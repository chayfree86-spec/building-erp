import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Building2, Calendar, IndianRupee, Edit2, Save, X } from 'lucide-react';
import { purchasesApi } from '@/services/api-endpoints';
import { formatCurrency, formatDate } from '@/utils/format';
import toast from 'react-hot-toast';

export function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<any[]>([]);

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

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !purchase) return <div className="card p-8 text-center text-red-500">Failed to load purchase details.</div>;

  const items = editMode && editedItems.length > 0 ? editedItems : (purchase.items || []);
  const supplier = purchase.supplier;
  const isDraft = purchase.status === 'draft';
  const canEdit = purchase.status === 'draft' || purchase.status === 'submitted';

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
  const handleSave = () => updateMutation.mutate({subtotal:totals.subtotal,discount_amount:totals.discount,tax_amount:totals.tax,total_amount:totals.total,
    items:editedItems.map((item:any)=>({id:item.id,product_id:item.product_id,quantity:Number(item.quantity)||0,purchase_price:Number(item.purchase_price)||0,selling_price:Number(item.selling_price)||0,discount_amount:Number(item.discount_amount)||0,gst_rate:Number(item.gst_rate)||0,taxable_amount:Number(item.taxable_amount)||0,tax_amount:Number(item.tax_amount)||0,line_total:Number(item.line_total)||0}))});

  return (
    <div className="space-y-6">
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
        {canEdit && !editMode && (
          <button onClick={enterEditMode} className="btn btn-secondary flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit</button>
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
                      <input type="number" className="input-field w-20 text-right text-sm" min="0.001" step="0.001" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
                    ) : (
                      `${Number(item.quantity).toFixed(3)} ${(item.unit?.short_name || item.product?.unit?.short_name || '')}`
                    )}
                  </td>
                  <td className="py-3 px-2 text-right font-mono align-middle">
                    {editMode ? <input type="number" className="input-field w-24 text-right text-sm" min="0" step="0.01" value={item.purchase_price} onChange={(e) => updateItem(idx, 'purchase_price', Number(e.target.value))} />
                    : formatCurrency(Number(item.purchase_price))}</td>
                  <td className="py-3 px-2 text-right font-mono align-middle">
                    {editMode ? <input type="number" className="input-field w-24 text-right text-sm" min="0" step="0.01" value={item.selling_price || 0} onChange={(e) => updateItem(idx, 'selling_price', Number(e.target.value))} />
                    : <span className="text-primary-600 font-medium">{formatCurrency(Number(item.selling_price || 0))}</span>}</td>
                  <td className="py-3 px-2 text-right font-mono text-red-600 align-middle">
                    {editMode ? <input type="number" className="input-field w-20 text-right text-sm" min="0" step="0.01" value={item.discount_amount || 0} onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))} />
                    : formatCurrency(Number(item.discount_amount || 0))}</td>
                  <td className="py-3 px-2 text-right align-middle">
                    {editMode ? <input type="number" className="input-field w-16 text-right text-sm" min="0" step="0.01" value={item.gst_rate || 0} onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))} />
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
  );
}
