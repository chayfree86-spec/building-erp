import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useCustomerPayments } from '@/features/purchases/api/queries';
import { formatCurrency, formatDate } from '@/utils/format';
import { Search, RotateCcw, CreditCard, Eye, Pencil } from 'lucide-react';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'reversed', label: 'Reversed' },
];

export function CustomerPaymentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useCustomerPayments({ search: search || undefined, status: status || undefined });
  const payments = (data as any)?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Payments" description="Manage payments received from customers" action={{ label: 'Add Payment', onClick: () => navigate('/customer-payments/new') }} />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payment #, customer..." className="input-field has-icon" />
            </div>
            <div className="w-48">
              <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
            </div>
          </div>
          
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm shrink-0">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Received:</span>
            <span className="text-sm font-bold text-neutral-900 font-mono">{formatCurrency(payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0))}</span>
          </div>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load payments" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments yet" description="Record your first customer payment." action={{ label: 'Add Payment', onClick: () => navigate('/customer-payments/new') }} />
      ) : (
        <DataTable
          data={payments}
          keyExtractor={(p: any) => p.id}
          columns={[
            { key: 'payment_no', header: 'Payment #', render: (p: any) => (
              <div>
                <p className="font-medium text-neutral-900">{p.payment_no || `#${p.id}`}</p>
                <p className="text-xs text-neutral-500">{formatDate(p.payment_date)}</p>
              </div>
            )},
            { key: 'customer', header: 'Customer', hideOnMobile: true, render: (p: any) => (
              <div>
                <p className="text-sm font-medium">{p.customer?.name || '-'}</p>
                {p.customer?.mobile && <p className="text-xs text-neutral-500">{p.customer.mobile}</p>}
              </div>
            )},
            { key: 'mode', header: 'Mode', hideOnMobile: true, render: (p: any) => p.payment_mode?.name || '-' },
            { key: 'amount', header: 'Amount', render: (p: any) => (
              <span className={`font-semibold tabular-nums ${p.status === 'confirmed' ? 'text-emerald-600' : p.status === 'reversed' ? 'text-neutral-400 line-through' : 'text-red-500'}`}>{formatCurrency(p.amount)}</span>
            )},
            { key: 'status', header: 'Status', render: (p: any) => <StatusBadge status={p.status} /> },
            { key: 'actions', header: '', hideOnMobile: true, className: 'text-right w-16', render: (p: any) => (
              <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                {p.status === 'draft' ? (
                  <Button size="sm" variant="ghost" title="Edit"><Pencil className="w-4 h-4 text-blue-500" /></Button>
                ) : (
                  <Button size="sm" variant="ghost" title="View"><Eye className="w-4 h-4" /></Button>
                )}
              </div>
            )},
          ]}
        />
      )}
    </div>
  );
}
