import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Users, Package, AlertTriangle, Clock, ArrowUpRight, ShoppingCart, Receipt } from 'lucide-react';
import { reportsApi } from '@/services/api-endpoints';
import { formatCurrency } from '@/utils/format';

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
  red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
};

type Period = 'today' | 'week' | 'month';

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>('today');

  // Date ranges
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const dateFrom = period === 'today' ? today : period === 'week' ? weekAgo : monthAgo;

  // Fetch real data
  const { data: dailySales } = useQuery({
    queryKey: ['dashboard-daily-sales', today],
    queryFn: async () => { const { data } = await reportsApi.dailySales({ date: today }); return data.data; },
  });
  const { data: salesReport } = useQuery({
    queryKey: ['dashboard-sales', dateFrom],
    queryFn: async () => { const { data } = await reportsApi.sales({ date_from: dateFrom }); return data.data; },
  });
  const { data: purchaseReport } = useQuery({
    queryKey: ['dashboard-purchases', dateFrom],
    queryFn: async () => { const { data } = await reportsApi.purchases({ date_from: dateFrom }); return data.data; },
  });
  const { data: stockReport } = useQuery({
    queryKey: ['dashboard-stock'],
    queryFn: async () => { const { data } = await reportsApi.stock(); return data.data; },
  });
  const { data: lowStock } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: async () => { const { data } = await reportsApi.lowStock(); return data.data; },
  });
  const { data: custOutstanding } = useQuery({
    queryKey: ['dashboard-cust-outstanding'],
    queryFn: async () => { const { data } = await reportsApi.customerOutstanding(); return data.data; },
  });
  const { data: suppOutstanding } = useQuery({
    queryKey: ['dashboard-supp-outstanding'],
    queryFn: async () => { const { data } = await reportsApi.supplierOutstanding(); return data.data; },
  });

  // Extract values
  const todaySalesAmount = dailySales?.summary?.total_sales || 0;
  const todayInvoices = dailySales?.summary?.total_invoices || 0;
  const salesTotal = salesReport?.summary?.total_sales || 0;
  const salesPaid = salesReport?.summary?.total_paid || 0;
  const purchaseTotal = purchaseReport?.summary?.total_amount || 0;
  const stockValue = stockReport?.summary?.total_value || 0;
  const stockBatches = stockReport?.summary?.total_batches || 0;
  const lowStockCount = lowStock?.count || 0;
  const custOutstandingTotal = custOutstanding?.total_outstanding || 0;
  const suppOutstandingTotal = suppOutstanding?.total_outstanding || 0;

  const kpiCards = [
    { title: 'Today Sales', value: formatCurrency(todaySalesAmount), sub: `${todayInvoices} invoices`, color: 'blue', icon: TrendingUp, link: '/invoices' },
    { title: 'Collection', value: formatCurrency(salesPaid), sub: `${period === 'today' ? 'Today' : 'Period'} paid`, color: 'emerald', icon: DollarSign, link: '/customer-payments' },
    { title: 'Purchases', value: formatCurrency(purchaseTotal), sub: `${period === 'today' ? 'Today' : 'Period'} purchases`, color: 'indigo', icon: TrendingDown, link: '/purchases' },
    { title: 'Customer Due', value: formatCurrency(custOutstandingTotal), sub: 'Total outstanding', color: 'orange', icon: Users, link: '/reports' },
    { title: 'Supplier Due', value: formatCurrency(suppOutstandingTotal), sub: 'Total payable', color: 'cyan', icon: Users, link: '/reports' },
    { title: 'Stock Value', value: formatCurrency(stockValue), sub: `${stockBatches} batches`, color: 'purple', icon: Package, link: '/stock' },
    { title: 'Low Stock', value: String(lowStockCount), sub: 'Items need reorder', color: lowStockCount > 0 ? 'red' : 'emerald', icon: AlertTriangle, link: '/reports' },
    { title: 'Period Sales', value: formatCurrency(salesTotal), sub: `${period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}`, color: 'amber', icon: Receipt, link: '/reports' },
  ];

  const topProducts = stockReport?.batches?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Overview of your building materials business</p>
        </div>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${period === p ? 'btn-primary !py-2' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
            >
              {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <Link key={card.title} to={card.link} className="card hover:shadow-md transition-shadow p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="text-sm text-neutral-500 mb-1">{card.title}</p>
              <p className="text-xl lg:text-2xl font-bold text-neutral-900 tabular-nums">{card.value}</p>
              <p className="text-xs text-neutral-400 mt-1">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-neutral-900 mb-4">Today's Sales Overview</h3>
          {dailySales?.invoices?.length > 0 ? (
            <div className="space-y-3">
              {dailySales.invoices.slice(0, 5).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b border-neutral-50">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">{inv.invoice_no}</p>
                    <p className="text-xs text-neutral-500">{inv.customer_name_snapshot || inv.customer?.name || 'Walk-in'}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(inv.total_amount)}</span>
                </div>
              ))}
              <Link to="/invoices" className="text-sm text-primary-600 font-medium hover:underline block text-center mt-2">View All Invoices →</Link>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-neutral-50 rounded-xl">
              <p className="text-neutral-400 text-sm">No sales today yet</p>
            </div>
          )}
        </div>
        <div className="card p-5">
          <h3 className="text-base font-semibold text-neutral-900 mb-4">Top Stock by Value</h3>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((batch: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-neutral-400 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-700">{batch.product?.name || 'Unknown'}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.max(5, 100 - i * 20)}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 tabular-nums">{formatCurrency(batch.available_quantity * (batch.landed_cost || batch.purchase_price || 0))}</span>
                </div>
              ))}
              <Link to="/stock" className="text-sm text-primary-600 font-medium hover:underline block text-center mt-2">View All Stock →</Link>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-neutral-50 rounded-xl">
              <p className="text-neutral-400 text-sm">No stock data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'New Invoice', icon: Receipt, path: '/invoices/new', color: 'blue' },
            { label: 'New Purchase', icon: ShoppingCart, path: '/purchases/new', color: 'indigo' },
            { label: 'Add Customer', icon: Users, path: '/customers', color: 'emerald' },
            { label: 'Add Product', icon: Package, path: '/products', color: 'purple' },
            { label: 'Receive Payment', icon: DollarSign, path: '/customer-payments', color: 'orange' },
            { label: 'View Stock', icon: AlertTriangle, path: '/stock', color: 'cyan' },
          ].map((action) => {
            const c = colorMap[action.color];
            return (
              <Link key={action.label} to={action.path} className={`flex flex-col items-center gap-2 p-4 rounded-xl ${c.bg} hover:shadow-md transition-all`}>
                <action.icon className={`w-6 h-6 ${c.icon}`} />
                <span className={`text-xs font-medium ${c.text} text-center`}>{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

