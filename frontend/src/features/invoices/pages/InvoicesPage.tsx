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
import { Search, RotateCcw, Receipt, Eye, X, Pencil, Trash2, CreditCard, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { salesApi } from '@/services/api-endpoints';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/Modal';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancel' | 'delete'; id: number } | null>(null);

  const confirmMutation = useMutation({
    mutationFn: (id: number) => salesApi.confirm(id),
    onSuccess: () => {
      toast.success('Invoice confirmed successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to confirm invoice');
    }
  });

  const { data, isLoading, isError, refetch } = useInvoices({ search: search || undefined, status: status || undefined });
  const invoices = (data as any)?.items || [];

  const triggerConfirm = (type: 'cancel' | 'delete', id: number) => {
    setConfirmAction({ type, id });
    setConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Invoices"
        description="Manage counter sales & invoices"
        action={{ label: 'New Invoice', onClick: () => navigate('/invoices/new') }}
      />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice #, customer..." className="input-field has-icon" />
            </div>
            <div className="w-48">
              <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
            </div>
          </div>
          
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm shrink-0">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Sales:</span>
            <span className="text-sm font-bold text-neutral-900 font-mono">{formatCurrency(invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0))}</span>
          </div>
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
                <p className="font-medium text-neutral-900">{inv.invoice_number}</p>
                <p className="text-xs text-neutral-500">{formatDate(inv.invoice_date)}</p>
              </div>
            )},
            { key: 'customer', header: 'Customer', hideOnMobile: true, render: (inv: any) => (
              <div>
                <p className="text-sm font-medium">{inv.customer_name_snapshot || inv.customer?.name || 'Walk-in'}</p>
                {inv.customer?.mobile && <p className="text-xs text-neutral-500">{inv.customer.mobile}</p>}
              </div>
            )},
            { key: 'total', header: 'Amount', className: 'text-right', render: (inv: any) => {
              const bal = Number(inv.total_amount || 0) - Number(inv.paid_amount || 0);
              const paidAmt = Number(inv.paid_amount || 0);
              return (
              <div>
                <p className="font-semibold text-red-600">{formatCurrency(inv.total_amount)}</p>
                {paidAmt > 0 && <p className="text-xs text-emerald-600">Paid: {formatCurrency(inv.paid_amount)}</p>}
                {paidAmt > 0 && bal > 0 && <p className="text-xs text-red-500">Balance: {formatCurrency(bal)}</p>}
              </div>
            );}},
            { key: 'status', header: 'Status', render: (inv: any) => <StatusBadge status={inv.status} /> },
            { key: 'actions', header: 'Actions', className: 'text-right w-36', render: (inv: any) => {
              const hasBalance = (Number(inv.total_amount) - Number(inv.paid_amount || 0)) > 0.01;
              const isConfirmed = ['confirmed', 'partially_paid'].includes(inv.status);
              return (
                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                  {isConfirmed && hasBalance && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/customer-payments/new?customer=${inv.customer_id}&invoice=${inv.id}`)} title="Record Payment"><CreditCard className="w-4 h-4 text-emerald-500" /></Button>
                  )}
                  {inv.status === 'draft' && (
                    <Button size="sm" variant="ghost" onClick={() => confirmMutation.mutate(inv.id)} disabled={confirmMutation.isPending} title="Confirm Invoice">
                      {confirmMutation.isPending && confirmMutation.variables === inv.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/invoices/${inv.id}`)} title="View/Edit"><Eye className="w-4 h-4 text-blue-500" /></Button>
                  {inv.status === 'draft' ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => triggerConfirm('delete', inv.id)} title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => triggerConfirm('cancel', inv.id)} title="Cancel"><X className="w-4 h-4 text-neutral-400" /></Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" disabled title="Delete"><Trash2 className="w-4 h-4 text-neutral-300 cursor-not-allowed" /></Button>
                  )}
                </div>
              );
            }},
          ]}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
          onConfirm={async () => {
            const { type, id } = confirmAction;
            setConfirmOpen(false);
            setConfirmAction(null);
            try {
              if (type === 'cancel') {
                await salesApi.cancel(id, 'Cancelled by user');
                toast.success('Invoice cancelled successfully');
              } else {
                await salesApi.remove(id);
                toast.success('Invoice deleted successfully');
              }
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
            } catch (err: any) {
              toast.error(err?.response?.data?.message || 'Failed to execute action');
            }
          }}
          title={confirmAction.type === 'cancel' ? 'Cancel Invoice?' : 'Delete Invoice?'}
          message={confirmAction.type === 'cancel'
            ? 'Are you sure you want to cancel this invoice? This action cannot be undone.'
            : 'Are you sure you want to delete this draft invoice? This will permanently remove the record.'}
          confirmLabel={confirmAction.type === 'cancel' ? 'Yes, Cancel' : 'Yes, Delete'}
        />
      )}
    </div>
  );
}
