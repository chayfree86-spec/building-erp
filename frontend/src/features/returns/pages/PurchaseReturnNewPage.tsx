import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { returnsApi, purchasesApi, productsApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { handleFormKeyDown } from '@/utils/formNavigation';
import type { Product } from '@/types';

const itemSchema = z.object({
  product_id: z.number().min(1), batch_id: z.number().min(1),
  quantity: z.number().min(0.001), purchase_price: z.number().min(0),
  gst_rate: z.number().min(0), taxable_amount: z.number().min(0),
  tax_amount: z.number().min(0), line_total: z.number().min(0),
});

const formSchema = z.object({
  purchase_id: z.number().min(1, 'Purchase is required'),
  supplier_id: z.number().min(1),
  return_date: z.string().min(1, 'Date is required'),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function PurchaseReturnNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeStoreId, stores } = useAuth();
  const resolvedStoreId = activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 1);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { purchase_id: 0, supplier_id: 0, return_date: new Date().toISOString().split('T')[0], remarks: '' },
  });

  const [items, setItems] = useState<any[]>([]);

  const { data: purchasesData } = useQuery({
    queryKey: ['purchases-list'],
    queryFn: async () => { const res = await purchasesApi.list({ per_page: 200 }); return (res as any)?.data?.data || []; },
  });
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => { const res = await productsApi.list({ per_page: 500 }); const d = (res as any)?.data; return Array.isArray(d) ? d : d?.data || []; },
  });

  const purchases: any[] = Array.isArray(purchasesData) ? purchasesData : [];
  const products: Product[] = Array.isArray(productsData) ? productsData : [];

  const loadPurchaseItems = (purchaseId: number) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (purchase) {
      setValue('supplier_id', purchase.supplier_id);
      const purchaseItems = purchase.items || [];
      setItems(purchaseItems.map((pi: any) => ({
        purchase_item_id: pi.id, product_id: pi.product_id, batch_id: pi.batch_id || 0,
        quantity: pi.quantity || 1, purchase_price: pi.purchase_price || 0,
        gst_rate: pi.gst_rate || 0, taxable_amount: pi.taxable_amount || (pi.quantity * pi.purchase_price),
        tax_amount: pi.tax_amount || 0, line_total: pi.line_total || (pi.quantity * pi.purchase_price),
      })));
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => returnsApi.purchaseCreate(payload),
    onSuccess: () => { toast.success('Purchase return created!'); queryClient.invalidateQueries({ queryKey: ['purchaseReturns'] }); navigate('/purchase-returns'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const onSubmit = (data: FormData) => {
    const validItems = items.filter(i => i.product_id > 0);
    if (validItems.length === 0) { toast.error('No items'); return; }
    const subtotal = validItems.reduce((s, i) => s + ((i.quantity || 0) * (i.purchase_price || 0)), 0);
    createMutation.mutate({
      store_id: resolvedStoreId, purchase_id: data.purchase_id, supplier_id: data.supplier_id,
      return_date: data.return_date, remarks: data.remarks || undefined,
      subtotal, tax_amount: 0, round_off: 0, total_amount: subtotal,
      items: validItems.map(i => ({
        purchase_item_id: (i as any).purchase_item_id, product_id: i.product_id, batch_id: i.batch_id, quantity: i.quantity,
        purchase_price: i.purchase_price, taxable_amount: i.taxable_amount || (i.quantity * i.purchase_price),
        gst_rate: i.gst_rate || 0, tax_amount: i.tax_amount || 0,
        line_total: i.line_total || (i.quantity * i.purchase_price),
      })),
    });
  };

  const updateItem = (i: number, u: any) => {
    const n = [...items]; n[i] = { ...n[i], ...u, line_total: (u.quantity || n[i].quantity) * (u.purchase_price || n[i].purchase_price) }; setItems(n);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/purchase-returns')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-neutral-900">New Purchase Return</h1><p className="text-sm text-neutral-500">Return goods to supplier</p></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5"><div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><RotateCcw className="w-4 h-4 text-red-600" /></div><h2 className="text-base font-semibold text-neutral-900">Return Details</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Purchase <span className="text-red-500">*</span></label>
              <SearchableSelect options={purchases.map((p: any) => ({ value: p.id, label: `#${p.purchase_number || p.id} - ${p.supplier?.name || 'Supplier'}` }))} value={watch('purchase_id') || ''} onChange={v => { setValue('purchase_id', Number(v)); loadPurchaseItems(Number(v)); }} placeholder="Select purchase..." />
              {errors.purchase_id && <p className="text-red-500 text-xs mt-1">{errors.purchase_id.message}</p>}
            </div>
            <div><label className="label">Date <span className="text-red-500">*</span></label><DatePicker value={watch('return_date')} onChange={d => setValue('return_date', d)} /></div>
            <div><label className="label">Remarks</label><input {...register('remarks')} className="input-field" placeholder="Reason for return..." /></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-base font-semibold text-neutral-900">Items</h2></div>
          {items.length === 0 ? <p className="text-sm text-neutral-500 text-center py-8">Select a purchase to load items.</p> : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="p-3 border border-neutral-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><label className="label">Quantity</label><input type="number" step="0.001" min="0.001" value={item.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} className="input-field" /></div>
                  <div><label className="label">Price</label><input type="number" min="0" value={item.purchase_price} onChange={e => updateItem(i, { purchase_price: Number(e.target.value) })} className="input-field" /></div>
                  <div><label className="label">GST %</label><input type="number" min="0" value={item.gst_rate} onChange={e => updateItem(i, { gst_rate: Number(e.target.value) })} className="input-field" /></div>
                  <div><label className="label">Line Total</label><div className="input-field bg-neutral-50">₹{(item.quantity * item.purchase_price).toFixed(2)}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate('/purchase-returns')}>Cancel</Button>
          <Button type="submit" disabled={items.length === 0 || createMutation.isPending} icon={createMutation.isPending ? Loader2 : undefined} variant="primary">{createMutation.isPending ? 'Creating...' : 'Create Return'}</Button>
        </div>
      </form>
    </div>
  );
}
