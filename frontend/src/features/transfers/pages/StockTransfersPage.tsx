import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useTransfers } from '@/features/purchases/api/queries';
import { formatDate } from '@/utils/format';
import { Search, RotateCcw, ArrowRightLeft } from 'lucide-react';

const statusOptions = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'dispatched', label: 'Dispatched' },
  { value: 'received', label: 'Received' }, { value: 'cancelled', label: 'Cancelled' },
];

export function StockTransfersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useTransfers({ search: search || undefined, status: status || undefined });
  const transfers = (data as any)?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Transfers" description="Inter-store stock movements" action={{ label: 'New Transfer', onClick: () => navigate('/stock-transfers/new') }} />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transfer #..." className="input-field has-icon" />
          </div>
          <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? (
        <EmptyState icon="error" title="Failed to load transfers" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : transfers.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="No transfers yet" description="Start transferring stock between stores." action={{ label: 'New Transfer', onClick: () => navigate('/stock-transfers/new') }} />
      ) : (
        <DataTable
          data={transfers}
          keyExtractor={(t: any) => t.id}
          onRowClick={(t: any) => navigate(`/stock-transfers/${t.id}`)}
          columns={[
            { key: 'transfer_no', header: 'Transfer #', render: (t: any) => (
              <div>
                <p className="font-medium text-neutral-900">{t.transfer_no || `#${t.id}`}</p>
                <p className="text-xs text-neutral-500">{formatDate(t.transfer_date)}</p>
              </div>
            )},
            { key: 'from', header: 'From → To', hideOnMobile: true, render: (t: any) => (
              <span className="text-sm">{t.from_store?.name || 'Warehouse'} → {t.to_store?.name || 'Store'}</span>
            )},
            { key: 'items', header: 'Items', render: (t: any) => `${t.items_count || t.items?.length || 0} items` },
            { key: 'status', header: 'Status', render: (t: any) => <StatusBadge status={t.status} /> },
          ]}
        />
      )}
    </div>
  );
}
