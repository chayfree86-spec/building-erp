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
import { Search, RotateCcw, ShoppingCart, Plus, Eye, Check, X, Truck, Edit2, Send } from 'lucide-react';
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

  const { data, isLoading, isError, refetch } = usePurchases({ search: search || undefined, status: status || undefined });
  const purchases = (data as any)?.items || [];

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'submit') await purchasesApi.submit(id);
      else if (action === 'approve') await purchasesApi.approve(id);
      else if (action === 'confirm') await purchasesApi.confirm(id);
      else if (action === 'cancel') await purchasesApi.cancel(id, 'Cancelled by user');
      toast.success(`Purchase ${action}ed successfully`);
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action} purchase`);
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice #, supplier..." className="input-field has-icon" />
          </div>
          <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
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
            { key: 'total', header: 'Total Amt', render: (p: any) => (
              <div className="text-right">
                <p className="font-semibold text-neutral-900">{formatCurrency(p.total_amount)}</p>
                {p.paid_amount > 0 && <p className="text-xs text-emerald-600">Paid: {formatCurrency(p.paid_amount)}</p>}
              </div>
            )},
            { key: 'status', header: 'Status', render: (p: any) => <StatusBadge status={p.status} /> },
            { key: 'actions', header: '', hideOnMobile: true, render: (p: any) => (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                {(p.status === 'draft') && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/purchases/${p.id}`)} title="Edit"><Edit2 className="w-4 h-4 text-blue-500" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'submit')} title="Submit"><Send className="w-4 h-4" /></Button>
                  </>
                )}
                {(p.status === 'submitted') && (
                  <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'approve')} title="Approve"><Check className="w-4 h-4 text-emerald-600" /></Button>
                )}
                {(p.status === 'approved') && (
                  <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'confirm')} title="Confirm"><Truck className="w-4 h-4 text-blue-600" /></Button>
                )}
                {!['cancelled', 'confirmed'].includes(p.status) && (
                  <Button size="sm" variant="ghost" onClick={() => handleAction(p.id, 'cancel')} title="Cancel"><X className="w-4 h-4 text-red-500" /></Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => navigate(`/purchases/${p.id}`)} title="View"><Eye className="w-4 h-4" /></Button>
              </div>
            )},
          ]}
        />
      )}
    </div>
  );
}
