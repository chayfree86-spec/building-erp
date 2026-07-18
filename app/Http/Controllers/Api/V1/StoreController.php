<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Stores retrieved.',
            'data' => Store::with('users')->get(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'code' => 'required|string|max:50|unique:stores,code',
            'mobile' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:100',
            'gst_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:10',
            'invoice_prefix' => 'nullable|string|max:20',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $store = Store::create(collect($validated)->except(['user_ids'])->toArray() + ['created_by' => $request->user()->id]);

        if ($request->has('user_ids')) {
            $store->users()->sync($request->user_ids);
        }

        return response()->json([
            'success' => true, 'message' => 'Store created.',
            'data' => $store->load('users'), 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Store retrieved.',
            'data' => Store::with('users')->findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $store = Store::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:200',
            'code' => 'sometimes|string|max:50|unique:stores,code,' . $id,
            'mobile' => 'nullable|string|max:15',
            'email' => 'nullable|email|max:100',
            'gst_number' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:10',
            'invoice_prefix' => 'nullable|string|max:20',
            'status' => 'sometimes|in:active,inactive',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $store->update(collect($validated)->except(['user_ids'])->toArray());

        if ($request->has('user_ids')) {
            $store->users()->sync($request->user_ids);
        }

        return response()->json([
            'success' => true, 'message' => 'Store updated.',
            'data' => $store->load('users'), 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $store = Store::findOrFail($id);
        $store->delete();

        return response()->json([
            'success' => true, 'message' => 'Store deleted.',
            'data' => null, 'errors' => null,
        ]);
    }
}
