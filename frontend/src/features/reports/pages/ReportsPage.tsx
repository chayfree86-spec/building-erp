import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/api-endpoints';
import { formatCurrency } from '@/utils/format';
import { BarChart3, Download, TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react';

export function ReportsPage() {
  const [reportType, setReportType] = useState<string>('sales');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', reportType],
    queryFn: async () => {
      switch (reportType) {
        case 'stock': return (await reportsApi.stock()).data;
        case 'sales': return (await reportsApi.sales()).data;
        case 'purchases': return (await reportsApi.purchases()).data;
        case 'profit': return (await reportsApi.profit()).data;
        case 'gst': return (await reportsApi.gst()).data;
        case 'low-stock': return (await reportsApi.lowStock()).data;
        case 'daily-sales': return (await reportsApi.dailySales()).data;
        case 'customer-outstanding': return (await reportsApi.customerOutstanding()).data;
        default: return (await reportsApi.sales()).data;
      }
    },
  });
  const raw = (data as any)?.data;
  const reportData = Array.isArray(raw) ? raw : (raw?.data || []);

  const reportTypes = [
    { key: 'sales', label: 'Sales Report', icon: TrendingUp },
    { key: 'purchases', label: 'Purchase Report', icon: TrendingDown },
    { key: 'stock', label: 'Stock Report', icon: Package },
    { key: 'profit', label: 'Profit & Loss', icon: DollarSign },
    { key: 'gst', label: 'GST Report', icon: BarChart3 },
    { key: 'low-stock', label: 'Low Stock', icon: Package },
    { key: 'daily-sales', label: 'Daily Sales', icon: TrendingUp },
    { key: 'customer-outstanding', label: 'Customer Outstanding', icon: DollarSign },
  ];

  const renderReportContent = () => {
    if (isLoading) return <CardSkeleton count={6} />;
    if (isError) return <EmptyState icon="error" title="Failed to load report" action={{ label: 'Retry', onClick: () => refetch() }} />;

    if (!Array.isArray(reportData) || reportData.length === 0) {
      return <EmptyState icon={BarChart3} title="No data available" description="No records found for the selected report." />;
    }

    // Dynamic column rendering based on first item keys
    const firstItem = reportData[0];
    const keys = Object.keys(firstItem).filter(k => k !== 'id');
    const columns = keys.slice(0, 6).map(key => ({
      key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      render: (item: any) => {
        const val = item[key];
        if (typeof val === 'number') return formatCurrency(val);
        if (val === null || val === undefined) return '-';
        return String(val);
      },
    }));

    return <DataTable data={reportData} keyExtractor={(item: any, i: number) => item.id || i} columns={columns} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Business intelligence and analytics" />
      <div className="flex flex-wrap gap-2">
        {reportTypes.map(rt => (
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">
            {reportTypes.find(r => r.key === reportType)?.label || 'Report'}
          </h3>
          <Button size="sm" variant="ghost" icon={Download}>Export</Button>
        </div>
        {renderReportContent()}
      </div>
    </div>
  );
}
