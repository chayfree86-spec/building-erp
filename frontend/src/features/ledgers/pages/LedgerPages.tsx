import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useQuery } from '@tanstack/react-query';
import { ledgersApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate } from '@/utils/format';
import { Search, RotateCcw, BookOpen } from 'lucide-react';

function LedgerPage({ type, title, description }: { type: 'customer' | 'supplier' | 'inventory'; title: string; description: string }) {
  const [search, setSearch] = useState('');
  const [partyId, setPartyId] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [`${type}-ledger`, search, partyId],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      if (partyId) params.party_id = partyId;
      if (type === 'customer') return (await ledgersApi.customer(params)).data;
      if (type === 'supplier') return (await ledgersApi.supplier(params)).data;
      return (await ledgersApi.inventory(params)).data;
    },
  });
  const raw = (data as any)?.data;
  const entries = Array.isArray(raw) ? raw : (raw?.data || []);

  const getTypeBadge = (entryType: string) => {
    const map: Record<string, string> = {
      purchase: 'bg-blue-50 text-blue-700 border-blue-100', 
      sale: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      payment: 'bg-amber-50 text-amber-700 border-amber-100', 
      return: 'bg-red-50 text-red-700 border-red-100',
      opening: 'bg-purple-50 text-purple-700 border-purple-100', 
      adjustment: 'bg-orange-50 text-orange-700 border-orange-100',
      transfer: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    };
    return map[entryType] || 'bg-neutral-50 text-neutral-700 border-neutral-100';
  };

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP VERSION (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
        <PageHeader title={title} description={description} />
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${type}...`} className="input-field has-icon" />
            </div>
            <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setPartyId(''); }}>Reset</Button>
          </div>
        </div>
        {isLoading ? <CardSkeleton count={8} /> : isError ? (
          <EmptyState icon="error" title="Failed to load ledger" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : entries.length === 0 ? (
          <EmptyState icon={BookOpen} title="No ledger entries" description="Transactions will appear here." />
        ) : (
          <DataTable
            data={entries}
            keyExtractor={(e: any, i: number) => e.id || i}
            columns={[
              { key: 'date', header: 'Date', render: (e: any) => (
                <div>
                  <p className="text-sm">{formatDate(e.date || e.created_at)}</p>
                </div>
              )},
              { key: 'type', header: 'Type', render: (e: any) => (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getTypeBadge(e.entry_type || e.type)}`}>
                  {e.entry_type || e.type || '-'}
                </span>
              )},
              { key: 'reference', header: 'Reference', hideOnMobile: true, render: (e: any) => e.reference_no || e.invoice_no || '-' },
              { key: 'description', header: 'Description', hideOnMobile: true, render: (e: any) => e.description || e.narration || '-' },
              { key: 'debit', header: 'Debit', render: (e: any) => e.debit_amount ? <span className="text-red-600 font-medium">{formatCurrency(e.debit_amount)}</span> : '-' },
              { key: 'credit', header: 'Credit', render: (e: any) => e.credit_amount ? <span className="text-emerald-600 font-medium">{formatCurrency(e.credit_amount)}</span> : '-' },
              { key: 'balance', header: 'Balance', render: (e: any) => <span className="font-semibold">{formatCurrency(e.balance || e.running_balance || 0)}</span> },
            ]}
          />
        )}
      </div>

      {/* ─── PWA MOBILE VERSION (Optimized Cards Layout) ─── */}
      <div className="md:hidden space-y-4 pb-16">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h1>
          <p className="text-neutral-500 text-xs mt-0.5">{description}</p>
        </div>

        {/* Filter Card */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm space-y-2">
          <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${type}...`}
                className="input-field has-icon w-full py-1.5 text-xs rounded-xl"
              />
            </div>
            <button
              onClick={() => { setSearch(''); setPartyId(''); }}
              className="w-full py-2 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        </div>

        {/* Mobile Entries List */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-neutral-100 rounded-[20px] animate-pulse" />
            <div className="h-20 bg-neutral-100 rounded-[20px] animate-pulse" />
          </div>
        ) : isError ? (
          <EmptyState icon="error" title="Failed to load ledger" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : entries.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[24px] border border-neutral-200/50 p-6 space-y-2 shadow-sm">
            <BookOpen className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">No entries found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e: any, idx: number) => {
              const entryType = e.entry_type || e.type || '';
              return (
                <div
                  key={e.id || idx}
                  className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm"
                >
                  <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-neutral-800">{formatDate(e.date || e.created_at)}</span>
                        { (e.reference_no || e.invoice_no) && (
                          <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">Ref: {e.reference_no || e.invoice_no}</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider scale-95 origin-right ${getTypeBadge(entryType)}`}>
                        {entryType}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 px-2.5 bg-neutral-50/50 rounded-xl border border-neutral-100/70 text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-bold text-neutral-600 truncate">{e.description || e.narration || '-'}</p>
                        <p className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider mt-0.5">Running Bal</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex gap-2 justify-end mb-0.5">
                          {e.debit_amount && (
                            <span className="font-bold text-red-600 tabular-nums">Dr {formatCurrency(e.debit_amount)}</span>
                          )}
                          {e.credit_amount && (
                            <span className="font-bold text-emerald-600 tabular-nums">Cr {formatCurrency(e.credit_amount)}</span>
                          )}
                        </div>
                        <span className="font-black text-neutral-800 text-sm block">
                          {formatCurrency(e.balance || e.running_balance || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export function CustomerLedgerPage() {
  return <LedgerPage type="customer" title="Customer Ledger" description="Track customer transactions and balances" />;
}

export function SupplierLedgerPage() {
  return <LedgerPage type="supplier" title="Supplier Ledger" description="Track supplier transactions and balances" />;
}

export function InventoryLedgerPage() {
  return <LedgerPage type="inventory" title="Inventory Ledger" description="Track stock movements" />;
}
