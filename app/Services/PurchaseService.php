<?php

namespace App\Services;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseBatch;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    /**
     * Confirm a purchase: creates batches, ledger entries, and updates supplier balance.
     * All in one atomic database transaction.
     */
    public static function confirm(Purchase $purchase): Purchase
    {
        if (!in_array($purchase->status, ['draft', 'submitted', 'approved'])) {
            throw new \RuntimeException('Only draft, submitted or approved purchases can be confirmed.');
        }

        return DB::transaction(function () use ($purchase) {
            $purchase->load('items');

            foreach ($purchase->items as $item) {
                // Create one batch per purchase item
                $batch = PurchaseBatch::create([
                    'store_id' => $purchase->store_id,
                    'purchase_id' => $purchase->id,
                    'purchase_item_id' => $item->id,
                    'supplier_id' => $purchase->supplier_id,
                    'product_id' => $item->product_id,
                    'batch_number' => self::generateBatchNumber($purchase, $item),
                    'purchase_date' => $purchase->purchase_date,
                    'purchase_quantity' => $item->quantity,
                    'available_quantity' => $item->quantity,
                    'sold_quantity' => 0,
                    'purchase_return_quantity' => 0,
                    'sales_return_quantity' => 0,
                    'damage_quantity' => 0,
                    'adjustment_quantity' => 0,
                    'purchase_price' => $item->purchase_price,
                    'selling_price' => $item->selling_price,
                    'landed_cost' => $item->landed_cost ?: $item->purchase_price,
                    'gst_rate' => $item->gst_rate,
                    'status' => 'active',
                    'created_by' => $purchase->created_by,
                ]);

                // Create inventory ledger entry
                InventoryLedgerService::addEntry(
                    storeId: $purchase->store_id,
                    productId: $item->product_id,
                    batchId: $batch->id,
                    transactionType: 'purchase',
                    transactionId: $purchase->id,
                    transactionItemId: $item->id,
                    referenceNumber: $purchase->purchase_number,
                    transactionDate: $purchase->purchase_date,
                    incomingQuantity: $item->quantity,
                    outgoingQuantity: 0,
                    unitId: $item->unit_id,
                    remarks: "Purchase: {$purchase->purchase_number}",
                    createdBy: $purchase->created_by,
                );
            }

            // Supplier ledger entry
            SupplierLedgerService::addEntry(
                storeId: $purchase->store_id,
                supplierId: $purchase->supplier_id,
                transactionType: 'purchase',
                transactionId: $purchase->id,
                referenceNumber: $purchase->purchase_number,
                transactionDate: $purchase->purchase_date,
                creditAmount: $purchase->total_amount,
                debitAmount: 0,
                remarks: "Purchase: {$purchase->purchase_number}",
                createdBy: $purchase->created_by,
            );

            $purchase->update(['status' => 'confirmed']);

            AuditLogService::log(
                module: 'purchase',
                action: 'purchase_confirm',
                recordType: 'purchase',
                recordId: $purchase->id,
                storeId: $purchase->store_id,
                newValues: ['status' => 'confirmed'],
            );

            return $purchase->fresh(['items', 'batches']);
        });
    }

    /**
     * Cancel a purchase. Reverses batches and ledger entries.
     */
    public static function cancel(Purchase $purchase, int $cancelledBy, string $reason): Purchase
    {
        if (!in_array($purchase->status, ['draft', 'submitted', 'confirmed'])) {
            throw new \RuntimeException('Purchase cannot be cancelled in its current status.');
        }

        return DB::transaction(function () use ($purchase, $cancelledBy, $reason) {
            // Reverse batches
            foreach ($purchase->batches as $batch) {
                if ($batch->available_quantity < $batch->purchase_quantity) {
                    throw new \RuntimeException(
                        "Cannot cancel: Batch {$batch->batch_number} has sales/returns. Use reversal instead."
                    );
                }

                $batch->update([
                    'available_quantity' => 0,
                    'status' => 'cancelled',
                ]);

                // Reverse inventory ledger
                InventoryLedgerService::addEntry(
                    storeId: $purchase->store_id,
                    productId: $batch->product_id,
                    batchId: $batch->id,
                    transactionType: 'reversal',
                    transactionId: $purchase->id,
                    transactionItemId: null,
                    referenceNumber: $purchase->purchase_number . '-CXL',
                    transactionDate: now()->toDateString(),
                    incomingQuantity: 0,
                    outgoingQuantity: $batch->available_quantity,
                    unitId: null,
                    remarks: "Purchase cancellation: {$reason}",
                    createdBy: $cancelledBy,
                );
            }

            // Reverse supplier ledger
            SupplierLedgerService::addEntry(
                storeId: $purchase->store_id,
                supplierId: $purchase->supplier_id,
                transactionType: 'purchase_reversal',
                transactionId: $purchase->id,
                referenceNumber: $purchase->purchase_number . '-CXL',
                transactionDate: now()->toDateString(),
                creditAmount: 0,
                debitAmount: $purchase->total_amount,
                remarks: "Purchase cancellation: {$reason}",
                createdBy: $cancelledBy,
            );

            $purchase->update([
                'status' => 'cancelled',
                'cancelled_by' => $cancelledBy,
                'cancelled_at' => now(),
                'cancellation_reason' => $reason,
            ]);

            AuditLogService::log(
                module: 'purchase',
                action: 'purchase_cancel',
                recordType: 'purchase',
                recordId: $purchase->id,
                storeId: $purchase->store_id,
                reason: $reason,
            );

            return $purchase->fresh();
        });
    }

    private static function generateBatchNumber(Purchase $purchase, PurchaseItem $item): string
    {
        $productCode = \App\Models\Product::find($item->product_id)?->sku ?? 'PRD';
        return "BATCH/{$purchase->purchase_number}/{$productCode}/{$item->id}";
    }
}
