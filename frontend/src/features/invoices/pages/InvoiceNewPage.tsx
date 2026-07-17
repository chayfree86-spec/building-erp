import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select } from '@/components/ui/Select';
import { salesApi, productsApi, customersApi, stockApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { formatCurrency } from '@/utils/format';
import type { Product, Customer } from '@/types';

// ─── Schema ───
const itemSchema = z.object({
  product_id: z.number().min(1, 'Required'),
  quantity: z.number().min(0.001, 'Min 0.001'),
  rate: z.number().min(0, 'Min 0'),
  gst_rate: z.number().min(0).default(0),
  discount_amount: z.number().min(0).default(0),
  taxable_amount: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  line_total: z.number().min(0).default(0),
});

const formSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  invoice_date: z.string().min(1, 'Date is required'),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function InvoiceNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeStoreId } = useAuth();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: 0,
      invoice_date: new Date().toISOString().split('T')[0],
      remarks: '',
    },
  });

  const [items, setItems] = useState<z.infer<typeof itemSchema>[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => { const { data } = await customersApi.list(); return data.data || []; },
  });
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => { const { data } = await productsApi.list({ per_page: 500 }); return data.data?.data || data.data || []; },
  });

  const customers: Customer[] = Array.isArray(customersData) ? customersData : [];
  const products: Product[] = Array.isArray(productsData) ? productsData : [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => salesApi.create(payload),
    onSuccess: (res: any) => {
      toast.success('Invoice created successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/invoices/${res.data.data.id}`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create invoice'),
  });

  const recalcItem = useCallback((item: typeof items[0]) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const disc = Number(item.discount_amount) || 0;
    const gstPct = Number(item.gst_rate) || 0;
    const lineGross = qty * rate;
    const taxable = lineGross - disc;
    const tax = (taxable * gstPct) / 100;
    return {
      ...item, quantity: qty, rate,
      discount_amount: disc, gst_rate: gstPct,
      taxable_amount: Math.round(taxable * 100) / 100,
      tax_amount: Math.round(tax * 100) / 100,
      line_total: Math.round((taxable + tax) * 100) / 100,
    };
  }, []);

  const totals = items.reduce((acc, item) => ({
    subtotal: acc.subtotal + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    discount: acc.discount + (Number(item.discount_amount) || 0),
    taxable: acc.taxable + (Number(item.taxable_amount) || 0),
    tax: acc.tax + (Number(item.tax_amount) || 0),
    total: acc.total + (Number(item.line_total) || 0),
  }), { subtotal: 0, discount: 0, taxable: 0, tax: 0, total: 0 });

  const addItem = () => setItems([...items, { product_id: 0, quantity: 1, rate: 0, gst_rate: 0, discount_amount: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'product_id') {
      const product = products.find(p => p.id === Number(value));
      if (product?.gstRate) item.gst_rate = Number(product.gstRate.rate) || 0;
      // Auto-fill selling price from stock batches
      const pid = Number(value);
      if (pid) {
        stockApi.productStock(pid).then(({ data }: any) => {
          const batches = data?.data?.batches || [];
          if (batches.length > 0) {
            const latestBatch = batches[batches.length - 1];
            const sellPrice = Number(latestBatch.selling_price) || Number(latestBatch.landed_cost) || 0;
            if (sellPrice > 0) {
              const newItems = [...items];
              newItems[index] = recalcItem({ ...newItems[index], rate: sellPrice });
              setItems(newItems);
              return;
            }
          }
        }).catch(() => {});
      }
    }
    updated[index] = recalcItem(item);
    setItems(updated);
  };

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    const customer = customers.find(c => c.id === data.customer_id);

    createMutation.mutate({
      store_id: activeStoreId,
      customer_id: data.customer_id,
      invoice_date: data.invoice_date,
      customer_name_snapshot: customer?.name,
      customer_mobile_snapshot: customer?.mobile,
      customer_gst_snapshot: customer?.gst_number,
      remarks: data.remarks || undefined,
      subtotal: Math.round(totals.subtotal * 100) / 100,
      item_discount: Math.round(totals.discount * 100) / 100,
      overall_discount: 0,
      taxable_amount: Math.round(totals.taxable * 100) / 100,
      cgst_amount: 0, sgst_amount: 0, igst_amount: Math.round(totals.tax * 100) / 100,
      tax_amount: Math.round(totals.tax * 100) / 100,
      round_off: 0,
      total_amount: Math.round(totals.total * 100) / 100,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        rate: item.rate,
        discount_amount: item.discount_amount,
        overall_discount_share: 0,
        taxable_amount: item.taxable_amount,
        gst_rate: item.gst_rate,
        tax_amount: item.tax_amount,
        line_total: item.line_total,
      })),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">New Sales Invoice</h1>
          <p className="text-sm text-neutral-500">Create a new sales invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Customer *"
              options={customers.map(c => ({ value: c.id, label: c.name, sub: c.mobile || '' }))}
              value={watch('customer_id') || ''}
              onChange={(val) => {
                const id = Number(val); setValue('customer_id', id);
                setSelectedCustomer(customers.find(c => c.id === id) || null);
              }}
              placeholder="Select customer..."
              error={errors.customer_id?.message}
            />
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Invoice Date *</label>
              <input type="date" className="input-field w-full" {...register('invoice_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Remarks</label>
              <input type="text" className="input-field w-full" placeholder="Optional" {...register('remarks')} />
            </div>
          </div>
          {selectedCustomer && (
            <div className="mt-4 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
              <p><span className="font-medium">GST:</span> {selectedCustomer.gst_number || 'N/A'}</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">Items</h2>
            <button type="button" onClick={addItem} className="btn btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Item</button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-neutral-400"><p>No items added yet. Click "Add Item" to start.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-neutral-500">
                    <th className="pb-2 w-8">#</th>
                    <th className="pb-2">Product</th>
                    <th className="pb-2 text-right w-20">Qty</th>
                    <th className="pb-2 text-right w-24">Rate</th>
                    <th className="pb-2 text-right w-20">Disc.</th>
                    <th className="pb-2 text-right w-20">GST%</th>
                    <th className="pb-2 text-right w-24">Tax</th>
                    <th className="pb-2 text-right w-28">Total</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-2 text-neutral-400">{idx + 1}</td>
                      <td className="py-2">
                        <Select
                          compact
                          options={products.map(p => ({ value: p.id, label: p.name }))}
                          value={item.product_id || ''}
                          onChange={(val) => updateItem(idx, 'product_id', Number(val))}
                          placeholder="Select..."
                        />
                      </td>
                      <td className="py-2"><input type="number" className="input-field w-full text-right text-sm py-1" min="0.001" step="0.001" value={item.quantity || ''} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} /></td>
                      <td className="py-2"><input type="number" className="input-field w-full text-right text-sm py-1" min="0" step="0.01" value={item.rate || ''} onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))} /></td>
                      <td className="py-2"><input type="number" className="input-field w-full text-right text-sm py-1" min="0" step="0.01" value={item.discount_amount || ''} onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))} /></td>
                      <td className="py-2"><input type="number" className="input-field w-full text-right text-sm py-1" min="0" step="0.01" value={item.gst_rate || ''} onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))} /></td>
                      <td className="py-2 text-right font-mono text-neutral-600">{formatCurrency(item.tax_amount)}</td>
                      <td className="py-2 text-right font-semibold font-mono">{formatCurrency(item.line_total)}</td>
                      <td className="py-2"><button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6 border-t pt-4 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span className="font-mono">{formatCurrency(totals.subtotal)}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Discount</span><span className="font-mono text-red-600">-{formatCurrency(totals.discount)}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Taxable</span><span className="font-mono">{formatCurrency(totals.taxable)}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Tax (IGST)</span><span className="font-mono">{formatCurrency(totals.tax)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="font-mono">{formatCurrency(totals.total)}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate('/invoices')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={items.length === 0 || createMutation.isPending} className="btn btn-primary flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
