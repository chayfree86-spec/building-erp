import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useSuppliers } from '../customers/api/queries';
import { formatCurrency } from '@/utils/format';
import { Search, RotateCcw, Truck } from 'lucide-react';
import type { Supplier } from '@/types';

export function SuppliersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useSuppliers({ search: search || undefined, status: status || undefined });
  const suppliers = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Manage your material suppliers" action={{ label: 'Add Supplier', onClick: () => navigate('/suppliers/new') }} />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile..." className="input-field pl-10" /></div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input-field"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? <EmptyState icon="error" title="Failed to load suppliers" action={{ label: 'Retry', onClick: () => refetch() }} /> : (
        <DataTable
          data={suppliers} keyExtractor={s => s.id}
          columns={[
            { key: 'name', header: 'Supplier', render: (s: Supplier) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center"><Truck className="w-4 h-4 text-cyan-600" /></div>
                <div><p className="font-medium text-neutral-900">{s.name}</p><p className="text-xs text-neutral-500">{s.mobile || 'No mobile'}</p></div>
              </div>
            )},
            { key: 'gst', header: 'GST', hideOnMobile: true, render: (s: Supplier) => s.gst_number || '-' },
            { key: 'balance', header: 'Outstanding', className: 'text-right tabular-nums', render: (s: Supplier) => <span className="text-cyan-600 font-semibold">{formatCurrency(s.opening_balance)}</span> },
            { key: 'status', header: 'Status', render: (s: Supplier) => <StatusBadge status={s.status} /> },
          ]}
          onRowClick={s => navigate(`/suppliers/${s.id}`)}
        />
      )}
    </div>
  );
}
