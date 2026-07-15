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
            'data' => Category::with('unit')->get(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'unit_id' => 'nullable|exists:units,id',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $category = Category::create($validated + ['created_by' => $request->user()->id]);

        return response()->json([
            'success' => true, 'message' => 'Category created.',
            'data' => $category->load('unit'), 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Category retrieved.',
            'data' => Category::with('unit')->findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $category->update($request->validate([
            'name' => 'sometimes|string|max:200',
            'unit_id' => 'nullable|exists:units,id',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]));

        return response()->json([
            'success' => true, 'message' => 'Category updated.',
            'data' => $category->load('unit'), 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $category->update(['status' => 'inactive']);

        return response()->json([
            'success' => true, 'message' => 'Category deactivated.',
            'data' => null, 'errors' => null,
        ]);
    }
}
