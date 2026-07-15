<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Units retrieved.',
            'data' => Unit::all(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'short_name' => 'required|string|max:20|unique:units,short_name',
            'decimal_places' => 'sometimes|integer|min:0|max:4',
            'allow_fraction' => 'sometimes|boolean',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $unit = Unit::create($validated);

        return response()->json([
            'success' => true, 'message' => 'Unit created.',
            'data' => $unit, 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Unit retrieved.',
            'data' => Unit::findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $unit = Unit::findOrFail($id);

        $unit->update($request->validate([
            'name' => 'sometimes|string|max:100',
            'short_name' => 'sometimes|string|max:20|unique:units,short_name,' . $id,
            'decimal_places' => 'sometimes|integer|min:0|max:4',
            'allow_fraction' => 'sometimes|boolean',
            'status' => 'sometimes|in:active,inactive',
        ]));

        return response()->json([
            'success' => true, 'message' => 'Unit updated.',
            'data' => $unit, 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $unit = Unit::findOrFail($id);
        $unit->update(['status' => 'inactive']);

        return response()->json([
            'success' => true, 'message' => 'Unit deactivated.',
            'data' => null, 'errors' => null,
        ]);
    }
}
