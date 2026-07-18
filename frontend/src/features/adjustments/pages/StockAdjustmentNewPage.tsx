import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, ClipboardEdit, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { adjustmentsApi, productsApi, stockApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { handleFormKeyDown } from '@/utils/formNavigation';
import type { Product } from '@/types';

// ─── Schema ───
const itemSchema = z.object({
  product_id: z.number().min(1, 'Product is required'),
  batch_id: z.number().min(1, 'Batch is required'),
  quantity: z.number().min(0.001, 'Min 0.001'),
  remarks: z.string().optional(),
});

const formSchema = z.object({
  adjustment_date: z.string().min(1, 'Date is required'),
  type: z.enum(['addition', 'deduction', 'damage'], { error: 'Type is required' }),
  reason: z.string().min(1, 'Reason is required').max(500, 'Max 500 chars'),
});
// Items live in local state and are validated in onSubmit via `validItems`.
// They must NOT be in the form schema: they're never synced to RHF, so a
// schema `items.min(1)` would always fail and silently block the save.

type FormData = z.infer<typeof formSchema>;

interface BatchInfo {
  id: number;
  batch_number?: string;
  product_id: number;
  available_quantity: number;
  purchase_price?: number;
}

export function StockAdjustmentNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeStoreId, stores } = useAuth();
  const resolvedStoreId = activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 1);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustment_date: new Date().toISOString().split('T')[0],
      type: 'addition',
      reason: '',
    },
  });

  const [items, setItems] = useState<z.infer<typeof itemSchema>[]>([]);
  const [batchMap, setBatchMap] = useState<Record<number, BatchInfo[]>>({});
  const [loadingBatches, setLoadingBatches] = useState<Record<number, boolean>>({});

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await productsApi.list({ per_page: 500 });
      const responseData = (res as any)?.data;
      if (Array.isArray(responseData)) return responseData;
      if (Array.isArray(responseData?.data)) return responseData.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const products: Product[] = Array.isArray(productsData) ? productsData : [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => adjustmentsApi.create(payload),
    onSuccess: (res: any) => {
      toast.success('Stock adjustment created!');
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      navigate('/stock-adjustments');
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        const msg = Array.isArray(firstError) ? firstError[0] : firstError;
        toast.error(String(msg));
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create adjustment');
      }
    },
  });

  const loadBatches = async (productId: number, itemIndex: number) => {
    if (!productId || productId <= 0) return;
    setLoadingBatches(prev => ({ ...prev, [itemIndex]: true }));
    try {
      const res = await stockApi.productStock(productId, {});
      const data = (res as any)?.data?.data;
      const batches: BatchInfo[] = data?.batches || [];
      setBatchMap(prev => ({ ...prev, [itemIndex]: batches }));
      // Reset batch_id for this item
      const newItems = [...items];
      newItems[itemIndex] = { ...newItems[itemIndex], batch_id: 0, product_id: productId };
      setItems(newItems);
    } catch {
      toast.error('Failed to load batches');
    } finally {
      setLoadingBatches(prev => ({ ...prev, [itemIndex]: false }));
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: 0, batch_id: 0, quantity: 1, remarks: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updates: Partial<typeof items[0]>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    const validItems = items.filter(i => i.product_id > 0 && i.batch_id > 0);
    if (validItems.length === 0) { toast.error('Select product and batch for each item'); return; }

    createMutation.mutate({
      store_id: resolvedStoreId,
      adjustment_date: data.adjustment_date,
      type: data.type,
      reason: data.reason,
      items: validItems.map(item => ({
        product_id: item.product_id,
        batch_id: item.batch_id,
        quantity: Number(item.quantity) || 0,
        remarks: item.remarks || undefined,
      })),
    });
  };

  const typeOptions = [
    { value: 'addition', label: 'Addition (+)' },
    { value: 'deduction', label: 'Deduction (-)' },
    { value: 'damage', label: 'Damage' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/stock-adjustments')} className="p-2 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">New Stock Adjustment</h1>
          <p className="text-sm text-neutral-500">Correct inventory quantities</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <ClipboardEdit className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900">Adjustment Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Date <span className="text-red-500">*</span></label>
              <DatePicker value={watch('adjustment_date')} onChange={(d) => setValue('adjustment_date', d)} />
              {errors.adjustment_date && <p className="text-red-500 text-xs mt-1">{errors.adjustment_date.message}</p>}
            </div>
            <div>
              <label className="label">Type <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={typeOptions}
                value={watch('type')}
                onChange={(v) => setValue('type', v as any)}
                placeholder="Select type"
              />
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>
            <div>
              <label className="label">Reason <span className="text-red-500">*</span></label>
              <input {...register('reason')} placeholder="e.g. Physical stock count correction" className="input-field" />
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900">Items</h2>
            <Button type="button" onClick={addItem} icon={Plus} variant="primary" className="text-sm py-1.5 px-3">
              Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">No items added yet. Click "Add Item" to start.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const batches = batchMap[index] || [];
                const batchOptions = batches.map((b: BatchInfo) => ({
                  value: b.id,
                  label: b.batch_number ? `Batch #${b.batch_number} (${b.available_quantity} avail)` : `Batch #${b.id} (${b.available_quantity} avail)`,
                }));
                const productOpts = products.filter(p => {
                  const avail = batches.filter(b => b.product_id === p.id);
                  return true;
                }).map(p => ({ value: p.id, label: `${p.name} (${p.sku || ''})` }));

                return (
                  <div key={index} className="p-4 border border-neutral-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">Item #{index + 1}</span>
                      <button type="button" onClick={() => removeItem(index)} className="p-1 hover:bg-red-50 rounded-lg text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Product <span className="text-red-500">*</span></label>
                        <SearchableSelect
                          options={products.map(p => ({ value: p.id, label: p.name, sub: p.sku || '' }))}
                          value={item.product_id || ''}
                          onChange={(val) => {
                            const pid = Number(val);
                            updateItem(index, { product_id: pid });
                            loadBatches(pid, index);
                          }}
                          placeholder="Search product..."
                        />
                      </div>
                      <div>
                        <label className="label">Batch <span className="text-red-500">*</span></label>
                        {loadingBatches[index] ? (
                          <div className="input-field flex items-center gap-2 text-neutral-400">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading batches...
                          </div>
                        ) : (
                          <SearchableSelect
                            options={batchOptions}
                            value={item.batch_id || ''}
                            onChange={(val) => updateItem(index, { batch_id: Number(val) })}
                            placeholder={item.product_id > 0 ? 'Select batch...' : 'Select product first'}
                          />
                        )}
                      </div>
                      <div>
                        <label className="label">Quantity <span className="text-red-500">*</span></label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                          className="input-field"
                          placeholder="0.001"
                        />
                      </div>
                      <div>
                        <label className="label">Remarks</label>
                        <input
                          type="text"
                          value={item.remarks || ''}
                          onChange={(e) => updateItem(index, { remarks: e.target.value })}
                          className="input-field"
                          placeholder="Optional notes..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate('/stock-adjustments')}>Cancel</Button>
          <Button
            type="submit"
            disabled={items.length === 0 || createMutation.isPending}
            icon={createMutation.isPending ? Loader2 : undefined}
            variant="primary"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Adjustment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
