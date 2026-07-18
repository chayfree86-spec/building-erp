<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Brands retrieved.',
            'data' => Brand::with(['categories'])->get(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
        ]);

        $brand = Brand::create(collect($validated)->except(['category_ids'])->toArray() + ['created_by' => $request->user()->id]);

        if ($request->has('category_ids')) {
            $brand->categories()->sync($request->category_ids);
        }

        return response()->json([
            'success' => true, 'message' => 'Brand created.',
            'data' => $brand->load(['categories']), 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Brand retrieved.',
            'data' => Brand::with(['categories'])->findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
        ]);

        $brand->update(collect($validated)->except(['category_ids'])->toArray());

        if ($request->has('category_ids')) {
            $brand->categories()->sync($request->category_ids);
        }

        return response()->json([
            'success' => true, 'message' => 'Brand updated.',
            'data' => $brand->load(['categories']), 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);
        $brand->delete();

        return response()->json([
            'success' => true, 'message' => 'Brand deleted.',
            'data' => null, 'errors' => null,
        ]);
    }
}
