import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useStock } from '@/features/purchases/api/queries';
import { formatCurrency } from '@/utils/format';
import { Package } from 'lucide-react';

export function StockBatchPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useStock({ search: search || undefined });
  const batches = (data as any)?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Batches" description="FIFO batch-wise inventory tracking" />
      <div className="card p-4">
        <div className="relative max-w-md">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by product or batch..." className="input-field has-icon" />
        </div>
      </div>
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : batches.length === 0 ? (
        <EmptyState icon={Package} title="No batches found" description="Stock batches will appear when purchases are confirmed." />
      ) : (
        <DataTable
          data={batches} keyExtractor={(b: any) => b.batch_no || b.id}
          columns={[
            { key: 'batch', header: 'Batch #', render: (b: any) => <span className="font-medium">{b.batch_no || `#${b.id}`}</span> },
            { key: 'product', header: 'Product', render: (b: any) => b.product?.name || '-' },
            { key: 'quantity', header: 'Qty', render: (b: any) => Number(b.quantity || 0).toFixed(3) },
            { key: 'unit', header: 'Unit', hideOnMobile: true, render: (b: any) => b.unit?.short_name || '-' },
            { key: 'value', header: 'Value', render: (b: any) => formatCurrency(Number(b.quantity || 0) * Number(b.landed_cost || b.purchase_price || 0)) },
          ]}
        />
      )}
    </div>
  );
}
