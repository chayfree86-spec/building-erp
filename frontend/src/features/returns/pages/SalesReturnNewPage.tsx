import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { returnsApi, salesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { handleFormKeyDown } from '@/utils/formNavigation';
import { getLocalDateString } from '@/utils/format';

const itemSchema = z.object({
  product_id: z.number().min(1), batch_id: z.number().min(0),
  quantity: z.number().min(0.001), rate: z.number().min(0),
  gst_rate: z.number().min(0), taxable_amount: z.number().min(0),
  tax_amount: z.number().min(0), line_total: z.number().min(0),
});

const formSchema = z.object({
  invoice_id: z.number().min(1, 'Invoice is required'),
  customer_id: z.number().min(1),
  return_date: z.string().min(1, 'Date is required'),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function SalesReturnNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeStoreId, stores } = useAuth();
  const resolvedStoreId = activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 1);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { invoice_id: 0, customer_id: 0, return_date: getLocalDateString(), remarks: '' },
  });

  const [items, setItems] = useState<any[]>([]);

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-list'],
    queryFn: async () => { const res = await salesApi.list({ per_page: 200 }); return (res as any)?.data?.data || []; },
  });

  const invoices: any[] = Array.isArray(invoicesData) ? invoicesData : [];

  const loadInvoiceItems = (invoiceId: number) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setValue('customer_id', inv.customer_id);
      const invItems = inv.items || [];
      setItems(invItems.map((si: any) => ({
        invoice_item_id: si.id, product_id: si.product_id, batch_id: si.batch_id || 0,
        quantity: si.quantity || 1, rate: si.rate || 0,
        gst_rate: si.gst_rate || 0, taxable_amount: si.taxable_amount || (si.quantity * si.rate),
        tax_amount: si.tax_amount || 0, line_total: si.line_total || (si.quantity * si.rate),
      })));
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => returnsApi.salesCreate(payload),
    onSuccess: () => { toast.success('Sales return created!'); queryClient.invalidateQueries({ queryKey: ['salesReturns'] }); navigate('/sales-returns'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed'),
  });

  const onSubmit = (data: FormData) => {
    const validItems = items.filter(i => i.product_id > 0);
    if (validItems.length === 0) { toast.error('No items'); return; }
    const subtotal = validItems.reduce((s, i) => s + ((i.quantity || 0) * (i.rate || 0)), 0);
    createMutation.mutate({
      store_id: resolvedStoreId, invoice_id: data.invoice_id, customer_id: data.customer_id,
      return_date: data.return_date, remarks: data.remarks || undefined,
      subtotal, tax_amount: 0, round_off: 0, total_amount: subtotal,
      items: validItems.map(i => ({
        invoice_item_id: (i as any).invoice_item_id, product_id: i.product_id, batch_id: i.batch_id, quantity: i.quantity,
        rate: i.rate, taxable_amount: i.taxable_amount || (i.quantity * i.rate),
        gst_rate: i.gst_rate || 0, tax_amount: i.tax_amount || 0,
        line_total: i.line_total || (i.quantity * i.rate),
      })),
    });
  };

  const updateItem = (i: number, u: any) => {
    const n = [...items]; n[i] = { ...n[i], ...u, line_total: (u.quantity || n[i].quantity) * (u.rate || n[i].rate) }; setItems(n);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/sales-returns')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-neutral-900">New Sales Return</h1><p className="text-sm text-neutral-500">Return goods from customer</p></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5"><div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><RotateCcw className="w-4 h-4 text-orange-600" /></div><h2 className="text-base font-semibold text-neutral-900">Return Details</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Invoice <span className="text-red-500">*</span></label>
              <SearchableSelect options={invoices.map((inv: any) => ({ value: inv.id, label: `#${inv.invoice_number || inv.id} - ${inv.customer?.name || 'Customer'}` }))} value={watch('invoice_id') || ''} onChange={v => { setValue('invoice_id', Number(v)); loadInvoiceItems(Number(v)); }} placeholder="Select invoice..." />
              {errors.invoice_id && <p className="text-red-500 text-xs mt-1">{errors.invoice_id.message}</p>}
            </div>
            <div><label className="label">Date <span className="text-red-500">*</span></label><DatePicker value={watch('return_date')} onChange={d => setValue('return_date', d)} /></div>
            <div><label className="label">Remarks</label><input {...register('remarks')} className="input-field" placeholder="Reason for return..." /></div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="text-base font-semibold text-neutral-900">Items</h2></div>
          {items.length === 0 ? <p className="text-sm text-neutral-500 text-center py-8">Select an invoice to load items.</p> : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="p-3 border border-neutral-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><label className="label">Quantity</label><input type="number" step="0.001" min="0.001" value={item.quantity} onChange={e => updateItem(i, { quantity: Number(e.target.value) })} className="input-field" /></div>
                  <div><label className="label">Rate</label><input type="number" min="0" value={item.rate} onChange={e => updateItem(i, { rate: Number(e.target.value) })} className="input-field" /></div>
                  <div><label className="label">GST %</label><input type="number" min="0" value={item.gst_rate} onChange={e => updateItem(i, { gst_rate: Number(e.target.value) })} className="input-field" /></div>
                  <div><label className="label">Line Total</label><div className="input-field bg-neutral-50">₹{(item.quantity * item.rate).toFixed(2)}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate('/sales-returns')}>Cancel</Button>
          <Button type="submit" disabled={items.length === 0 || createMutation.isPending} icon={createMutation.isPending ? Loader2 : undefined} variant="primary">{createMutation.isPending ? 'Creating...' : 'Create Return'}</Button>
        </div>
      </form>
    </div>
  );
}
