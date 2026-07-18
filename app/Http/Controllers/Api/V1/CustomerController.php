<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::with('addresses');

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
            'success' => true, 'message' => 'Customers retrieved.',
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
            'credit_limit' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if (!empty($validated['mobile'])) {
            $validated['normalized_mobile'] = preg_replace('/[^0-9]/', '', $validated['mobile']);
        }

        $customer = Customer::create($validated + ['created_by' => $request->user()->id]);

        return response()->json([
            'success' => true, 'message' => 'Customer created.',
            'data' => $customer->load('addresses'), 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Customer retrieved.',
            'data' => Customer::with('addresses')->findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:200',
            'mobile' => 'nullable|string|max:15',
            'alternate_mobile' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:100',
            'gst_number' => 'nullable|string|max:20',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_type' => 'nullable|in:debit,credit',
            'credit_limit' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if (!empty($data['mobile'])) {
            $data['normalized_mobile'] = preg_replace('/[^0-9]/', '', $data['mobile']);
        }

        $customer->update($data + ['updated_by' => $request->user()->id]);

        return response()->json([
            'success' => true, 'message' => 'Customer updated.',
            'data' => $customer->load('addresses'), 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json([
            'success' => true, 'message' => 'Customer deleted.',
            'data' => null, 'errors' => null,
        ]);
    }
}
