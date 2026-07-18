<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PaymentMode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentModeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Payment modes retrieved.',
            'data' => PaymentMode::all(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:payment_modes,code',
            'is_active' => 'sometimes|boolean',
        ]);

        $paymentMode = PaymentMode::create($validated);

        return response()->json([
            'success' => true, 'message' => 'Payment mode created.',
            'data' => $paymentMode, 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Payment mode retrieved.',
            'data' => PaymentMode::findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $paymentMode = PaymentMode::findOrFail($id);

        $paymentMode->update($request->validate([
            'name' => 'sometimes|string|max:100',
            'code' => 'sometimes|string|max:50|unique:payment_modes,code,' . $id,
            'is_active' => 'sometimes|boolean',
        ]));

        return response()->json([
            'success' => true, 'message' => 'Payment mode updated.',
            'data' => $paymentMode, 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $paymentMode = PaymentMode::findOrFail($id);
        $paymentMode->delete();

        return response()->json([
            'success' => true, 'message' => 'Payment mode deleted.',
            'data' => null, 'errors' => null,
        ]);
    }
}
