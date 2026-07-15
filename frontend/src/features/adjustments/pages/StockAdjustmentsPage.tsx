import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useAdjustments } from '@/features/purchases/api/queries';
import { formatDate } from '@/utils/format';
import { Search, RotateCcw, ClipboardEdit } from 'lucide-react';

const typeOptions = [
  { value: 'addition', label: 'Addition' }, { value: 'deduction', label: 'Deduction' }, { value: 'damage', label: 'Damage' },
];
const statusOptions = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'cancelled', label: 'Cancelled' },
];

export function StockAdjustmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useAdjustments({ search: search || undefined, status: status || undefined });
  const adjustments = (data as any)?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Adjustments" description="Correct inventory quantities" action={{ label: 'New Adjustment', onClick: () => navigate('/stock-adjustments/new') }} />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reason, product..." className="input-field pl-10" />
          </div>
          <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? (
        <EmptyState icon="error" title="Failed to load adjustments" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : adjustments.length === 0 ? (
        <EmptyState icon={ClipboardEdit} title="No adjustments yet" description="Create your first stock adjustment." action={{ label: 'New Adjustment', onClick: () => navigate('/stock-adjustments/new') }} />
      ) : (
        <DataTable
          data={adjustments}
          keyExtractor={(a: any) => a.id}
          onRowClick={(a: any) => navigate(`/stock-adjustments/${a.id}`)}
          columns={[
            { key: 'adj_no', header: 'Adj #', render: (a: any) => (
              <div>
                <p className="font-medium text-neutral-900">{a.adjustment_no || `#${a.id}`}</p>
                <p className="text-xs text-neutral-500">{formatDate(a.adjustment_date)}</p>
              </div>
            )},
            { key: 'type', header: 'Type', render: (a: any) => (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                a.type === 'addition' ? 'bg-emerald-50 text-emerald-700' : a.type === 'damage' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
              }`}>{a.type}</span>
            )},
            { key: 'reason', header: 'Reason', hideOnMobile: true, render: (a: any) => a.reason || '-' },
            { key: 'items', header: 'Items', render: (a: any) => `${a.items_count || a.items?.length || 0} items` },
            { key: 'status', header: 'Status', render: (a: any) => <StatusBadge status={a.status} /> },
          ]}
        />
      )}
    </div>
  );
}
