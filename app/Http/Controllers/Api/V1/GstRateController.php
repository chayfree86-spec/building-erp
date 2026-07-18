<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\GstRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GstRateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'GST rates retrieved.',
            'data' => GstRate::all(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'rate' => 'required|numeric|min:0|max:100',
            'cgst_rate' => 'required|numeric|min:0|max:100',
            'sgst_rate' => 'required|numeric|min:0|max:100',
            'igst_rate' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $gstRate = GstRate::create($validated);

        return response()->json([
            'success' => true, 'message' => 'GST rate created.',
            'data' => $gstRate, 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'GST rate retrieved.',
            'data' => GstRate::findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $gstRate = GstRate::findOrFail($id);

        $gstRate->update($request->validate([
            'name' => 'sometimes|string|max:100',
            'rate' => 'sometimes|numeric|min:0|max:100',
            'cgst_rate' => 'sometimes|numeric|min:0|max:100',
            'sgst_rate' => 'sometimes|numeric|min:0|max:100',
            'igst_rate' => 'sometimes|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive',
        ]));

        return response()->json([
            'success' => true, 'message' => 'GST rate updated.',
            'data' => $gstRate, 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $gstRate = GstRate::findOrFail($id);
        $gstRate->delete();

        return response()->json([
            'success' => true, 'message' => 'GST rate deleted.',
            'data' => null, 'errors' => null,
        ]);
    }
}
