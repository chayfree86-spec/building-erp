import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Building2, Calendar, IndianRupee, User, CreditCard, Pencil, Save, X, Plus, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select } from '@/components/ui/Select';
import { salesApi, paymentsApi, productsApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate, getLocalDateString } from '@/utils/format';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<number>(0);
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');
  const [paySaving, setPaySaving] = useState(false);

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['invoices', Number(id)],
    queryFn: async () => { const { data } = await salesApi.get(Number(id)); return data.data; },
    enabled: !!id,
  });

  const { data: paymentModes } = useQuery({
    queryKey: ['payment-modes'],
    queryFn: async () => { const { data } = await (await import('@/services/api-endpoints')).paymentModesApi.list(); return data.data || []; },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => { const { data } = await productsApi.list({ per_page: 500 }); const d = (data as any)?.data; return Array.isArray(d) ? d : d?.data || []; },
    staleTime: 5 * 60 * 1000,
  });

  const modes: any[] = Array.isArray(paymentModes) ? paymentModes : [];
  const products: any[] = Array.isArray(productsData) ? productsData : [];

  const updateMutation = useMutation({
    mutationFn: (payload: any) => salesApi.update(Number(id), payload),
    onSuccess: () => { toast.success('Invoice updated!'); setEditMode(false); queryClient.invalidateQueries({ queryKey: ['invoices'] }); queryClient.invalidateQueries({ queryKey: ['stock'] }); },
    onError: (err: any) => { const e = err?.response?.data?.errors; toast.error(e ? String(Object.values(e)[0]) : 'Update failed'); },
  });

  const confirmMutation = useMutation({
    mutationFn: (invoiceId: number) => salesApi.confirm(invoiceId),
    onSuccess: () => {
      toast.success('Invoice confirmed successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to confirm invoice');
    }
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !invoice) return <div className="card p-8 text-center text-red-500">Failed to load invoice details.</div>;

  const items = editMode ? editedItems : (invoice.items || []);
  const customer = invoice.customer;
  const isDraft = invoice.status === 'draft';

  const balance = Number(invoice.total_amount || 0) - Number(invoice.paid_amount || 0);

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-700', confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700', reversed: 'bg-orange-100 text-orange-700',
  };

  const enterEditMode = () => {
    setEditedItems((invoice.items || []).map((i: any) => ({
      id: i.id, product_id: i.product_id, product: i.product, product_name_snapshot: i.product_name_snapshot || i.product?.name || '',
      quantity: Number(i.quantity), rate: Number(i.rate),
      discount_amount: Number(i.discount_amount || 0), gst_rate: Number(i.gst_rate || 0),
      taxable_amount: Number(i.taxable_amount || 0), tax_amount: Number(i.tax_amount || 0),
      line_total: Number(i.line_total),
    })));
    setEditMode(true);
  };

  const addItemToEdit = () => {
    setEditedItems(prev => [...prev, { id: 0, product_id: 0, product: null, product_name_snapshot: '', quantity: 1, rate: 0, discount_amount: 0, gst_rate: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 }]);
  };

  const removeEditItem = (idx: number) => {
    setEditedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const editItem = (idx: number, field: string, val: any) => {
    setEditedItems(prev => {
      const updated = [...prev];
      updated[idx] = { 
        ...updated[idx], 
        [field]: field === 'product_name_snapshot' ? String(val) : (field === 'product_id' ? Number(val) : Number(val) || 0) 
      };
      const item = updated[idx];
      if (field === 'product_id') {
        const prod = products.find(p => p.id === Number(val));
        if (prod) {
          item.product_name_snapshot = prod.name;
          item.gst_rate = Number((prod as any).gst_rate?.rate) || 0;
        }
      }
      const lineGross = item.quantity * item.rate;
      const taxable = lineGross - item.discount_amount;
      const tax = (taxable * item.gst_rate) / 100;
      updated[idx] = { ...item, taxable_amount: Math.round(taxable * 100) / 100, tax_amount: Math.round(tax * 100) / 100, line_total: Math.round((taxable + tax) * 100) / 100 };
      // Auto-add new row after selecting a product in the last row
      if (field === 'product_id' && Number(val) > 0 && idx === prev.length - 1) {
        updated.push({ id: 0, product_id: 0, product: null, product_name_snapshot: '', quantity: 1, rate: 0, discount_amount: 0, gst_rate: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 });
      }
      return updated;
    });
  };

  const calcTotals = () => {
    return editedItems.reduce((acc, i) => ({
      subtotal: acc.subtotal + i.quantity * i.rate,
      discount: acc.discount + i.discount_amount,
      taxable: acc.taxable + i.taxable_amount,
      tax: acc.tax + i.tax_amount,
      total: acc.total + i.line_total,
    }), { subtotal: 0, discount: 0, taxable: 0, tax: 0, total: 0 });
  };

  const saveEdit = () => {
    const t = calcTotals();
    updateMutation.mutate({
      subtotal: Math.round(t.subtotal * 100) / 100,
      item_discount: Math.round(t.discount * 100) / 100,
      taxable_amount: Math.round(t.taxable * 100) / 100,
      igst_amount: Math.round(t.tax * 100) / 100,
      tax_amount: Math.round(t.tax * 100) / 100,
      total_amount: Math.round(t.total * 100) / 100,
      items: editedItems.map(i => ({
        id: i.id, product_id: i.product_id, product_name_snapshot: i.product_name_snapshot || undefined, quantity: Number(i.quantity) || 0,
        rate: Number(i.rate) || 0, discount_amount: Number(i.discount_amount) || 0,
        gst_rate: Number(i.gst_rate) || 0, taxable_amount: Number(i.taxable_amount) || 0,
        tax_amount: Number(i.tax_amount) || 0, line_total: Number(i.line_total) || 0,
      })),
    });
  };

  const handlePayment = async () => {
    const amt = Number(payAmount);
    if (!amt || amt <= 0) { toast.error('Enter valid amount'); return; }
    if (!payMode) { toast.error('Select payment mode'); return; }
    setPaySaving(true);
    try {
      await paymentsApi.customerCreate({
        store_id: invoice.store_id,
        customer_id: invoice.customer_id,
        payment_date: getLocalDateString(),
        payment_mode_id: payMode,
        amount: amt,
        transaction_reference: payRef || undefined,
        remarks: payRemarks || undefined,
        allocations: [{ invoice_id: invoice.id, allocated_amount: amt }],
      });
      toast.success('Payment recorded!');
      setShowPayModal(false);
      setPayAmount(''); setPayMode(0); setPayRef(''); setPayRemarks('');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payment failed');
    } finally { setPaySaving(false); }
  };

  return (
    <>
      {/* Desktop Version (100% Unchanged) */}
      <div className="hidden md:block space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">Invoice #{invoice.invoice_number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] || 'bg-neutral-100'}`}>
                {invoice.status?.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">Created on {formatDate(invoice.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editMode && (
              <>
                {isDraft && (
                  <button onClick={() => confirmMutation.mutate(invoice.id)} disabled={confirmMutation.isPending} className="btn btn-success text-sm flex items-center gap-1.5">
                    {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm
                  </button>
                )}
                <button onClick={enterEditMode} className="btn btn-secondary text-sm"><Pencil className="w-4 h-4" /> Edit</button>
              </>
            )}
            {editMode && (
              <>
                <button onClick={() => setEditMode(false)} className="btn btn-secondary text-sm"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={saveEdit} disabled={updateMutation.isPending} className="btn btn-primary text-sm">
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </>
            )}
            {!isDraft && balance > 0 && (
              <>
                <button onClick={() => { setPayAmount(String(balance)); setShowPayModal(true); }} className="btn btn-ghost border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-sm flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Quick Pay
                </button>
                <button onClick={() => navigate(`/customer-payments/new?customer=${invoice.customer_id}&invoice=${invoice.id}`)} className="btn btn-success text-sm flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Record Payment
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><User className="w-4 h-4" /> Customer</div>
            <p className="font-semibold text-neutral-900">{customer?.name || invoice.customer_name_snapshot || 'N/A'}</p>
            {customer?.mobile && <p className="text-sm text-neutral-500">{customer.mobile}</p>}
            {customer?.gst_number && <p className="text-xs text-neutral-400">GST: {customer.gst_number}</p>}
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Calendar className="w-4 h-4" /> Invoice Date</div>
            <p className="font-semibold text-neutral-900">{formatDate(invoice.invoice_date)}</p>
            <p className="text-xs text-neutral-400">Payment: {invoice.payment_status || 'unpaid'}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><IndianRupee className="w-4 h-4" /> Amount</div>
            <p className="font-semibold text-lg text-neutral-900">{formatCurrency(Number(invoice.total_amount))}</p>
            <p className="text-xs">Paid: <span className="text-emerald-600 font-medium">{formatCurrency(Number(invoice.paid_amount || 0))}</span> | Balance: <span className={balance > 0 ? 'text-red-500 font-medium' : 'text-neutral-400'}>{formatCurrency(Math.max(0, balance))}</span></p>
          </div>
        </div>

        {/* Items Table */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Items ({items.length})</h2>
            {editMode && (
              <button type="button" onClick={addItemToEdit} className="btn btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Item</button>
            )}
          </div>
          <div className="overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="pb-2 px-2">#</th><th className="pb-2 px-2">Product</th><th className="pb-2 text-right px-2">Qty</th>
                  <th className="pb-2 text-right px-2">Rate</th><th className="pb-2 text-right px-2">Disc.</th>
                  <th className="pb-2 text-right px-2">GST%</th><th className="pb-2 text-right px-2">Tax</th><th className="pb-2 text-right px-2">Total</th>
                  {editMode && <th className="pb-2 w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => {
                  const productObj = products.find((p: any) => p.id === Number(item.product_id));
                  const categoryName = productObj?.category?.name?.toLowerCase() || item.product?.category?.name?.toLowerCase() || '';
                  const isService = categoryName && (
                    categoryName.includes('service') ||
                    categoryName.includes('charge') ||
                    categoryName.includes('extra') ||
                    categoryName.includes('other')
                  );

                  return (
                    <tr key={item.id || idx} className="border-b border-neutral-100">
                      <td className="py-3 px-2 text-neutral-400 align-middle">{idx + 1}</td>
                      <td className="py-3 px-2 font-medium align-middle overflow-visible">
                        {editMode ? (
                          <>
                            <Select compact options={products.map((p: any) => ({ value: p.id, label: p.name }))} value={item.product_id || ''} onChange={(val) => editItem(idx, 'product_id', Number(val))} placeholder="Select product..." />
                            {isService && (
                              <input
                                type="text"
                                className="input-field w-full text-xs mt-1.5 !py-1 !px-2"
                                value={item.product_name_snapshot || ''}
                                onChange={(e) => editItem(idx, 'product_name_snapshot', e.target.value)}
                                placeholder="Enter custom description..."
                              />
                            )}
                          </>
                        ) : (item.product_name_snapshot || item.product?.name || `Product #${item.product_id}`)}
                      </td>
                      <td className="py-3 px-2 text-right align-middle">
                        {editMode ? (
                          <input type="number" className="input-field w-20 text-right text-sm !py-1 !px-1.5" min="0.001" step="0.001" value={item.quantity || ''} onChange={e => editItem(idx, 'quantity', e.target.value)} onFocus={(e) => e.target.select()} />
                        ) : (
                          `${Number(item.quantity).toFixed(3)} ${(item.unit?.short_name || item.product?.unit?.short_name || '')}`
                        )}
                      </td>
                      <td className="py-3 px-2 text-right font-mono align-middle">
                        {editMode ? <input type="number" className="input-field w-24 text-right text-sm !py-1 !px-1.5" min="0" step="0.01" value={item.rate || ''} onChange={e => editItem(idx, 'rate', e.target.value)} onFocus={(e) => e.target.select()} /> : formatCurrency(Number(item.rate))}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-red-600 align-middle">
                        {editMode ? <input type="number" className="input-field w-20 text-right text-sm !py-1 !px-1.5" min="0" step="0.01" value={item.discount_amount || ''} onChange={e => editItem(idx, 'discount_amount', e.target.value)} onFocus={(e) => e.target.select()} /> : formatCurrency(Number(item.discount_amount || 0))}
                      </td>
                      <td className="py-3 px-2 text-right align-middle">
                        {editMode ? <input type="number" className="input-field w-16 text-right text-sm !py-1 !px-1.5" min="0" step="0.01" value={item.gst_rate || ''} onChange={e => editItem(idx, 'gst_rate', e.target.value)} onFocus={(e) => e.target.select()} /> : `${Number(item.gst_rate || 0)}%`}
                      </td>
                      <td className="py-3 px-2 text-right font-mono align-middle">{formatCurrency(Number(item.tax_amount || 0))}</td>
                      <td className="py-3 px-2 text-right font-semibold font-mono align-middle">{formatCurrency(Number(item.line_total))}</td>
                      {editMode && (
                        <td className="py-3 align-middle">
                          <button type="button" onClick={() => removeEditItem(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {editMode && (
            <div className="mt-4 border-t pt-4 flex justify-end">
              <div className="w-64 space-y-1.5 text-sm">
                {(() => { const t = calcTotals(); return (<>
                  <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span className="font-mono">{formatCurrency(t.subtotal)}</span></div>
                  <div className="flex justify-between text-neutral-600"><span>Discount</span><span className="font-mono text-red-600">-{formatCurrency(t.discount)}</span></div>
                  <div className="flex justify-between text-neutral-600"><span>Tax</span><span className="font-mono">{formatCurrency(t.tax)}</span></div>
                  <div className="flex justify-between font-bold text-base border-t pt-1.5"><span>Total</span><span className="font-mono">{formatCurrency(t.total)}</span></div>
                </>); })()}
              </div>
            </div>
          )}
          {!editMode && (
            <div className="mt-4 border-t pt-4 flex justify-end">
              <div className="w-64 space-y-1.5 text-sm">
                <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span className="font-mono">{formatCurrency(Number(invoice.subtotal))}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Discount</span><span className="font-mono text-red-600">-{formatCurrency(Number(invoice.item_discount || 0))}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Tax</span><span className="font-mono">{formatCurrency(Number(invoice.tax_amount || 0))}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-1.5"><span>Total</span><span className="font-mono">{formatCurrency(Number(invoice.total_amount))}</span></div>
              </div>
            </div>
          )}
        </div>

        {invoice.remarks && (
          <div className="card p-4"><h3 className="text-sm font-medium text-neutral-500 mb-1">Remarks</h3><p className="text-neutral-700">{invoice.remarks}</p></div>
        )}
      </div>

      {/* Mobile PWA Layout */}
      <div className="md:hidden space-y-4 pb-28">
        {/* Header Navigation */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/invoices')}
              className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl active:scale-95 transition-all border border-neutral-200/50"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xs font-black text-neutral-800 uppercase tracking-wider">
              {editMode ? 'Edit Invoice' : 'Invoice Details'}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {!editMode && (
              <button
                onClick={enterEditMode}
                className="p-2.5 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 shadow-sm rounded-xl active:scale-95 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {editMode && (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="p-2.5 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 shadow-sm rounded-xl active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={saveEdit}
                  disabled={updateMutation.isPending}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl active:scale-95 transition-all shadow-md shadow-indigo-100/50"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Invoice Number & Status Row */}
        <div className="bg-white rounded-[24px] border border-neutral-200/50 p-4 shadow-sm flex justify-between items-start gap-4">
          <div className="min-w-0">
            <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider block">Invoice ID</span>
            <h2 className="text-sm font-black text-neutral-800 tracking-tight break-all mt-0.5">{invoice.invoice_number}</h2>
            <span className="text-[10px] text-neutral-400 font-semibold block mt-1">Created: {formatDate(invoice.created_at)}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${statusColors[invoice.status] || 'bg-neutral-100'}`}>
            {invoice.status}
          </span>
        </div>

        {/* Draft Confirmation Alert (Mobile CTA) */}
        {!editMode && isDraft && (
          <div className="p-1 bg-amber-100/60 border border-amber-200/50 rounded-[24px] shadow-sm">
            <div className="bg-white rounded-[20px] p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800">Draft Invoice</h4>
                  <p className="text-[10px] text-neutral-400 font-medium mt-0.5">This invoice is currently in draft. Confirm it to finalize stock changes.</p>
                </div>
              </div>
              <button
                onClick={() => confirmMutation.mutate(invoice.id)}
                disabled={confirmMutation.isPending}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-md shadow-amber-100 border border-amber-600"
              >
                {confirmMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm Invoice
              </button>
            </div>
          </div>
        )}

        {/* Info Card: Customer & Financials (Double-Bezel) */}
        {!editMode && (
          <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
            <div className="rounded-[20px] bg-white p-4 space-y-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
              <div className="flex items-start gap-2.5 pb-3 border-b border-neutral-100/80">
                <User className="w-4 h-4 text-neutral-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider block">Customer</span>
                  <p className="text-xs font-bold text-neutral-800 truncate mt-0.5">{customer?.name || invoice.customer_name_snapshot || 'N/A'}</p>
                  {customer?.mobile && <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">{customer.mobile}</p>}
                  {customer?.gst_number && <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">GST: {customer.gst_number}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Invoice Date</span>
                  <p className="text-neutral-700 mt-1">{formatDate(invoice.invoice_date)}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 uppercase font-bold">{invoice.payment_status || 'unpaid'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Total Amount</span>
                  <p className="text-base font-black text-neutral-800 mt-0.5 tabular-nums">{formatCurrency(Number(invoice.total_amount))}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Paid: <span className="text-emerald-600 font-bold tabular-nums">{formatCurrency(Number(invoice.paid_amount || 0))}</span>
                  </p>
                </div>
              </div>

              {balance > 0 && (
                <div className="bg-red-50/50 border border-red-100/40 p-2.5 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-red-600 font-bold">Balance Due</span>
                  <span className="text-red-600 font-extrabold tabular-nums">{formatCurrency(balance)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Items List Card (Mobile First - Double Bezel) */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
          <div className="rounded-[20px] bg-white p-4 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-50">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Items ({items.length})</h2>
              {editMode && (
                <button
                  type="button"
                  onClick={addItemToEdit}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              )}
            </div>

            {/* Read Mode Items */}
            {!editMode && (
              <div className="divide-y divide-neutral-100/80">
                {items.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-800">{item.product_name_snapshot || item.product?.name || `Product #${item.product_id}`}</p>
                        <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                          Qty: <span className="text-neutral-700 font-bold tabular-nums">{Number(item.quantity).toFixed(3)} {item.unit?.short_name || item.product?.unit?.short_name || ''}</span>
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-neutral-800 tabular-nums shrink-0">
                        {formatCurrency(Number(item.line_total))}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-400 font-semibold bg-neutral-50/50 p-2 rounded-xl border border-neutral-100/30">
                      <span>Rate: <span className="text-neutral-600 tabular-nums">{formatCurrency(Number(item.rate))}</span></span>
                      {Number(item.discount_amount) > 0 && (
                        <span className="text-red-500 font-bold">Disc: <span className="tabular-nums">-{formatCurrency(Number(item.discount_amount))}</span></span>
                      )}
                      <span>GST: <span className="text-neutral-600 tabular-nums">{item.gst_rate || 0}% ({formatCurrency(Number(item.tax_amount))})</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Mode Items (Mobile Editor) */}
            {editMode && (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {items.map((item: any, idx: number) => {
                  const productObj = products.find((p: any) => p.id === Number(item.product_id));
                  const categoryName = productObj?.category?.name?.toLowerCase() || item.product?.category?.name?.toLowerCase() || '';
                  const isService = categoryName && (
                    categoryName.includes('service') ||
                    categoryName.includes('charge') ||
                    categoryName.includes('extra') ||
                    categoryName.includes('other')
                  );

                  return (
                    <div key={item.id || idx} className="p-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60 space-y-3.5 relative">
                      <button
                        type="button"
                        onClick={() => removeEditItem(idx)}
                        className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-red-500 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Product</label>
                        <Select
                          compact
                          options={products.map((p: any) => ({ value: p.id, label: p.name }))}
                          value={item.product_id || ''}
                          onChange={(val) => editItem(idx, 'product_id', Number(val))}
                          placeholder="Select product..."
                        />
                        {isService && (
                          <input
                            type="text"
                            className="input-field w-full text-xs mt-1.5 !py-1.5 !px-2.5"
                            value={item.product_name_snapshot || ''}
                            onChange={(e) => editItem(idx, 'product_name_snapshot', e.target.value)}
                            placeholder="Enter custom description..."
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Qty</label>
                          <input
                            type="number"
                            className="input-field w-full text-right text-xs py-1.5 px-2 tabular-nums"
                            min="0.001"
                            step="0.001"
                            value={item.quantity || ''}
                            onChange={e => editItem(idx, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Rate</label>
                          <input
                            type="number"
                            className="input-field w-full text-right text-xs py-1.5 px-2 tabular-nums"
                            min="0"
                            step="0.01"
                            value={item.rate || ''}
                            onChange={e => editItem(idx, 'rate', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Disc</label>
                          <input
                            type="number"
                            className="input-field w-full text-right text-xs py-1.5 px-2 tabular-nums"
                            min="0"
                            step="0.01"
                            value={item.discount_amount || ''}
                            onChange={e => editItem(idx, 'discount_amount', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold pt-1">
                        <span>GST: {item.gst_rate || 0}% ({formatCurrency(Number(item.tax_amount))})</span>
                        <span className="text-xs font-bold text-neutral-700">Total: <span className="tabular-nums">{formatCurrency(Number(item.line_total))}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Subtotal & Summary Breakdown */}
            <div className="pt-3.5 border-t border-neutral-100 space-y-2 text-xs font-semibold text-neutral-500">
              {(() => {
                const t = editMode ? calcTotals() : { subtotal: Number(invoice.subtotal), discount: Number(invoice.item_discount), tax: Number(invoice.tax_amount), total: Number(invoice.total_amount) };
                return (
                  <>
                    <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(t.subtotal)}</span></div>
                    {t.discount > 0 && (
                      <div className="flex justify-between text-red-500"><span>Discount</span><span className="tabular-nums">-{formatCurrency(t.discount)}</span></div>
                    )}
                    <div className="flex justify-between"><span>Tax (GST)</span><span className="tabular-nums">{formatCurrency(t.tax)}</span></div>
                    <div className="flex justify-between font-bold text-sm text-neutral-800 pt-2.5 border-t border-dashed mt-1.5">
                      <span>Grand Total</span>
                      <span className="text-indigo-600 font-black tabular-nums">{formatCurrency(t.total)}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Mobile Edit Mode Bottom Save/Cancel CTA */}
            {editMode && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="w-full py-3 rounded-xl text-xs font-bold border border-neutral-200 text-neutral-500 hover:bg-neutral-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updateMutation.isPending}
                  onClick={saveEdit}
                  className="w-full py-3 rounded-xl text-xs font-extrabold bg-indigo-600 text-white active:scale-95 transition-all shadow-md shadow-indigo-100"
                >
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Remarks Section */}
        {invoice.remarks && (
          <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
            <div className="rounded-[20px] bg-white p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] text-xs">
              <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Remarks</h3>
              <p className="text-neutral-750 font-medium">{invoice.remarks}</p>
            </div>
          </div>
        )}

        {/* Sticky Mobile Actions Bar (Quick Pay & Record Payment) */}
        {!editMode && !isDraft && balance > 0 && (
          <div className="fixed bottom-[64px] left-0 right-0 bg-white/95 border-t border-neutral-200/90 backdrop-blur-md p-4 flex gap-3 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-safe">
            <button
              onClick={() => { setPayAmount(String(balance)); setShowPayModal(true); }}
              className="flex-1 py-3.5 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-2xl text-xs font-bold active:scale-95 transition-all"
            >
              Quick Pay
            </button>
            <button
              onClick={() => navigate(`/customer-payments/new?customer=${invoice.customer_id}&invoice=${invoice.id}`)}
              className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-indigo-100 border border-indigo-700"
            >
              Record Payment
            </button>
          </div>
        )}
      </div>

      {/* Quick Payment Modal (Shared) */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPayModal(false)} />
          <div className="relative bg-white rounded-[28px] border border-neutral-200/40 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-neutral-850 uppercase tracking-wider">Record Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="p-1.5 hover:bg-neutral-100 rounded-full"><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <p className="text-xs text-neutral-500 font-medium">Invoice #{invoice.invoice_number} &bull; Bal: <span className="font-extrabold text-neutral-800 tabular-nums">{formatCurrency(balance)}</span></p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Amount *</label>
                <div className="relative rounded-xl bg-neutral-50 border border-neutral-200 p-1 flex items-center">
                  <span className="pl-3 text-lg font-bold text-neutral-400">₹</span>
                  <input type="number" className="w-full bg-transparent border-0 focus:ring-0 text-base font-bold tabular-nums text-neutral-800 py-2 px-2 select-all" placeholder="0.00" step="0.01" min="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus />
                </div>
              </div>
              
              <Select label="Payment Mode *" options={modes.map((m: any) => ({ value: m.id, label: m.name }))} value={payMode || ''} onChange={v => setPayMode(Number(v))} placeholder="Select mode..." />
              
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Reference</label>
                <input type="text" className="input-field w-full text-xs py-2 px-3 rounded-xl" placeholder="Cheque #, UPI Ref" value={payRef} onChange={e => setPayRef(e.target.value)} />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">Remarks</label>
                <input type="text" className="input-field w-full text-xs py-2 px-3 rounded-xl" placeholder="Optional" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} />
              </div>
            </div>
            
            <div className="flex items-center gap-3 justify-end pt-2">
              <button onClick={() => setShowPayModal(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700">Cancel</button>
              <button onClick={handlePayment} disabled={paySaving || !payAmount || !payMode} className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 text-white flex items-center gap-1.5 active:scale-95 transition-all shadow-md border border-emerald-700">
                {paySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
