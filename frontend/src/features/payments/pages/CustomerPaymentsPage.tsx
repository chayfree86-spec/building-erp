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
import { Search, CreditCard, Eye, Pencil, Plus } from 'lucide-react';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'reversed', label: 'Reversed' },
];

export function CustomerPaymentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useCustomerPayments({ search: search || undefined, status: status || undefined });
  const payments = (data as any)?.items || [];

  const totalAmount = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP VERSION (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
        <PageHeader title="Customer Payments" description="Manage payments received from customers" action={{ label: 'Add Payment', onClick: () => navigate('/customer-payments/new') }} />
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-1 items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payment #, customer..." className="input-field has-icon" />
              </div>
              <div className="w-48">
                <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
              </div>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm shrink-0">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Received:</span>
              <span className="text-sm font-bold text-neutral-900 tabular-nums">{formatCurrency(totalAmount)}</span>
            </div>
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
                <span className={`font-semibold tabular-nums ${p.status === 'confirmed' ? 'text-emerald-600' : p.status === 'reversed' ? 'text-neutral-400 line-through' : 'text-red-500'}`}>{formatCurrency(p.amount)}</span>
              )},
              { key: 'status', header: 'Status', render: (p: any) => <StatusBadge status={p.status} /> },
              { key: 'actions', header: '', hideOnMobile: true, className: 'text-right w-16', render: (p: any) => (
                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                  {p.status === 'draft' ? (
                    <Button size="sm" variant="ghost" title="Edit"><Pencil className="w-4 h-4 text-blue-500" /></Button>
                  ) : (
                    <Button size="sm" variant="ghost" title="View"><Eye className="w-4 h-4" /></Button>
                  )}
                </div>
              )},
            ]}
          />
        )}
      </div>

      {/* ─── PWA MOBILE VERSION (Optimized Cards Layout) ─── */}
      <div className="md:hidden space-y-4 pb-16">
        
        {/* Mobile Header with Quick Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Payments</h1>
            <p className="text-neutral-500 text-xs mt-0.5">Manage customer payments</p>
          </div>
          <button
            onClick={() => navigate('/customer-payments/new')}
            className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 flex items-center justify-center active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Filter & Search */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm space-y-2">
          <div className="rounded-[20px] bg-white p-3.5 space-y-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search payment #, customer..."
                className="input-field has-icon w-full py-1.5 text-xs rounded-xl"
              />
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <SearchableSelect placeholder="All Status" options={statusOptions} value={status} onChange={setStatus} />
              </div>
              <div className="bg-neutral-50/50 border border-neutral-200/60 rounded-xl px-3 py-1.5 flex flex-col items-end shrink-0 justify-center">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Total</span>
                <span className="text-xs font-bold text-neutral-800 tabular-nums mt-0.5">{formatCurrency(totalAmount)}</span>
              </div>
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
          <EmptyState icon="error" title="Failed to load payments" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : payments.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[24px] border border-neutral-200/50 p-6 space-y-2 shadow-sm">
            <CreditCard className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">No payments found</p>
            <button
              onClick={() => navigate('/customer-payments/new')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 active:scale-95"
            >
              Add first payment &rarr;
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p: any) => (
              <div
                key={p.id}
                className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-neutral-800">{p.payment_no || `#${p.id}`}</span>
                      <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">{formatDate(p.payment_date)}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  <div className="flex justify-between items-center py-2 px-2.5 bg-neutral-50/50 rounded-xl border border-neutral-100/70 text-xs">
                    <div>
                      <p className="font-bold text-neutral-700">{p.customer?.name || '-'}</p>
                      <p className="text-[10px] text-neutral-400 font-medium mt-0.5">{p.payment_mode?.name || 'Cash'}</p>
                    </div>
                    <span className={`font-bold tabular-nums text-sm ${p.status === 'confirmed' ? 'text-emerald-600' : p.status === 'reversed' ? 'text-neutral-400 line-through' : 'text-red-500'}`}>
                      {formatCurrency(p.amount)}
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
