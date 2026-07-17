<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PurchaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Purchase::with(['supplier', 'store', 'items', 'createdBy']);

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
            $query->whereDate('purchase_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('purchase_date', '<=', $request->date_to);
        }

        $purchases = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'message' => 'Purchases retrieved successfully.',
            'data' => $purchases,
            'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'store_id' => 'required|exists:stores,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'supplier_invoice_number' => 'nullable|string|max:100',
            'subtotal' => 'required|numeric|min:0',
            'discount_amount' => 'numeric|min:0',
            'tax_amount' => 'numeric|min:0',
            'additional_cost' => 'numeric|min:0',
            'round_off' => 'numeric',
            'total_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.unit_id' => 'nullable|exists:units,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.purchase_price' => 'required|numeric|min:0',
            'items.*.selling_price' => 'numeric|min:0',
            'items.*.discount_amount' => 'numeric|min:0',
            'items.*.taxable_amount' => 'numeric|min:0',
            'items.*.gst_rate' => 'numeric|min:0',
            'items.*.tax_amount' => 'numeric|min:0',
            'items.*.additional_cost_share' => 'numeric|min:0',
            'items.*.landed_cost' => 'numeric|min:0',
            'items.*.line_total' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'data' => null,
                'errors' => $validator->errors(),
            ], 422);
        }

        $purchaseNumber = \App\Services\DocumentNumberService::generate(
            $request->store_id,
            'purchase'
        );

        $purchase = Purchase::create([
            'store_id' => $request->store_id,
            'supplier_id' => $request->supplier_id,
            'purchase_number' => $purchaseNumber,
            'supplier_invoice_number' => $request->supplier_invoice_number,
            'purchase_date' => $request->purchase_date,
            'subtotal' => $request->subtotal,
            'discount_amount' => $request->discount_amount ?? 0,
            'tax_amount' => $request->tax_amount ?? 0,
            'additional_cost' => $request->additional_cost ?? 0,
            'round_off' => $request->round_off ?? 0,
            'total_amount' => $request->total_amount,
            'paid_amount' => $request->paid_amount ?? 0,
            'balance_amount' => $request->total_amount - ($request->paid_amount ?? 0),
            'status' => 'draft',
            'remarks' => $request->remarks,
            'created_by' => $request->user()->id,
        ]);

        foreach ($request->items as $item) {
            $purchase->items()->create([
                'product_id' => $item['product_id'],
                'unit_id' => $item['unit_id'] ?? null,
                'quantity' => $item['quantity'],
                'purchase_price' => $item['purchase_price'],
                'selling_price' => $item['selling_price'] ?? 0,
                'discount_amount' => $item['discount_amount'] ?? 0,
                'taxable_amount' => $item['taxable_amount'] ?? 0,
                'gst_rate' => $item['gst_rate'] ?? 0,
                'tax_amount' => $item['tax_amount'] ?? 0,
                'additional_cost_share' => $item['additional_cost_share'] ?? 0,
                'landed_cost' => $item['landed_cost'] ?? $item['purchase_price'],
                'line_total' => $item['line_total'],
            ]);
        }

        \App\Services\AuditLogService::log(
            module: 'purchase',
            action: 'purchase_create',
            recordType: 'purchase',
            recordId: $purchase->id,
            storeId: $request->store_id,
        );

        return response()->json([
            'success' => true,
            'message' => 'Purchase created successfully.',
            'data' => $purchase->load(['items', 'supplier', 'store']),
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $purchase = Purchase::with(['items', 'supplier', 'store', 'batches', 'createdBy'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Purchase retrieved.',
            'data' => $purchase,
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);

        if (!in_array($purchase->status, ['draft', 'submitted'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only draft or submitted purchases can be edited.',
                'data' => null,
                'errors' => null,
            ], 422);
        }

        // Similar validation and update as store
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'supplier_invoice_number' => 'nullable|string|max:100',
            'subtotal' => 'required|numeric|min:0',
            'discount_amount' => 'numeric|min:0',
            'tax_amount' => 'numeric|min:0',
            'additional_cost' => 'numeric|min:0',
            'round_off' => 'numeric',
            'total_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'data' => null,
                'errors' => $validator->errors(),
            ], 422);
        }

        $purchase->update($request->only([
            'supplier_id', 'purchase_date', 'supplier_invoice_number',
            'subtotal', 'discount_amount', 'tax_amount', 'additional_cost',
            'round_off', 'total_amount', 'remarks',
        ]));

        $purchase->update([
            'balance_amount' => $purchase->total_amount - $purchase->paid_amount,
        ]);

        // Update items if provided
        if ($request->has('items')) {
            $purchase->items()->delete();
            foreach ($request->items as $item) {
                $purchase->items()->create($item);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase updated.',
            'data' => $purchase->load(['items', 'supplier', 'store']),
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);

        if ($purchase->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Only draft purchases can be deleted.',
                'data' => null,
                'errors' => null,
            ], 422);
        }

        // Delete bill attachment if exists
        if ($purchase->bill_attachment) {
            Storage::disk('public')->delete($purchase->bill_attachment);
        }

        $purchase->items()->delete();
        $purchase->delete();

        return response()->json([
            'success' => true,
            'message' => 'Purchase deleted.',
            'data' => null,
            'errors' => null,
        ]);
    }

    /**
     * Upload bill/invoice attachment for a purchase.
     */
    public function uploadBill(Request $request, int $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'bill' => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:10240',
        ], [
            'bill.max' => 'Bill file size must not exceed 10MB.',
            'bill.mimes' => 'Bill must be a PDF, JPG, JPEG, PNG, or WebP file.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'data' => null,
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('bill');
        $originalName = $file->getClientOriginalName();

        // Store in: storage/app/public/purchases/{store_id}/{purchase_id}/
        $path = $file->storeAs(
            "purchases/{$purchase->store_id}/{$purchase->id}",
            'bill_' . time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName),
            'public'
        );

        // Delete old attachment if exists
        if ($purchase->bill_attachment) {
            Storage::disk('public')->delete($purchase->bill_attachment);
        }

        $purchase->update([
            'bill_attachment' => $path,
            'bill_attachment_original_name' => $originalName,
        ]);

        \App\Services\AuditLogService::log(
            module: 'purchase',
            action: 'bill_upload',
            recordType: 'purchase',
            recordId: $purchase->id,
            storeId: $purchase->store_id,
        );

        return response()->json([
            'success' => true,
            'message' => 'Bill uploaded successfully.',
            'data' => [
                'bill_url' => Storage::disk('public')->url($path),
                'original_name' => $originalName,
            ],
            'errors' => null,
        ]);
    }

    /**
     * Delete bill attachment.
     */
    public function deleteBill(int $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);

        if (!$purchase->bill_attachment) {
            return response()->json([
                'success' => false,
                'message' => 'No bill attachment found.',
                'data' => null,
                'errors' => null,
            ], 404);
        }

        Storage::disk('public')->delete($purchase->bill_attachment);

        $purchase->update([
            'bill_attachment' => null,
            'bill_attachment_original_name' => null,
        ]);

        \App\Services\AuditLogService::log(
            module: 'purchase',
            action: 'bill_delete',
            recordType: 'purchase',
            recordId: $purchase->id,
            storeId: $purchase->store_id,
        );

        return response()->json([
            'success' => true,
            'message' => 'Bill deleted successfully.',
            'data' => null,
            'errors' => null,
        ]);
    }

    public function submit(int $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);
        if ($purchase->status !== 'draft') {
            return response()->json([
                'success' => false, 'message' => 'Only draft purchases can be submitted.',
                'data' => null, 'errors' => null,
            ], 422);
        }
        $purchase->update(['status' => 'submitted']);

        return response()->json([
            'success' => true, 'message' => 'Purchase submitted.',
            'data' => $purchase, 'errors' => null,
        ]);
    }

    public function approve(int $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);
        if ($purchase->status !== 'submitted') {
            return response()->json([
                'success' => false, 'message' => 'Only submitted purchases can be approved.',
                'data' => null, 'errors' => null,
            ], 422);
        }
        $purchase->update(['status' => 'approved', 'approved_by' => request()->user()->id, 'approved_at' => now()]);

        return response()->json([
            'success' => true, 'message' => 'Purchase approved.',
            'data' => $purchase, 'errors' => null,
        ]);
    }

    public function confirm(int $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);

        try {
            $purchase = \App\Services\PurchaseService::confirm($purchase);
            return response()->json([
                'success' => true, 'message' => 'Purchase confirmed. Batches created.',
                'data' => $purchase, 'errors' => null,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $purchase = Purchase::findOrFail($id);

        try {
            $purchase = \App\Services\PurchaseService::cancel(
                $purchase,
                $request->user()->id,
                $request->input('reason', 'No reason provided')
            );
            return response()->json([
                'success' => true, 'message' => 'Purchase cancelled.',
                'data' => $purchase, 'errors' => null,
            ]);
        } catch (\RuntimeException $e) {
            return response()->json([
                'success' => false, 'message' => $e->getMessage(),
                'data' => null, 'errors' => null,
            ], 422);
        }
    }
}
