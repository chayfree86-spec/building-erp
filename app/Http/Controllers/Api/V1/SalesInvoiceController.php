<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Services\DocumentNumberService;
use App\Services\InvoiceService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SalesInvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SalesInvoice::with(['customer', 'store', 'items', 'createdBy']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->date_from) {
            $query->whereDate('invoice_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('invoice_date', '<=', $request->date_to);
        }

        return response()->json([
            'success' => true, 'message' => 'Invoices retrieved.',
            'data' => $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20),
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'customer_id' => 'required|exists:customers,id',
            'invoice_date' => 'required|date',
            'customer_name_snapshot' => 'nullable|string|max:200',
            'customer_mobile_snapshot' => 'nullable|string|max:15',
            'customer_address_snapshot' => 'nullable|string',
            'customer_gst_snapshot' => 'nullable|string|max:20',
            'subtotal' => 'required|numeric|min:0',
            'item_discount' => 'numeric|min:0',
            'overall_discount' => 'numeric|min:0',
            'taxable_amount' => 'numeric|min:0',
            'cgst_amount' => 'numeric|min:0',
            'sgst_amount' => 'numeric|min:0',
            'igst_amount' => 'numeric|min:0',
            'tax_amount' => 'numeric|min:0',
            'round_off' => 'numeric',
            'total_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.rate' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'numeric|min:0',
            'items.*.overall_discount_share' => 'numeric|min:0',
            'items.*.taxable_amount' => 'numeric|min:0',
            'items.*.gst_rate' => 'numeric|min:0',
            'items.*.tax_amount' => 'numeric|min:0',
            'items.*.line_total' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 'message' => 'Validation failed.',
                'data' => null, 'errors' => $validator->errors(),
            ], 422);
        }

        $invoiceNumber = DocumentNumberService::generate($request->store_id, 'sales_invoice');

        $invoice = SalesInvoice::create([
            'store_id' => $request->store_id,
            'customer_id' => $request->customer_id,
            'invoice_number' => $invoiceNumber,
            'invoice_date' => $request->invoice_date,
            'customer_name_snapshot' => $request->customer_name_snapshot,
            'customer_mobile_snapshot' => $request->customer_mobile_snapshot,
            'customer_address_snapshot' => $request->customer_address_snapshot,
            'customer_gst_snapshot' => $request->customer_gst_snapshot,
            'subtotal' => $request->subtotal,
            'item_discount' => $request->item_discount ?? 0,
            'overall_discount' => $request->overall_discount ?? 0,
            'taxable_amount' => $request->taxable_amount ?? 0,
            'cgst_amount' => $request->cgst_amount ?? 0,
            'sgst_amount' => $request->sgst_amount ?? 0,
            'igst_amount' => $request->igst_amount ?? 0,
            'tax_amount' => $request->tax_amount ?? 0,
            'round_off' => $request->round_off ?? 0,
            'total_amount' => $request->total_amount,
            'paid_amount' => 0,
            'balance_amount' => $request->total_amount,
            'payment_status' => 'unpaid',
            'status' => 'draft',
            'remarks' => $request->remarks,
            'created_by' => $request->user()->id,
        ]);

        foreach ($request->items as $item) {
            SalesInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'product_id' => $item['product_id'],
                'unit_id' => $item['unit_id'] ?? null,
                'quantity' => $item['quantity'],
                'rate' => $item['rate'],
                'discount_amount' => $item['discount_amount'] ?? 0,
                'overall_discount_share' => $item['overall_discount_share'] ?? 0,
                'taxable_amount' => $item['taxable_amount'] ?? 0,
                'gst_rate' => $item['gst_rate'] ?? 0,
                'tax_amount' => $item['tax_amount'] ?? 0,
                'line_total' => $item['line_total'],
            ]);
        }

        // Auto-confirm only if requested (default: true for backward compat)
        if ($request->input('auto_confirm', true)) {
            try {
                $invoice = \App\Services\InvoiceService::confirm($invoice);
            } catch (\RuntimeException $e) {
                // If confirm fails, still return created invoice as draft
            }
        }

        AuditLogService::log(
            module: 'sales_invoice', action: 'invoice_create',
            recordType: 'sales_invoice', recordId: $invoice->id,
            storeId: $request->store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Sales invoice created & confirmed.',
            'data' => $invoice->load(['items', 'customer', 'store', 'batchAllocations']),
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Invoice retrieved.',
            'data' => SalesInvoice::with(['items.product.unit', 'items.unit', 'customer', 'store', 'batchAllocations', 'createdBy'])
                ->findOrFail($id),
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $invoice = SalesInvoice::findOrFail($id);

        // Allow editing any invoice (draft or confirmed)

        $invoice->update($request->validate([
            'invoice_date' => 'sometimes|date',
            'subtotal' => 'sometimes|numeric|min:0',
            'item_discount' => 'sometimes|numeric|min:0',
            'overall_discount' => 'sometimes|numeric|min:0',
            'taxable_amount' => 'sometimes|numeric|min:0',
            'cgst_amount' => 'sometimes|numeric|min:0',
            'sgst_amount' => 'sometimes|numeric|min:0',
            'igst_amount' => 'sometimes|numeric|min:0',
            'tax_amount' => 'sometimes|numeric|min:0',
            'round_off' => 'sometimes|numeric',
            'total_amount' => 'sometimes|numeric|min:0',
            'remarks' => 'nullable|string',
        ]));

        if ($request->has('total_amount')) {
            $invoice->update(['balance_amount' => $invoice->total_amount - $invoice->paid_amount]);
        }

        if ($request->has('items')) {
            $invoice->items()->delete();
            foreach ($request->items as $item) {
                SalesInvoiceItem::create(array_merge($item, ['invoice_id' => $invoice->id]));
            }
        }

        return response()->json([
            'success' => true, 'message' => 'Invoice updated.',
            'data' => $invoice->load(['items', 'customer', 'store']),
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $invoice = SalesInvoice::findOrFail($id);

        if ($invoice->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft invoices can be deleted.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $invoice->items()->delete();
        $invoice->delete();

        return response()->json([
            'success' => true, 'message' => 'Invoice deleted.',
            'data' => null, 'errors' => null,
        ]);
    }

    public function confirm(int $id): JsonResponse
    {
        try {
            $invoice = SalesInvoice::findOrFail($id);
            $invoice = InvoiceService::confirm($invoice);

            return response()->json([
                'success' => true, 'message' => 'Invoice confirmed successfully.',
                'data' => $invoice->load(['items', 'batchAllocations']),
                'errors' => null,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }
    }

    public function cancel(int $id, Request $request): JsonResponse
    {
        $invoice = SalesInvoice::findOrFail($id);

        if (!in_array($invoice->status, ['draft'])) {
            return response()->json([
                'success' => false, 'message' => 'Cannot cancel invoice in its current status.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $invoice->update([
            'status' => 'cancelled',
            'cancelled_by' => $request->user()->id,
            'cancelled_at' => now(),
            'cancellation_reason' => $request->reason ?? 'Cancelled by user',
        ]);

        AuditLogService::log(
            module: 'sales_invoice', action: 'invoice_cancel',
            recordType: 'sales_invoice', recordId: $invoice->id,
            storeId: $invoice->store_id, reason: $request->reason ?? null,
        );

        return response()->json([
            'success' => true, 'message' => 'Invoice cancelled.',
            'data' => $invoice, 'errors' => null,
        ]);
    }

    public function reverse(int $id, Request $request): JsonResponse
    {
        $invoice = SalesInvoice::with(['items', 'batchAllocations'])->findOrFail($id);

        if ($invoice->status !== 'confirmed') {
            return response()->json([
                'success' => false, 'message' => 'Only confirmed invoices can be reversed.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($invoice, $request) {
            foreach ($invoice->batchAllocations as $alloc) {
                $batch = \App\Models\PurchaseBatch::lockForUpdate()->find($alloc->batch_id);
                if ($batch) {
                    $batch->increment('available_quantity', $alloc->quantity);
                    $batch->decrement('sold_quantity', $alloc->quantity);
                    if ($batch->available_quantity > 0 && $batch->status === 'exhausted') {
                        $batch->update(['status' => 'active']);
                    }
                }

                \App\Services\InventoryLedgerService::addEntry(
                    storeId: $invoice->store_id,
                    productId: $alloc->product_id,
                    batchId: $alloc->batch_id,
                    transactionType: 'sales_reversal',
                    transactionId: $invoice->id,
                    transactionItemId: null,
                    referenceNumber: $invoice->invoice_number . '-REV',
                    transactionDate: now()->toDateString(),
                    incomingQuantity: $alloc->quantity,
                    outgoingQuantity: 0,
                    unitId: null,
                    remarks: "Sales reversal: " . ($request->reason ?? 'Reversed'),
                    createdBy: $request->user()->id,
                );
            }

            \App\Services\CustomerLedgerService::addEntry(
                storeId: $invoice->store_id,
                customerId: $invoice->customer_id,
                transactionType: 'sales_reversal',
                transactionId: $invoice->id,
                referenceNumber: $invoice->invoice_number . '-REV',
                transactionDate: now()->toDateString(),
                debitAmount: $invoice->total_amount,
                creditAmount: 0,
                remarks: "Sales reversal: " . ($request->reason ?? 'Reversed'),
                createdBy: $request->user()->id,
            );

            $invoice->update([
                'status' => 'reversed',
                'cancelled_by' => $request->user()->id,
                'cancelled_at' => now(),
                'cancellation_reason' => $request->reason ?? 'Reversed',
            ]);
        });

        AuditLogService::log(
            module: 'sales_invoice', action: 'invoice_reverse',
            recordType: 'sales_invoice', recordId: $invoice->id,
            storeId: $invoice->store_id, reason: $request->reason ?? null,
        );

        return response()->json([
            'success' => true, 'message' => 'Invoice reversed successfully.',
            'data' => $invoice->fresh(), 'errors' => null,
        ]);
    }
}
