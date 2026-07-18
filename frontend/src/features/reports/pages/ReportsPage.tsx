import { useState } from 'react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/api-endpoints';
import { formatCurrency, getLocalDateString } from '@/utils/format';
import { BarChart3, Download, TrendingUp, TrendingDown, Package, DollarSign, Users, Truck, AlertTriangle } from 'lucide-react';

// ── formatting helpers ─────────────────────────────────────────────
const money = (v: any) => formatCurrency(Number(v) || 0);
const qty = (v: any) => (Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 });
const fmtDate = (v: any) =>
  v ? new Date(String(v)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

type Col = { key: string; header: string; render?: (r: any) => ReactNode; className?: string; hideOnMobile?: boolean };
type Stat = { label: string; value: string; color?: string };

interface ReportConfig {
  key: string;
  label: string;
  icon: any;
  filter: 'range' | 'date' | 'none';
  fetch: (params: any) => Promise<any>;
  rowsKey?: string;                       // where the row array lives inside `data`
  columns?: Col[];
  stats?: (data: any) => Stat[];          // KPI cards built from the response
  emptyMessage?: string;
}

const REPORTS: ReportConfig[] = [
  {
    key: 'sales', label: 'Sales Report', icon: TrendingUp, filter: 'range',
    fetch: (p) => reportsApi.sales(p), rowsKey: 'invoices',
    columns: [
      { key: 'invoice_number', header: 'Invoice #' },
      { key: 'invoice_date', header: 'Date', render: (r) => fmtDate(r.invoice_date) },
      { key: 'customer', header: 'Customer', render: (r) => r.customer_name_snapshot || r.customer?.name || '-' },
      { key: 'total_amount', header: 'Total', className: 'text-right', render: (r) => money(r.total_amount) },
      { key: 'paid_amount', header: 'Paid', className: 'text-right', hideOnMobile: true, render: (r) => money(r.paid_amount) },
      { key: 'balance_amount', header: 'Balance', className: 'text-right', render: (r) => money(r.balance_amount) },
      { key: 'payment_status', header: 'Status', render: (r) => <StatusBadge status={r.payment_status} /> },
    ],
    stats: (d) => {
      const s = d?.summary || {};
      return [
        { label: 'Invoices', value: String(s.total_invoices ?? 0) },
        { label: 'Total Sales', value: money(s.total_sales) },
        { label: 'Collected', value: money(s.total_paid), color: 'text-emerald-600' },
        { label: 'Outstanding', value: money(s.total_outstanding), color: 'text-red-600' },
        { label: 'Tax', value: money(s.total_tax) },
      ];
    },
  },
  {
    key: 'purchases', label: 'Purchase Report', icon: TrendingDown, filter: 'range',
    fetch: (p) => reportsApi.purchases(p), rowsKey: 'purchases',
    columns: [
      { key: 'purchase_number', header: 'Purchase #' },
      { key: 'purchase_date', header: 'Date', render: (r) => fmtDate(r.purchase_date) },
      { key: 'supplier', header: 'Supplier', render: (r) => r.supplier?.name || '-' },
      { key: 'total_amount', header: 'Total', className: 'text-right', render: (r) => money(r.total_amount) },
      { key: 'paid_amount', header: 'Paid', className: 'text-right', hideOnMobile: true, render: (r) => money(r.paid_amount) },
      { key: 'balance_amount', header: 'Balance', className: 'text-right', render: (r) => money(r.balance_amount) },
      { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.payment_status || r.status} /> },
    ],
    stats: (d) => {
      const s = d?.summary || {};
      return [
        { label: 'Purchases', value: String(s.total_purchases ?? 0) },
        { label: 'Total Amount', value: money(s.total_amount) },
        { label: 'Paid', value: money(s.total_paid), color: 'text-emerald-600' },
        { label: 'Outstanding', value: money(s.total_outstanding), color: 'text-red-600' },
        { label: 'Tax', value: money(s.total_tax) },
      ];
    },
  },
  {
    key: 'stock', label: 'Stock Report', icon: Package, filter: 'none',
    fetch: (p) => reportsApi.stock(p), rowsKey: 'batches',
    columns: [
      { key: 'product', header: 'Product', render: (r) => r.product?.name || `#${r.product_id}` },
      { key: 'batch_number', header: 'Batch', hideOnMobile: true, render: (r) => r.batch_number || '-' },
      { key: 'available_quantity', header: 'Available', className: 'text-right', render: (r) => qty(r.available_quantity) },
      { key: 'purchase_price', header: 'Cost', className: 'text-right', hideOnMobile: true, render: (r) => money(r.purchase_price) },
      { key: 'selling_price', header: 'Sell Price', className: 'text-right', render: (r) => money(r.selling_price) },
      { key: 'value', header: 'Stock Value', className: 'text-right', render: (r) => money((Number(r.available_quantity) || 0) * (Number(r.landed_cost) || 0)) },
    ],
    stats: (d) => {
      const s = d?.summary || {};
      return [
        { label: 'Products', value: String(s.total_products ?? 0) },
        { label: 'Batches', value: String(s.total_batches ?? 0) },
        { label: 'Total Qty', value: qty(s.total_quantity) },
        { label: 'Stock Value', value: money(s.total_value) },
      ];
    },
  },
  {
    key: 'profit', label: 'Profit & Loss', icon: DollarSign, filter: 'range',
    fetch: (p) => reportsApi.profit(p),
    stats: (d) => [
      { label: 'Total Sales', value: money(d?.total_sales) },
      { label: 'Total Cost', value: money(d?.total_cost) },
      { label: 'Gross Profit', value: money(d?.gross_profit) },
      { label: 'Margin', value: `${Number(d?.profit_margin_percent ?? 0).toFixed(2)}%` },
    ],
  },
  {
    key: 'gst', label: 'GST Report', icon: BarChart3, filter: 'range',
    fetch: (p) => reportsApi.gst(p),
    stats: (d) => {
      const o = d?.output_gst || {};
      const i = d?.input_gst || {};
      return [
        { label: 'Output CGST', value: money(o.cgst) },
        { label: 'Output SGST', value: money(o.sgst) },
        { label: 'Output IGST', value: money(o.igst) },
        { label: 'Output GST', value: money(o.total) },
        { label: 'Input GST', value: money(i.total) },
        { label: 'Net Payable', value: money(d?.net_payable) },
      ];
    },
  },
  {
    key: 'low-stock', label: 'Low Stock', icon: AlertTriangle, filter: 'none',
    fetch: (p) => reportsApi.lowStock(p), rowsKey: 'items',
    emptyMessage: 'No products below the minimum stock level.',
    columns: [
      { key: 'product_name', header: 'Product', render: (r) => r.product_name || `#${r.product_id}` },
      { key: 'sku', header: 'SKU', hideOnMobile: true, render: (r) => r.sku || '-' },
      { key: 'current_stock', header: 'Current', className: 'text-right', render: (r) => qty(r.current_stock) },
      { key: 'minimum_stock', header: 'Minimum', className: 'text-right', render: (r) => qty(r.minimum_stock) },
      { key: 'shortage', header: 'Shortage', className: 'text-right text-red-600 font-semibold', render: (r) => qty(r.shortage) },
    ],
    stats: (d) => [{ label: 'Items Below Minimum', value: String(d?.count ?? 0) }],
  },
  {
    key: 'daily-sales', label: 'Daily Sales', icon: TrendingUp, filter: 'date',
    fetch: (p) => reportsApi.dailySales(p), rowsKey: 'invoices',
    columns: [
      { key: 'invoice_number', header: 'Invoice #' },
      { key: 'customer', header: 'Customer', render: (r) => r.customer_name_snapshot || r.customer?.name || '-' },
      { key: 'total_amount', header: 'Total', className: 'text-right', render: (r) => money(r.total_amount) },
      { key: 'paid_amount', header: 'Paid', className: 'text-right', hideOnMobile: true, render: (r) => money(r.paid_amount) },
      { key: 'payment_status', header: 'Status', render: (r) => <StatusBadge status={r.payment_status} /> },
    ],
    stats: (d) => {
      const s = d?.summary || {};
      return [
        { label: 'Invoices', value: String(s.total_invoices ?? 0) },
        { label: 'Sales', value: money(s.total_sales) },
        { label: 'Tax', value: money(s.total_tax) },
        { label: 'Discount', value: money(s.total_discount) },
        { label: 'Collected', value: money(s.total_paid) },
      ];
    },
  },
  {
    key: 'customer-outstanding', label: 'Customer Outstanding', icon: Users, filter: 'none',
    fetch: (p) => reportsApi.customerOutstanding(p), rowsKey: 'customers',
    emptyMessage: 'No customers with outstanding balance.',
    columns: [
      { key: 'customer_name', header: 'Customer', render: (r) => r.customer_name || `#${r.customer_id}` },
      { key: 'mobile', header: 'Mobile', hideOnMobile: true, render: (r) => r.mobile || '-' },
      { key: 'outstanding', header: 'Outstanding', className: 'text-right font-semibold text-red-600', render: (r) => money(r.outstanding) },
    ],
    stats: (d) => [{ label: 'Total Outstanding', value: money(d?.total_outstanding), color: 'text-red-600' }],
  },
  {
    key: 'supplier-outstanding', label: 'Supplier Outstanding', icon: Truck, filter: 'none',
    fetch: (p) => reportsApi.supplierOutstanding(p), rowsKey: 'suppliers',
    emptyMessage: 'No suppliers with outstanding balance.',
    columns: [
      { key: 'supplier_name', header: 'Supplier', render: (r) => r.supplier_name || `#${r.supplier_id}` },
      { key: 'mobile', header: 'Mobile', hideOnMobile: true, render: (r) => r.mobile || '-' },
      { key: 'outstanding', header: 'Outstanding', className: 'text-right font-semibold', render: (r) => money(r.outstanding) },
    ],
    stats: (d) => [{ label: 'Total Outstanding', value: money(d?.total_outstanding) }],
  },
];

const todayStr = () => getLocalDateString();
const monthStartStr = () => {
  const d = new Date();
  const tzOffset = 5.5 * 60 * 60 * 1000;
  const localDate = new Date(d.getTime() + tzOffset);
  return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-01`;
};

const getThemeClasses = (key: string, active: boolean) => {
  if (!active) {
    return {
      tab: 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent',
      icon: 'text-neutral-400'
    };
  }
  switch (key) {
    case 'sales':
    case 'daily-sales':
      return { tab: 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm', icon: 'text-blue-600' };
    case 'purchases':
      return { tab: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 shadow-sm', icon: 'text-indigo-600' };
    case 'stock':
      return { tab: 'bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm', icon: 'text-amber-600' };
    case 'profit':
      return { tab: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-sm', icon: 'text-emerald-600' };
    case 'gst':
      return { tab: 'bg-purple-50 text-purple-700 border border-purple-200/60 shadow-sm', icon: 'text-purple-600' };
    case 'low-stock':
      return { tab: 'bg-red-50 text-red-700 border border-red-200/60 shadow-sm', icon: 'text-red-600' };
    case 'customer-outstanding':
      return { tab: 'bg-orange-50 text-orange-700 border border-orange-200/60 shadow-sm', icon: 'text-orange-600' };
    case 'supplier-outstanding':
      return { tab: 'bg-cyan-50 text-cyan-700 border border-cyan-200/60 shadow-sm', icon: 'text-cyan-600' };
    default:
      return { tab: 'bg-primary-50 text-primary-700 border border-primary-100/50 shadow-sm', icon: 'text-primary-600' };
  }
};

export function ReportsPage() {
  const [reportType, setReportType] = useState<string>('sales');
  const [dateFrom, setDateFrom] = useState<string>(monthStartStr());
  const [dateTo, setDateTo] = useState<string>(todayStr());
  const [singleDate, setSingleDate] = useState<string>(todayStr());

  const config = REPORTS.find(r => r.key === reportType)!;

  const params =
    config.filter === 'range' ? { date_from: dateFrom, date_to: dateTo }
    : config.filter === 'date' ? { date: singleDate }
    : {};

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', reportType, params],
    queryFn: async () => (await config.fetch(params)).data,
  });

  const reportData = (data as any)?.data;
  const rows: any[] = config.rowsKey ? (reportData?.[config.rowsKey] || []) : [];
  const stats: Stat[] = reportData && config.stats ? config.stats(reportData) : [];

  const renderBody = () => {
    if (isLoading) return <CardSkeleton count={4} />;
    if (isError) return <EmptyState icon="error" title="Failed to load report" action={{ label: 'Retry', onClick: () => refetch() }} />;

    return (
      <div className="space-y-6">
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            {stats.map(s => (
              <div key={s.label} className="p-1 rounded-2xl bg-neutral-50 border border-neutral-200/60 shadow-sm transition-all duration-300 hover:shadow-md hover:border-neutral-300/80">
                <div className="bg-white rounded-xl p-4 border border-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-xl font-bold mt-2 font-mono tabular-nums leading-none ${s.color || 'text-neutral-900'}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {config.columns && (
          rows.length > 0 ? (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <DataTable data={rows} keyExtractor={(item: any, i: number) => item.id ?? item.product_id ?? item.customer_id ?? item.supplier_id ?? i} columns={config.columns} />
            </div>
          ) : (
            <EmptyState icon={config.icon} title="No records" description={config.emptyMessage || 'No records found for the selected period.'} />
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Business intelligence and analytics — live from your data" />

      {/* Horizontal Category Selector */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-2 flex flex-wrap gap-1.5 shadow-sm">
        {REPORTS.map(rt => {
          const IconComponent = rt.icon;
          const active = reportType === rt.key;
          const theme = getThemeClasses(rt.key, active);
          return (
            <button
              key={rt.key}
              type="button"
              onClick={() => setReportType(rt.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${theme.tab}`}
            >
              <IconComponent className={`w-4 h-4 ${theme.icon}`} />
              <span>{rt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Report Content */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{config.label}</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Filter results and export data</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {config.filter === 'range' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date Range</span>
                <div className="flex items-center gap-2 bg-neutral-50 p-1.5 rounded-xl border border-neutral-200 h-[48px]">
                  <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="From" className="!py-1.5 !px-2.5 !h-[36px] !w-[115px] text-xs sm:text-sm" />
                  <span className="text-neutral-400 text-xs font-medium">to</span>
                  <DatePicker value={dateTo} onChange={setDateTo} align="right" placeholder="To" className="!py-1.5 !px-2.5 !h-[36px] !w-[115px] text-xs sm:text-sm" />
                </div>
              </div>
            )}
            {config.filter === 'date' && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date</span>
                <div className="bg-neutral-50 p-1.5 rounded-xl border border-neutral-200 h-[48px] flex items-center">
                  <DatePicker value={singleDate} onChange={setSingleDate} align="right" placeholder="Select Date" className="!py-1.5 !px-2.5 !h-[36px] !w-[120px] text-xs sm:text-sm" />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-transparent select-none uppercase tracking-wider hidden sm:block">Action</span>
              <Button 
                size="sm" 
                variant="ghost" 
                icon={Download} 
                onClick={() => window.print()}
                className="!py-2.5 !px-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 shadow-sm transition-all h-[48px] flex items-center justify-center"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
        {renderBody()}
      </div>
    </div>
  );
}
