<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Services\DocumentNumberService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PurchaseReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseReturn::with(['supplier', 'store', 'purchase', 'items', 'createdBy']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }
        if ($request->date_from) {
            $query->whereDate('return_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('return_date', '<=', $request->date_to);
        }

        return response()->json([
            'success' => true, 'message' => 'Purchase returns retrieved.',
            'data' => $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20),
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'purchase_id' => 'required|exists:purchases,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'return_date' => 'required|date',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'numeric|min:0',
            'round_off' => 'numeric',
            'total_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.batch_id' => 'required|exists:purchase_batches,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.purchase_price' => 'required|numeric|min:0',
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

        $returnNumber = DocumentNumberService::generate($request->store_id, 'purchase_return');

        $purchaseReturn = PurchaseReturn::create([
            'store_id' => $request->store_id,
            'purchase_id' => $request->purchase_id,
            'supplier_id' => $request->supplier_id,
            'return_number' => $returnNumber,
            'return_date' => $request->return_date,
            'subtotal' => $request->subtotal,
            'tax_amount' => $request->tax_amount ?? 0,
            'round_off' => $request->round_off ?? 0,
            'total_amount' => $request->total_amount,
            'status' => 'draft',
            'remarks' => $request->remarks,
            'created_by' => $request->user()->id,
        ]);

        foreach ($request->items as $item) {
            PurchaseReturnItem::create([
                'purchase_return_id' => $purchaseReturn->id,
                'product_id' => $item['product_id'],
                'batch_id' => $item['batch_id'],
                'quantity' => $item['quantity'],
                'purchase_price' => $item['purchase_price'],
                'taxable_amount' => $item['taxable_amount'] ?? 0,
                'gst_rate' => $item['gst_rate'] ?? 0,
                'tax_amount' => $item['tax_amount'] ?? 0,
                'line_total' => $item['line_total'],
            ]);
        }

        AuditLogService::log(
            module: 'purchase_return', action: 'return_create',
            recordType: 'purchase_return', recordId: $purchaseReturn->id,
            storeId: $request->store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Purchase return created.',
            'data' => $purchaseReturn->load(['items', 'supplier', 'store']),
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Purchase return retrieved.',
            'data' => PurchaseReturn::with(['items.product', 'supplier', 'store', 'purchase', 'createdBy'])
                ->findOrFail($id),
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $purchaseReturn = PurchaseReturn::findOrFail($id);

        if ($purchaseReturn->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft returns can be edited.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $purchaseReturn->update($request->validate([
            'return_date' => 'sometimes|date',
            'subtotal' => 'sometimes|numeric|min:0',
            'tax_amount' => 'sometimes|numeric|min:0',
            'round_off' => 'sometimes|numeric',
            'total_amount' => 'sometimes|numeric|min:0',
            'remarks' => 'nullable|string',
        ]));

        if ($request->has('items')) {
            $purchaseReturn->items()->delete();
            foreach ($request->items as $item) {
                PurchaseReturnItem::create(array_merge($item, ['purchase_return_id' => $purchaseReturn->id]));
            }
        }

        return response()->json([
            'success' => true, 'message' => 'Purchase return updated.',
            'data' => $purchaseReturn->load(['items', 'supplier', 'store']),
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $purchaseReturn = PurchaseReturn::findOrFail($id);

        if ($purchaseReturn->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft returns can be deleted.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $purchaseReturn->items()->delete();
        $purchaseReturn->delete();

        return response()->json([
            'success' => true, 'message' => 'Purchase return deleted.',
            'data' => null, 'errors' => null,
        ]);
    }

    public function confirm(int $id): JsonResponse
    {
        $purchaseReturn = PurchaseReturn::with('items')->findOrFail($id);

        if (!in_array($purchaseReturn->status, ['draft', 'submitted'])) {
            return response()->json([
                'success' => false, 'message' => 'Only draft/submitted returns can be confirmed.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        try {
            DB::transaction(function () use ($purchaseReturn) {
                foreach ($purchaseReturn->items as $item) {
                    $batch = \App\Models\PurchaseBatch::lockForUpdate()->find($item->batch_id);
                    if (!$batch || $batch->available_quantity < $item->quantity) {
                        throw new \RuntimeException("Insufficient stock in batch for product ID {$item->product_id}");
                    }

                    $batch->decrement('available_quantity', $item->quantity);
                    $batch->increment('purchase_return_quantity', $item->quantity);
                    if ($batch->available_quantity <= 0) {
                        $batch->update(['status' => 'exhausted']);
                    }

                    \App\Services\InventoryLedgerService::addEntry(
                        storeId: $purchaseReturn->store_id,
                        productId: $item->product_id,
                        batchId: $item->batch_id,
                        transactionType: 'purchase_return',
                        transactionId: $purchaseReturn->id,
                        transactionItemId: $item->id,
                        referenceNumber: $purchaseReturn->return_number,
                        transactionDate: $purchaseReturn->return_date,
                        incomingQuantity: 0,
                        outgoingQuantity: $item->quantity,
                        unitId: null,
                        remarks: "Purchase Return: {$purchaseReturn->return_number}",
                        createdBy: $purchaseReturn->created_by,
                    );
                }

                \App\Services\SupplierLedgerService::addEntry(
                    storeId: $purchaseReturn->store_id,
                    supplierId: $purchaseReturn->supplier_id,
                    transactionType: 'purchase_return',
                    transactionId: $purchaseReturn->id,
                    referenceNumber: $purchaseReturn->return_number,
                    transactionDate: $purchaseReturn->return_date,
                    creditAmount: 0,
                    debitAmount: $purchaseReturn->total_amount,
                    remarks: "Purchase Return: {$purchaseReturn->return_number}",
                    createdBy: $purchaseReturn->created_by,
                );

                $purchaseReturn->update(['status' => 'confirmed']);
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }

        AuditLogService::log(
            module: 'purchase_return', action: 'return_confirm',
            recordType: 'purchase_return', recordId: $purchaseReturn->id,
            storeId: $purchaseReturn->store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Purchase return confirmed.',
            'data' => $purchaseReturn->fresh(['items', 'supplier']),
            'errors' => null,
        ]);
    }

    public function cancel(int $id, Request $request): JsonResponse
    {
        $purchaseReturn = PurchaseReturn::findOrFail($id);

        if (!in_array($purchaseReturn->status, ['draft', 'submitted'])) {
            return response()->json([
                'success' => false, 'message' => 'Cannot cancel return in its current status.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $purchaseReturn->update([
            'status' => 'cancelled',
            'cancelled_by' => $request->user()->id,
            'cancelled_at' => now(),
            'cancellation_reason' => $request->reason ?? 'Cancelled by user',
        ]);

        AuditLogService::log(
            module: 'purchase_return', action: 'return_cancel',
            recordType: 'purchase_return', recordId: $purchaseReturn->id,
            storeId: $purchaseReturn->store_id,
            reason: $request->reason ?? null,
        );

        return response()->json([
            'success' => true, 'message' => 'Purchase return cancelled.',
            'data' => $purchaseReturn, 'errors' => null,
        ]);
    }
}
