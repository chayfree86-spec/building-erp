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
import { formatCurrency } from '@/utils/format';
import { BarChart3, Download, TrendingUp, TrendingDown, Package, DollarSign, Users, Truck, AlertTriangle } from 'lucide-react';

// ── formatting helpers ─────────────────────────────────────────────
const money = (v: any) => formatCurrency(Number(v) || 0);
const qty = (v: any) => (Number(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 });
const fmtDate = (v: any) =>
  v ? new Date(String(v)).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

type Col = { key: string; header: string; render?: (r: any) => ReactNode; className?: string; hideOnMobile?: boolean };
type Stat = { label: string; value: string };

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
        { label: 'Collected', value: money(s.total_paid) },
        { label: 'Outstanding', value: money(s.total_outstanding) },
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
        { label: 'Paid', value: money(s.total_paid) },
        { label: 'Outstanding', value: money(s.total_outstanding) },
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
      { key: 'outstanding', header: 'Outstanding', className: 'text-right font-semibold', render: (r) => money(r.outstanding) },
    ],
    stats: (d) => [{ label: 'Total Outstanding', value: money(d?.total_outstanding) }],
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

const todayStr = () => new Date().toISOString().split('T')[0];
const monthStartStr = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
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
      <div className="space-y-5">
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.map(s => (
              <div key={s.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">{s.label}</p>
                <p className="text-lg font-bold text-neutral-900 mt-1 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {config.columns && (
          rows.length > 0 ? (
            <DataTable data={rows} keyExtractor={(item: any, i: number) => item.id ?? item.product_id ?? item.customer_id ?? item.supplier_id ?? i} columns={config.columns} />
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

      <div className="flex flex-wrap gap-2">
        {REPORTS.map(rt => (
          <Button
            key={rt.key}
            variant={reportType === rt.key ? 'primary' : 'ghost'}
            size="sm"
            icon={rt.icon}
            onClick={() => setReportType(rt.key)}
          >
            {rt.label}
          </Button>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">{config.label}</h3>
          <div className="flex items-end gap-2">
            {config.filter === 'range' && (
              <>
                <DatePicker label="From" value={dateFrom} onChange={setDateFrom} />
                <DatePicker label="To" value={dateTo} onChange={setDateTo} align="right" />
              </>
            )}
            {config.filter === 'date' && (
              <DatePicker label="Date" value={singleDate} onChange={setSingleDate} align="right" />
            )}
            <Button size="sm" variant="ghost" icon={Download} onClick={() => window.print()}>Export</Button>
          </div>
        </div>
        {renderBody()}
      </div>
    </div>
  );
}
