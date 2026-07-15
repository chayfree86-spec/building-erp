<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StoreAccessMiddleware
{
    /**
     * Ensure the authenticated user has access to the requested store.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. User account is not active.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        $storeId = $request->route('store_id')
            ?? $request->header('X-Store-Id')
            ?? $request->input('store_id');

        if ($storeId && !$user->hasStoreAccess((int) $storeId)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. You do not have access to this store.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
