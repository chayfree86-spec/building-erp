<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PurchaseBatch;
use App\Models\InventoryLedger;
use App\Models\CustomerLedger;
use App\Models\SupplierLedger;
use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReconciliationController extends Controller
{
    public function stockReconciliation(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');

        $batchStock = PurchaseBatch::where('store_id', $storeId)
            ->select('product_id', DB::raw('SUM(available_quantity) as batch_available'))
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        $ledgerStock = InventoryLedger::where('store_id', $storeId)
            ->select('product_id', DB::raw('SUM(incoming_quantity) - SUM(outgoing_quantity) as ledger_balance'))
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        $discrepancies = [];
        $allProductIds = $batchStock->keys()->merge($ledgerStock->keys())->unique();

        foreach ($allProductIds as $productId) {
            $batchQty = $batchStock->get($productId)?->batch_available ?? 0;
            $ledgerQty = $ledgerStock->get($productId)?->ledger_balance ?? 0;
            $diff = $batchQty - $ledgerQty;

            if (abs($diff) > 0.001) {
                $discrepancies[] = [
                    'product_id' => $productId,
                    'batch_available' => (float) $batchQty,
                    'ledger_balance' => (float) $ledgerQty,
                    'difference' => (float) $diff,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Stock reconciliation completed.',
            'data' => [
                'discrepancies' => $discrepancies,
                'total_discrepancies' => count($discrepancies),
            ],
            'errors' => null,
        ]);
    }

    public function customerReconciliation(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');

        $customers = Customer::where('status', 'active')->get();
        $data = [];

        foreach ($customers as $customer) {
            $balance = CustomerLedger::where('store_id', $storeId)
                ->where('customer_id', $customer->id)
                ->select(DB::raw('SUM(debit_amount) - SUM(credit_amount) as balance'))
                ->value('balance') ?? 0;

            $data[] = [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'outstanding_balance' => (float) $balance,
            ];
        }

        return response()->json([
            'success' => true, 'message' => 'Customer reconciliation completed.',
            'data' => $data, 'errors' => null,
        ]);
    }

    public function supplierReconciliation(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');

        $suppliers = Supplier::where('status', 'active')->get();
        $data = [];

        foreach ($suppliers as $supplier) {
            $balance = SupplierLedger::where('store_id', $storeId)
                ->where('supplier_id', $supplier->id)
                ->select(DB::raw('SUM(credit_amount) - SUM(debit_amount) as balance'))
                ->value('balance') ?? 0;

            $data[] = [
                'supplier_id' => $supplier->id,
                'supplier_name' => $supplier->name,
                'outstanding_balance' => (float) $balance,
            ];
        }

        return response()->json([
            'success' => true, 'message' => 'Supplier reconciliation completed.',
            'data' => $data, 'errors' => null,
        ]);
    }
}
