<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Categories retrieved.',
            'data' => Category::with(['unit', 'units'])->withCount('products')->get(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'unit_id' => 'nullable|exists:units,id',
            'unit_ids' => 'nullable|array',
            'unit_ids.*' => 'exists:units,id',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $category = Category::create(collect($validated)->except(['unit_ids'])->toArray() + ['created_by' => $request->user()->id]);

        if ($request->has('unit_ids')) {
            $category->units()->sync($request->unit_ids);
        }

        return response()->json([
            'success' => true, 'message' => 'Category created.',
            'data' => $category->load(['unit', 'units']), 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Category retrieved.',
            'data' => Category::with(['unit', 'units'])->findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:200',
            'unit_id' => 'nullable|exists:units,id',
            'unit_ids' => 'nullable|array',
            'unit_ids.*' => 'exists:units,id',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $category->update(collect($validated)->except(['unit_ids'])->toArray());

        if ($request->has('unit_ids')) {
            $category->units()->sync($request->unit_ids);
        }

        return response()->json([
            'success' => true, 'message' => 'Category updated.',
            'data' => $category->load(['unit', 'units']), 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true, 'message' => 'Category deleted.',
            'data' => null, 'errors' => null,
        ]);
    }
}
