import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Phone, MapPin, FileText, ShoppingCart, CreditCard, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { suppliersApi, purchasesApi, paymentsApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate } from '@/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';

const MONTHS = [
  { value: '', label: 'All Time' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
];

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monthFilter, setMonthFilter] = useState('');
  const [txnFilter, setTxnFilter] = useState('all');

  const { data: supplier, isLoading, isError } = useQuery({
    queryKey: ['suppliers', Number(id)],
    queryFn: async () => { const { data } = await suppliersApi.get(Number(id)); return data.data; },
    enabled: !!id,
  });

  const { data: purchasesData } = useQuery({
    queryKey: ['supplier-purchases', Number(id), monthFilter],
    queryFn: async () => {
      const params: any = { supplier_id: Number(id), per_page: 50 };
      if (monthFilter) { params.date_from = monthFilter + '-01'; params.date_to = monthFilter + '-31'; }
      const { data } = await purchasesApi.list(params);
      return data.data?.data || data.data || [];
    },
    enabled: !!id,
  });
  const purchases = Array.isArray(purchasesData) ? purchasesData : [];

  const { data: paymentsData } = useQuery({
    queryKey: ['supplier-payment-history', Number(id), monthFilter],
    queryFn: async () => {
      const params: any = { supplier_id: Number(id), per_page: 50 };
      if (monthFilter) { params.date_from = monthFilter + '-01'; params.date_to = monthFilter + '-31'; }
      const { data } = await paymentsApi.supplierList(params);
      return data.data?.data || data.data || [];
    },
    enabled: !!id,
  });
  const payments = Array.isArray(paymentsData) ? paymentsData : [];

  const totalPurchased = purchases.reduce((sum: number, p: any) => sum + (Number(p.total_amount) || 0), 0);
  const totalPaid = payments.filter((p: any) => p.status === 'confirmed').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const openingBal = Number(supplier?.opening_balance) || 0;
  const openingType = supplier?.opening_balance_type;
  const effectiveOpening = openingType === 'credit' ? openingBal : (openingType === 'debit' ? -openingBal : 0);
  const outstanding = effectiveOpening + totalPurchased - totalPaid;

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !supplier) return <div className="card p-8 text-center text-red-500">Failed to load supplier.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/suppliers')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900">{supplier.name}</h1>
          <p className="text-sm text-neutral-500">Supplier since {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
        </div>
        <button onClick={() => navigate(`/supplier-payments/new?supplier=${supplier.id}`)} className="btn btn-primary flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Pay Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Phone className="w-4 h-4" /> Contact</div>
          <p className="font-semibold">{supplier.mobile || 'No mobile'}</p>
          {supplier.email && <p className="text-sm text-neutral-500">{supplier.email}</p>}
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><FileText className="w-4 h-4" /> GST</div>
          <p className="font-semibold">{supplier.gst_number || 'Not registered'}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><MapPin className="w-4 h-4" /> Address</div>
          <p className="font-semibold text-sm">{supplier.addresses?.[0]?.address || 'No address'}</p>
          {supplier.addresses?.[0]?.city && <p className="text-xs text-neutral-500">{supplier.addresses[0].city}, {supplier.addresses[0].state} {supplier.addresses[0].pincode}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-cyan-50 to-white border-cyan-100">
          <div className="flex items-center gap-2 text-cyan-600 text-sm mb-2"><FileText className="w-4 h-4" /> Opening Balance</div>
          <p className="text-2xl font-bold text-cyan-700">{formatCurrency(openingBal)}</p>
          <p className="text-xs text-cyan-400 mt-1 capitalize">{openingType || 'N/A'}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 text-sm mb-2"><ShoppingCart className="w-4 h-4" /> Total Purchased</div>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalPurchased)}</p>
          <p className="text-xs text-blue-400 mt-1">{purchases.length} purchase{purchases.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-2"><CreditCard className="w-4 h-4" /> Total Paid</div>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-emerald-400 mt-1">{payments.filter((p: any) => p.status === 'confirmed').length} confirmed</p>
        </div>
        <div className={"card p-5 bg-gradient-to-br " + (outstanding > 0 ? 'from-red-50 to-white border-red-100' : 'from-green-50 to-white border-green-100')}>
          <div className="flex items-center gap-2 text-sm mb-2" style={{ color: outstanding > 0 ? '#DC2626' : '#059669' }}>
            <TrendingUp className="w-4 h-4" /> Outstanding
          </div>
          <p className="text-2xl font-bold" style={{ color: outstanding > 0 ? '#DC2626' : '#059669' }}>{formatCurrency(Math.abs(outstanding))}</p>
          <p className="text-xs mt-1" style={{ color: outstanding > 0 ? '#FCA5A5' : '#6EE7B7' }}>
            {outstanding > 0 ? 'You owe' : outstanding < 0 ? 'In advance' : 'Settled'}
          </p>
        </div>
      </div>

      {/* Transaction History - Combined Table */}
      <div className="card rounded-2xl">
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-neutral-500" /> Transaction History
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-100 rounded-xl p-1">
              {(['all', 'purchases', 'payments'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxnFilter(t)}
                  className={'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ' + (txnFilter === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700')}
                >
                  {t === 'all' ? 'All' : t === 'purchases' ? 'Purchases' : 'Payments'}
                </button>
              ))}
            </div>
            <Select options={MONTHS} value={monthFilter} onChange={setMonthFilter} placeholder="All Time" className="w-36" />
          </div>
        </div>

        {/* Merge purchases and payments into single timeline */}
        {(() => {
          const allTxns: any[] = [];
          purchases.forEach((p: any) => allTxns.push({ ...p, _type: 'purchase', _date: p.purchase_date, _ref: p.purchase_number, _amount: Number(p.total_amount) || 0, _paid: Number(p.paid_amount) || 0, _mode: null, _txnRef: null }));
          payments.forEach((p: any) => allTxns.push({ ...p, _type: 'payment', _date: p.payment_date, _ref: p.payment_number || ('#' + p.id), _amount: Number(p.amount) || 0, _paid: 0, _mode: p.payment_mode?.name, _txnRef: p.transaction_reference }));

          const filtered = txnFilter === 'all' ? allTxns : allTxns.filter((t: any) => t._type === (txnFilter === 'purchases' ? 'purchase' : 'payment'));
          filtered.sort((a: any, b: any) => new Date(b._date).getTime() - new Date(a._date).getTime());

          if (filtered.length === 0) return (
            <div className="p-12 text-center">
              <ArrowDownLeft className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">No transactions found</p>
              <p className="text-sm text-neutral-400 mt-1">Try changing the filter or date range.</p>
            </div>
          );

          return (
            <div className="overflow-visible">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-neutral-500">
                    <th className="px-5 py-3 font-medium w-12">Type</th>
                    <th className="px-5 py-3 font-medium">Reference #</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Details</th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((txn: any) => {
                    const isPurchase = txn._type === 'purchase';
                    return (
                      <tr
                        key={txn._type + '-' + txn.id}
                        onClick={() => isPurchase ? navigate('/purchases/' + txn.id) : null}
                        className={'border-b border-neutral-50 transition-colors ' + (isPurchase ? 'cursor-pointer hover:bg-red-50/50' : 'hover:bg-emerald-50/50')}
                      >
                        <td className="px-5 py-3">
                          <div className={'w-8 h-8 rounded-xl flex items-center justify-center ' + (isPurchase ? 'bg-red-50' : 'bg-emerald-50')}>
                            {isPurchase ? (
                              <ArrowDownLeft className="w-4 h-4 text-red-500" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className={'font-medium ' + (isPurchase ? 'text-neutral-900' : 'text-emerald-700')}>{txn._ref}</p>
                          <p className="text-xs text-neutral-400">{isPurchase ? 'Purchase' : 'Payment'}{txn._mode ? ' via ' + txn._mode : ''}</p>
                        </td>
                        <td className="px-5 py-3 text-neutral-600">{formatDate(txn._date)}</td>
                        <td className="px-5 py-3 text-neutral-500 text-sm">
                          {isPurchase ? (
                            <span>{txn.items?.length || 0} items | Paid: <span className="font-medium text-emerald-600">{formatCurrency(txn._paid)}</span></span>
                          ) : (
                            <span>{txn._txnRef || '-'}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums">
                          <span className={isPurchase ? 'text-red-600' : 'text-emerald-600'}>
                            {isPurchase ? '-' : '+'}{formatCurrency(txn._amount)}
                          </span>
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={txn.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
