import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Phone, MapPin, FileText, CreditCard, TrendingUp, ArrowDownLeft, ArrowUpRight, MessageSquare, Download } from 'lucide-react';
import { customersApi, salesApi, paymentsApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate } from '@/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { generateCustomerStatementPdf } from '@/utils/CustomerStatementPdf';
import { MasterFormModal, type FieldDef } from '@/components/shared/MasterFormModal';
import toast from 'react-hot-toast';

const MONTHS = [
  { value: '', label: 'All Time' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
];

const customerFields: FieldDef[] = [
  { key: 'name', label: 'Customer Name', required: true, placeholder: 'Full name or business name' },
  { key: 'mobile', label: 'Mobile', placeholder: '10-digit mobile number' },
  { key: 'email', label: 'Email', placeholder: 'customer@example.com' },
  { key: 'gst_number', label: 'GST Number', placeholder: 'GSTIN' },
  { key: 'opening_balance', label: 'Opening Balance', type: 'number', placeholder: '0', defaultValue: '0' },
  { key: 'credit_limit', label: 'Credit Limit', type: 'number', placeholder: '0', defaultValue: '0' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Billing address' },
  { key: 'city', label: 'City', placeholder: 'City' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'pincode', label: 'Pincode', placeholder: 'Pincode' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [monthFilter, setMonthFilter] = useState('');
  const [txnFilter, setTxnFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ['customers', Number(id)],
    queryFn: async () => { const { data } = await customersApi.get(Number(id)); return data.data; },
    enabled: !!id,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['customer-invoices', Number(id), monthFilter],
    queryFn: async () => {
      const params: any = { customer_id: Number(id), per_page: 50 };
      if (monthFilter) { params.date_from = monthFilter + '-01'; params.date_to = monthFilter + '-31'; }
      const { data } = await salesApi.list(params);
      return data.data?.data || data.data || [];
    },
    enabled: !!id,
  });
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  const { data: paymentsData } = useQuery({
    queryKey: ['customer-payment-history', Number(id), monthFilter],
    queryFn: async () => {
      const params: any = { customer_id: Number(id), per_page: 50 };
      if (monthFilter) { params.date_from = monthFilter + '-01'; params.date_to = monthFilter + '-31'; }
      const { data } = await paymentsApi.customerList(params);
      return data.data?.data || data.data || [];
    },
    enabled: !!id,
  });
  const payments = Array.isArray(paymentsData) ? paymentsData : [];

  const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0);
  const totalReceived = payments.filter((p: any) => p.status === 'confirmed').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const openingBal = Number(customer?.opening_balance) || 0;
  const openingType = customer?.opening_balance_type;
  const effectiveOpening = openingType === 'debit' ? openingBal : (openingType === 'credit' ? -openingBal : 0);
  const outstanding = customer?.outstanding_balance !== undefined ? Number(customer.outstanding_balance) : (effectiveOpening + totalInvoiced - totalReceived);

  const getLedgerEntries = () => {
    const entries: any[] = [];
    
    // Add opening balance
    const openingDate = customer?.created_at || new Date().toISOString();
    const matchesMonth = !monthFilter || openingDate.startsWith(monthFilter);

    if (matchesMonth) {
      entries.push({
        id: 'opening',
        date: openingDate,
        type: 'opening',
        reference_no: 'OP-BAL',
        description: 'Opening Balance',
        debit_amount: effectiveOpening > 0 ? effectiveOpening : 0,
        credit_amount: effectiveOpening < 0 ? Math.abs(effectiveOpening) : 0,
        running_balance: effectiveOpening,
        amount: Math.abs(effectiveOpening),
        status: 'confirmed'
      });
    }

    let running = effectiveOpening;

    const txns: any[] = [];
    invoices.forEach((inv: any) => txns.push({ ...inv, _type: 'invoice', date: inv.invoice_date, amount: Number(inv.total_amount) || 0 }));
    payments.forEach((p: any) => txns.push({ ...p, _type: 'payment', date: p.payment_date, amount: Number(p.amount) || 0 }));
    txns.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    txns.forEach((t) => {
      const isInv = t._type === 'invoice';
      if (isInv) {
        running += t.amount;
        entries.push({
          id: t.id,
          date: t.date,
          type: 'invoice',
          reference_no: t.invoice_number,
          description: `Invoice for ${t.items?.length || 0} items`,
          debit_amount: t.amount,
          credit_amount: 0,
          running_balance: running,
          amount: t.amount,
          paid_amount: t.paid_amount,
          items: t.items,
          status: t.status
        });
      } else {
        running -= t.amount;
        entries.push({
          id: t.id,
          date: t.date,
          type: 'payment',
          reference_no: t.payment_no || `#${t.id}`,
          description: `Payment received via ${t.payment_mode?.name || 'cash'}`,
          debit_amount: 0,
          credit_amount: t.amount,
          running_balance: running,
          amount: t.amount,
          payment_mode: t.payment_mode,
          transaction_reference: t.transaction_reference,
          status: t.status
        });
      }
    });

    return entries.reverse();
  };

  const handleDownloadStatement = () => {
    const entries = getLedgerEntries();
    const doc = generateCustomerStatementPdf({
      customer,
      entries,
      periodLabel: monthFilter || 'All Time',
      summary: {
        totalPurchase: totalInvoiced,
        totalPaid: totalReceived,
        outstanding: outstanding
      }
    });
    doc.save(`${customer.name.replace(/\s+/g, '_')}_statement.pdf`);
  };

  const shareOnWhatsApp = async () => {
    try {
      toast.loading('Preparing PDF statement...', { id: 'pdf-share' });
      const entries = getLedgerEntries();
      const doc = generateCustomerStatementPdf({
        customer,
        entries,
        periodLabel: monthFilter || 'All Time',
        summary: {
          totalPurchase: totalInvoiced,
          totalPaid: totalReceived,
          outstanding: outstanding
        }
      });
      const pdfBlob = doc.output('blob');
      const fileName = `${customer.name.replace(/\s+/g, '_')}_statement.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        toast.dismiss('pdf-share');
        await navigator.share({
          files: [pdfFile],
          title: `${customer.name} Statement`,
          text: `Financial statement for ${customer.name}.`
        });
      } else {
        toast.success('Statement downloaded. Opening WhatsApp...', { id: 'pdf-share' });
        doc.save(fileName);
        
        const statusText = outstanding > 0 ? 'Customer owes' : outstanding < 0 ? 'Advance' : 'Settled';
        const text = `नमस्ते ${customer.name},\n\nआपका खाता विवरण:\n\nकुल खरीद: ${formatCurrency(totalInvoiced)}\nकुल भुगतान: ${formatCurrency(totalReceived)}\nआउटस्टैंडिंग: ${formatCurrency(Math.abs(outstanding))} (${statusText})\n\nसॉफ्टवेयर द्वारा साझा किया गया खाता विवरण।\nधन्यवाद।`;
        
        window.open(`https://wa.me/${customer.mobile}?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to share statement', { id: 'pdf-share' });
    }
  };

  const handleSave = async (formData: Record<string, any>) => {
    const payload = {
      ...formData,
      opening_balance: Number(formData.opening_balance) || 0,
      credit_limit: Number(formData.credit_limit) || 0,
      // Map flat address field from MasterFormModal to the structure needed
      addresses: [{
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        pincode: formData.pincode || '',
      }]
    };
    try {
      await customersApi.update(customer.id, payload);
      toast.success('Customer updated');
      queryClient.invalidateQueries({ queryKey: ['customers', Number(id)] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !customer) return <div className="card p-8 text-center text-red-500">Failed to load customer.</div>;

  // Filtered transactions using unified ledger entries datasource
  const ledgerEntries = getLedgerEntries();
  const filteredTxns = ledgerEntries.filter((t: any) => {
    if (txnFilter === 'invoices') return t.type === 'invoice';
    if (txnFilter === 'payments') return t.type === 'payment';
    return true; // 'all' displays everything (invoices, payments, and opening balance)
  });

  // Prepare default edit values for MasterFormModal
  const editDefaultValues = {
    name: customer.name || '',
    mobile: customer.mobile || '',
    email: customer.email || '',
    gst_number: customer.gst_number || '',
    opening_balance: String(customer.opening_balance || 0),
    credit_limit: String(customer.credit_limit || 0),
    address: customer.addresses?.[0]?.address || '',
    city: customer.addresses?.[0]?.city || '',
    state: customer.addresses?.[0]?.state || '',
    pincode: customer.addresses?.[0]?.pincode || '',
    status: customer.status || 'active',
  };

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP VERSION (Unchanged Layout) ─── */}
      <div className="hidden md:block space-y-6">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/customers')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-neutral-900">{customer.name}</h1>
                <button
                  onClick={() => setModalOpen(true)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors active:scale-95"
                  title="Edit Customer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">Customer since {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              onClick={shareOnWhatsApp}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.9 9.9 0 0 0-6.98-2.879c-5.443 0-9.866 4.372-9.87 9.802 0 1.96.516 3.878 1.494 5.58l-1.019 3.72 3.841-1.008zm11.378-5.321c-.302-.15-.179-.226-.789-.916-.61-.69-1.28-1.447-1.393-1.577-.113-.13-.208-.282-.132-.433.075-.15.113-.226.226-.377.113-.15.227-.3.339-.452.113-.151.245-.316.113-.526-.13-.21-1.168-2.779-1.262-3.003-.092-.22-.187-.19-.257-.19-.068-.003-.146-.003-.224-.003-.078 0-.205.029-.313.146-.108.117-.412.399-.412.973 0 .574.422 1.128.48 1.206.058.078.814 1.229 1.973 1.723 1.159.493 1.159.329 1.369.31.21-.019.678-.276.772-.544.094-.268.094-.497.066-.544-.029-.047-.104-.078-.406-.228z"/>
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/customer-payments/new?customer=${customer.id}`)}
              icon={CreditCard}
              className="flex items-center gap-2"
            >
              Receive Payment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Phone className="w-4 h-4" /> Contact</div>
            <p className="font-semibold">{customer.mobile || 'No mobile'}</p>
            {customer.email && <p className="text-sm text-neutral-500">{customer.email}</p>}
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><FileText className="w-4 h-4" /> GST Number</div>
            <p className="font-semibold">{customer.gst_number || 'Not registered'}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><MapPin className="w-4 h-4" /> Address</div>
            <p className="font-semibold text-sm">{customer.addresses?.[0]?.address || 'No address'}</p>
            {customer.addresses?.[0]?.city && <p className="text-xs text-neutral-500">{customer.addresses[0].city}, {customer.addresses[0].state} {customer.addresses[0].pincode}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5 bg-gradient-to-br from-cyan-50 to-white border-cyan-100">
            <div className="flex items-center gap-2 text-cyan-600 text-sm mb-2"><FileText className="w-4 h-4" /> Opening Balance</div>
            <p className="text-2xl font-bold text-cyan-700">{formatCurrency(openingBal)}</p>
            <p className="text-xs text-cyan-400 mt-1 capitalize">{openingType || 'N/A'}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 text-sm mb-2"><FileText className="w-4 h-4" /> Total Invoiced</div>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalInvoiced)}</p>
            <p className="text-xs text-blue-400 mt-1">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-600 text-sm mb-2"><CreditCard className="w-4 h-4" /> Total Received</div>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalReceived)}</p>
            <p className="text-xs text-emerald-400 mt-1">{payments.filter((p: any) => p.status === 'confirmed').length} confirmed</p>
          </div>
          <div className={"card p-5 bg-gradient-to-br " + (outstanding > 0 ? 'from-rose-50 to-white border-rose-100' : 'from-green-50 to-white border-green-100')}>
            <div className="flex items-center gap-2 text-sm mb-2" style={{ color: outstanding > 0 ? '#e25c6a' : '#059669' }}>
              <TrendingUp className="w-4 h-4" /> Outstanding
            </div>
            <p className="text-2xl font-bold" style={{ color: outstanding > 0 ? '#e25c6a' : '#059669' }}>{formatCurrency(Math.abs(outstanding))}</p>
            <p className="text-xs mt-1" style={{ color: outstanding > 0 ? '#fda4af' : '#6ee7b7' }}>
              {outstanding > 0 ? 'Customer owes' : outstanding < 0 ? 'In advance' : 'Settled'}
            </p>
          </div>
        </div>

        {/* Desktop Transaction Table */}
        <div className="card rounded-2xl">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-neutral-500" /> Transaction History
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-neutral-100 rounded-xl p-1">
                {(['all', 'invoices', 'payments'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxnFilter(t)}
                    className={'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ' + (txnFilter === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-775')}
                  >
                    {t === 'all' ? 'All' : t === 'invoices' ? 'Invoices' : 'Payments'}
                  </button>
                ))}
              </div>
              <Select options={MONTHS} value={monthFilter} onChange={(v) => setMonthFilter(String(v))} placeholder="All Time" className="w-36" />
            </div>
          </div>

          {filteredTxns.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowDownLeft className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">No transactions found</p>
            </div>
          ) : (
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
                  {filteredTxns.map((txn: any) => {
                    const isInvoice = txn.type === 'invoice';
                    const isPayment = txn.type === 'payment';
                    return (
                      <tr
                        key={txn.type + '-' + txn.id}
                        onClick={() => isInvoice ? navigate('/invoices/' + txn.id) : null}
                        className={'border-b border-neutral-50 transition-colors ' + (isInvoice ? 'cursor-pointer hover:bg-blue-50/50' : isPayment ? 'hover:bg-emerald-50/50' : '')}
                      >
                        <td className="px-5 py-3">
                          <div className={'w-8 h-8 rounded-xl flex items-center justify-center ' + (isInvoice ? 'bg-blue-50' : isPayment ? 'bg-emerald-50' : 'bg-neutral-50')}>
                            {isInvoice ? <ArrowUpRight className="w-4 h-4 text-blue-500" /> : isPayment ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> : <TrendingUp className="w-4 h-4 text-neutral-500" />}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className={'font-medium ' + (isInvoice ? 'text-neutral-900' : isPayment ? 'text-emerald-700' : 'text-neutral-805')}>{txn.reference_no}</p>
                          <p className="text-xs text-neutral-400 capitalize">{txn.type}</p>
                        </td>
                        <td className="px-5 py-3 text-neutral-600">{formatDate(txn.date)}</td>
                        <td className="px-5 py-3 text-neutral-500 text-sm">
                          {isInvoice ? (
                            <span>{txn.items?.length || 0} items | Paid: <span className="font-medium text-emerald-600">{formatCurrency(txn.paid_amount || 0)}</span></span>
                          ) : isPayment ? (
                            <span>{txn.payment_mode?.name || 'Cash'} {txn.transaction_reference ? `• Ref: ${txn.transaction_reference}` : ''}</span>
                          ) : (
                            <span>Opening Balance ({openingType || 'N/A'})</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums">
                          <span className={isInvoice ? 'text-blue-600' : isPayment ? 'text-emerald-600' : 'text-neutral-600'}>
                            {isInvoice ? '+' : isPayment ? '-' : (effectiveOpening >= 0 ? '+' : '-')}{formatCurrency(txn.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={txn.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── MOBILE / PWA VERSION (With Dark Header & Priority Flow) ─── */}
      <div className="md:hidden space-y-5">
        
        {/* 1. App-style Profile Header Card */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-950 text-white border-0 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl" />

          <div className="flex flex-col items-center text-center relative z-10 space-y-4">
            {/* Header Action Bar */}
            <div className="w-full flex items-center justify-between">
              <button onClick={() => navigate('/customers')} className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-all border border-white/5">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Customer Profile</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setModalOpen(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-all border border-white/5"
                  title="Edit Customer"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <StatusBadge status={customer.status} />
              </div>
            </div>

            {/* User Info Avatar Row */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold text-white shadow-inner select-none mb-2">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <h1 className="text-lg font-bold tracking-tight text-white">{customer.name}</h1>
              <p className="text-[11px] text-neutral-400 mt-0.5 font-medium">Customer since {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : 'N/A'}</p>
            </div>

            {/* Profile Quick Actions Grid */}
            <div className="w-full grid grid-cols-3 gap-2.5 max-w-sm pt-1">
              {customer.mobile ? (
                <a
                  href={`tel:${customer.mobile}`}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 text-white"
                >
                  <Phone className="w-4.5 h-4.5 text-sky-400" />
                  <span className="text-[10px] font-bold">Call</span>
                </a>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-white/5 border border-white/5 opacity-40 text-neutral-400 select-none">
                  <Phone className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-bold">No Call</span>
                </div>
              )}

              <button
                onClick={shareOnWhatsApp}
                className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 text-white"
              >
                <MessageSquare className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-[10px] font-bold">WhatsApp</span>
              </button>

              <button
                onClick={() => navigate(`/customer-payments/new?customer=${customer.id}`)}
                className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 text-white"
              >
                <CreditCard className="w-4.5 h-4.5 text-violet-400" />
                <span className="text-[10px] font-bold">Receive Pay</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Compact PWA KPI Grid (Primary - Shown second) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-3.5 bg-neutral-50/50 border-neutral-200/60 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Opening Bal</span>
            <span className="text-[15px] font-bold text-neutral-800 tabular-nums mt-1.5 block">{formatCurrency(openingBal)}</span>
            <span className="text-[9px] text-neutral-400 font-bold mt-1 block uppercase">{openingType || 'N/A'}</span>
          </div>
          
          <div className="card p-3.5 bg-blue-50/30 border-blue-100/50 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Total Billed</span>
            <span className="text-[15px] font-bold text-blue-700 tabular-nums mt-1.5 block">{formatCurrency(totalInvoiced)}</span>
            <span className="text-[9px] text-blue-400 block mt-1">{invoices.length} Invoices</span>
          </div>

          <div className="card p-3.5 bg-emerald-50/30 border-emerald-100/50 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Total Received</span>
            <span className="text-[15px] font-bold text-emerald-700 tabular-nums mt-1.5 block">{formatCurrency(totalReceived)}</span>
            <span className="text-[9px] text-emerald-400 block mt-1">{payments.filter((p: any) => p.status === 'confirmed').length} Paid</span>
          </div>

          <div className={`card p-3.5 flex flex-col justify-between relative overflow-hidden shadow-sm ${
            outstanding > 0 ? 'bg-red-50/30 border-red-100/50' : 'bg-emerald-50/30 border-emerald-100/50'
          }`}>
            <button onClick={handleDownloadStatement} className="absolute top-3.5 right-3.5 p-1 rounded bg-white hover:bg-neutral-50 shadow-sm border border-neutral-200 transition-colors">
              <Download className="w-3 h-3 text-neutral-500" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: outstanding > 0 ? '#dc2626' : '#16a34a' }}>Outstanding</span>
            <span className="text-[15px] font-bold tabular-nums mt-1.5 block" style={{ color: outstanding > 0 ? '#dc2626' : '#16a34a' }}>{formatCurrency(Math.abs(outstanding))}</span>
            <span className="text-[9px] font-bold uppercase mt-1 block tracking-wider" style={{ color: outstanding > 0 ? '#fca5a5' : '#86efac' }}>
              {outstanding > 0 ? 'Owes' : outstanding < 0 ? 'Advance' : 'Settled'}
            </span>
          </div>
        </div>

        {/* 3. Transaction History Section (Primary - Shown third) */}
        <div className="card rounded-2xl">
          <div className="p-4 border-b border-neutral-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5 text-neutral-500" /> Transaction History
              </h2>
              <Select options={MONTHS} value={monthFilter} onChange={(v) => setMonthFilter(String(v))} placeholder="All Time" className="w-24 text-[10px] h-7" />
            </div>
            
            <div className="flex bg-neutral-100 rounded-xl p-0.5 justify-around w-full">
              {(['all', 'invoices', 'payments'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxnFilter(t)}
                  className={'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ' + (txnFilter === t ? 'bg-white text-neutral-800 shadow-sm' : 'text-neutral-500 hover:text-neutral-700')}
                >
                  {t === 'all' ? 'All' : t === 'invoices' ? 'Invoices' : 'Payments'}
                </button>
              ))}
            </div>
          </div>

          {filteredTxns.length === 0 ? (
            <div className="p-10 text-center text-neutral-400 text-xs">
              <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p>No transactions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {filteredTxns.map((txn: any) => {
                const isInvoice = txn.type === 'invoice';
                const isPayment = txn.type === 'payment';
                return (
                  <div
                    key={txn.type + '-' + txn.id}
                    onClick={() => isInvoice ? navigate('/invoices/' + txn.id) : null}
                    className="p-4 space-y-2.5 active:bg-neutral-50"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={'w-7 h-7 rounded-lg flex items-center justify-center border ' + (isInvoice ? 'bg-blue-50 text-blue-500 border-blue-100' : isPayment ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-neutral-50 text-neutral-550 border-neutral-200')}>
                          {isInvoice ? <ArrowUpRight className="w-3.5 h-3.5" /> : isPayment ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-800">{txn.reference_no}</span>
                          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block font-semibold">{txn.type}</span>
                        </div>
                      </div>
                      <StatusBadge status={txn.status} />
                    </div>

                    <div className="flex justify-between items-center text-xs text-neutral-500 font-semibold">
                      <span>{formatDate(txn.date)}</span>
                      <span>{isInvoice ? `${txn.items?.length || 0} items` : isPayment ? (txn.payment_mode?.name || 'Cash') : 'Opening Balance'}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-neutral-50/50">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Amount</span>
                      <span className={`font-bold tabular-nums text-sm ${isInvoice ? 'text-blue-600' : isPayment ? 'text-emerald-600' : 'text-neutral-600'}`}>
                        {isInvoice ? '+' : isPayment ? '-' : (effectiveOpening >= 0 ? '+' : '-')}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Account Details Card (Secondary - Shown last at the bottom) */}
        <div className="card p-4 space-y-3 mt-4">
          <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-neutral-400 block font-semibold">Contact & Mobile</span>
              <span className="font-bold text-neutral-800 block">{customer.mobile || 'N/A'}</span>
              {customer.email && <span className="text-neutral-500 block">{customer.email}</span>}
            </div>
            <div className="space-y-1">
              <span className="text-neutral-400 block font-semibold">GSTIN / Registration</span>
              <span className="font-bold text-neutral-800 block">{customer.gst_number || 'Unregistered / N/A'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-neutral-400 block font-semibold">Billing Address</span>
              <span className="font-bold text-neutral-800 block leading-normal">{customer.addresses?.[0]?.address || 'No billing address registered'}</span>
              {customer.addresses?.[0]?.city && <span className="text-neutral-500 block mt-0.5">{customer.addresses[0].city}, {customer.addresses[0].state} - {customer.addresses[0].pincode}</span>}
            </div>
          </div>
        </div>

      </div>

      {/* Edit Customer Modal */}
      <MasterFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit Customer"
        fields={customerFields}
        initialData={editDefaultValues}
        onSave={handleSave}
      />

    </div>
  );
}
