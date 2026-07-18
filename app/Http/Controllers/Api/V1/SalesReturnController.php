<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Services\DocumentNumberService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SalesReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SalesReturn::with(['customer', 'store', 'invoice', 'items', 'createdBy']);

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
            $query->whereDate('return_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('return_date', '<=', $request->date_to);
        }

        return response()->json([
            'success' => true, 'message' => 'Sales returns retrieved.',
            'data' => $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20),
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'invoice_id' => 'required|exists:sales_invoices,id',
            'customer_id' => 'required|exists:customers,id',
            'return_date' => 'required|date',
            'subtotal' => 'required|numeric|min:0',
            'item_discount' => 'numeric|min:0',
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
            'items.*.batch_id' => 'required|exists:purchase_batches,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.rate' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'numeric|min:0',
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

        $returnNumber = DocumentNumberService::generate($request->store_id, 'sales_return');

        $salesReturn = SalesReturn::create([
            'store_id' => $request->store_id,
            'invoice_id' => $request->invoice_id,
            'customer_id' => $request->customer_id,
            'return_number' => $returnNumber,
            'return_date' => $request->return_date,
            'subtotal' => $request->subtotal,
            'item_discount' => $request->item_discount ?? 0,
            'taxable_amount' => $request->taxable_amount ?? 0,
            'cgst_amount' => $request->cgst_amount ?? 0,
            'sgst_amount' => $request->sgst_amount ?? 0,
            'igst_amount' => $request->igst_amount ?? 0,
            'tax_amount' => $request->tax_amount ?? 0,
            'round_off' => $request->round_off ?? 0,
            'total_amount' => $request->total_amount,
            'refund_amount' => 0,
            'status' => 'draft',
            'remarks' => $request->remarks,
            'created_by' => $request->user()->id,
        ]);

        foreach ($request->items as $item) {
            SalesReturnItem::create([
                'sales_return_id' => $salesReturn->id,
                'invoice_item_id' => $item['invoice_item_id'] ?? null,
                'product_id' => $item['product_id'],
                'batch_id' => $item['batch_id'],
                'quantity' => $item['quantity'],
                'rate' => $item['rate'],
                'discount_amount' => $item['discount_amount'] ?? 0,
                'taxable_amount' => $item['taxable_amount'] ?? 0,
                'gst_rate' => $item['gst_rate'] ?? 0,
                'tax_amount' => $item['tax_amount'] ?? 0,
                'line_total' => $item['line_total'],
            ]);
        }

        AuditLogService::log(
            module: 'sales_return', action: 'return_create',
            recordType: 'sales_return', recordId: $salesReturn->id,
            storeId: $request->store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Sales return created.',
            'data' => $salesReturn->load(['items', 'customer', 'store', 'invoice']),
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Sales return retrieved.',
            'data' => SalesReturn::with(['items.product', 'customer', 'store', 'invoice', 'createdBy'])
                ->findOrFail($id),
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $salesReturn = SalesReturn::findOrFail($id);

        if ($salesReturn->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft returns can be edited.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $salesReturn->update($request->validate([
            'return_date' => 'sometimes|date',
            'subtotal' => 'sometimes|numeric|min:0',
            'item_discount' => 'sometimes|numeric|min:0',
            'taxable_amount' => 'sometimes|numeric|min:0',
            'cgst_amount' => 'sometimes|numeric|min:0',
            'sgst_amount' => 'sometimes|numeric|min:0',
            'igst_amount' => 'sometimes|numeric|min:0',
            'tax_amount' => 'sometimes|numeric|min:0',
            'round_off' => 'sometimes|numeric',
            'total_amount' => 'sometimes|numeric|min:0',
            'remarks' => 'nullable|string',
        ]));

        if ($request->has('items')) {
            $salesReturn->items()->delete();
            foreach ($request->items as $item) {
                SalesReturnItem::create(array_merge($item, ['sales_return_id' => $salesReturn->id]));
            }
        }

        return response()->json([
            'success' => true, 'message' => 'Sales return updated.',
            'data' => $salesReturn->load(['items', 'customer', 'store']),
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $salesReturn = SalesReturn::findOrFail($id);

        if ($salesReturn->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft returns can be deleted.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $salesReturn->items()->delete();
        $salesReturn->delete();

        return response()->json([
            'success' => true, 'message' => 'Sales return deleted.',
            'data' => null, 'errors' => null,
        ]);
    }

    public function confirm(int $id): JsonResponse
    {
        $salesReturn = SalesReturn::with('items')->findOrFail($id);

        if (!in_array($salesReturn->status, ['draft', 'submitted'])) {
            return response()->json([
                'success' => false, 'message' => 'Only draft returns can be confirmed.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        try {
            DB::transaction(function () use ($salesReturn) {
                foreach ($salesReturn->items as $item) {
                    $batch = \App\Models\PurchaseBatch::lockForUpdate()->find($item->batch_id);
                    if ($batch) {
                        $batch->increment('available_quantity', $item->quantity);
                        $batch->increment('sales_return_quantity', $item->quantity);
                        if ($batch->status === 'exhausted') {
                            $batch->update(['status' => 'active']);
                        }
                    }

                    \App\Services\InventoryLedgerService::addEntry(
                        storeId: $salesReturn->store_id,
                        productId: $item->product_id,
                        batchId: $item->batch_id,
                        transactionType: 'sales_return',
                        transactionId: $salesReturn->id,
                        transactionItemId: $item->id,
                        referenceNumber: $salesReturn->return_number,
                        transactionDate: $salesReturn->return_date,
                        incomingQuantity: $item->quantity,
                        outgoingQuantity: 0,
                        unitId: null,
                        remarks: "Sales Return: {$salesReturn->return_number}",
                        createdBy: $salesReturn->created_by,
                    );
                }

                \App\Services\CustomerLedgerService::addEntry(
                    storeId: $salesReturn->store_id,
                    customerId: $salesReturn->customer_id,
                    transactionType: 'sales_return',
                    transactionId: $salesReturn->id,
                    referenceNumber: $salesReturn->return_number,
                    transactionDate: $salesReturn->return_date,
                    debitAmount: $salesReturn->total_amount,
                    creditAmount: 0,
                    remarks: "Sales Return: {$salesReturn->return_number}",
                    createdBy: $salesReturn->created_by,
                );

                $salesReturn->update(['status' => 'confirmed']);
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }

        AuditLogService::log(
            module: 'sales_return', action: 'return_confirm',
            recordType: 'sales_return', recordId: $salesReturn->id,
            storeId: $salesReturn->store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Sales return confirmed.',
            'data' => $salesReturn->fresh(['items', 'customer']),
            'errors' => null,
        ]);
    }

    public function cancel(int $id, Request $request): JsonResponse
    {
        $salesReturn = SalesReturn::findOrFail($id);

        if (!in_array($salesReturn->status, ['draft', 'submitted'])) {
            return response()->json([
                'success' => false, 'message' => 'Cannot cancel return in its current status.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $salesReturn->update([
            'status' => 'cancelled',
            'cancelled_by' => $request->user()->id,
            'cancelled_at' => now(),
            'cancellation_reason' => $request->reason ?? 'Cancelled by user',
        ]);

        return response()->json([
            'success' => true, 'message' => 'Sales return cancelled.',
            'data' => $salesReturn, 'errors' => null,
        ]);
    }
}
