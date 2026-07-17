import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, Save, Send, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select } from '@/components/ui/Select';
import { purchasesApi, productsApi, suppliersApi, storesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { formatCurrency } from '@/utils/format';
import type { Product, Supplier, GstRate } from '@/types';

// ─── Schema ───
const itemSchema = z.object({
  product_id: z.number().min(1, 'Product is required'),
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
  items: z.array(itemSchema).min(1, 'At least 1 item required'),
});

type FormData = z.infer<typeof formSchema>;

// ─── Component ───
export function PurchaseNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeStoreId } = useAuth();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_id: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      supplier_invoice_number: '',
      remarks: '',
      items: [],
    },
  });

  // Items state managed separately for real-time calculations
  const [items, setItems] = useState<FormData['items']>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Fetch data
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => { const { data } = await suppliersApi.list(); return data.data || []; },
  });
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => { const { data } = await productsApi.list({ per_page: 500 }); return data.data?.data || data.data || []; },
  });

  const suppliers: Supplier[] = Array.isArray(suppliersData) ? suppliersData : [];
  const products: Product[] = Array.isArray(productsData) ? productsData : [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => purchasesApi.create(payload),
    onSuccess: (res: any) => {
      toast.success('Purchase created successfully!');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      navigate(`/purchases/${res.data.data.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create purchase');
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
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // When product changes, auto-fill GST rate
    if (field === 'product_id') {
      const product = products.find(p => p.id === Number(value));
      if (product?.gstRate) {
        item.gst_rate = Number(product.gstRate.rate) || 0;
      }
    }

    // Recalculate
    updated[index] = recalcItem(item);
    setItems(updated);
    setValue('items', updated);
  };

  // ─── Submit ───
  const onSubmit = async (data: FormData) => {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    const payload = {
      store_id: activeStoreId,
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
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        purchase_price: item.purchase_price,
        selling_price: item.selling_price || 0,
        discount_amount: item.discount_amount,
        taxable_amount: item.taxable_amount,
        gst_rate: item.gst_rate,
        tax_amount: item.tax_amount,
        line_total: item.line_total,
      })),
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-5xl">
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Card */}
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Supplier */}
            <Select
              label="Supplier *"
              options={suppliers.map(s => ({ value: s.id, label: s.name, sub: s.mobile || '' }))}
              value={watch('supplier_id') || ''}
              onChange={(val) => {
                const id = Number(val);
                setValue('supplier_id', id);
                setSelectedSupplier(suppliers.find(s => s.id === id) || null);
              }}
              placeholder="Select supplier..."
              error={errors.supplier_id?.message}
            />

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Purchase Date *</label>
              <input type="date" className="input-field w-full" {...register('purchase_date')} />
              {errors.purchase_date && <p className="text-red-500 text-xs mt-1">{errors.purchase_date.message}</p>}
            </div>

            {/* Supplier Invoice # */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Supplier Invoice #</label>
              <input type="text" className="input-field w-full" placeholder="Optional" {...register('supplier_invoice_number')} />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Remarks</label>
              <input type="text" className="input-field w-full" placeholder="Optional" {...register('remarks')} />
            </div>
          </div>

          {/* Selected supplier info */}
          {selectedSupplier && (
            <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600 space-y-1">
              <p><span className="font-medium">GST:</span> {selectedSupplier.gst_number || 'N/A'}</p>
              {selectedSupplier.addresses?.[0] && (
                <p><span className="font-medium">Address:</span> {selectedSupplier.addresses[0].address}, {selectedSupplier.addresses[0].city} {selectedSupplier.addresses[0].state} - {selectedSupplier.addresses[0].pincode}</p>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Items</h2>
            <button type="button" onClick={addItem} className="btn btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p>No items added yet. Click "Add Item" to start.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-neutral-500">
                    <th className="pb-2 font-medium w-8">#</th>
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium text-right w-20">Qty</th>
                    <th className="pb-2 font-medium text-right w-28">Purch. Price</th>
                    <th className="pb-2 font-medium text-right w-28">Selling Price</th>
                    <th className="pb-2 font-medium text-right w-20">Disc.</th>
                    <th className="pb-2 font-medium text-right w-20">GST%</th>
                    <th className="pb-2 font-medium text-right w-24">Tax Amt</th>
                    <th className="pb-2 font-medium text-right w-28">Line Total</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const product = products.find(p => p.id === Number(item.product_id));
                    return (
                      <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-2 text-neutral-400">{idx + 1}</td>
                        <td className="py-2">
                          <Select
                            compact
                            options={products.map(p => ({ value: p.id, label: p.name, sub: p.sku || '' }))}
                            value={item.product_id || ''}
                            onChange={(val) => updateItem(idx, 'product_id', Number(val))}
                            placeholder="Select..."
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm py-1"
                            min="0.001" step="0.001"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm py-1"
                            min="0" step="0.01"
                            value={item.purchase_price || ''}
                            onChange={(e) => updateItem(idx, 'purchase_price', Number(e.target.value))}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm py-1"
                            min="0" step="0.01"
                            value={item.selling_price || ''}
                            onChange={(e) => updateItem(idx, 'selling_price', Number(e.target.value))}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm py-1"
                            min="0" step="0.01"
                            value={item.discount_amount || ''}
                            onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            className="input-field w-full text-right text-sm py-1"
                            min="0" step="0.01"
                            value={item.gst_rate || ''}
                            onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))}
                          />
                        </td>
                        <td className="py-2 text-right font-mono text-neutral-600">
                          {formatCurrency(item.tax_amount)}
                        </td>
                        <td className="py-2 text-right font-semibold font-mono">
                          {formatCurrency(item.line_total)}
                        </td>
                        <td className="py-2">
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
                  <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Total Discount</span>
                  <span className="font-mono text-red-600">-{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Taxable Amount</span>
                  <span className="font-mono">{formatCurrency(totals.taxable)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Tax Amount</span>
                  <span className="font-mono">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 text-neutral-900">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(totals.total)}</span>
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
    </div>
  );
}
