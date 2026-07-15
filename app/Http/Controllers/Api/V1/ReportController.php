<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use App\Models\Purchase;
use App\Models\PurchaseBatch;
use App\Models\Customer;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function stockReport(Request $request): JsonResponse
    {
        $query = PurchaseBatch::with(['product.category', 'product.unit', 'store'])
            ->where('available_quantity', '>', 0);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->category_id) {
            $query->whereHas('product', fn($q) => $q->where('category_id', $request->category_id));
        }

        $batches = $query->get();

        $summary = [
            'total_products' => $batches->unique('product_id')->count(),
            'total_batches' => $batches->count(),
            'total_quantity' => $batches->sum('available_quantity'),
            'total_value' => $batches->sum(fn($b) => $b->available_quantity * $b->landed_cost),
        ];

        return response()->json([
            'success' => true, 'message' => 'Stock report generated.',
            'data' => ['batches' => $batches, 'summary' => $summary],
            'errors' => null,
        ]);
    }

    public function salesReport(Request $request): JsonResponse
    {
        $query = SalesInvoice::with(['customer', 'store', 'items']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->date_from) {
            $query->whereDate('invoice_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('invoice_date', '<=', $request->date_to);
        }

        $invoices = $query->where('status', 'confirmed')->get();

        $summary = [
            'total_invoices' => $invoices->count(),
            'total_sales' => $invoices->sum('total_amount'),
            'total_paid' => $invoices->sum('paid_amount'),
            'total_outstanding' => $invoices->sum('balance_amount'),
            'total_tax' => $invoices->sum('tax_amount'),
        ];

        return response()->json([
            'success' => true, 'message' => 'Sales report generated.',
            'data' => ['invoices' => $invoices, 'summary' => $summary],
            'errors' => null,
        ]);
    }

    public function purchaseReport(Request $request): JsonResponse
    {
        $query = Purchase::with(['supplier', 'store', 'items']);

        if ($storeId = $request->header('X-Store-Id')) {
            $query->where('store_id', $storeId);
        }
        if ($request->date_from) {
            $query->whereDate('purchase_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('purchase_date', '<=', $request->date_to);
        }

        $purchases = $query->where('status', 'confirmed')->get();

        $summary = [
            'total_purchases' => $purchases->count(),
            'total_amount' => $purchases->sum('total_amount'),
            'total_paid' => $purchases->sum('paid_amount'),
            'total_outstanding' => $purchases->sum('balance_amount'),
            'total_tax' => $purchases->sum('tax_amount'),
        ];

        return response()->json([
            'success' => true, 'message' => 'Purchase report generated.',
            'data' => ['purchases' => $purchases, 'summary' => $summary],
            'errors' => null,
        ]);
    }

    public function profitReport(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');

        $salesTotal = SalesInvoice::where('status', 'confirmed')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->when($request->date_from, fn($q) => $q->whereDate('invoice_date', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('invoice_date', '<=', $request->date_to))
            ->sum('total_amount');

        $costTotal = DB::table('sales_batch_allocations')
            ->join('sales_invoices', 'sales_batch_allocations.invoice_id', '=', 'sales_invoices.id')
            ->where('sales_invoices.status', 'confirmed')
            ->when($storeId, fn($q) => $q->where('sales_batch_allocations.store_id', $storeId))
            ->when($request->date_from, fn($q) => $q->whereDate('sales_invoices.invoice_date', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('sales_invoices.invoice_date', '<=', $request->date_to))
            ->sum('sales_batch_allocations.cost_amount');

        $profit = $salesTotal - $costTotal;
        $margin = $salesTotal > 0 ? round(($profit / $salesTotal) * 100, 2) : 0;

        return response()->json([
            'success' => true, 'message' => 'Profit report generated.',
            'data' => [
                'total_sales' => (float) $salesTotal,
                'total_cost' => (float) $costTotal,
                'gross_profit' => (float) $profit,
                'profit_margin_percent' => $margin,
            ],
            'errors' => null,
        ]);
    }

    public function gstReport(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');

        // Output GST (sales)
        $outputGst = SalesInvoice::where('status', 'confirmed')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->when($request->date_from, fn($q) => $q->whereDate('invoice_date', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('invoice_date', '<=', $request->date_to))
            ->select(DB::raw('SUM(cgst_amount) as cgst, SUM(sgst_amount) as sgst, SUM(igst_amount) as igst, SUM(tax_amount) as total_tax'))
            ->first();

        // Input GST (purchases)
        $inputGst = Purchase::where('status', 'confirmed')
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->when($request->date_from, fn($q) => $q->whereDate('purchase_date', '>=', $request->date_from))
            ->when($request->date_to, fn($q) => $q->whereDate('purchase_date', '<=', $request->date_to))
            ->select(DB::raw('SUM(tax_amount) as total_tax'))
            ->first();

        return response()->json([
            'success' => true, 'message' => 'GST report generated.',
            'data' => [
                'output_gst' => [
                    'cgst' => (float) ($outputGst->cgst ?? 0),
                    'sgst' => (float) ($outputGst->sgst ?? 0),
                    'igst' => (float) ($outputGst->igst ?? 0),
                    'total' => (float) ($outputGst->total_tax ?? 0),
                ],
                'input_gst' => [
                    'total' => (float) ($inputGst->total_tax ?? 0),
                ],
                'net_payable' => (float) (($outputGst->total_tax ?? 0) - ($inputGst->total_tax ?? 0)),
            ],
            'errors' => null,
        ]);
    }

    public function customerOutstanding(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');

        $customers = Customer::where('status', 'active')->get();
        $data = [];

        foreach ($customers as $customer) {
            $balance = \App\Models\CustomerLedger::where('store_id', $storeId)
                ->where('customer_id', $customer->id)
                ->select(DB::raw('SUM(debit_amount) - SUM(credit_amount) as balance'))
                ->value('balance') ?? 0;

            if (abs($balance) > 0.001) {
                $data[] = [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'mobile' => $customer->mobile,
                    'outstanding' => (float) $balance,
                ];
            }
        }

        $totalOutstanding = array_sum(array_column($data, 'outstanding'));

        return response()->json([
            'success' => true, 'message' => 'Customer outstanding report.',
            'data' => [
                'customers' => $data,
                'total_outstanding' => $totalOutstanding,
            ],
            'errors' => null,
        ]);
    }

    public function supplierOutstanding(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');

        $suppliers = Supplier::where('status', 'active')->get();
        $data = [];

        foreach ($suppliers as $supplier) {
            $balance = \App\Models\SupplierLedger::where('store_id', $storeId)
                ->where('supplier_id', $supplier->id)
                ->select(DB::raw('SUM(credit_amount) - SUM(debit_amount) as balance'))
                ->value('balance') ?? 0;

            if (abs($balance) > 0.001) {
                $data[] = [
                    'supplier_id' => $supplier->id,
                    'supplier_name' => $supplier->name,
                    'mobile' => $supplier->mobile,
                    'outstanding' => (float) $balance,
                ];
            }
        }

        $totalOutstanding = array_sum(array_column($data, 'outstanding'));

        return response()->json([
            'success' => true, 'message' => 'Supplier outstanding report.',
            'data' => [
                'suppliers' => $data,
                'total_outstanding' => $totalOutstanding,
            ],
            'errors' => null,
        ]);
    }

    public function lowStock(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');

        $products = \App\Models\Product::with(['category', 'unit'])
            ->where('status', 'active')
            ->where('minimum_stock', '>', 0)
            ->get();

        $data = [];
        foreach ($products as $product) {
            $totalStock = PurchaseBatch::where('product_id', $product->id)
                ->when($storeId, fn($q) => $q->where('store_id', $storeId))
                ->where('available_quantity', '>', 0)
                ->sum('available_quantity');

            if ($totalStock <= $product->minimum_stock) {
                $data[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'current_stock' => (float) $totalStock,
                    'minimum_stock' => (float) $product->minimum_stock,
                    'shortage' => (float) ($product->minimum_stock - $totalStock),
                ];
            }
        }

        return response()->json([
            'success' => true, 'message' => 'Low stock report.',
            'data' => ['items' => $data, 'count' => count($data)],
            'errors' => null,
        ]);
    }

    public function dailySales(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id');
        $date = $request->date ?? now()->toDateString();

        $invoices = SalesInvoice::with(['customer', 'items.product', 'batchAllocations'])
            ->where('status', 'confirmed')
            ->whereDate('invoice_date', $date)
            ->when($storeId, fn($q) => $q->where('store_id', $storeId))
            ->get();

        $summary = [
            'date' => $date,
            'total_invoices' => $invoices->count(),
            'total_sales' => $invoices->sum('total_amount'),
            'total_tax' => $invoices->sum('tax_amount'),
            'total_discount' => $invoices->sum('item_discount') + $invoices->sum('overall_discount'),
            'total_paid' => $invoices->sum('paid_amount'),
        ];

        return response()->json([
            'success' => true, 'message' => 'Daily sales report.',
            'data' => ['invoices' => $invoices, 'summary' => $summary],
            'errors' => null,
        ]);
    }
}
