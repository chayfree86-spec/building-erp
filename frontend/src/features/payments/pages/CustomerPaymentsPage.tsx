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
import { Search, RotateCcw, CreditCard, Eye, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi } from '@/services/api-endpoints';
import { useQueryClient } from '@tanstack/react-query';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'reversed', label: 'Reversed' },
];

export function CustomerPaymentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useCustomerPayments({ search: search || undefined, status: status || undefined });
  const payments = (data as any)?.items || [];

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'confirm') await paymentsApi.customerConfirm(id, []);
      else if (action === 'reverse') await paymentsApi.customerReverse(id, 'Reversed by user');
      toast.success(`Payment ${action}ed successfully`);
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action} payment`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Payments" description="Manage payments received from customers" action={{ label: 'Add Payment', onClick: () => navigate('/customer-payments/new') }} />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payment #, customer..." className="input-field pl-10" />
          </div>
          <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
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
              <span className="font-semibold text-emerald-600">{formatCurrency(p.amount)}</span>
            )},
            { key: 'status', header: 'Status', render: (p: any) => <StatusBadge status={p.status} /> },
            { key: 'actions', header: '', hideOnMobile: true, render: (p: any) => (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {p.status === 'draft' && (
                  <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'confirm')} title="Confirm"><Check className="w-4 h-4 text-emerald-600" /></Button>
                )}
                {p.status === 'confirmed' && (
                  <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'reverse')} title="Reverse"><X className="w-4 h-4 text-red-500" /></Button>
                )}
                <Button size="sm" variant="ghost" title="View"><Eye className="w-4 h-4" /></Button>
              </div>
            )},
          ]}
        />
      )}
    </div>
  );
}
