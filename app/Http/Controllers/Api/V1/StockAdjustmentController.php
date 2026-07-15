<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockAdjustmentItem;
use App\Services\DocumentNumberService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StockAdjustmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StockAdjustment::with(['store', 'items.product', 'createdBy', 'approvedBy']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->date_from) {
            $query->whereDate('adjustment_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('adjustment_date', '<=', $request->date_to);
        }

        return response()->json([
            'success' => true, 'message' => 'Stock adjustments retrieved.',
            'data' => $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20),
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'adjustment_date' => 'required|date',
            'type' => 'required|in:addition,deduction,damage',
            'reason' => 'required|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.batch_id' => 'required|exists:purchase_batches,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 'message' => 'Validation failed.',
                'data' => null, 'errors' => $validator->errors(),
            ], 422);
        }

        $adjustmentNumber = DocumentNumberService::generate($request->store_id, 'stock_adjustment');

        $adjustment = StockAdjustment::create([
            'store_id' => $request->store_id,
            'adjustment_number' => $adjustmentNumber,
            'adjustment_date' => $request->adjustment_date,
            'type' => $request->type,
            'status' => 'draft',
            'reason' => $request->reason,
            'created_by' => $request->user()->id,
        ]);

        foreach ($request->items as $item) {
            StockAdjustmentItem::create([
                'stock_adjustment_id' => $adjustment->id,
                'product_id' => $item['product_id'],
                'batch_id' => $item['batch_id'],
                'quantity' => $item['quantity'],
                'remarks' => $item['remarks'] ?? null,
            ]);
        }

        AuditLogService::log(
            module: 'stock_adjustment', action: 'adjustment_create',
            recordType: 'stock_adjustment', recordId: $adjustment->id,
            storeId: $request->store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Stock adjustment created.',
            'data' => $adjustment->load(['items.product', 'store']),
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Stock adjustment retrieved.',
            'data' => StockAdjustment::with(['items.product.batches', 'store', 'createdBy', 'approvedBy'])
                ->findOrFail($id),
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if ($adjustment->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft adjustments can be edited.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $adjustment->update($request->validate([
            'adjustment_date' => 'sometimes|date',
            'type' => 'sometimes|in:addition,deduction,damage',
            'reason' => 'sometimes|string|max:500',
        ]));

        if ($request->has('items')) {
            $adjustment->items()->delete();
            foreach ($request->items as $item) {
                StockAdjustmentItem::create(array_merge($item, ['stock_adjustment_id' => $adjustment->id]));
            }
        }

        return response()->json([
            'success' => true, 'message' => 'Stock adjustment updated.',
            'data' => $adjustment->load(['items.product', 'store']),
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if ($adjustment->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft adjustments can be deleted.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $adjustment->items()->delete();
        $adjustment->delete();

        return response()->json([
            'success' => true, 'message' => 'Stock adjustment deleted.',
            'data' => null, 'errors' => null,
        ]);
    }

    public function submit(int $id): JsonResponse
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if ($adjustment->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft adjustments can be submitted.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $adjustment->update(['status' => 'submitted']);

        return response()->json([
            'success' => true, 'message' => 'Stock adjustment submitted for approval.',
            'data' => $adjustment, 'errors' => null,
        ]);
    }

    public function approve(int $id): JsonResponse
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if ($adjustment->status !== 'submitted') {
            return response()->json([
                'success' => false, 'message' => 'Only submitted adjustments can be approved.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $adjustment->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true, 'message' => 'Stock adjustment approved.',
            'data' => $adjustment, 'errors' => null,
        ]);
    }

    public function confirm(int $id): JsonResponse
    {
        $adjustment = StockAdjustment::with('items')->findOrFail($id);

        if ($adjustment->status !== 'approved') {
            return response()->json([
                'success' => false, 'message' => 'Only approved adjustments can be confirmed.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        try {
            DB::transaction(function () use ($adjustment) {
                foreach ($adjustment->items as $item) {
                    $batch = \App\Models\PurchaseBatch::lockForUpdate()->find($item->batch_id);

                    if (!$batch) {
                        throw new \RuntimeException("Batch not found for product ID {$item->product_id}");
                    }

                    $incoming = 0;
                    $outgoing = 0;

                    if ($adjustment->type === 'addition') {
                        $batch->increment('available_quantity', $item->quantity);
                        $batch->increment('adjustment_quantity', $item->quantity);
                        $incoming = $item->quantity;
                    } elseif ($adjustment->type === 'deduction') {
                        if ($batch->available_quantity < $item->quantity) {
                            throw new \RuntimeException("Insufficient stock in batch for deduction.");
                        }
                        $batch->decrement('available_quantity', $item->quantity);
                        $batch->increment('adjustment_quantity', $item->quantity);
                        $outgoing = $item->quantity;
                    } elseif ($adjustment->type === 'damage') {
                        if ($batch->available_quantity < $item->quantity) {
                            throw new \RuntimeException("Insufficient stock in batch for damage adjustment.");
                        }
                        $batch->decrement('available_quantity', $item->quantity);
                        $batch->increment('damage_quantity', $item->quantity);
                        $outgoing = $item->quantity;
                    }

                    if ($batch->available_quantity <= 0) {
                        $batch->update(['status' => 'exhausted']);
                    } elseif ($batch->status === 'exhausted') {
                        $batch->update(['status' => 'active']);
                    }

                    \App\Services\InventoryLedgerService::addEntry(
                        storeId: $adjustment->store_id,
                        productId: $item->product_id,
                        batchId: $item->batch_id,
                        transactionType: 'adjustment',
                        transactionId: $adjustment->id,
                        transactionItemId: $item->id,
                        referenceNumber: $adjustment->adjustment_number,
                        transactionDate: $adjustment->adjustment_date,
                        incomingQuantity: $incoming,
                        outgoingQuantity: $outgoing,
                        unitId: null,
                        remarks: "Adjustment ({$adjustment->type}): {$adjustment->reason}",
                        createdBy: $adjustment->created_by,
                    );
                }

                $adjustment->update(['status' => 'confirmed']);
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }

        AuditLogService::log(
            module: 'stock_adjustment', action: 'adjustment_confirm',
            recordType: 'stock_adjustment', recordId: $adjustment->id,
            storeId: $adjustment->store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Stock adjustment confirmed.',
            'data' => $adjustment->fresh(['items']), 'errors' => null,
        ]);
    }
}
