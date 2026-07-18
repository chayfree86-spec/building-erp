import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, Save, Send, Calculator, Truck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { purchasesApi, productsApi, suppliersApi, storesApi, stockApi, categoriesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { formatCurrency, getLocalDateString } from '@/utils/format';
import { handleFormKeyDown } from '@/utils/formNavigation';
import type { Product, Supplier, GstRate, Category } from '@/types';

const itemSchema = z.object({
  product_id: z.number().min(1, 'Product is required'),
  unit_id: z.number().optional().default(0),
  quantity: z.number().min(0.001, 'Min 0.001'),
  purchase_price: z.number().min(0, 'Min 0'),
  selling_price: z.number().min(0).optional().default(0),
  gst_rate: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
  taxable_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  line_total: z.number().min(0).default(0),
});

const formSchema = z.object({
  supplier_id: z.number().min(1, 'Supplier is required'),
  purchase_date: z.string().min(1, 'Date is required'),
  supplier_invoice_number: z.string().optional(),
  remarks: z.string().optional(),
});
// Items are held in local state (for live calc) and validated manually in
// onSubmit via `validItems`. Keeping them OUT of the form schema mirrors the
// invoice form — otherwise the empty trailing row (product_id: 0) fails zod
// validation and handleSubmit silently blocks the save.

type FormData = z.infer<typeof formSchema>;

// ─── Component ───
export function PurchaseNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeStoreId, stores } = useAuth();
  const resolvedStoreId = activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 1);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_id: 0,
      purchase_date: getLocalDateString(),
      supplier_invoice_number: '',
      remarks: '',
    },
  });

  // Items state managed separately for real-time calculations
  const [items, setItems] = useState<z.infer<typeof itemSchema>[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Quick-add supplier modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickMobile, setQuickMobile] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickGst, setQuickGst] = useState('');
  const [quickCategoryId, setQuickCategoryId] = useState<number | null>(null);
  const [quickSaving, setQuickSaving] = useState(false);

  const quickAddSupplier = async () => {
    if (!quickName.trim()) { toast.error('Supplier name is required'); return; }
    setQuickSaving(true);
    try {
      const { data } = await suppliersApi.create({
        name: quickName.trim(),
        category_id: quickCategoryId,
        mobile: quickMobile.trim() || null,
        email: quickEmail.trim() || null,
        gst_number: quickGst.trim() || null,
        opening_balance: 0,
        opening_balance_type: 'credit',
        status: 'active',
      });
      const newSup = data.data || data;
      toast.success('Supplier added!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setValue('supplier_id', newSup.id);
      setSelectedSupplier(newSup);
      setShowQuickAdd(false);
      setQuickName(''); setQuickMobile(''); setQuickEmail(''); setQuickGst(''); setQuickCategoryId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add supplier');
    } finally {
      setQuickSaving(false);
    }
  };

  // Fetch data
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => { const { data } = await suppliersApi.list(); return data.data || []; },
  });
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await productsApi.list({ per_page: 500 });
      const responseData = (res as any)?.data;
      if (Array.isArray(responseData)) return responseData;
      if (Array.isArray(responseData?.data)) return responseData.data;
      if (Array.isArray(responseData?.data?.data)) return responseData.data.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => { const { data } = await categoriesApi.list(); return data.data || []; },
  });

  const suppliers: Supplier[] = Array.isArray(suppliersData) ? suppliersData : [];
  const products: Product[] = Array.isArray(productsData) ? productsData : [];
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];

  const filteredProducts = selectedSupplier?.category_id
    ? products.filter(p => Number(p.category_id) === Number(selectedSupplier.category_id))
    : products;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => purchasesApi.create(payload),
    onSuccess: (res: any) => {
      toast.success('Purchase created successfully!');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      navigate(`/purchases/${res.data.data.id}`);
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        const msg = Array.isArray(firstError) ? firstError[0] : firstError;
        toast.error(String(msg));
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create purchase');
      }
    },
  });

  // ─── Calculations ───
  const recalcItem = useCallback((item: typeof items[0], product?: Product) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.purchase_price) || 0;
    const disc = Number(item.discount_amount) || 0;
    const gstPct = Number(item.gst_rate) || 0;

    const lineGross = qty * price;
    const afterDisc = lineGross - disc;
    const taxable = afterDisc;
    const tax = (taxable * gstPct) / 100;
    const total = taxable + tax;

    return {
      ...item,
      quantity: qty,
      purchase_price: price,
      discount_amount: disc,
      gst_rate: gstPct,
      taxable_amount: Math.round(taxable * 100) / 100,
      tax_amount: Math.round(tax * 100) / 100,
      line_total: Math.round(total * 100) / 100,
    };
  }, []);

  const totals = items.reduce((acc, item) => ({
    subtotal: acc.subtotal + (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
    discount: acc.discount + (Number(item.discount_amount) || 0),
    taxable: acc.taxable + (Number(item.taxable_amount) || 0),
    tax: acc.tax + (Number(item.tax_amount) || 0),
    total: acc.total + (Number(item.line_total) || 0),
  }), { subtotal: 0, discount: 0, taxable: 0, tax: 0, total: 0 });

  // ─── Item Management ───
  const addItem = () => {
    setItems([...items, {
      product_id: 0,
      unit_id: 0,
      quantity: 1,
      purchase_price: 0,
      selling_price: 0,
      gst_rate: 0,
      discount_amount: 0,
      taxable_amount: 0,
      tax_amount: 0,
      line_total: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'product_id') {
        const product = products.find(p => p.id === Number(value));
        const gstRate = (product as any)?.gst_rate;
        if (gstRate?.rate) {
          item.gst_rate = Number(gstRate.rate) || 0;
        }
        if (product) {
          item.unit_id = product.unit_id || 0;
        }
        // Auto-fill selling price from the product's most recent batch (editable).
        const pid = Number(value);
        if (pid) {
          stockApi.productStock(pid).then(({ data }: any) => {
            const batches = data?.data?.batches || [];
            if (batches.length > 0) {
              const latestBatch = batches[batches.length - 1];
              const sellPrice = Number(latestBatch.selling_price) || 0;
              if (sellPrice > 0) {
                setItems(prevItems => {
                  const newItems = [...prevItems];
                  newItems[index] = recalcItem({ ...newItems[index], selling_price: sellPrice });
                  return newItems;
                });
              }
            }
          }).catch(() => {});
        }
      }
      updated[index] = recalcItem(item);
      if (field === 'product_id' && Number(value) > 0 && index === prev.length - 1) {
        updated.push({ product_id: 0, unit_id: 0, quantity: 1, purchase_price: 0, selling_price: 0, gst_rate: 0, discount_amount: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 });
      }
      return updated;
    });
  };

  // ─── Submit ───
  const onSubmit = async (data: FormData) => {
    const validItems = items.filter(i => Number(i.product_id) > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    const payload = {
      store_id: resolvedStoreId,
      supplier_id: data.supplier_id,
      purchase_date: data.purchase_date,
      supplier_invoice_number: data.supplier_invoice_number || undefined,
      remarks: data.remarks || undefined,
      subtotal: Math.round(totals.subtotal * 100) / 100,
      discount_amount: Math.round(totals.discount * 100) / 100,
      tax_amount: Math.round(totals.tax * 100) / 100,
      additional_cost: 0,
      round_off: 0,
      total_amount: Math.round(totals.total * 100) / 100,
      items: validItems.map(item => ({
        product_id: item.product_id,
        unit_id: item.unit_id ? Number(item.unit_id) : null,
        quantity: Number(item.quantity) || 0,
        purchase_price: Number(item.purchase_price) || 0,
        selling_price: Number(item.selling_price) || 0,
        discount_amount: Number(item.discount_amount) || 0,
        taxable_amount: Number(item.taxable_amount) || 0,
        gst_rate: Number(item.gst_rate) || 0,
        tax_amount: Number(item.tax_amount) || 0,
        line_total: Number(item.line_total) || 0,
      })),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/purchases')} className="p-2 hover:bg-neutral-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">New Purchase</h1>
          <p className="text-sm text-neutral-500">Create a new purchase order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-6">
        {/* Header Card */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-orange-600" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 flex-1">Supplier & Purchase Info</h2>
            <button type="button" onClick={() => setShowQuickAdd(true)} className="btn-primary text-xs py-1.5 px-3 gap-1.5">
              <Truck className="w-3.5 h-3.5" /> New Supplier
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <label className="label">Supplier <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={suppliers.map(s => ({ value: s.id, label: s.name, sub: s.mobile || '' }))}
                value={watch('supplier_id') || ''}
                onChange={(val) => {
                  const id = Number(val);
                  setValue('supplier_id', id);
                  setSelectedSupplier(suppliers.find(s => s.id === id) || null);
                }}
                placeholder="Search & select supplier..."
                error={errors.supplier_id?.message}
              />
            </div>

            {/* Date */}
            <div>
              <DatePicker
                label="Purchase Date *"
                value={watch('purchase_date')}
                onChange={(val) => setValue('purchase_date', val)}
                error={errors.purchase_date?.message}
              />
            </div>

            {/* Supplier Invoice # */}
            <div>
              <label className="label">Supplier Invoice #</label>
              <input type="text" className="input-field w-full" placeholder="Supplier's bill number" {...register('supplier_invoice_number')} />
            </div>

            {/* Remarks */}
            <div>
              <label className="label">Remarks</label>
              <input type="text" className="input-field w-full" placeholder="Any notes about this purchase..." {...register('remarks')} />
            </div>
          </div>

          {/* Selected supplier info */}
          {selectedSupplier && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-700 font-bold text-sm">{selectedSupplier.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{selectedSupplier.name}</p>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                    {selectedSupplier.mobile && <span>{selectedSupplier.mobile}</span>}
                    <span>GST: {selectedSupplier.gst_number || 'N/A'}</span>
                    {selectedSupplier.category && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-md font-medium text-[10px]">
                        Category: {selectedSupplier.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Items</h2>
              {selectedSupplier?.category && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  Showing items related to <span className="font-semibold text-orange-600">{selectedSupplier.category.name}</span>
                </p>
              )}
            </div>
            <button type="button" onClick={addItem} className="btn btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p>No items added yet. Click "Add Item" to start.</p>
            </div>
          ) : (
            <div className="overflow-visible">
              <table className="w-full text-sm" style={{ overflow: 'visible' }}>
                <thead>
                  <tr className="border-b text-left text-neutral-500">
                    <th className="pb-2 font-medium w-8 px-2">#</th>
                    <th className="pb-2 font-medium px-2">Product</th>
                    <th className="pb-2 font-medium w-28 px-2">Unit</th>
                    <th className="pb-2 font-medium text-right w-20 px-2">Qty</th>
                    <th className="pb-2 font-medium text-right w-28 px-2">Purch. Price</th>
                    <th className="pb-2 font-medium text-right w-28 px-2">Selling Price</th>
                    <th className="pb-2 font-medium text-right w-20 px-2">Disc.</th>
                    <th className="pb-2 font-medium text-right w-20 px-2">GST%</th>
                    <th className="pb-2 font-medium text-right w-24 px-2">Tax Amt</th>
                    <th className="pb-2 font-medium text-right w-28 px-2">Line Total</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const product = products.find(p => p.id === Number(item.product_id));
                    const category = product ? categories.find(c => Number(c.id) === Number(product.category_id)) : null;
                    const allowedUnits = category?.units || [];
                    const unitOptions = allowedUnits.length > 0
                      ? allowedUnits.map((u: any) => ({ value: u.id, label: u.short_name }))
                      : (product?.unit ? [{ value: product.unit.id, label: product.unit.short_name }] : []);

                    return (
                      <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-2 text-neutral-400 align-middle">{idx + 1}</td>
                        <td className="py-3 px-2 align-middle overflow-visible">
                          <SearchableSelect
                            compact
                            options={filteredProducts.map(p => ({ value: p.id, label: p.name, sub: p.sku || '' }))}
                            value={item.product_id || ''}
                            onChange={(val) => updateItem(idx, 'product_id', Number(val))}
                            placeholder="Select..."
                          />
                        </td>
                        <td className="py-3 px-2 align-middle">
                          <Select
                            compact
                            options={unitOptions}
                            value={item.unit_id || ''}
                            onChange={(val) => updateItem(idx, 'unit_id', Number(val))}
                            disabled={!item.product_id}
                            placeholder="Select..."
                          />
                        </td>
                        <td className="py-3 px-2 align-middle">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm !py-1.5 !px-2"
                            min="0.001" step="0.001"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="py-3 px-2 align-middle">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm !py-1.5 !px-2"
                            min="0" step="0.01"
                            value={item.purchase_price || ''}
                            onChange={(e) => updateItem(idx, 'purchase_price', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="py-3 px-2 align-middle">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm !py-1.5 !px-2"
                            min="0" step="0.01"
                            value={item.selling_price || ''}
                            onChange={(e) => updateItem(idx, 'selling_price', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="py-3 px-2 align-middle">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm !py-1.5 !px-2"
                            min="0" step="0.01"
                            value={item.discount_amount || ''}
                            onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="py-3 px-2 align-middle">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm !py-1.5 !px-2"
                            min="0" step="0.01"
                            value={item.gst_rate || ''}
                            onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="py-3 px-2 text-right tabular-nums text-neutral-600 align-middle">
                          {formatCurrency(item.tax_amount)}
                        </td>
                        <td className="py-3 px-2 text-right font-semibold tabular-nums align-middle">
                          {formatCurrency(item.line_total)}
                        </td>
                        <td className="py-3 align-middle">
                          <button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="mt-6 border-t pt-4 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Total Discount</span>
                  <span className="tabular-nums text-red-600 font-medium">-{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Taxable Amount</span>
                  <span className="tabular-nums font-medium">{formatCurrency(totals.taxable)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Tax Amount</span>
                  <span className="tabular-nums font-medium">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 text-neutral-900">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate('/purchases')} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || items.length === 0 || createMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>
        </div>
      </form>

      {/* Quick Add Supplier Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowQuickAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-[fadeIn_150ms_ease]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-neutral-900">Add New Supplier</h3>
              <button onClick={() => setShowQuickAdd(false)} className="p-1.5 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Name <span className="text-red-500">*</span></label>
                <input type="text" className="input-field w-full" placeholder="Supplier name" value={quickName} onChange={e => setQuickName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && quickAddSupplier()} />
              </div>
              <div>
                <label className="label">Category</label>
                <SearchableSelect
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                  value={quickCategoryId || ''}
                  onChange={(val) => setQuickCategoryId(val ? Number(val) : null)}
                  placeholder="Select category..."
                />
              </div>
              <div>
                <label className="label">Mobile</label>
                <input type="text" className="input-field w-full" placeholder="Mobile number" value={quickMobile} onChange={e => setQuickMobile(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input-field w-full" placeholder="Email address" value={quickEmail} onChange={e => setQuickEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">GST Number</label>
                <input type="text" className="input-field w-full" placeholder="GSTIN" value={quickGst} onChange={e => setQuickGst(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end mt-6">
              <button type="button" onClick={() => setShowQuickAdd(false)} className="btn btn-secondary text-sm">Cancel</button>
              <button type="button" onClick={quickAddSupplier} disabled={quickSaving || !quickName.trim()} className="btn btn-primary text-sm flex items-center gap-2">
                {quickSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
