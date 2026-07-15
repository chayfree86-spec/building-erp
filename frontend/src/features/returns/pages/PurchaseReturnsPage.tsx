import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { usePurchaseReturns } from '@/features/purchases/api/queries';
import { formatCurrency, formatDate } from '@/utils/format';
import { Search, RotateCcw, RotateCcw as ReturnIcon } from 'lucide-react';

export function PurchaseReturnsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = usePurchaseReturns({ search: search || undefined, status: status || undefined });
  const returns = (data as any)?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Returns" description="Goods returned to suppliers" action={{ label: 'New Return', onClick: () => navigate('/purchase-returns/new') }} />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search return #, supplier..." className="input-field pl-10" />
          </div>
          <SearchableSelect placeholder="All Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'cancelled', label: 'Cancelled' }]} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? (
        <EmptyState icon="error" title="Failed to load returns" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : returns.length === 0 ? (
        <EmptyState icon={ReturnIcon} title="No returns yet" description="Record your first purchase return." action={{ label: 'New Return', onClick: () => navigate('/purchase-returns/new') }} />
      ) : (
        <DataTable
          data={returns}
          keyExtractor={(r: any) => r.id}
          onRowClick={(r: any) => navigate(`/purchase-returns/${r.id}`)}
          columns={[
            { key: 'return_no', header: 'Return #', render: (r: any) => (
              <div>
                <p className="font-medium text-neutral-900">{r.return_no || `#${r.id}`}</p>
                <p className="text-xs text-neutral-500">{formatDate(r.return_date)}</p>
              </div>
            )},
            { key: 'supplier', header: 'Supplier', hideOnMobile: true, render: (r: any) => r.supplier?.name || '-' },
            { key: 'purchase', header: 'Original Purchase', hideOnMobile: true, render: (r: any) => r.purchase?.invoice_no || '-' },
            { key: 'amount', header: 'Amount', render: (r: any) => <span className="font-semibold text-red-600">{formatCurrency(r.total_amount)}</span> },
            { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
          ]}
        />
      )}
    </div>
  );
}
