<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::with(['addresses', 'category', 'categories']);

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true, 'message' => 'Suppliers retrieved.',
            'data' => $query->get(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'category_id' => 'nullable|integer|exists:categories,id',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
            'mobile' => 'nullable|string|max:15',
            'alternate_mobile' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:100',
            'gst_number' => 'nullable|string|max:20',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_type' => 'nullable|in:debit,credit',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if (!empty($validated['mobile'])) {
            $validated['normalized_mobile'] = preg_replace('/[^0-9]/', '', $validated['mobile']);
        }

        if ($request->has('category_ids')) {
            $validated['category_id'] = count($request->category_ids) > 0 ? $request->category_ids[0] : null;
        }

        $supplier = Supplier::create(array_diff_key($validated, ['category_ids' => 1]) + ['created_by' => $request->user()->id]);

        if ($request->has('category_ids')) {
            $supplier->categories()->sync($request->category_ids);
        }

        return response()->json([
            'success' => true, 'message' => 'Supplier created.',
            'data' => $supplier->load(['addresses', 'category', 'categories']), 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Supplier retrieved.',
            'data' => Supplier::with(['addresses', 'category', 'categories'])->findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:200',
            'category_id' => 'nullable|integer|exists:categories,id',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
            'mobile' => 'nullable|string|max:15',
            'alternate_mobile' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:100',
            'gst_number' => 'nullable|string|max:20',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_type' => 'nullable|in:debit,credit',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if (!empty($data['mobile'])) {
            $data['normalized_mobile'] = preg_replace('/[^0-9]/', '', $data['mobile']);
        }

        if ($request->has('category_ids')) {
            $data['category_id'] = count($request->category_ids) > 0 ? $request->category_ids[0] : null;
        }

        $supplier->update(array_diff_key($data, ['category_ids' => 1]) + ['updated_by' => $request->user()->id]);

        if ($request->has('category_ids')) {
            $supplier->categories()->sync($request->category_ids);
        }

        return response()->json([
            'success' => true, 'message' => 'Supplier updated.',
            'data' => $supplier->load(['addresses', 'category', 'categories']), 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();

        return response()->json([
            'success' => true, 'message' => 'Supplier deleted.',
            'data' => null, 'errors' => null,
        ]);
    }
}
