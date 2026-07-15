<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Permissions retrieved.',
            'data' => Permission::all(), 'errors' => null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:permissions,slug',
            'module' => 'required|string|max:50',
            'action' => 'required|string|max:50',
            'description' => 'nullable|string',
        ]);

        $permission = Permission::create($validated);

        return response()->json([
            'success' => true, 'message' => 'Permission created.',
            'data' => $permission, 'errors' => null,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'Permission retrieved.',
            'data' => Permission::findOrFail($id), 'errors' => null,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $permission = Permission::findOrFail($id);

        $permission->update($request->validate([
            'name' => 'sometimes|string|max:100',
            'slug' => 'sometimes|string|max:100|unique:permissions,slug,' . $id,
            'module' => 'sometimes|string|max:50',
            'action' => 'sometimes|string|max:50',
            'description' => 'nullable|string',
        ]));

        return response()->json([
            'success' => true, 'message' => 'Permission updated.',
            'data' => $permission, 'errors' => null,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        Permission::findOrFail($id)->delete();

        return response()->json([
            'success' => true, 'message' => 'Permission deleted.',
            'data' => null, 'errors' => null,
        ]);
    }
}
