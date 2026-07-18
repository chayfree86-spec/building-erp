import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { transfersApi, productsApi, stockApi, storesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { getLocalDateString } from '@/utils/format';
import { handleFormKeyDown } from '@/utils/formNavigation';
import type { Product } from '@/types';

const itemSchema = z.object({
  product_id: z.number().min(1, 'Product is required'),
  batch_id: z.number().min(1, 'Batch is required'),
  quantity: z.number().min(0.001, 'Min 0.001'),
});

const formSchema = z.object({
  source_store_id: z.number().min(1, 'Source store is required'),
  destination_store_id: z.number().min(1, 'Destination store is required'),
  transfer_date: z.string().min(1, 'Date is required'),
  remarks: z.string().optional(),
});
// Items live in local state and are validated in onSubmit via `validItems`.
// They must NOT be in the form schema: they're never synced to RHF, so a
// schema `items.min(1)` would always fail and silently block the save.

type FormData = z.infer<typeof formSchema>;

interface BatchInfo {
  id: number; batch_number?: string; product_id: number; available_quantity: number;
}

export function StockTransferNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeStoreId, stores } = useAuth();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      source_store_id: activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 0),
      destination_store_id: 0,
      transfer_date: getLocalDateString(),
      remarks: '',
    },
  });

  const [items, setItems] = useState<z.infer<typeof itemSchema>[]>([]);
  const [batchMap, setBatchMap] = useState<Record<number, BatchInfo[]>>({});
  const [loadingBatches, setLoadingBatches] = useState<Record<number, boolean>>({});

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await productsApi.list({ per_page: 500 });
      const d = (res as any)?.data;
      return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const products: Product[] = Array.isArray(productsData) ? productsData : [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => transfersApi.create(payload),
    onSuccess: () => {
      toast.success('Stock transfer created!');
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      navigate('/stock-transfers');
    },
    onError: (err: any) => {
      const e = err?.response?.data?.errors;
      toast.error(e ? String(Object.values(e)[0]) : err?.response?.data?.message || 'Failed');
    },
  });

  const loadBatches = async (productId: number, itemIndex: number) => {
    if (!productId) return;
    setLoadingBatches(prev => ({ ...prev, [itemIndex]: true }));
    try {
      const res = await stockApi.productStock(productId, {});
      const data = (res as any)?.data?.data;
      setBatchMap(prev => ({ ...prev, [itemIndex]: data?.batches || [] }));
      const newItems = [...items];
      newItems[itemIndex] = { ...newItems[itemIndex], batch_id: 0, product_id: productId };
      setItems(newItems);
    } catch { toast.error('Failed to load batches'); }
    finally { setLoadingBatches(prev => ({ ...prev, [itemIndex]: false })); }
  };

  const addItem = () => setItems([...items, { product_id: 0, batch_id: 0, quantity: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, u: Partial<typeof items[0]>) => {
    const n = [...items]; n[i] = { ...n[i], ...u }; setItems(n);
  };

  const onSubmit = async (data: FormData) => {
    const validItems = items.filter(i => i.product_id > 0 && i.batch_id > 0);
    if (validItems.length === 0) { toast.error('Select product and batch for each item'); return; }
    createMutation.mutate({
      source_store_id: data.source_store_id,
      destination_store_id: data.destination_store_id,
      transfer_date: data.transfer_date,
      remarks: data.remarks || undefined,
      items: validItems.map(item => ({
        product_id: item.product_id, batch_id: item.batch_id,
        quantity: Number(item.quantity) || 0,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/stock-transfers')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-neutral-900">New Stock Transfer</h1><p className="text-sm text-neutral-500">Move stock between stores</p></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><ArrowRightLeft className="w-4 h-4 text-blue-600" /></div>
            <h2 className="text-base font-semibold text-neutral-900">Transfer Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Source Store <span className="text-red-500">*</span></label>
              <SearchableSelect options={stores.map(s => ({ value: s.id, label: s.name }))} value={watch('source_store_id') || ''} onChange={v => setValue('source_store_id', Number(v))} placeholder="Source" />
              {errors.source_store_id && <p className="text-red-500 text-xs mt-1">{errors.source_store_id.message}</p>}
            </div>
            <div>
              <label className="label">Destination Store <span className="text-red-500">*</span></label>
              <SearchableSelect options={stores.filter(s => s.id !== watch('source_store_id')).map(s => ({ value: s.id, label: s.name }))} value={watch('destination_store_id') || ''} onChange={v => setValue('destination_store_id', Number(v))} placeholder="Destination" />
              {errors.destination_store_id && <p className="text-red-500 text-xs mt-1">{errors.destination_store_id.message}</p>}
            </div>
            <div>
              <label className="label">Date <span className="text-red-500">*</span></label>
              <DatePicker value={watch('transfer_date')} onChange={d => setValue('transfer_date', d)} />
              {errors.transfer_date && <p className="text-red-500 text-xs mt-1">{errors.transfer_date.message}</p>}
            </div>
            <div>
              <label className="label">Remarks</label>
              <input {...register('remarks')} placeholder="Optional notes..." className="input-field" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900">Items</h2>
            <Button type="button" onClick={addItem} icon={Plus} variant="primary" className="text-sm py-1.5 px-3">Add Item</Button>
          </div>
          {items.length === 0 ? <p className="text-sm text-neutral-500 text-center py-8">No items added yet.</p> : (
            <div className="space-y-3">
              {items.map((item, i) => {
                const batches = batchMap[i] || [];
                return (
                  <div key={i} className="p-4 border border-neutral-200 rounded-xl space-y-3">
                    <div className="flex justify-between"><span className="text-sm font-medium text-neutral-700">Item #{i + 1}</span>
                      <button type="button" onClick={() => removeItem(i)} className="p-1 hover:bg-red-50 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="label">Product *</label>
                        <SearchableSelect options={products.map(p => ({ value: p.id, label: p.name, sub: p.sku || '' }))} value={item.product_id || ''} onChange={v => { const pid = Number(v); updateItem(i, { product_id: pid }); loadBatches(pid, i); }} placeholder="Search product..." />
                      </div>
                      <div>
                        <label className="label">Batch *</label>
                        {loadingBatches[i] ? <div className="input-field flex items-center gap-2 text-neutral-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div> :
                          <SearchableSelect options={batches.map(b => ({ value: b.id, label: `Batch #${b.batch_number || b.id} (${b.available_quantity})` }))} value={item.batch_id || ''} onChange={v => updateItem(i, { batch_id: Number(v) })} placeholder="Select batch" />}
                      </div>
                      <div>
                        <label className="label">Quantity *</label>
                        <input type="number" step="0.001" min="0.001" value={item.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} className="input-field" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate('/stock-transfers')}>Cancel</Button>
          <Button type="submit" disabled={items.length === 0 || createMutation.isPending} icon={createMutation.isPending ? Loader2 : undefined} variant="primary">{createMutation.isPending ? 'Creating...' : 'Create Transfer'}</Button>
        </div>
      </form>
    </div>
  );
}
