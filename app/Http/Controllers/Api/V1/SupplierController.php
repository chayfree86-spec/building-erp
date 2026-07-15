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
        $query = Supplier::with('addresses');

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

        $supplier = Supplier::create($validated + ['created_by' => $request->user()->id]);

        return response()->json([
            'success' => true, 'message' => 'Supplier created.',
            'data' => $supplier->load('addresses'), 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Supplier retrieved.',
            'data' => Supplier::with('addresses')->findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:200',
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

        $supplier->update($data + ['updated_by' => $request->user()->id]);

        return response()->json([
            'success' => true, 'message' => 'Supplier updated.',
            'data' => $supplier->load('addresses'), 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->update(['status' => 'inactive']);

        return response()->json([
            'success' => true, 'message' => 'Supplier deactivated.',
            'data' => null, 'errors' => null,
        ]);
    }
}
