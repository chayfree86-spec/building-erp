import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useSupplierPayments } from '@/features/purchases/api/queries';
import { formatCurrency, formatDate } from '@/utils/format';
import { Search, RotateCcw, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi } from '@/services/api-endpoints';
import { useQueryClient } from '@tanstack/react-query';

export function SupplierPaymentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useSupplierPayments({ search: search || undefined, status: status || undefined });
  const payments = (data as any)?.items || [];

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'confirm') await paymentsApi.supplierConfirm(id);
      else if (action === 'reverse') await paymentsApi.supplierReverse(id, 'Reversed by user');
      toast.success(`Payment ${action}ed`);
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Supplier Payments" description="Payments made to suppliers" action={{ label: 'Add Payment', onClick: () => navigate('/supplier-payments/new') }} />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payment #, supplier..." className="input-field has-icon" /></div>
          <SearchableSelect placeholder="All Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'reversed', label: 'Reversed' }]} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? (
        <EmptyState icon="error" title="Failed to load" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No supplier payments yet" description="Record your first supplier payment." action={{ label: 'Add Payment', onClick: () => navigate('/supplier-payments/new') }} />
      ) : (
        <DataTable
          data={payments} keyExtractor={(p: any) => p.id}
          columns={[
            { key: 'payment_no', header: 'Payment #', render: (p: any) => (
              <div><p className="font-medium text-neutral-900">{p.payment_no || `#${p.id}`}</p><p className="text-xs text-neutral-500">{formatDate(p.payment_date)}</p></div>
            )},
            { key: 'supplier', header: 'Supplier', hideOnMobile: true, render: (p: any) => <div><p className="text-sm font-medium">{p.supplier?.name || '-'}</p></div> },
            { key: 'mode', header: 'Mode', hideOnMobile: true, render: (p: any) => p.payment_mode?.name || '-' },
            { key: 'amount', header: 'Amount', render: (p: any) => <span className="font-semibold text-red-600">{formatCurrency(p.amount)}</span> },
            { key: 'status', header: 'Status', render: (p: any) => <StatusBadge status={p.status} /> },
            { key: 'actions', header: '', render: (p: any) => (
              <div className="flex gap-1">
                {p.status === 'draft' && <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); handleAction(p.id, 'confirm'); }}>Confirm</Button>}
                {p.status === 'confirmed' && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAction(p.id, 'reverse'); }}>Reverse</Button>}
              </div>
            )},
          ]}
        />
      )}
    </div>
  );
}
