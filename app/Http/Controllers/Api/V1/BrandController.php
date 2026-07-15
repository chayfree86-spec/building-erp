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
            'data' => Brand::all(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $brand = Brand::create($validated + ['created_by' => $request->user()->id]);

        return response()->json([
            'success' => true, 'message' => 'Brand created.',
            'data' => $brand, 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Brand retrieved.',
            'data' => Brand::findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);

        $brand->update($request->validate([
            'name' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]));

        return response()->json([
            'success' => true, 'message' => 'Brand updated.',
            'data' => $brand, 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);
        $brand->update(['status' => 'inactive']);

        return response()->json([
            'success' => true, 'message' => 'Brand deactivated.',
            'data' => null, 'errors' => null,
        ]);
    }
}
