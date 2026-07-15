<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Setting::query();

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->group) {
            $query->where('group', $request->group);
        }

        return response()->json([
            'success' => true, 'message' => 'Settings retrieved.',
            'data' => $query->get(), 'errors' => null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        $storeId = $request->header('X-Store-Id');

        foreach ($validated['settings'] as $setting) {
            Setting::updateOrCreate(
                [
                    'store_id' => $storeId,
                    'key' => $setting['key'],
                ],
                [
                    'value' => $setting['value'],
                    'group' => $setting['group'] ?? 'general',
                    'type' => $setting['type'] ?? 'string',
                    'description' => $setting['description'] ?? null,
                ]
            );
        }

        return response()->json([
            'success' => true, 'message' => 'Settings updated.',
            'data' => Setting::where('store_id', $storeId)->get(), 'errors' => null,
        ]);
    }
}
