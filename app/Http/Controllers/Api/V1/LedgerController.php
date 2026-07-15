<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CustomerLedger;
use App\Models\SupplierLedger;
use App\Models\InventoryLedger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    public function customerLedger(Request $request): JsonResponse
    {
        $query = CustomerLedger::with(['customer', 'store']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->date_from) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        $query->orderBy('transaction_date')->orderBy('id');

        return response()->json([
            'success' => true, 'message' => 'Customer ledger retrieved.',
            'data' => $query->get(), 'errors' => null,
        ]);
    }

    public function supplierLedger(Request $request): JsonResponse
    {
        $query = SupplierLedger::with(['supplier', 'store']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }
        if ($request->date_from) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        $query->orderBy('transaction_date')->orderBy('id');

        return response()->json([
            'success' => true, 'message' => 'Supplier ledger retrieved.',
            'data' => $query->get(), 'errors' => null,
        ]);
    }

    public function inventoryLedger(Request $request): JsonResponse
    {
        $query = InventoryLedger::with(['product', 'batch', 'unit', 'store']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->date_from) {
            $query->whereDate('transaction_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('transaction_date', '<=', $request->date_to);
        }

        $query->orderBy('transaction_date')->orderBy('id');

        return response()->json([
            'success' => true, 'message' => 'Inventory ledger retrieved.',
            'data' => $query->get(), 'errors' => null,
        ]);
    }
}
