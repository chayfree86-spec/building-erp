<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1;

/*
|--------------------------------------------------------------------------
| API Routes - Building ERP v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Auth routes (public)
    Route::post('auth/login', [V1\AuthController::class, 'login']);
    Route::post('auth/logout', [V1\AuthController::class, 'logout'])->middleware('auth:sanctum');

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {

        // Current user
        Route::get('auth/me', [V1\AuthController::class, 'me']);
        Route::get('auth/stores', [V1\AuthController::class, 'myStores']);

        // Stores (Super Admin only)
        Route::apiResource('stores', V1\StoreController::class);

        // Users
        Route::apiResource('users', V1\UserController::class);

        // Roles & Permissions
        Route::apiResource('roles', V1\RoleController::class);
        Route::apiResource('permissions', V1\PermissionController::class);

        // Masters
        Route::apiResource('units', V1\UnitController::class);
        Route::apiResource('categories', V1\CategoryController::class);
        Route::apiResource('brands', V1\BrandController::class);
        Route::apiResource('gst-rates', V1\GstRateController::class);
        Route::apiResource('products', V1\ProductController::class);

        // Customers & Suppliers
        Route::apiResource('customers', V1\CustomerController::class);
        Route::apiResource('suppliers', V1\SupplierController::class);
        Route::apiResource('payment-modes', V1\PaymentModeController::class);

        // Purchases
        Route::apiResource('purchases', V1\PurchaseController::class);
        Route::post('purchases/{id}/submit', [V1\PurchaseController::class, 'submit']);
        Route::post('purchases/{id}/approve', [V1\PurchaseController::class, 'approve']);
        Route::post('purchases/{id}/confirm', [V1\PurchaseController::class, 'confirm']);
        Route::post('purchases/{id}/cancel', [V1\PurchaseController::class, 'cancel']);
        Route::post('purchases/{id}/upload-bill', [V1\PurchaseController::class, 'uploadBill']);
        Route::delete('purchases/{id}/bill', [V1\PurchaseController::class, 'deleteBill']);

        // Purchase Returns
        Route::apiResource('purchase-returns', V1\PurchaseReturnController::class);
        Route::post('purchase-returns/{id}/confirm', [V1\PurchaseReturnController::class, 'confirm']);
        Route::post('purchase-returns/{id}/cancel', [V1\PurchaseReturnController::class, 'cancel']);

        // Sales Invoices
        Route::apiResource('invoices', V1\SalesInvoiceController::class);
        Route::post('invoices/{id}/confirm', [V1\SalesInvoiceController::class, 'confirm']);
        Route::post('invoices/{id}/cancel', [V1\SalesInvoiceController::class, 'cancel']);
        Route::post('invoices/{id}/reverse', [V1\SalesInvoiceController::class, 'reverse']);

        // Sales Returns
        Route::apiResource('sales-returns', V1\SalesReturnController::class);
        Route::post('sales-returns/{id}/confirm', [V1\SalesReturnController::class, 'confirm']);
        Route::post('sales-returns/{id}/cancel', [V1\SalesReturnController::class, 'cancel']);

        // Customer Payments
        Route::apiResource('customer-payments', V1\CustomerPaymentController::class);
        Route::post('customer-payments/{id}/confirm', [V1\CustomerPaymentController::class, 'confirm']);
        Route::post('customer-payments/{id}/reverse', [V1\CustomerPaymentController::class, 'reverse']);

        // Supplier Payments
        Route::apiResource('supplier-payments', V1\SupplierPaymentController::class);
        Route::post('supplier-payments/{id}/confirm', [V1\SupplierPaymentController::class, 'confirm']);
        Route::post('supplier-payments/{id}/reverse', [V1\SupplierPaymentController::class, 'reverse']);

        // Stock
        Route::get('stock', [V1\StockController::class, 'index']);
        Route::get('stock/batch-wise', [V1\StockController::class, 'batchWise']);
        Route::get('stock/product/{productId}', [V1\StockController::class, 'productStock']);

        // Stock Adjustments
        Route::apiResource('stock-adjustments', V1\StockAdjustmentController::class);
        Route::post('stock-adjustments/{id}/submit', [V1\StockAdjustmentController::class, 'submit']);
        Route::post('stock-adjustments/{id}/approve', [V1\StockAdjustmentController::class, 'approve']);
        Route::post('stock-adjustments/{id}/confirm', [V1\StockAdjustmentController::class, 'confirm']);

        // Stock Transfers
        Route::apiResource('stock-transfers', V1\StockTransferController::class);
        Route::post('stock-transfers/{id}/submit', [V1\StockTransferController::class, 'submit']);
        Route::post('stock-transfers/{id}/approve', [V1\StockTransferController::class, 'approve']);
        Route::post('stock-transfers/{id}/dispatch', [V1\StockTransferController::class, 'dispatch']);
        Route::post('stock-transfers/{id}/receive', [V1\StockTransferController::class, 'receive']);

        // Ledgers
        Route::get('customer-ledgers', [V1\LedgerController::class, 'customerLedger']);
        Route::get('supplier-ledgers', [V1\LedgerController::class, 'supplierLedger']);
        Route::get('inventory-ledgers', [V1\LedgerController::class, 'inventoryLedger']);

        // Reports
        Route::get('reports/stock', [V1\ReportController::class, 'stockReport']);
        Route::get('reports/sales', [V1\ReportController::class, 'salesReport']);
        Route::get('reports/purchases', [V1\ReportController::class, 'purchaseReport']);
        Route::get('reports/profit', [V1\ReportController::class, 'profitReport']);
        Route::get('reports/gst', [V1\ReportController::class, 'gstReport']);
        Route::get('reports/customer-outstanding', [V1\ReportController::class, 'customerOutstanding']);
        Route::get('reports/supplier-outstanding', [V1\ReportController::class, 'supplierOutstanding']);
        Route::get('reports/low-stock', [V1\ReportController::class, 'lowStock']);
        Route::get('reports/daily-sales', [V1\ReportController::class, 'dailySales']);
        Route::get('reports/global-search', [V1\ReportController::class, 'globalSearch']);

        // Audit Logs
        Route::get('audit-logs', [V1\AuditLogController::class, 'index']);

        // Settings
        Route::get('settings', [V1\SettingController::class, 'index']);
        Route::put('settings', [V1\SettingController::class, 'update']);

        // Reconciliation
        Route::get('reconciliation/stock', [V1\ReconciliationController::class, 'stockReconciliation']);
        Route::get('reconciliation/customer', [V1\ReconciliationController::class, 'customerReconciliation']);
        Route::get('reconciliation/supplier', [V1\ReconciliationController::class, 'supplierReconciliation']);

    });
});
