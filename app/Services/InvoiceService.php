<?php

namespace App\Services;

use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\SalesBatchAllocation;
use App\Models\PurchaseBatch;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    /**
     * Confirm a sales invoice.
     * Performs FIFO stock allocation, creates batch allocation records,
     * updates inventory, and creates ledger entries.
     * All in one atomic database transaction.
     */
    public static function confirm(SalesInvoice $invoice): SalesInvoice
    {
        if ($invoice->status !== 'draft') {
            throw new \RuntimeException('Only draft invoices can be confirmed.');
        }

        return DB::transaction(function () use ($invoice) {
            $invoice->load('items');

            foreach ($invoice->items as $item) {
                // Check if the product belongs to a service category
                $product = \App\Models\Product::with('category')->find($item->product_id);
                $isService = $product && in_array(strtolower($product->category?->name ?? ''), [
                    'services & charges', 'services', 'charges', 'extra charges', 'other charges', 'service'
                ]);

                if ($isService) {
                    continue;
                }

                // Perform FIFO allocation
                $allocations = FifoStockService::allocate(
                    storeId: $invoice->store_id,
                    productId: $item->product_id,
                    requiredQuantity: (float) $item->quantity,
                );

                foreach ($allocations as $alloc) {
                    $batch = PurchaseBatch::lockForUpdate()->find($alloc['batch_id']);

                    if (!$batch || $batch->available_quantity < $alloc['quantity']) {
                        throw new \RuntimeException(
                            "Stock changed during confirmation for product ID {$item->product_id}. Please retry."
                        );
                    }

                    // Calculate discount share for this allocation
                    $allocQtyRatio = $alloc['quantity'] / $item->quantity;
                    $discountShare = round($item->discount_amount * $allocQtyRatio, 2);
                    $overallDiscountShare = round($item->overall_discount_share * $allocQtyRatio, 2);

                    // Calculate taxable amount for this allocation
                    $allocRate = $alloc['selling_price'];
                    $allocTaxable = round($alloc['quantity'] * $allocRate, 2) - $discountShare - $overallDiscountShare;
                    $allocTax = round($allocTaxable * $alloc['gst_rate'] / 100, 2);

                    // Calculate profit
                    $profit = ProfitCalculationService::calculate(
                        quantity: $alloc['quantity'],
                        landedCost: $alloc['landed_cost'],
                        sellingPrice: $alloc['selling_price'],
                        discountShare: $discountShare + $overallDiscountShare,
                        taxableAmount: $allocTaxable,
                        taxAmount: $allocTax,
                    );

                    // Create batch allocation record
                    SalesBatchAllocation::create([
                        'store_id' => $invoice->store_id,
                        'invoice_id' => $invoice->id,
                        'invoice_item_id' => $item->id,
                        'product_id' => $item->product_id,
                        'batch_id' => $batch->id,
                        'quantity' => $alloc['quantity'],
                        'purchase_price' => $alloc['purchase_price'],
                        'landed_cost' => $alloc['landed_cost'],
                        'selling_price' => $alloc['selling_price'],
                        'discount_share' => $discountShare + $overallDiscountShare,
                        'taxable_amount' => $allocTaxable,
                        'tax_amount' => $allocTax,
                        'cost_amount' => $profit['cost_amount'],
                        'sale_amount' => $profit['sale_amount'],
                        'profit_amount' => $profit['profit_amount'],
                    ]);

                    // Reduce batch available quantity
                    $batch->decrement('available_quantity', $alloc['quantity']);
                    $batch->increment('sold_quantity', $alloc['quantity']);

                    // Update batch status if exhausted
                    if ($batch->available_quantity <= 0) {
                        $batch->update(['status' => 'exhausted']);
                    }

                    // Create inventory ledger entry
                    InventoryLedgerService::addEntry(
                        storeId: $invoice->store_id,
                        productId: $item->product_id,
                        batchId: $batch->id,
                        transactionType: 'sale',
                        transactionId: $invoice->id,
                        transactionItemId: $item->id,
                        referenceNumber: $invoice->invoice_number,
                        transactionDate: $invoice->invoice_date,
                        incomingQuantity: 0,
                        outgoingQuantity: $alloc['quantity'],
                        unitId: $item->unit_id,
                        remarks: "Sale: {$invoice->invoice_number}",
                        createdBy: $invoice->created_by,
                    );
                }
            }

            // Customer ledger entry
            CustomerLedgerService::addEntry(
                storeId: $invoice->store_id,
                customerId: $invoice->customer_id,
                transactionType: 'sales_invoice',
                transactionId: $invoice->id,
                referenceNumber: $invoice->invoice_number,
                transactionDate: $invoice->invoice_date,
                debitAmount: $invoice->total_amount,
                creditAmount: 0,
                remarks: "Sales Invoice: {$invoice->invoice_number}",
                createdBy: $invoice->created_by,
            );

            $invoice->update([
                'status' => $invoice->paid_amount > 0
                    ? ($invoice->paid_amount >= $invoice->total_amount ? 'paid' : 'partially_paid')
                    : 'confirmed',
                'payment_status' => $invoice->paid_amount > 0
                    ? ($invoice->paid_amount >= $invoice->total_amount ? 'paid' : 'partially_paid')
                    : 'unpaid',
            ]);

            AuditLogService::log(
                module: 'invoice',
                action: 'invoice_confirm',
                recordType: 'sales_invoice',
                recordId: $invoice->id,
                storeId: $invoice->store_id,
                newValues: ['status' => $invoice->status],
            );

            return $invoice->fresh(['items', 'batchAllocations']);
        });
    }

    /**
     * Cancel an invoice. Reverses stock, allocations, and ledger entries.
     */
    public static function cancel(SalesInvoice $invoice, int $cancelledBy, string $reason): SalesInvoice
    {
        if (in_array($invoice->status, ['cancelled', 'reversed'])) {
            throw new \RuntimeException('Invoice is already cancelled or reversed.');
        }

        if ($invoice->returns()->whereIn('status', ['confirmed'])->exists()) {
            throw new \RuntimeException('Cannot cancel: Invoice has confirmed returns. Reverse returns first.');
        }

        return DB::transaction(function () use ($invoice, $cancelledBy, $reason) {
            // Reverse batch allocations
            foreach ($invoice->batchAllocations as $allocation) {
                $batch = PurchaseBatch::lockForUpdate()->find($allocation->batch_id);

                if ($batch) {
                    $batch->increment('available_quantity', $allocation->quantity);
                    $batch->decrement('sold_quantity', $allocation->quantity);

                    if ($batch->status === 'exhausted' && $batch->available_quantity > 0) {
                        $batch->update(['status' => 'active']);
                    }
                }

                // Reverse inventory ledger
                InventoryLedgerService::addEntry(
                    storeId: $invoice->store_id,
                    productId: $allocation->product_id,
                    batchId: $allocation->batch_id,
                    transactionType: 'reversal',
                    transactionId: $invoice->id,
                    transactionItemId: $allocation->invoice_item_id,
                    referenceNumber: $invoice->invoice_number . '-CXL',
                    transactionDate: now()->toDateString(),
                    incomingQuantity: $allocation->quantity,
                    outgoingQuantity: 0,
                    unitId: null,
                    remarks: "Invoice cancellation: {$reason}",
                    createdBy: $cancelledBy,
                );
            }

            // Reverse customer ledger
            CustomerLedgerService::addEntry(
                storeId: $invoice->store_id,
                customerId: $invoice->customer_id,
                transactionType: 'invoice_reversal',
                transactionId: $invoice->id,
                referenceNumber: $invoice->invoice_number . '-CXL',
                transactionDate: now()->toDateString(),
                debitAmount: 0,
                creditAmount: $invoice->total_amount,
                remarks: "Invoice cancellation: {$reason}",
                createdBy: $cancelledBy,
            );

            $invoice->update([
                'status' => 'cancelled',
                'cancelled_by' => $cancelledBy,
                'cancelled_at' => now(),
                'cancellation_reason' => $reason,
                'balance_amount' => 0,
            ]);

            AuditLogService::log(
                module: 'invoice',
                action: 'invoice_cancel',
                recordType: 'sales_invoice',
                recordId: $invoice->id,
                storeId: $invoice->store_id,
                reason: $reason,
            );

            return $invoice->fresh();
        });
    }
}
