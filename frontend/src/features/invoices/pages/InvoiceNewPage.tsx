import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Loader2, Save, UserPlus, X, ShoppingCart, User, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { salesApi, productsApi, customersApi, stockApi, categoriesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { formatCurrency } from '@/utils/format';
import { handleFormKeyDown } from '@/utils/formNavigation';
import type { Product, Customer, Category } from '@/types';

// ─── Schema ───
const itemSchema = z.object({
  product_id: z.number().min(1, 'Required'),
  unit_id: z.number().optional().default(0),
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
  const { activeStoreId, stores } = useAuth();
  const resolvedStoreId = activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 1);

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

  // Quick-add customer modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickMobile, setQuickMobile] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickGst, setQuickGst] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);

  const quickAddCustomer = async () => {
    if (!quickName.trim()) { toast.error('Customer name is required'); return; }
    setQuickSaving(true);
    try {
      const { data } = await customersApi.create({
        name: quickName.trim(),
        mobile: quickMobile.trim() || null,
        email: quickEmail.trim() || null,
        gst_number: quickGst.trim() || null,
        opening_balance: 0,
        opening_balance_type: 'credit',
        credit_limit: 0,
        status: 'active',
      });
      const newCust = data.data || data;
      toast.success('Customer added!');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setValue('customer_id', newCust.id);
      setSelectedCustomer(newCust);
      setShowQuickAdd(false);
      setQuickName(''); setQuickMobile(''); setQuickEmail(''); setQuickGst('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add customer');
    } finally {
      setQuickSaving(false);
    }
  };

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => { const { data } = await customersApi.list(); return data.data || []; },
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
    staleTime: 5 * 60 * 1000, // 5 min — prevent refetch during session
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => { const { data } = await categoriesApi.list(); return data.data || []; },
  });

  const customers: Customer[] = Array.isArray(customersData) ? customersData : [];
  const products: Product[] = Array.isArray(productsData) ? productsData : [];
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => salesApi.create(payload),
    onSuccess: (res: any) => {
      toast.success('Invoice created successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/invoices/${res.data.data.id}`);
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        const msg = Array.isArray(firstError) ? firstError[0] : firstError;
        toast.error(String(msg));
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create invoice');
      }
    },
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

  const addItem = () => setItems([...items, { product_id: 0, unit_id: 0, quantity: 1, rate: 0, gst_rate: 0, discount_amount: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'product_id') {
        const product = products.find(p => p.id === Number(value));
        const gstRate = (product as any)?.gst_rate;
        if (gstRate?.rate) item.gst_rate = Number(gstRate.rate) || 0;
        if (product) {
          item.unit_id = product.unit_id || 0;
        }
        const pid = Number(value);
        if (pid) {
          stockApi.productStock(pid).then(({ data }: any) => {
            const batches = data?.data?.batches || [];
            if (batches.length > 0) {
              const latestBatch = batches[batches.length - 1];
              const sellPrice = Number(latestBatch.selling_price) || Number(latestBatch.landed_cost) || 0;
              if (sellPrice > 0) {
                setItems(prevItems => {
                  const newItems = [...prevItems];
                  newItems[index] = recalcItem({ ...newItems[index], rate: sellPrice });
                  return newItems;
                });
              }
            }
          }).catch(() => {});
        }
      }
      updated[index] = recalcItem(item);
      if (field === 'product_id' && Number(value) > 0 && index === prev.length - 1) {
        updated.push({ product_id: 0, unit_id: 0, quantity: 1, rate: 0, gst_rate: 0, discount_amount: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 });
      }
      return updated;
    });
  };

  const onSubmit = async (data: FormData, autoConfirm = true) => {
    const validItems = items.filter(i => Number(i.product_id) > 0);
    if (validItems.length === 0) { toast.error('Add at least one item'); return; }
    const customer = customers.find(c => c.id === data.customer_id);

    const vTotals = validItems.reduce((acc, item) => ({
      subtotal: acc.subtotal + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
      discount: acc.discount + (Number(item.discount_amount) || 0),
      taxable: acc.taxable + (Number(item.taxable_amount) || 0),
      tax: acc.tax + (Number(item.tax_amount) || 0),
      total: acc.total + (Number(item.line_total) || 0),
    }), { subtotal: 0, discount: 0, taxable: 0, tax: 0, total: 0 });

    createMutation.mutate({
      store_id: resolvedStoreId,
      customer_id: data.customer_id,
      invoice_date: data.invoice_date,
      customer_name_snapshot: customer?.name,
      customer_mobile_snapshot: customer?.mobile,
      customer_gst_snapshot: customer?.gst_number,
      remarks: data.remarks || undefined,
      auto_confirm: autoConfirm,
      subtotal: Math.round(vTotals.subtotal * 100) / 100,
      item_discount: Math.round(vTotals.discount * 100) / 100,
      overall_discount: 0,
      taxable_amount: Math.round(vTotals.taxable * 100) / 100,
      cgst_amount: 0, sgst_amount: 0, igst_amount: Math.round(vTotals.tax * 100) / 100,
      tax_amount: Math.round(vTotals.tax * 100) / 100,
      round_off: 0,
      total_amount: Math.round(vTotals.total * 100) / 100,
      items: validItems.map(item => ({
        product_id: item.product_id,
        unit_id: item.unit_id ? Number(item.unit_id) : null,
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
        discount_amount: Number(item.discount_amount) || 0,
        overall_discount_share: 0,
        taxable_amount: Number(item.taxable_amount) || 0,
        gst_rate: Number(item.gst_rate) || 0,
        tax_amount: Number(item.tax_amount) || 0,
        line_total: Number(item.line_total) || 0,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">New Sales Invoice</h1>
          <p className="text-sm text-neutral-500">Create a new sales invoice</p>
        </div>
      </div>

      <form onKeyDown={handleFormKeyDown} className="space-y-6">
        {/* Customer & Invoice Info Card */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900 flex-1">Customer & Invoice Info</h2>
            <button type="button" onClick={() => setShowQuickAdd(true)} className="btn-primary text-xs py-1.5 px-3 gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> New Customer
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer <span className="text-red-500">*</span></label>
              <SearchableSelect
                options={customers.map(c => ({ value: c.id, label: c.name, sub: c.mobile || '' }))}
                value={watch('customer_id') || ''}
                onChange={(val) => {
                  const id = Number(val); setValue('customer_id', id);
                  setSelectedCustomer(customers.find(c => c.id === id) || null);
                }}
                placeholder="Search & select customer..."
                error={errors.customer_id?.message}
              />
            </div>
            <div>
              <DatePicker
                label="Invoice Date *"
                value={watch('invoice_date')}
                onChange={(val) => setValue('invoice_date', val)}
                error={errors.invoice_date?.message}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Remarks</label>
              <input type="text" className="input-field w-full" placeholder="Any notes about this invoice..." {...register('remarks')} />
            </div>
          </div>
          {selectedCustomer && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">{selectedCustomer.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{selectedCustomer.name}</p>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                    {selectedCustomer.mobile && <span>{selectedCustomer.mobile}</span>}
                    <span>GST: {selectedCustomer.gst_number || 'N/A'}</span>
                  </div>
                </div>
              </div>
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
            <div className="overflow-visible">
              <table className="w-full text-sm" style={{ overflow: 'visible' }}>
                <thead>
                  <tr className="border-b text-left text-neutral-500">
                    <th className="pb-2 w-8 px-2">#</th>
                    <th className="pb-2 px-2">Product</th>
                    <th className="pb-2 font-medium w-28 px-2">Unit</th>
                    <th className="pb-2 text-right w-20 px-2">Qty</th>
                    <th className="pb-2 text-right w-24 px-2">Rate</th>
                    <th className="pb-2 text-right w-20 px-2">Disc.</th>
                    <th className="pb-2 text-right w-20 px-2">GST%</th>
                    <th className="pb-2 text-right w-24 px-2">Tax</th>
                    <th className="pb-2 text-right w-28 px-2">Total</th>
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
                            options={products.map(p => ({ value: p.id, label: p.name }))}
                            value={item.product_id || ''}
                            onChange={(val) => updateItem(idx, 'product_id', Number(val))}
                            placeholder="Select..."
                          />
                        </td>
                        <td className="py-3 px-2 align-middle">
                          <select
                            className="input-field w-full text-sm py-1 px-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                            value={item.unit_id || ''}
                            onChange={(e) => updateItem(idx, 'unit_id', Number(e.target.value))}
                            disabled={!item.product_id}
                          >
                            <option value="">Select...</option>
                            {unitOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-2 align-middle"><input type="number" className="input-field w-full text-right text-sm" min="0.001" step="0.001" value={item.quantity || ''} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} /></td>
                        <td className="py-3 px-2 align-middle"><input type="number" className="input-field w-full text-right text-sm" min="0" step="0.01" value={item.rate || ''} onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))} /></td>
                        <td className="py-3 px-2 align-middle"><input type="number" className="input-field w-full text-right text-sm" min="0" step="0.01" value={item.discount_amount || ''} onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))} /></td>
                        <td className="py-3 px-2 align-middle"><input type="number" className="input-field w-full text-right text-sm" min="0" step="0.01" value={item.gst_rate || ''} onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))} /></td>
                        <td className="py-3 px-2 text-right tabular-nums text-neutral-600 align-middle">{formatCurrency(item.tax_amount)}</td>
                        <td className="py-3 px-2 text-right font-semibold tabular-nums align-middle">{formatCurrency(item.line_total)}</td>
                        <td className="py-3 align-middle"><button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {items.length > 0 && (
            <div className="mt-6 border-t pt-4 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span className="tabular-nums font-medium">{formatCurrency(totals.subtotal)}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Discount</span><span className="tabular-nums text-red-600 font-medium">-{formatCurrency(totals.discount)}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Taxable</span><span className="tabular-nums font-medium">{formatCurrency(totals.taxable)}</span></div>
                <div className="flex justify-between text-neutral-600"><span>Tax (IGST)</span><span className="tabular-nums font-medium">{formatCurrency(totals.tax)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2 text-neutral-900"><span>Total</span><span className="tabular-nums">{formatCurrency(totals.total)}</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate('/invoices')} className="btn btn-secondary">Cancel</button>
          <button type="button" disabled={items.length === 0 || createMutation.isPending} onClick={() => handleSubmit((data) => onSubmit(data, false))()} className="btn btn-ghost border border-neutral-200 flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save as Draft
          </button>
          <button type="button" disabled={items.length === 0 || createMutation.isPending} onClick={() => handleSubmit((data) => onSubmit(data, true))()} className="btn btn-primary flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Confirm
          </button>
        </div>
      </form>

      {/* Quick Add Customer Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowQuickAdd(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-[fadeIn_150ms_ease]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-neutral-900">Add New Customer</h3>
              <button onClick={() => setShowQuickAdd(false)} className="p-1.5 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Name <span className="text-red-500">*</span></label>
                <input type="text" className="input-field w-full" placeholder="Customer name" value={quickName} onChange={e => setQuickName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && quickAddCustomer()} />
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
              <button type="button" onClick={quickAddCustomer} disabled={quickSaving || !quickName.trim()} className="btn btn-primary text-sm flex items-center gap-2">
                {quickSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
