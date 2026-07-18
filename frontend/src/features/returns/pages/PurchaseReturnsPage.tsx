import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { usePurchaseReturns } from '@/features/purchases/api/queries';
import { formatCurrency, formatDate } from '@/utils/format';
import { Search, RotateCcw, RotateCcw as ReturnIcon, Plus } from 'lucide-react';

export function PurchaseReturnsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = usePurchaseReturns({ search: search || undefined, status: status || undefined });
  const returns = (data as any)?.items || [];

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP VERSION (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
        <PageHeader title="Purchase Returns" description="Goods returned to suppliers" action={{ label: 'New Return', onClick: () => navigate('/purchase-returns/new') }} />
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search return #, supplier..." className="input-field has-icon" />
            </div>
            <SearchableSelect placeholder="All Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'cancelled', label: 'Cancelled' }]} value={status} onChange={setStatus} />
            <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
          </div>
        </div>
        {isLoading ? <CardSkeleton count={5} /> : isError ? (
          <EmptyState icon="error" title="Failed to load returns" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : returns.length === 0 ? (
          <EmptyState icon={ReturnIcon} title="No returns yet" description="Record your first purchase return." action={{ label: 'New Return', onClick: () => navigate('/purchase-returns/new') }} />
        ) : (
          <DataTable
            data={returns}
            keyExtractor={(r: any) => r.id}
            onRowClick={(r: any) => navigate(`/purchase-returns/${r.id}`)}
            columns={[
              { key: 'return_no', header: 'Return #', render: (r: any) => (
                <div>
                  <p className="font-medium text-neutral-900">{r.return_no || `#${r.id}`}</p>
                  <p className="text-xs text-neutral-500">{formatDate(r.return_date)}</p>
                </div>
              )},
              { key: 'supplier', header: 'Supplier', hideOnMobile: true, render: (r: any) => r.supplier?.name || '-' },
              { key: 'purchase', header: 'Original Purchase', hideOnMobile: true, render: (r: any) => r.purchase?.invoice_no || '-' },
              { key: 'amount', header: 'Amount', render: (r: any) => <span className="font-semibold text-red-600">{formatCurrency(r.total_amount)}</span> },
              { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
            ]}
          />
        )}
      </div>

      {/* ─── PWA MOBILE VERSION (Optimized Cards Layout) ─── */}
      <div className="md:hidden space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Purchase Returns</h1>
            <p className="text-neutral-500 text-xs mt-0.5">Goods returned to suppliers</p>
          </div>
          <button
            onClick={() => navigate('/purchase-returns/new')}
            className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md flex items-center justify-center active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm space-y-2">
          <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search return #, supplier..."
                className="input-field has-icon w-full py-1.5 text-xs rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableSelect placeholder="All Status" options={[{ value: 'draft', label: 'Draft' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'cancelled', label: 'Cancelled' }]} value={status} onChange={setStatus} />
              </div>
              <button onClick={() => { setSearch(''); setStatus(''); }} className="px-3 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold active:scale-95 transition-all">
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cards List */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-neutral-100 rounded-[20px] animate-pulse" />
            <div className="h-20 bg-neutral-100 rounded-[20px] animate-pulse" />
          </div>
        ) : isError ? (
          <EmptyState icon="error" title="Failed to load returns" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : returns.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[24px] border border-neutral-200/50 p-6 space-y-2 shadow-sm">
            <ReturnIcon className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">No returns found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((r: any) => (
              <div
                key={r.id}
                onClick={() => navigate(`/purchase-returns/${r.id}`)}
                className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-neutral-800">{r.return_no || `#${r.id}`}</span>
                      <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">{formatDate(r.return_date)}</span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex justify-between items-center py-2 px-2.5 bg-neutral-50/50 rounded-xl border border-neutral-100/70 text-xs">
                    <div>
                      <p className="font-bold text-neutral-700">{r.supplier?.name || '-'}</p>
                      <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Purchase: {r.purchase?.invoice_no || '-'}</p>
                    </div>
                    <span className="font-black text-red-600 text-sm">
                      {formatCurrency(r.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
