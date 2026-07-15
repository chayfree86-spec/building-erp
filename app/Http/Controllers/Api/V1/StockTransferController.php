<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Services\DocumentNumberService;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StockTransferController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StockTransfer::with(['sourceStore', 'destinationStore', 'items.product', 'createdBy']);

        if ($request->source_store_id) {
            $query->where('source_store_id', $request->source_store_id);
        }
        if ($request->destination_store_id) {
            $query->where('destination_store_id', $request->destination_store_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->date_from) {
            $query->whereDate('transfer_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('transfer_date', '<=', $request->date_to);
        }

        return response()->json([
            'success' => true, 'message' => 'Stock transfers retrieved.',
            'data' => $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20),
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'source_store_id' => 'required|exists:stores,id',
            'destination_store_id' => 'required|exists:stores,id|different:source_store_id',
            'transfer_date' => 'required|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.batch_id' => 'required|exists:purchase_batches,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 'message' => 'Validation failed.',
                'data' => null, 'errors' => $validator->errors(),
            ], 422);
        }

        $transferNumber = DocumentNumberService::generate($request->source_store_id, 'stock_transfer');

        $transfer = StockTransfer::create([
            'source_store_id' => $request->source_store_id,
            'destination_store_id' => $request->destination_store_id,
            'transfer_number' => $transferNumber,
            'transfer_date' => $request->transfer_date,
            'status' => 'draft',
            'remarks' => $request->remarks,
            'created_by' => $request->user()->id,
        ]);

        foreach ($request->items as $item) {
            StockTransferItem::create([
                'stock_transfer_id' => $transfer->id,
                'product_id' => $item['product_id'],
                'batch_id' => $item['batch_id'],
                'quantity' => $item['quantity'],
            ]);
        }

        AuditLogService::log(
            module: 'stock_transfer', action: 'transfer_create',
            recordType: 'stock_transfer', recordId: $transfer->id,
            storeId: $request->source_store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Stock transfer created.',
            'data' => $transfer->load(['items.product', 'sourceStore', 'destinationStore']),
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Stock transfer retrieved.',
            'data' => StockTransfer::with(['items.product', 'sourceStore', 'destinationStore', 'createdBy'])
                ->findOrFail($id),
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $transfer = StockTransfer::findOrFail($id);

        if ($transfer->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft transfers can be edited.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $transfer->update($request->validate([
            'transfer_date' => 'sometimes|date',
            'remarks' => 'nullable|string',
        ]));

        if ($request->has('items')) {
            $transfer->items()->delete();
            foreach ($request->items as $item) {
                StockTransferItem::create(array_merge($item, ['stock_transfer_id' => $transfer->id]));
            }
        }

        return response()->json([
            'success' => true, 'message' => 'Stock transfer updated.',
            'data' => $transfer->load(['items.product', 'sourceStore', 'destinationStore']),
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $transfer = StockTransfer::findOrFail($id);

        if ($transfer->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft transfers can be deleted.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $transfer->items()->delete();
        $transfer->delete();

        return response()->json([
            'success' => true, 'message' => 'Stock transfer deleted.',
            'data' => null, 'errors' => null,
        ]);
    }

    public function submit(int $id): JsonResponse
    {
        $transfer = StockTransfer::findOrFail($id);

        if ($transfer->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft transfers can be submitted.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $transfer->update(['status' => 'submitted']);

        return response()->json([
            'success' => true, 'message' => 'Stock transfer submitted for approval.',
            'data' => $transfer, 'errors' => null,
        ]);
    }

    public function approve(int $id): JsonResponse
    {
        $transfer = StockTransfer::findOrFail($id);

        if ($transfer->status !== 'submitted') {
            return response()->json([
                'success' => false, 'message' => 'Only submitted transfers can be approved.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        $transfer->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true, 'message' => 'Stock transfer approved.',
            'data' => $transfer, 'errors' => null,
        ]);
    }

    public function dispatch(int $id): JsonResponse
    {
        $transfer = StockTransfer::with('items')->findOrFail($id);

        if ($transfer->status !== 'approved') {
            return response()->json([
                'success' => false, 'message' => 'Only approved transfers can be dispatched.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        try {
            DB::transaction(function () use ($transfer) {
                foreach ($transfer->items as $item) {
                    $batch = \App\Models\PurchaseBatch::lockForUpdate()->find($item->batch_id);

                    if (!$batch || $batch->available_quantity < $item->quantity) {
                        throw new \RuntimeException("Insufficient stock in batch for product ID {$item->product_id}");
                    }

                    // Deduct from source
                    $batch->decrement('available_quantity', $item->quantity);
                    if ($batch->available_quantity <= 0) {
                        $batch->update(['status' => 'exhausted']);
                    }

                    \App\Services\InventoryLedgerService::addEntry(
                        storeId: $transfer->source_store_id,
                        productId: $item->product_id,
                        batchId: $item->batch_id,
                        transactionType: 'transfer_out',
                        transactionId: $transfer->id,
                        transactionItemId: $item->id,
                        referenceNumber: $transfer->transfer_number,
                        transactionDate: now()->toDateString(),
                        incomingQuantity: 0,
                        outgoingQuantity: $item->quantity,
                        unitId: null,
                        remarks: "Transfer Out: {$transfer->transfer_number}",
                        createdBy: auth()->id(),
                    );
                }

                $transfer->update([
                    'status' => 'dispatched',
                    'dispatched_by' => auth()->id(),
                    'dispatched_at' => now(),
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }

        AuditLogService::log(
            module: 'stock_transfer', action: 'transfer_dispatch',
            recordType: 'stock_transfer', recordId: $transfer->id,
            storeId: $transfer->source_store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Stock transfer dispatched.',
            'data' => $transfer->fresh(['items']), 'errors' => null,
        ]);
    }

    public function receive(int $id): JsonResponse
    {
        $transfer = StockTransfer::with('items')->findOrFail($id);

        if ($transfer->status !== 'dispatched') {
            return response()->json([
                'success' => false, 'message' => 'Only dispatched transfers can be received.',
                'data' => null, 'errors' => null,
            ], 422);
        }

        try {
            DB::transaction(function () use ($transfer) {
                foreach ($transfer->items as $item) {
                    $sourceBatch = \App\Models\PurchaseBatch::find($item->batch_id);

                    // Create a new batch in destination store
                    $newBatch = \App\Models\PurchaseBatch::create([
                        'store_id' => $transfer->destination_store_id,
                        'purchase_id' => $sourceBatch?->purchase_id,
                        'purchase_item_id' => $sourceBatch?->purchase_item_id,
                        'supplier_id' => $sourceBatch?->supplier_id,
                        'product_id' => $item->product_id,
                        'batch_number' => ($sourceBatch?->batch_number ?? 'BATCH') . '-TR',
                        'purchase_date' => now()->toDateString(),
                        'purchase_quantity' => $item->quantity,
                        'available_quantity' => $item->quantity,
                        'sold_quantity' => 0,
                        'purchase_price' => $sourceBatch?->purchase_price ?? 0,
                        'selling_price' => $sourceBatch?->selling_price ?? 0,
                        'landed_cost' => $sourceBatch?->landed_cost ?? 0,
                        'gst_rate' => $sourceBatch?->gst_rate ?? 0,
                        'status' => 'active',
                        'created_by' => auth()->id(),
                    ]);

                    \App\Services\InventoryLedgerService::addEntry(
                        storeId: $transfer->destination_store_id,
                        productId: $item->product_id,
                        batchId: $newBatch->id,
                        transactionType: 'transfer_in',
                        transactionId: $transfer->id,
                        transactionItemId: $item->id,
                        referenceNumber: $transfer->transfer_number,
                        transactionDate: now()->toDateString(),
                        incomingQuantity: $item->quantity,
                        outgoingQuantity: 0,
                        unitId: null,
                        remarks: "Transfer In: {$transfer->transfer_number}",
                        createdBy: auth()->id(),
                    );
                }

                $transfer->update([
                    'status' => 'received',
                    'received_by' => auth()->id(),
                    'received_at' => now(),
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }

        AuditLogService::log(
            module: 'stock_transfer', action: 'transfer_receive',
            recordType: 'stock_transfer', recordId: $transfer->id,
            storeId: $transfer->destination_store_id,
        );

        return response()->json([
            'success' => true, 'message' => 'Stock transfer received.',
            'data' => $transfer->fresh(['items']), 'errors' => null,
        ]);
    }
}
