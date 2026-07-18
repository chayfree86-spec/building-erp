<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['roles', 'stores']);

        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('mobile', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true, 'message' => 'Users retrieved.',
            'data' => $query->get(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'mobile' => 'required|string|max:15|unique:users,mobile',
            'email' => 'nullable|email|max:100|unique:users,email',
            'password' => 'required|string|min:6',
            'pin' => 'nullable|string|size:4',
            'status' => 'sometimes|in:active,inactive',
            'roles' => 'nullable|array',
            'roles.*.role_id' => 'required|exists:roles,id',
            'roles.*.store_id' => 'required|exists:stores,id',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id',
            'store_ids' => 'nullable|array',
            'store_ids.*' => 'exists:stores,id',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        if (!empty($validated['pin'])) {
            $validated['pin'] = Hash::make($validated['pin']);
        }
        
        $user = User::create($validated);

        // Sync stores
        if ($request->has('store_ids')) {
            $syncData = [];
            foreach ($request->store_ids as $idx => $storeId) {
                $syncData[$storeId] = [
                    'is_default' => ($idx === 0),
                    'status' => 'active',
                ];
            }
            $user->stores()->sync($syncData);
        }

        // Sync roles (flat selection)
        if ($request->has('role_ids') && $request->has('store_ids')) {
            foreach ($request->role_ids as $roleId) {
                foreach ($request->store_ids as $storeId) {
                    $user->userRoles()->create([
                        'role_id' => $roleId,
                        'store_id' => $storeId,
                        'assigned_by' => $request->user()->id ?? $user->id,
                    ]);
                }
            }
        }

        // Support old format
        if ($request->has('roles')) {
            foreach ($request->roles as $roleData) {
                $user->userRoles()->create([
                    'role_id' => $roleData['role_id'],
                    'store_id' => $roleData['store_id'],
                    'assigned_by' => $request->user()->id ?? $user->id,
                ]);
            }
        }

        return response()->json([
            'success' => true, 'message' => 'User created.',
            'data' => $user->load(['roles', 'stores']), 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'User retrieved.',
            'data' => User::with(['roles.permissions', 'stores'])->findOrFail($id),
            'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:200',
            'mobile' => 'sometimes|string|max:15|unique:users,mobile,' . $id,
            'email' => 'nullable|email|max:100|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'pin' => 'nullable|string|size:4',
            'status' => 'sometimes|in:active,inactive',
            'role_ids' => 'nullable|array',
            'role_ids.*' => 'exists:roles,id',
            'store_ids' => 'nullable|array',
            'store_ids.*' => 'exists:stores,id',
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (array_key_exists('pin', $data)) {
            if (!empty($data['pin'])) {
                $data['pin'] = Hash::make($data['pin']);
            } else {
                unset($data['pin']);
            }
        }

        $user->update($data);

        // Sync stores
        if ($request->has('store_ids')) {
            $syncData = [];
            foreach ($request->store_ids as $idx => $storeId) {
                $syncData[$storeId] = [
                    'is_default' => ($idx === 0),
                    'status' => 'active',
                ];
            }
            $user->stores()->sync($syncData);
        }

        // Sync roles (flat selection)
        if ($request->has('role_ids') && $request->has('store_ids')) {
            $user->userRoles()->delete();
            foreach ($request->role_ids as $roleId) {
                foreach ($request->store_ids as $storeId) {
                    $user->userRoles()->create([
                        'role_id' => $roleId,
                        'store_id' => $storeId,
                        'assigned_by' => $request->user()->id ?? $user->id,
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true, 'message' => 'User updated.',
            'data' => $user->load(['roles.permissions', 'stores']), 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'inactive']);

        return response()->json([
            'success' => true, 'message' => 'User deactivated.',
            'data' => null, 'errors' => null,
        ]);
    }
}
