import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/auth-context';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute, GuestRoute } from '@/routes/guards';
import { Loader2 } from 'lucide-react';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage').then(m => ({ default: m.ProductsPage })));
const CustomersPage = lazy(() => import('@/features/customers/pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const SuppliersPage = lazy(() => import('@/features/suppliers/pages/SuppliersPage').then(m => ({ default: m.SuppliersPage })));

// Master pages
const StoresPageComp = lazy(() => import('@/features/stores/pages/MasterPages').then(m => ({ default: m.StoresPage })));
const UnitsPageComp = lazy(() => import('@/features/stores/pages/MasterPages').then(m => ({ default: m.UnitsPage })));
const CategoriesPageComp = lazy(() => import('@/features/stores/pages/MasterPages').then(m => ({ default: m.CategoriesPage })));
const BrandsPageComp = lazy(() => import('@/features/stores/pages/MasterPages').then(m => ({ default: m.BrandsPage })));
const GstRatesPageComp = lazy(() => import('@/features/stores/pages/MasterPages').then(m => ({ default: m.GstRatesPage })));
const PaymentModesPageComp = lazy(() => import('@/features/stores/pages/MasterPages').then(m => ({ default: m.PaymentModesPage })));

// Transaction pages
const PurchasesPage = lazy(() => import('@/features/purchases/pages/PurchasesPage').then(m => ({ default: m.PurchasesPage })));
const InvoicesPage = lazy(() => import('@/features/invoices/pages/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const StockPage = lazy(() => import('@/features/stock/pages/StockPage').then(m => ({ default: m.StockPage })));
const CustomerPaymentsPage = lazy(() => import('@/features/payments/pages/CustomerPaymentsPage').then(m => ({ default: m.CustomerPaymentsPage })));
const PurchaseReturnsPage = lazy(() => import('@/features/returns/pages/PurchaseReturnsPage').then(m => ({ default: m.PurchaseReturnsPage })));
const StockTransfersPage = lazy(() => import('@/features/transfers/pages/StockTransfersPage').then(m => ({ default: m.StockTransfersPage })));
const StockAdjustmentsPage = lazy(() => import('@/features/adjustments/pages/StockAdjustmentsPage').then(m => ({ default: m.StockAdjustmentsPage })));

// Admin pages
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const RolesPage = lazy(() => import('@/features/roles/pages/RolesPage').then(m => ({ default: m.RolesPage })));
const AuditLogsPage = lazy(() => import('@/features/audit/pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage').then(m => ({ default: m.ReportsPage })));

// Ledger pages
const CustomerLedgerPage = lazy(() => import('@/features/ledgers/pages/LedgerPages').then(m => ({ default: m.CustomerLedgerPage })));
const SupplierLedgerPage = lazy(() => import('@/features/ledgers/pages/LedgerPages').then(m => ({ default: m.SupplierLedgerPage })));
const InventoryLedgerPage = lazy(() => import('@/features/ledgers/pages/LedgerPages').then(m => ({ default: m.InventoryLedgerPage })));

const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CustomerDetailPage = lazy(() => import('@/features/customers/pages/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })));
const SupplierDetailPage = lazy(() => import('@/features/suppliers/pages/SupplierDetailPage').then(m => ({ default: m.SupplierDetailPage })));
const PurchaseNewPage = lazy(() => import('@/features/purchases/pages/PurchaseNewPage').then(m => ({ default: m.PurchaseNewPage })));
const PurchaseDetailPage = lazy(() => import('@/features/purchases/pages/PurchaseDetailPage').then(m => ({ default: m.PurchaseDetailPage })));
const InvoiceNewPage = lazy(() => import('@/features/invoices/pages/InvoiceNewPage').then(m => ({ default: m.InvoiceNewPage })));
const InvoiceDetailPage = lazy(() => import('@/features/invoices/pages/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const SalesReturnsPage = lazy(() => import('@/features/returns/pages/SalesReturnsPage').then(m => ({ default: m.SalesReturnsPage })));
const StockAdjustmentNewPage = lazy(() => import('@/features/adjustments/pages/StockAdjustmentNewPage').then(m => ({ default: m.StockAdjustmentNewPage })));
const StockTransferNewPage = lazy(() => import('@/features/transfers/pages/StockTransferNewPage').then(m => ({ default: m.StockTransferNewPage })));
const UserNewPage = lazy(() => import('@/features/users/pages/UserNewPage').then(m => ({ default: m.UserNewPage })));
const CustomerPaymentNewPage = lazy(() => import('@/features/payments/pages/CustomerPaymentNewPage').then(m => ({ default: m.CustomerPaymentNewPage })));
const SupplierPaymentsPage = lazy(() => import('@/features/payments/pages/SupplierPaymentsPage').then(m => ({ default: m.SupplierPaymentsPage })));
const SupplierPaymentNewPage = lazy(() => import('@/features/payments/pages/SupplierPaymentNewPage').then(m => ({ default: m.SupplierPaymentNewPage })));
const StockBatchPage = lazy(() => import('@/features/stock/pages/StockBatchPage').then(m => ({ default: m.StockBatchPage })));
const PurchaseReturnNewPage = lazy(() => import('@/features/returns/pages/PurchaseReturnNewPage').then(m => ({ default: m.PurchaseReturnNewPage })));
const SalesReturnNewPage = lazy(() => import('@/features/returns/pages/SalesReturnNewPage').then(m => ({ default: m.SalesReturnNewPage })));
const PermissionsPage = lazy(() => import('@/features/roles/pages/PermissionsPage').then(m => ({ default: m.PermissionsPage })));
const MorePage = lazy(() => import('@/features/more/pages/MorePage').then(m => ({ default: m.MorePage })));

const PageLoader = () => <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 2, refetchOnWindowFocus: false } } });

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<GuestRoute />}><Route path="/login" element={<LoginPage />} /></Route>
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="stores" element={<StoresPageComp />} />
                  <Route path="units" element={<UnitsPageComp />} />
                  <Route path="categories" element={<CategoriesPageComp />} />
                  <Route path="brands" element={<BrandsPageComp />} />
                  <Route path="gst-rates" element={<GstRatesPageComp />} />
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />
                  <Route path="payment-modes" element={<PaymentModesPageComp />} />
                  <Route path="customers" element={<CustomersPage />} />
                  <Route path="customers/:id" element={<CustomerDetailPage />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="suppliers/:id" element={<SupplierDetailPage />} />
                  <Route path="purchases" element={<PurchasesPage />} />
                  <Route path="purchases/new" element={<PurchaseNewPage />} />
                  <Route path="purchases/:id" element={<PurchaseDetailPage />} />
                  <Route path="purchase-returns" element={<PurchaseReturnsPage />} />
                  <Route path="purchase-returns/new" element={<PurchaseReturnNewPage />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/new" element={<InvoiceNewPage />} />
                  <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                  <Route path="sales-returns" element={<SalesReturnsPage />} />
                  <Route path="sales-returns/new" element={<SalesReturnNewPage />} />
                  <Route path="customer-payments" element={<CustomerPaymentsPage />} />
                  <Route path="customer-payments/new" element={<CustomerPaymentNewPage />} />
                  <Route path="supplier-payments" element={<SupplierPaymentsPage />} />
                  <Route path="supplier-payments/new" element={<SupplierPaymentNewPage />} />
                  <Route path="stock" element={<StockPage />} />
                  <Route path="stock/batch" element={<StockBatchPage />} />
                  <Route path="stock-adjustments" element={<StockAdjustmentsPage />} />
                  <Route path="stock-adjustments/new" element={<StockAdjustmentNewPage />} />
                  <Route path="stock-transfers" element={<StockTransfersPage />} />
                  <Route path="stock-transfers/new" element={<StockTransferNewPage />} />
                  <Route path="ledgers/customer" element={<CustomerLedgerPage />} />
                  <Route path="ledgers/supplier" element={<SupplierLedgerPage />} />
                  <Route path="ledgers/inventory" element={<InventoryLedgerPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="users/new" element={<UserNewPage />} />
                  <Route path="roles" element={<RolesPage />} />
                  <Route path="permissions" element={<PermissionsPage />} />
                  <Route path="audit-logs" element={<AuditLogsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="more" element={<MorePage />} />
                </Route>
              </Route>
              <Route path="*" element={<div className="flex items-center justify-center min-h-screen"><div className="text-center"><h1 className="text-6xl font-bold text-neutral-200">404</h1><p className="text-neutral-500 mt-2">Page not found</p></div></div>} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
