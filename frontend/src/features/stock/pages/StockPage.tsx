import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useStock } from '@/features/purchases/api/queries';
import { Search, RotateCcw, Package } from 'lucide-react';

export function StockPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useStock({ search: search || undefined });
  const items = (data as any)?.data || [];

  const filtered = search
    ? items.filter((item: any) =>
        (item.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.batch_no || '').toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      <PageHeader title="Stock" description="Current inventory levels across all stores" />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, batch..." className="input-field pl-10" />
          </div>
          <Button variant="ghost" icon={RotateCcw} onClick={() => setSearch('')}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load stock" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No stock records" description="Add purchases to build inventory." />
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(item: any) => `${item.product_id}-${item.batch_no || ''}`}
          columns={[
            { key: 'product', header: 'Product', render: (item: any) => (
              <div>
                <p className="font-medium text-neutral-900">{item.product?.name || 'Unknown'}</p>
                <p className="text-xs text-neutral-500">SKU: {item.product?.sku || '-'}</p>
              </div>
            )},
            { key: 'batch', header: 'Batch', hideOnMobile: true, render: (item: any) => (
              <div>
                <p className="text-sm">{item.batch_no || '-'}</p>
                {item.expiry_date && <p className="text-xs text-neutral-500">Exp: {item.expiry_date}</p>}
              </div>
            )},
            { key: 'qty', header: 'Quantity', render: (item: any) => (
              <span className="font-semibold">{parseFloat(item.quantity || 0).toFixed(2)}</span>
            )},
            { key: 'unit', header: 'Unit', hideOnMobile: true, render: (item: any) => item.product?.unit?.short_name || '-' },
            { key: 'value', header: 'Value', render: (item: any) => (
              <span className="font-semibold">₹{parseFloat(item.total_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            )},
          ]}
        />
      )}
    </div>
  );
}
