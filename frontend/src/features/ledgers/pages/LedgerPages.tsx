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
      purchase: 'bg-blue-50 text-blue-700', sale: 'bg-emerald-50 text-emerald-700',
      payment: 'bg-amber-50 text-amber-700', return: 'bg-red-50 text-red-700',
      opening: 'bg-purple-50 text-purple-700', adjustment: 'bg-orange-50 text-orange-700',
      transfer: 'bg-cyan-50 text-cyan-700',
    };
    return map[entryType] || 'bg-neutral-50 text-neutral-700';
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${type}...`} className="input-field pl-10" />
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
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getTypeBadge(e.entry_type || e.type)}`}>
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
