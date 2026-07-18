import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Building2, Calendar, IndianRupee, Edit2, Save, X, Trash2, Send, Check } from 'lucide-react';
import { purchasesApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate } from '@/utils/format';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ui/Modal';

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<any[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'delete' | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const { data: purchase, isLoading, isError } = useQuery({
    queryKey: ['purchases', Number(id)],
    queryFn: async () => { const { data } = await purchasesApi.get(Number(id)); return data.data; },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => purchasesApi.update(Number(id), payload),
    onSuccess: () => { toast.success('Purchase updated'); queryClient.invalidateQueries({ queryKey: ['purchases'] }); setEditMode(false); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Update failed'),
  });

  const handleStatusUpdate = async (action: 'submit' | 'approve' | 'confirm') => {
    setStatusUpdating(true);
    try {
      if (action === 'submit') {
        await purchasesApi.submit(Number(id));
        toast.success('Purchase submitted successfully');
      } else if (action === 'approve') {
        await purchasesApi.approve(Number(id));
        toast.success('Purchase approved successfully');
      } else if (action === 'confirm') {
        await purchasesApi.confirm(Number(id));
        toast.success('Purchase confirmed. Stock batches created!');
      }
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Status update failed');
    } finally {
      setStatusUpdating(false);
    }
  };

  const triggerConfirm = (action: 'cancel' | 'delete') => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !purchase) return <div className="card p-8 text-center text-red-500">Failed to load purchase details.</div>;

  const items = editMode && editedItems.length > 0 ? editedItems : (purchase.items || []);
  const supplier = purchase.supplier;
  const isDraft = purchase.status === 'draft';
  const canEdit = true;
  const isConfirmedOrLater = ['confirmed', 'partially_paid', 'paid', 'returned', 'cancelled'].includes(purchase.status);

  const statusColors: Record<string, string> = {
    draft: 'bg-neutral-100 text-neutral-700', submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-purple-100 text-purple-700', confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700', paid: 'bg-emerald-100 text-emerald-700',
  };

  const enterEditMode = () => { setEditedItems(JSON.parse(JSON.stringify(purchase.items || []))); setEditMode(true); };
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...editedItems]; const item = { ...updated[idx], [field]: value };
    if (field === 'purchase_price' || field === 'quantity' || field === 'discount_amount' || field === 'gst_rate') {
      const qty = Number(item.quantity)||0, price = Number(item.purchase_price)||0, disc = Number(item.discount_amount)||0, gstPct = Number(item.gst_rate)||0;
      const gross = qty*price, afterDisc = gross-disc, tax = (afterDisc*gstPct)/100;
      item.taxable_amount = Math.round(afterDisc*100)/100; item.tax_amount = Math.round(tax*100)/100; item.line_total = Math.round((afterDisc+tax)*100)/100;
    }
    updated[idx] = item; setEditedItems(updated);
  };
  const calcTot = () => {
    let s=0,d=0,t=0,tot=0; items.forEach((i:any)=>{s+=(Number(i.quantity)||0)*(Number(i.purchase_price)||0);d+=Number(i.discount_amount)||0;t+=Number(i.tax_amount)||0;tot+=Number(i.line_total)||0;});
    return {subtotal:Math.round(s*100)/100,discount:d,tax:t,total:tot};
  };
  const totals = editMode ? calcTot() : {subtotal:Number(purchase.subtotal),discount:Number(purchase.discount_amount||0),tax:Number(purchase.tax_amount||0),total:Number(purchase.total_amount)};
  const handleSave = () => {
    updateMutation.mutate({
      supplier_id: purchase.supplier_id,
      purchase_date: purchase.purchase_date,
      supplier_invoice_number: purchase.supplier_invoice_number,
      additional_cost: Number(purchase.additional_cost) || 0,
      round_off: Number(purchase.round_off) || 0,
      remarks: purchase.remarks,
      subtotal: totals.subtotal,
      discount_amount: totals.discount,
      tax_amount: totals.tax,
      total_amount: totals.total,
      items: editedItems.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: Number(item.quantity) || 0,
        purchase_price: Number(item.purchase_price) || 0,
        selling_price: Number(item.selling_price) || 0,
        discount_amount: Number(item.discount_amount) || 0,
        gst_rate: Number(item.gst_rate) || 0,
        taxable_amount: Number(item.taxable_amount) || 0,
        tax_amount: Number(item.tax_amount) || 0,
        line_total: Number(item.line_total) || 0,
      })),
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP LAYOUT (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/purchases')} className="p-2 hover:bg-neutral-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">Purchase #{purchase.purchase_number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[purchase.status] || 'bg-neutral-100'}`}>
                {purchase.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">Created on {formatDate(purchase.created_at)}</p>
          </div>
          {!editMode && (
            <div className="flex gap-2">
              {canEdit && (
                <button onClick={enterEditMode} className="btn btn-secondary flex items-center gap-2 text-sm"><Edit2 className="w-4 h-4" /> Edit</button>
              )}
              
              <button
                onClick={() => triggerConfirm('delete')}
                disabled={purchase.status !== 'draft'}
                className="btn btn-danger flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
  
              {purchase.status === 'draft' && (
                <button onClick={() => handleStatusUpdate('submit')} disabled={statusUpdating} className="btn btn-primary flex items-center gap-2 text-sm">
                  {statusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
                </button>
              )}
              {purchase.status === 'submitted' && (
                <>
                  <button onClick={() => triggerConfirm('cancel')} className="btn btn-danger flex items-center gap-2 text-sm"><X className="w-4 h-4" /> Cancel</button>
                  <button onClick={() => handleStatusUpdate('approve')} disabled={statusUpdating} className="btn btn-primary flex items-center gap-2 text-sm">
                    {statusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Approve
                  </button>
                </>
              )}
              {purchase.status === 'approved' && (
                <>
                  <button onClick={() => triggerConfirm('cancel')} className="btn btn-danger flex items-center gap-2 text-sm"><X className="w-4 h-4" /> Cancel</button>
                  <button onClick={() => handleStatusUpdate('confirm')} disabled={statusUpdating} className="btn btn-success flex items-center gap-2 text-sm">
                    {statusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm
                  </button>
                </>
              )}
              {purchase.status === 'confirmed' && Number(purchase.paid_amount || 0) === 0 && (
                <button onClick={() => triggerConfirm('cancel')} className="btn btn-danger flex items-center gap-2 text-sm"><X className="w-4 h-4" /> Cancel</button>
              )}
            </div>
          )}
          {editMode && (
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)} className="btn btn-secondary flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
              <button onClick={handleSave} disabled={updateMutation.isPending} className="btn btn-primary flex items-center gap-2">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          )}
        </div>
  
        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2">
              <Building2 className="w-4 h-4" /> Supplier
            </div>
            <p className="font-semibold text-neutral-900">{supplier?.name || 'N/A'}</p>
            {supplier?.mobile && <p className="text-sm text-neutral-500">{supplier.mobile}</p>}
            {supplier?.gst_number && <p className="text-xs text-neutral-400">GST: {supplier.gst_number}</p>}
          </div>
  
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2">
              <Calendar className="w-4 h-4" /> Purchase Date
            </div>
            <p className="font-semibold text-neutral-900">{formatDate(purchase.purchase_date)}</p>
            {purchase.supplier_invoice_number && (
              <p className="text-sm text-neutral-500">Ref: {purchase.supplier_invoice_number}</p>
            )}
          </div>
  
          <div className="card p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2">
              <IndianRupee className="w-4 h-4" /> Amount
            </div>
            <p className="font-semibold text-lg text-neutral-900">{formatCurrency(Number(purchase.total_amount))}</p>
            <p className="text-xs text-neutral-400">Paid: {formatCurrency(Number(purchase.paid_amount || 0))}</p>
          </div>
        </div>
  
        {/* Items Table */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Items ({items.length})</h2>
          <div className="overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-neutral-500">
                  <th className="pb-2 font-medium px-2">#</th>
                  <th className="pb-2 font-medium px-2">Product</th>
                  <th className="pb-2 font-medium text-right px-2">Qty</th>
                  <th className="pb-2 font-medium text-right px-2">Purch. Price</th>
                  <th className="pb-2 font-medium text-right px-2">Sell Price</th>
                  <th className="pb-2 font-medium text-right px-2">Disc.</th>
                  <th className="pb-2 font-medium text-right px-2">GST%</th>
                  <th className="pb-2 font-medium text-right px-2">Tax</th>
                  <th className="pb-2 font-medium text-right px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={item.id || idx} className="border-b border-neutral-100">
                    <td className="py-3 px-2 text-neutral-400 align-middle">{idx + 1}</td>
                    <td className="py-3 px-2 font-medium align-middle">{item.product?.name || `Product #${item.product_id}`}</td>
                    <td className="py-3 px-2 text-right align-middle">
                      {editMode ? (
                        <input type="number" className="input-field w-20 text-right text-sm !py-1 !px-1.5" min="0.001" step="0.001" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={isConfirmedOrLater} />
                      ) : (
                        `${Number(item.quantity).toFixed(3)} ${(item.unit?.short_name || item.product?.unit?.short_name || '')}`
                      )}
                    </td>
                    <td className="py-3 px-2 text-right font-mono align-middle">
                      {editMode ? <input type="number" className="input-field w-24 text-right text-sm !py-1 !px-1.5" min="0" step="0.01" value={item.purchase_price} onChange={(e) => updateItem(idx, 'purchase_price', Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={isConfirmedOrLater} />
                      : formatCurrency(Number(item.purchase_price))}</td>
                    <td className="py-3 px-2 text-right font-mono align-middle">
                      {editMode ? <input type="number" className="input-field w-24 text-right text-sm !py-1 !px-1.5" min="0" step="0.01" value={item.selling_price || 0} onChange={(e) => updateItem(idx, 'selling_price', Number(e.target.value))} onFocus={(e) => e.target.select()} />
                      : <span className="text-primary-600 font-medium">{formatCurrency(Number(item.selling_price || 0))}</span>}</td>
                    <td className="py-3 px-2 text-right font-mono text-red-600 align-middle">
                      {editMode ? <input type="number" className="input-field w-20 text-right text-sm !py-1 !px-1.5" min="0" step="0.01" value={item.discount_amount || 0} onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))} onFocus={(e) => e.target.select()} />
                      : formatCurrency(Number(item.discount_amount || 0))}</td>
                    <td className="py-3 px-2 text-right align-middle">
                      {editMode ? <input type="number" className="input-field w-16 text-right text-sm !py-1 !px-1.5" min="0" step="0.01" value={item.gst_rate || 0} onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))} onFocus={(e) => e.target.select()} disabled={isConfirmedOrLater} />
                      : `${Number(item.gst_rate || 0)}%`}</td>
                    <td className="py-3 px-2 text-right font-mono align-middle">{formatCurrency(Number(item.tax_amount || 0))}</td>
                    <td className="py-3 px-2 text-right font-semibold font-mono align-middle">{formatCurrency(Number(item.line_total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  
          {/* Totals */}
          <div className="mt-4 border-t pt-4 flex justify-end">
            <div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span><span className="font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Discount</span><span className="font-mono text-red-600">-{formatCurrency(totals.discount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Tax</span><span className="font-mono">{formatCurrency(totals.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-1.5">
                <span>Total</span><span className="font-mono">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
  
        {/* Remarks */}
        {purchase.remarks && (
          <div className="card p-4">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Remarks</h3>
            <p className="text-neutral-700">{purchase.remarks}</p>
          </div>
        )}
      </div>

      {/* ─── PWA MOBILE LAYOUT (Optimized) ─── */}
      <div className="md:hidden space-y-4 pb-20">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/purchases')} className="p-2.5 bg-white text-neutral-600 border border-neutral-200 shadow-sm rounded-xl active:scale-95 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-neutral-800 tracking-tight leading-none truncate">
                Purchase #{purchase.purchase_number}
              </h1>
              <p className="text-[10px] text-neutral-400 font-semibold mt-1">Created: {formatDate(purchase.created_at)}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${statusColors[purchase.status] || 'bg-neutral-100 text-neutral-600'}`}>
            {purchase.status?.replace('_', ' ')}
          </span>
        </div>

        {/* Action Buttons Group Box */}
        {(!editMode || editMode) && (
          <div className="rounded-[20px] p-2 bg-neutral-100/60 border border-neutral-200/50 flex flex-wrap gap-2">
            {!editMode ? (
              <>
                {canEdit && (
                  <button
                    onClick={enterEditMode}
                    className="flex-1 py-2 px-3 bg-white text-neutral-700 border border-neutral-200 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                
                <button
                  onClick={() => triggerConfirm('delete')}
                  disabled={purchase.status !== 'draft'}
                  className="flex-1 py-2 px-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>

                {purchase.status === 'draft' && (
                  <button
                    onClick={() => handleStatusUpdate('submit')}
                    disabled={statusUpdating}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Submit
                  </button>
                )}
                {purchase.status === 'submitted' && (
                  <div className="w-full flex gap-2">
                    <button onClick={() => triggerConfirm('cancel')} className="flex-1 py-2 px-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
                    <button onClick={() => handleStatusUpdate('approve')} disabled={statusUpdating} className="flex-1 py-2 px-3 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                      {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                    </button>
                  </div>
                )}
                {purchase.status === 'approved' && (
                  <div className="w-full flex gap-2">
                    <button onClick={() => triggerConfirm('cancel')} className="flex-1 py-2 px-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> Cancel</button>
                    <button onClick={() => handleStatusUpdate('confirm')} disabled={statusUpdating} className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                      {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Confirm
                    </button>
                  </div>
                )}
                {purchase.status === 'confirmed' && Number(purchase.paid_amount || 0) === 0 && (
                  <button onClick={() => triggerConfirm('cancel')} className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> Cancel Purchase</button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 py-2 px-3 bg-white text-neutral-600 border border-neutral-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 py-2 px-3 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md shadow-indigo-100"
                >
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                </button>
              </>
            )}
          </div>
        )}

        {/* Double-Bezel Card for Supplier & Date */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
          <div className="rounded-[20px] bg-white p-4 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-neutral-50">
              <Building2 className="w-4 h-4 text-neutral-400" />
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Supplier</span>
                <p className="font-bold text-neutral-800 text-xs truncate leading-tight mt-0.5">{supplier?.name || 'N/A'}</p>
                {supplier?.mobile && <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">Mob: {supplier.mobile}</p>}
                {supplier?.gst_number && <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">GST: {supplier.gst_number}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Purchase Details</span>
                <p className="font-bold text-neutral-800 text-xs mt-0.5">Date: {formatDate(purchase.purchase_date)}</p>
                {purchase.supplier_invoice_number && (
                  <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">Ref #: {purchase.supplier_invoice_number}</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Double-Bezel Card for Financials */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
          <div className="rounded-[20px] bg-white p-4 space-y-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-neutral-500" /> Financial Summary
            </h2>

            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="p-2 bg-neutral-50 border border-neutral-100 rounded-xl">
                <span className="text-[8px] uppercase font-extrabold text-neutral-400 block tracking-wider">Total</span>
                <span className="text-[11px] font-black text-red-600 tabular-nums block mt-1">{formatCurrency(totals.total)}</span>
              </div>
              <div className="p-2 bg-neutral-50 border border-neutral-100 rounded-xl">
                <span className="text-[8px] uppercase font-extrabold text-neutral-400 block tracking-wider">Paid</span>
                <span className="text-[11px] font-black text-emerald-600 tabular-nums block mt-1">{formatCurrency(Number(purchase.paid_amount || 0))}</span>
              </div>
              <div className="p-2 bg-neutral-50 border border-neutral-100 rounded-xl">
                <span className="text-[8px] uppercase font-extrabold text-neutral-400 block tracking-wider">Balance</span>
                <span className="text-[11px] font-black text-red-500 tabular-nums block mt-1">{formatCurrency(Math.max(0, totals.total - Number(purchase.paid_amount || 0)))}</span>
              </div>
            </div>

            <div className="space-y-2 text-[11px] font-semibold text-neutral-500 border-t border-neutral-50 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums text-neutral-700">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="tabular-nums text-red-500">-{formatCurrency(totals.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST)</span>
                <span className="tabular-nums text-neutral-700">{formatCurrency(totals.tax)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Double-Bezel Card for Items List */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
          <div className="rounded-[20px] bg-white p-4 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Items ({items.length})</h2>

            <div className="space-y-3">
              {items.map((item: any, idx: number) => (
                <div key={item.id || idx} className="p-3 bg-neutral-50 border border-neutral-200/50 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-neutral-800">
                    <span className="truncate max-w-[80%]">{item.product?.name || `Product #${item.product_id}`}</span>
                    <span className="text-neutral-400 text-[10px]">#{idx + 1}</span>
                  </div>

                  {editMode ? (
                    <div className="space-y-2 pt-1.5 border-t border-neutral-200/30">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Qty</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-xs py-1 px-2 rounded-lg font-semibold tabular-nums"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            disabled={isConfirmedOrLater}
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Purch. Price</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-xs py-1 px-2 rounded-lg font-semibold tabular-nums"
                            value={item.purchase_price}
                            onChange={(e) => updateItem(idx, 'purchase_price', Number(e.target.value))}
                            disabled={isConfirmedOrLater}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Selling Price</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-xs py-1 px-2 rounded-lg font-semibold tabular-nums"
                            value={item.selling_price || 0}
                            onChange={(e) => updateItem(idx, 'selling_price', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">Discount</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-xs py-1 px-2 rounded-lg font-semibold tabular-nums"
                            value={item.discount_amount || 0}
                            onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider block mb-0.5">GST%</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-xs py-1 px-2 rounded-lg font-semibold tabular-nums"
                            value={item.gst_rate || 0}
                            onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))}
                            disabled={isConfirmedOrLater}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-between text-[11px] text-neutral-500 gap-x-3 gap-y-1.5 pt-1.5 border-t border-neutral-200/30">
                      <span>Qty: <span className="font-bold text-neutral-700 tabular-nums">{Number(item.quantity).toFixed(3)} {item.unit?.short_name || item.product?.unit?.short_name || ''}</span></span>
                      <span>Rate: <span className="font-bold text-neutral-700 tabular-nums">{formatCurrency(Number(item.purchase_price))}</span></span>
                      <span>GST: <span className="font-bold text-neutral-700 tabular-nums">{Number(item.gst_rate || 0)}%</span></span>
                      <span>Disc: <span className="font-bold text-red-500 tabular-nums">-{formatCurrency(Number(item.discount_amount || 0))}</span></span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-neutral-200/50 text-[11px] font-bold">
                    <span className="text-neutral-400 font-semibold">Tax: <span className="tabular-nums text-neutral-600">{formatCurrency(Number(item.tax_amount || 0))}</span></span>
                    <span className="text-neutral-800">Line Total: <span className="tabular-nums text-indigo-600 text-xs">{formatCurrency(Number(item.line_total))}</span></span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Remarks Card */}
        {purchase.remarks && (
          <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
            <div className="rounded-[20px] bg-white p-4 space-y-2 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Remarks</h3>
              <p className="text-neutral-700 text-xs leading-relaxed font-semibold">{purchase.remarks}</p>
            </div>
          </div>
        )}

      </div>
  
      {confirmAction && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => { setConfirmOpen(false); setConfirmAction(null); }}
          onConfirm={async () => {
            const act = confirmAction;
            setConfirmOpen(false);
            setConfirmAction(null);
            try {
              if (act === 'cancel') {
                await purchasesApi.cancel(Number(id), 'Cancelled by user');
                toast.success('Purchase cancelled successfully');
                queryClient.invalidateQueries({ queryKey: ['purchases'] });
                queryClient.invalidateQueries({ queryKey: ['stock'] });
              } else {
                await purchasesApi.remove(Number(id));
                toast.success('Purchase deleted successfully');
                navigate('/purchases');
              }
            } catch (err: any) {
              toast.error(err?.response?.data?.message || 'Failed to execute action');
            }
          }}
          title={confirmAction === 'cancel' ? 'Cancel Purchase?' : 'Delete Purchase?'}
          message={confirmAction === 'cancel'
            ? 'Are you sure you want to cancel this purchase? This action cannot be undone.'
            : 'Are you sure you want to delete this draft purchase? This will permanently remove the record.'}
          confirmLabel={confirmAction === 'cancel' ? 'Yes, Cancel' : 'Yes, Delete'}
        />
      )}
    </div>
  );
}
