import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Building2, Calendar, IndianRupee, User, CreditCard, Pencil, Save, X, Plus, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select } from '@/components/ui/Select';
import { salesApi, paymentsApi, productsApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate } from '@/utils/format';

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
      id: i.id, product_id: i.product_id, product: i.product,
      quantity: Number(i.quantity), rate: Number(i.rate),
      discount_amount: Number(i.discount_amount || 0), gst_rate: Number(i.gst_rate || 0),
      taxable_amount: Number(i.taxable_amount || 0), tax_amount: Number(i.tax_amount || 0),
      line_total: Number(i.line_total),
    })));
    setEditMode(true);
  };

  const addItemToEdit = () => {
    setEditedItems(prev => [...prev, { id: 0, product_id: 0, product: null, quantity: 1, rate: 0, discount_amount: 0, gst_rate: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 }]);
  };

  const removeEditItem = (idx: number) => {
    setEditedItems(prev => prev.filter((_, i) => i !== idx));
  };

  const editItem = (idx: number, field: string, val: any) => {
    setEditedItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: field === 'product_id' ? Number(val) : Number(val) || 0 };
      const item = updated[idx];
      const lineGross = item.quantity * item.rate;
      const taxable = lineGross - item.discount_amount;
      const tax = (taxable * item.gst_rate) / 100;
      updated[idx] = { ...item, taxable_amount: Math.round(taxable * 100) / 100, tax_amount: Math.round(tax * 100) / 100, line_total: Math.round((taxable + tax) * 100) / 100 };
      // Auto-add new row after selecting a product in the last row
      if (field === 'product_id' && Number(val) > 0 && idx === prev.length - 1) {
        updated.push({ id: 0, product_id: 0, product: null, quantity: 1, rate: 0, discount_amount: 0, gst_rate: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 });
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
        id: i.id, product_id: i.product_id, quantity: Number(i.quantity) || 0,
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
        payment_date: new Date().toISOString().split('T')[0],
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
    <div className="space-y-6">
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
              {items.map((item: any, idx: number) => (
                <tr key={item.id || idx} className="border-b border-neutral-100">
                  <td className="py-3 px-2 text-neutral-400 align-middle">{idx + 1}</td>
                  <td className="py-3 px-2 font-medium align-middle overflow-visible">
                    {editMode ? (
                      <Select compact options={products.map((p: any) => ({ value: p.id, label: p.name }))} value={item.product_id || ''} onChange={(val) => editItem(idx, 'product_id', Number(val))} placeholder="Select product..." />
                    ) : (item.product?.name || `Product #${item.product_id}`)}
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
              ))}
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

      {/* Quick Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPayModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-neutral-900">Record Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="p-1.5 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-neutral-500 mb-4">Invoice #{invoice.invoice_number} — Balance: <span className="font-semibold text-neutral-800">{formatCurrency(balance)}</span></p>
            <div className="space-y-4">
              <div>
                <label className="label">Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-lg pointer-events-none z-10">₹</span>
                  <input type="number" className="input-field pl-10 text-lg font-semibold tabular-nums" placeholder="0.00" step="0.01" min="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus />
                </div>
              </div>
              <Select label="Payment Mode *" options={modes.map((m: any) => ({ value: m.id, label: m.name }))} value={payMode || ''} onChange={v => setPayMode(Number(v))} placeholder="Select mode..." />
              <div>
                <label className="label">Reference</label>
                <input type="text" className="input-field w-full" placeholder="Cheque #, UPI Ref" value={payRef} onChange={e => setPayRef(e.target.value)} />
              </div>
              <div>
                <label className="label">Remarks</label>
                <input type="text" className="input-field w-full" placeholder="Optional" value={payRemarks} onChange={e => setPayRemarks(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button onClick={() => setShowPayModal(false)} className="btn btn-secondary text-sm">Cancel</button>
              <button onClick={handlePayment} disabled={paySaving || !payAmount || !payMode} className="btn btn-success text-sm flex items-center gap-2">
                {paySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

