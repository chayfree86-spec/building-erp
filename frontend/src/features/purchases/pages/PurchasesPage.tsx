import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { usePurchases } from '../api/queries';
import { formatCurrency, formatDate } from '@/utils/format';
import { Search, RotateCcw, ShoppingCart, Plus, Eye, Check, X, Truck, Edit2, Send, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { purchasesApi } from '@/services/api-endpoints';
import { useQueryClient } from '@tanstack/react-query';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'paid', label: 'Paid' },
];

export function PurchasesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [actionPendingId, setActionPendingId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = usePurchases({ search: search || undefined, status: status || undefined });
  const purchases = (data as any)?.items || [];

  const handleStatusUpdate = async (id: number, action: 'submit' | 'approve' | 'confirm') => {
    setActionPendingId(id);
    try {
      if (action === 'submit') {
        await purchasesApi.submit(id);
        toast.success('Purchase submitted successfully');
      } else if (action === 'approve') {
        await purchasesApi.approve(id);
        toast.success('Purchase approved successfully');
      } else if (action === 'confirm') {
        await purchasesApi.confirm(id);
        toast.success('Purchase confirmed. Stock batches created!');
      }
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Manage supplier purchases & bills"
        action={{ label: 'New Purchase', onClick: () => navigate('/purchases/new') }}
      />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice #, supplier..." className="input-field has-icon" />
            </div>
            <div className="w-48">
              <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
            </div>
          </div>
          
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm shrink-0">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Purchases:</span>
            <span className="text-sm font-bold text-neutral-900 font-mono">{formatCurrency(purchases.reduce((sum: number, pur: any) => sum + (Number(pur.total_amount) || 0), 0))}</span>
          </div>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load purchases" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : purchases.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No purchases yet" description="Start by creating your first purchase." action={{ label: 'New Purchase', onClick: () => navigate('/purchases/new') }} />
      ) : (
        <DataTable
          data={purchases}
          keyExtractor={(p: any) => p.id}
          onRowClick={(p: any) => navigate(`/purchases/${p.id}`)}
          columns={[
            { key: 'purchase_no', header: 'Purchase #', render: (p: any) => (
              <div>
                <p className="font-medium text-neutral-900">{p.purchase_number || `#${p.id}`}</p>
                <p className="text-xs text-neutral-500">{formatDate(p.purchase_date)}</p>
              </div>
            )},
            { key: 'supplier', header: 'Supplier', hideOnMobile: true, render: (p: any) => (
              <div>
                <p className="text-sm font-medium">{p.supplier?.name || '-'}</p>
                {p.supplier?.gst_number && <p className="text-xs text-neutral-500">GST: {p.supplier.gst_number}</p>}
              </div>
            )},
            { key: 'items', header: 'Items', hideOnMobile: true, render: (p: any) => (
              <span className="text-sm text-neutral-600">{p.items?.length || 0} items</span>
            )},
            { key: 'purch_price', header: 'Purch. Price', hideOnMobile: true, render: (p: any) => (
              <div className="text-sm font-mono">
                {p.items?.map((i: any, idx: number) => (
                  <span key={idx} className="text-neutral-700">{idx > 0 && ', '}{formatCurrency(i.purchase_price)}</span>
                )) || '-'}
              </div>
            )},
            { key: 'sell_price', header: 'Sell Price', hideOnMobile: true, render: (p: any) => (
              <div className="text-sm font-mono">
                {p.items?.map((i: any, idx: number) => (
                  <span key={idx} className="text-primary-600 font-medium">{idx > 0 && ', '}{formatCurrency(i.selling_price || 0)}</span>
                )) || '-'}
              </div>
            )},
            { key: 'total', header: 'Total Amt', className: 'text-right', render: (p: any) => {
              const bal = Number(p.total_amount || 0) - Number(p.paid_amount || 0);
              const paidAmt = Number(p.paid_amount || 0);
              return (
              <div>
                <p className="font-semibold text-red-600">{formatCurrency(p.total_amount)}</p>
                {paidAmt > 0 && <p className="text-xs text-emerald-600">Paid: {formatCurrency(p.paid_amount)}</p>}
                {paidAmt > 0 && bal > 0 && <p className="text-xs text-red-500">Balance: {formatCurrency(bal)}</p>}
              </div>
            );}},
            { key: 'status', header: 'Status', render: (p: any) => <StatusBadge status={p.status} /> },
            {
              key: 'actions',
              header: 'Actions',
              render: (p: any) => {
                const isPending = actionPendingId === p.id;
                if (p.status === 'draft') {
                  return (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={Send}
                      loading={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(p.id, 'submit');
                      }}
                    >
                      Submit
                    </Button>
                  );
                }
                if (p.status === 'submitted') {
                  return (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={Check}
                      loading={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(p.id, 'approve');
                      }}
                    >
                      Approve
                    </Button>
                  );
                }
                if (p.status === 'approved') {
                  return (
                    <Button
                      size="sm"
                      variant="success"
                      icon={Check}
                      loading={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusUpdate(p.id, 'confirm');
                      }}
                    >
                      Confirm
                    </Button>
                  );
                }
                return null;
              }
            },
          ]}
        />
      )}
    </div>
  );
}
