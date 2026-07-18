import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useTransfers } from '@/features/purchases/api/queries';
import { formatDate } from '@/utils/format';
import { Search, RotateCcw, ArrowRightLeft, Plus } from 'lucide-react';

const statusOptions = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'dispatched', label: 'Dispatched' },
  { value: 'received', label: 'Received' }, { value: 'cancelled', label: 'Cancelled' },
];

export function StockTransfersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useTransfers({ search: search || undefined, status: status || undefined });
  const transfers = (data as any)?.items || [];

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP VERSION (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
        <PageHeader title="Stock Transfers" description="Inter-store stock movements" action={{ label: 'New Transfer', onClick: () => navigate('/stock-transfers/new') }} />
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transfer #..." className="input-field has-icon" />
            </div>
            <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
            <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
          </div>
        </div>
        {isLoading ? <CardSkeleton count={5} /> : isError ? (
          <EmptyState icon="error" title="Failed to load transfers" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : transfers.length === 0 ? (
          <EmptyState icon={ArrowRightLeft} title="No transfers yet" description="Start transferring stock between stores." action={{ label: 'New Transfer', onClick: () => navigate('/stock-transfers/new') }} />
        ) : (
          <DataTable
            data={transfers}
            keyExtractor={(t: any) => t.id}
            onRowClick={(t: any) => navigate(`/stock-transfers/${t.id}`)}
            columns={[
              { key: 'transfer_no', header: 'Transfer #', render: (t: any) => (
                <div>
                  <p className="font-medium text-neutral-900">{t.transfer_no || `#${t.id}`}</p>
                  <p className="text-xs text-neutral-500">{formatDate(t.transfer_date)}</p>
                </div>
              )},
              { key: 'from', header: 'From → To', hideOnMobile: true, render: (t: any) => (
                <span className="text-sm">{t.from_store?.name || 'Warehouse'} → {t.to_store?.name || 'Store'}</span>
              )},
              { key: 'items', header: 'Items', render: (t: any) => `${t.items_count || t.items?.length || 0} items` },
              { key: 'status', header: 'Status', render: (t: any) => <StatusBadge status={t.status} /> },
            ]}
          />
        )}
      </div>

      {/* ─── PWA MOBILE VERSION (Optimized Cards Layout) ─── */}
      <div className="md:hidden space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Transfers</h1>
            <p className="text-neutral-500 text-xs mt-0.5">Inter-store stock movements</p>
          </div>
          <button
            onClick={() => navigate('/stock-transfers/new')}
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
                placeholder="Search transfer #..."
                className="input-field has-icon w-full py-1.5 text-xs rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
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
          <EmptyState icon="error" title="Failed to load transfers" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : transfers.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[24px] border border-neutral-200/50 p-6 space-y-2 shadow-sm">
            <ArrowRightLeft className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">No transfers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((t: any) => (
              <div
                key={t.id}
                onClick={() => navigate(`/stock-transfers/${t.id}`)}
                className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-neutral-800">{t.transfer_no || `#${t.id}`}</span>
                      <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">{formatDate(t.transfer_date)}</span>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="flex justify-between items-center py-2 px-2.5 bg-neutral-50/50 rounded-xl border border-neutral-100/70 text-xs">
                    <div>
                      <p className="font-bold text-neutral-700">{t.from_store?.name || 'Warehouse'} &rarr; {t.to_store?.name || 'Store'}</p>
                    </div>
                    <span className="font-bold text-neutral-600 text-xs shrink-0">
                      {t.items_count || t.items?.length || 0} items
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
