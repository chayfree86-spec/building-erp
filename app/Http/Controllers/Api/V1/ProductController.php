<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'unit', 'brand', 'gstRate']);

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true, 'message' => 'Products retrieved.',
            'data' => $query->get(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'unit_id' => 'required|exists:units,id',
            'brand_id' => 'nullable|exists:brands,id',
            'gst_rate_id' => 'required|exists:gst_rates,id',
            'name' => 'required|string|max:200',
            'sku' => 'required|string|max:100|unique:products,sku',
            'barcode' => 'nullable|string|max:200|unique:products,barcode',
            'hsn_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'minimum_stock' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $product = Product::create($validated + ['created_by' => $request->user()->id]);

        return response()->json([
            'success' => true, 'message' => 'Product created.',
            'data' => $product->load(['category', 'unit', 'brand', 'gstRate']),
            'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Product retrieved.',
            'data' => Product::with(['category', 'unit', 'brand', 'gstRate', 'barcodes'])
                ->findOrFail($id),
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $product->update($request->validate([
            'category_id' => 'nullable|exists:categories,id',
            'unit_id' => 'sometimes|exists:units,id',
            'brand_id' => 'nullable|exists:brands,id',
            'gst_rate_id' => 'sometimes|exists:gst_rates,id',
            'name' => 'sometimes|string|max:200',
            'sku' => 'sometimes|string|max:100|unique:products,sku,' . $id,
            'barcode' => 'nullable|string|max:200|unique:products,barcode,' . $id,
            'hsn_code' => 'nullable|string|max:20',
            'description' => 'nullable|string',
            'minimum_stock' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]) + ['updated_by' => $request->user()->id]);

        return response()->json([
            'success' => true, 'message' => 'Product updated.',
            'data' => $product->load(['category', 'unit', 'brand', 'gstRate']),
            'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update(['status' => 'inactive']);

        return response()->json([
            'success' => true, 'message' => 'Product deactivated.',
            'data' => null, 'errors' => null,
        ]);
    }
}
