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

// Simple placeholder for pages not yet fully built
const Placeholder = ({ title }: { title: string }) => (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
    <div className="card p-8 text-center"><p className="text-neutral-500">This module is available via backend API. Full UI coming soon.</p></div>
  </div>
);
const make = (t: string) => lazy(() => Promise.resolve({ default: () => <Placeholder title={t} /> }));

const ProductDetailPage = make('Product Detail');
const CustomerDetailPage = make('Customer Detail');
const SupplierDetailPage = make('Supplier Detail');
const PurchaseNewPage = make('New Purchase');
const PurchaseDetailPage = make('Purchase Detail');
const InvoiceNewPage = make('New Invoice');
const InvoiceDetailPage = make('Invoice Detail');
const SalesReturnsPage = make('Sales Returns');
const SupplierPaymentsPage = make('Supplier Payments');
const StockBatchPage = make('Stock Batches');
const PermissionsPage = make('Permissions');
const MorePage = make('More');

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
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="invoices/new" element={<InvoiceNewPage />} />
                  <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                  <Route path="sales-returns" element={<SalesReturnsPage />} />
                  <Route path="customer-payments" element={<CustomerPaymentsPage />} />
                  <Route path="supplier-payments" element={<SupplierPaymentsPage />} />
                  <Route path="stock" element={<StockPage />} />
                  <Route path="stock/batch" element={<StockBatchPage />} />
                  <Route path="stock-adjustments" element={<StockAdjustmentsPage />} />
                  <Route path="stock-transfers" element={<StockTransfersPage />} />
                  <Route path="ledgers/customer" element={<CustomerLedgerPage />} />
                  <Route path="ledgers/supplier" element={<SupplierLedgerPage />} />
                  <Route path="ledgers/inventory" element={<InventoryLedgerPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="users" element={<UsersPage />} />
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
