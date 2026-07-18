import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useInvoices } from '@/features/purchases/api/queries';
import { formatCurrency, formatDate } from '@/utils/format';
import { Search, RotateCcw, Receipt, Eye, X, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { salesApi } from '@/services/api-endpoints';
import { useQueryClient } from '@tanstack/react-query';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'reversed', label: 'Reversed' },
];

export function InvoicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useInvoices({ search: search || undefined, status: status || undefined });
  const invoices = (data as any)?.items || [];

  const handleCancel = async (id: number) => {
    if (!window.confirm('Cancel this invoice?')) return;
    try { await salesApi.cancel(id, 'Cancelled by user'); toast.success('Invoice cancelled'); queryClient.invalidateQueries({ queryKey: ['invoices'] }); }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices"
        description="Manage counter sales & invoices"
        action={{ label: 'New Invoice', onClick: () => navigate('/invoices/new') }}
      />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice #, customer..." className="input-field has-icon" />
          </div>
          <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load invoices" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" description="Start by creating your first sales invoice." action={{ label: 'New Invoice', onClick: () => navigate('/invoices/new') }} />
      ) : (
        <DataTable
          data={invoices}
          keyExtractor={(inv: any) => inv.id}
          onRowClick={(inv: any) => navigate(`/invoices/${inv.id}`)}
          columns={[
            { key: 'invoice_no', header: 'Invoice #', render: (inv: any) => (
              <div>
                <p className="font-medium text-neutral-900">{inv.invoice_no}</p>
                <p className="text-xs text-neutral-500">{formatDate(inv.invoice_date)}</p>
              </div>
            )},
            { key: 'customer', header: 'Customer', hideOnMobile: true, render: (inv: any) => (
              <div>
                <p className="text-sm font-medium">{inv.customer_name_snapshot || inv.customer?.name || 'Walk-in'}</p>
                {inv.customer?.mobile && <p className="text-xs text-neutral-500">{inv.customer.mobile}</p>}
              </div>
            )},
            { key: 'total', header: 'Amount', render: (inv: any) => {
              const bal = Number(inv.total_amount || 0) - Number(inv.paid_amount || 0);
              return (
              <div className="text-right">
                <p className="font-semibold text-neutral-900">{formatCurrency(inv.total_amount)}</p>
                {inv.paid_amount > 0 && <p className="text-xs text-emerald-600">Paid: {formatCurrency(inv.paid_amount)}</p>}
                {bal > 0 && <p className="text-xs text-red-500">Balance: {formatCurrency(bal)}</p>}
              </div>
            );}},
            { key: 'status', header: 'Status', render: (inv: any) => <StatusBadge status={inv.status} /> },
            { key: 'actions', header: '', hideOnMobile: true, className: 'text-right w-24', render: (inv: any) => (
              <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/invoices/${inv.id}`)} title="Edit"><Pencil className="w-4 h-4 text-blue-500" /></Button>
                {inv.status === 'draft' && (
                  <Button size="sm" variant="ghost" onClick={() => handleCancel(inv.id)} title="Cancel"><X className="w-4 h-4 text-red-500" /></Button>
                )}
              </div>
            )},
          ]}
        />
      )}
    </div>
  );
}
