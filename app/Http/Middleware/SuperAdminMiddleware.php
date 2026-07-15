<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    /**
     * Ensure the authenticated user is a Super Admin (can access all stores).
     */
    public function handle(Request $request, Closure $next): Response
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

        $isSuperAdmin = $user->roles()->where('slug', 'super_admin')->exists();

        if (!$isSuperAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Super Admin privileges required.',
                'data' => null,
                'errors' => null,
            ], 403);
        }

        return $next($request);
    }
}
