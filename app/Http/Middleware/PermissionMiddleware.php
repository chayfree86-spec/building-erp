<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Ensure the authenticated user has the required permission.
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'data' => null,
                'errors' => null,
            ], 401);
        }

        $storeId = $request->route('store_id')
            ?? $request->header('X-Store-Id')
            ?? $request->input('store_id');

        if (!$user->hasPermission($permission, $storeId ? (int) $storeId : null)) {
            return response()->json([
                'success' => false,
                'message' => "Permission denied. Required permission: {$permission}.",
                'data' => null,
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
