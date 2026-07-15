import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useCustomers } from '../api/queries';
import { formatCurrency } from '@/utils/format';
import { Search, RotateCcw, Users } from 'lucide-react';
import type { Customer } from '@/types';

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useCustomers({ search: search || undefined, status: status || undefined });
  const customers = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your building material customers"
        action={{ label: 'Add Customer', onClick: () => navigate('/customers/new') }}
      />

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile..." className="input-field pl-10" />
          </div>
          <SearchableSelect placeholder="All Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>

      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load customers" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : (
        <DataTable
          data={customers}
          keyExtractor={c => c.id}
          columns={[
            { key: 'name', header: 'Customer', render: (c: Customer) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{c.name}</p>
                  <p className="text-xs text-neutral-500">{c.mobile || 'No mobile'}</p>
                </div>
              </div>
            )},
            { key: 'gst', header: 'GST', hideOnMobile: true, render: (c: Customer) => c.gst_number || '-' },
            { key: 'balance', header: 'Outstanding', className: 'text-right tabular-nums', render: (c: Customer) => (
              <span className={c.opening_balance > 0 ? 'text-orange-600 font-semibold' : 'text-neutral-600'}>{formatCurrency(c.opening_balance)}</span>
            )},
            { key: 'status', header: 'Status', render: (c: Customer) => <StatusBadge status={c.status} /> },
          ]}
          onRowClick={c => navigate(`/customers/${c.id}`)}
        />
      )}
    </div>
  );
}
