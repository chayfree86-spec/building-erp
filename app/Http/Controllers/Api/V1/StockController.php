<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PurchaseBatch;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseBatch::with(['product.category', 'product.unit', 'store'])
            ->where('available_quantity', '>', 0);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->search) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true, 'message' => 'Stock retrieved.',
            'data' => $query->get(), 'errors' => null,
        ]);
    }

    public function batchWise(Request $request): JsonResponse
    {
        $query = PurchaseBatch::with(['product.category', 'product.unit', 'store', 'purchase.supplier'])
            ->where('available_quantity', '>', 0);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }

        return response()->json([
            'success' => true, 'message' => 'Batch-wise stock retrieved.',
            'data' => $query->get()->groupBy('product_id'), 'errors' => null,
        ]);
    }

    public function productStock(int $productId, Request $request): JsonResponse
    {
        $product = Product::with(['category', 'unit'])->findOrFail($productId);

        $batches = PurchaseBatch::with(['store', 'purchase.supplier'])
            ->where('product_id', $productId);

        if ($storeId = $request->header('X-Store-Id')) {
            $batches->where('store_id', $storeId);
        }

        return response()->json([
            'success' => true, 'message' => 'Product stock retrieved.',
            'data' => [
                'product' => $product,
                'batches' => $batches->get(),
                'total_available' => $batches->sum('available_quantity'),
            ],
            'errors' => null,
        ]);
    }
}
