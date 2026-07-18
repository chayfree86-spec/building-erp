<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false, 'message' => 'Validation failed.',
                'data' => null, 'errors' => $validator->errors(),
            ], 422);
        }

        $login = $request->login;
        $user = User::where('email', $login)
            ->orWhere('mobile', $login)
            ->first();

        $authenticated = false;
        if ($user) {
            $isMobile = preg_match('/^[0-9+\s-]*$/', trim($login));
            if ($isMobile && !empty($user->pin)) {
                $authenticated = Hash::check($request->password, $user->pin);
            } else {
                $authenticated = Hash::check($request->password, $user->password);
            }
        }

        if (!$user || !$authenticated) {
            LoginLog::create([
                'email' => filter_var($login, FILTER_VALIDATE_EMAIL) ? $login : null,
                'mobile' => !filter_var($login, FILTER_VALIDATE_EMAIL) ? $login : null,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status' => 'failed',
                'failure_reason' => 'invalid_credentials',
                'created_at' => now(),
            ]);

            return response()->json([
                'success' => false, 'message' => 'Invalid credentials.',
                'data' => null, 'errors' => null,
            ], 401);
        }

        if (!$user->isActive()) {
            return response()->json([
                'success' => false, 'message' => 'Account is inactive or suspended.',
                'data' => null, 'errors' => null,
            ], 403);
        }

        // Create token
        $token = $user->createToken('api-token')->plainTextToken;

        $user->update(['last_login_at' => now()]);

        LoginLog::create([
            'user_id' => $user->id,
            'email' => $user->email,
            'mobile' => $user->mobile,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'status' => 'success',
            'created_at' => now(),
        ]);

        \App\Services\AuditLogService::log(
            module: 'auth', action: 'login',
            recordType: 'user', recordId: $user->id,
        );

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => $user->load('roles.permissions'),
                'token' => $token,
            ],
            'errors' => null,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        \App\Services\AuditLogService::log(
            module: 'auth', action: 'logout',
            recordType: 'user', recordId: $request->user()->id,
        );

        return response()->json([
            'success' => true, 'message' => 'Logged out successfully.',
            'data' => null, 'errors' => null,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'User profile.',
            'data' => $request->user()->load(['roles.permissions', 'stores']),
            'errors' => null,
        ]);
    }

    public function myStores(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true, 'message' => 'User stores.',
            'data' => $request->user()->stores()->wherePivot('status', 'active')->get(),
            'errors' => null,
        ]);
    }
}
