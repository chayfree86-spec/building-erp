import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Trash2, Loader2, Save, UserPlus, X,
  ShoppingCart, User, FileText, CheckCircle2, Share2, Printer, Download, Phone, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { salesApi, productsApi, customersApi, stockApi, categoriesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { formatCurrency, getLocalDateString, formatDate } from '@/utils/format';
import { handleFormKeyDown } from '@/utils/formNavigation';
import { generateInvoicePdf } from '@/utils/InvoicePdf';
import type { Product, Customer, Category } from '@/types';

// ─── Schema ───
const itemSchema = z.object({
  product_id: z.number().min(1, 'Required'),
  product_name_snapshot: z.string().optional(),
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
  customer_id: z.number().optional().default(0),
  invoice_date: z.string().min(1, 'Date is required'),
  remarks: z.string().optional(),
  guest_name: z.string().optional(),
  guest_mobile: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function InvoiceNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeStoreId, stores } = useAuth();
  const resolvedStoreId = activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 1);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as Resolver<FormData>,
    defaultValues: {
      customer_id: 0,
      invoice_date: getLocalDateString(),
      remarks: '',
      guest_name: '',
      guest_mobile: '',
    },
  });

  const [items, setItems] = useState<z.infer<typeof itemSchema>[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // PWA/Mobile state
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    staleTime: 5 * 60 * 1000,
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
      const inv = res.data.data || res.data;
      setCreatedInvoice(inv);
      setShowSuccessModal(true);
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

  const addItem = () => setItems([...items, { product_id: 0, product_name_snapshot: '', unit_id: 0, quantity: 1, rate: 0, gst_rate: 0, discount_amount: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 }]);
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
          item.product_name_snapshot = product.name;
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
        updated.push({ product_id: 0, product_name_snapshot: '', unit_id: 0, quantity: 1, rate: 0, gst_rate: 0, discount_amount: 0, taxable_amount: 0, tax_amount: 0, line_total: 0 });
      }
      return updated;
    });
  };

  const onSubmit = async (data: FormData, autoConfirm = true) => {
    if (!navigator.onLine) {
      toast.error('Network disconnected. Live API server required to create invoice.');
      return;
    }
    if (!isGuestMode && (!data.customer_id || data.customer_id === 0)) {
      toast.error('Customer is required. Select a customer or check Guest Mode.');
      return;
    }
    const validItems = items.filter(i => Number(i.product_id) > 0);
    if (validItems.length === 0) { toast.error('Add at least one item'); return; }
    const customer = isGuestMode ? null : customers.find(c => c.id === data.customer_id);

    const vTotals = validItems.reduce((acc, item) => ({
      subtotal: acc.subtotal + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
      discount: acc.discount + (Number(item.discount_amount) || 0),
      taxable: acc.taxable + (Number(item.taxable_amount) || 0),
      tax: acc.tax + (Number(item.tax_amount) || 0),
      total: acc.total + (Number(item.line_total) || 0),
    }), { subtotal: 0, discount: 0, taxable: 0, tax: 0, total: 0 });

    createMutation.mutate({
      store_id: resolvedStoreId,
      customer_id: isGuestMode ? undefined : data.customer_id,
      is_guest: isGuestMode,
      guest_name: isGuestMode ? data.guest_name : undefined,
      guest_mobile: isGuestMode ? data.guest_mobile : undefined,
      invoice_date: data.invoice_date,
      customer_name_snapshot: isGuestMode ? (data.guest_name || 'Walk-in Customer') : customer?.name,
      customer_mobile_snapshot: isGuestMode ? (data.guest_mobile || '0000000000') : customer?.mobile,
      customer_gst_snapshot: isGuestMode ? undefined : customer?.gst_number,
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
        product_name_snapshot: item.product_name_snapshot || undefined,
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

  const handleDownloadPdf = () => {
    if (!createdInvoice) return;
    const doc = generateInvoicePdf(createdInvoice);
    doc.save(`Invoice_${createdInvoice.invoice_number || 'draft'}.pdf`);
  };

  const handleSharePdf = async () => {
    if (!createdInvoice) return;
    try {
      const doc = generateInvoicePdf(createdInvoice);
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `Invoice_${createdInvoice.invoice_number}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${createdInvoice.invoice_number}`,
          text: `Invoice statement for ${createdInvoice.customer_name_snapshot}`,
        });
      } else {
        // Fallback to download and text share
        handleDownloadPdf();
        const text = `Invoice PDF generated & downloaded. Customer: ${createdInvoice.customer_name_snapshot}, Total: ${formatCurrency(createdInvoice.total_amount)}`;
        window.open(`https://wa.me/${createdInvoice.customer_mobile_snapshot}?text=${encodeURIComponent(text)}`, '_blank');
        toast('Direct PDF share unsupported. PDF downloaded; please attach manually.', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Error sharing PDF:', err);
    }
  };

  const handlePrint = () => {
    if (!createdInvoice) return;
    const doc = generateInvoicePdf(createdInvoice);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleWhatsAppShare = () => {
    if (!createdInvoice) return;
    const name = createdInvoice.customer_name_snapshot;
    const num = createdInvoice.invoice_number;
    const total = formatCurrency(createdInvoice.total_amount);
    const text = `नमस्ते ${name},\n\nआपका टैक्स इनवॉइस ${num} जनरेट हो गया है।\n\nकुल राशि: ${total}\n\nसॉफ्टवेयर द्वारा साझा किया गया खाता विवरण।\nधन्यवाद।`;
    window.open(`https://wa.me/${createdInvoice.customer_mobile_snapshot}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleResetForm = () => {
    setItems([]);
    setSelectedCustomer(null);
    setIsGuestMode(false);
    setValue('customer_id', 0);
    setValue('guest_name', '');
    setValue('guest_mobile', '');
    setValue('remarks', '');
    setCreatedInvoice(null);
    setShowSuccessModal(false);
  };

  return (
    <div className="space-y-6 pb-28 md:pb-6">
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/invoices')} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight">New Sales Invoice</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Create a new sales invoice</p>
        </div>
      </div>

      <form onKeyDown={handleFormKeyDown} className="space-y-5">
        {/* ─── DESKTOP Customer & Invoice Info Card (Unchanged) ─── */}
        <div className="hidden md:block card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-bold text-neutral-900 text-[15px]">Customer & Invoice Info</h2>
            </div>
            
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600 cursor-pointer bg-neutral-50 border border-neutral-200 px-2.5 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isGuestMode}
                  onChange={(e) => {
                    setIsGuestMode(e.target.checked);
                    if (e.target.checked) {
                      setValue('customer_id', 0);
                      setSelectedCustomer(null);
                    }
                  }}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
                />
                <span>Guest Mode</span>
              </label>

              {!isGuestMode && (
                <button type="button" onClick={() => setShowQuickAdd(true)} className="btn-primary text-xs py-1.5 px-2.5 gap-1 shadow-md">
                  <UserPlus className="w-3.5 h-3.5" /> + New
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isGuestMode ? (
              <>
                <div>
                  <label className="label">Customer Name (Guest)</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="Walk-in Customer"
                    {...register('guest_name')}
                  />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="0000000000"
                    {...register('guest_mobile')}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="label">Customer <span className="text-red-500">*</span></label>
                <SearchableSelect
                  options={customers.map(c => ({
                    value: c.id,
                    label: c.name,
                    sub: [c.mobile, c.outstanding_balance !== undefined ? `Outstanding: ${formatCurrency(c.outstanding_balance)}` : null].filter(Boolean).join(' • ')
                  }))}
                  value={watch('customer_id') || ''}
                  onChange={(val) => {
                    const id = Number(val); setValue('customer_id', id);
                    setSelectedCustomer(customers.find(c => c.id === id) || null);
                  }}
                  placeholder="Search & select customer..."
                  error={errors.customer_id?.message}
                />
              </div>
            )}
            <div>
              <DatePicker
                label="Invoice Date *"
                value={watch('invoice_date')}
                onChange={(val) => setValue('invoice_date', val)}
                error={errors.invoice_date?.message}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Remarks</label>
              <input type="text" className="input-field w-full" placeholder="Any notes about this invoice..." {...register('remarks')} />
            </div>
          </div>
          {selectedCustomer && (
            <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-2xl border border-blue-100/60 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-blue-100 shadow-sm text-primary-600 font-bold text-sm">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-neutral-800 text-sm">{selectedCustomer.name}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                    {selectedCustomer.mobile && <span>{selectedCustomer.mobile}</span>}
                    {selectedCustomer.gst_number && <span>• GST: {selectedCustomer.gst_number}</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Outstanding</span>
                <span className="text-sm font-bold text-red-600 tabular-nums mt-0.5 block">{formatCurrency(selectedCustomer.outstanding_balance || 0)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── PWA MOBILE Customer & Invoice Info Card (Redesigned) ─── */}
        <div className="md:hidden rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
          <div className="rounded-[20px] bg-white p-4 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neutral-500" /> Customer & Invoice Info
            </h2>

            {/* Segmented Selection Switch */}
            <div className="flex bg-neutral-100 rounded-xl p-0.5 justify-around w-full shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setIsGuestMode(false);
                }}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${!isGuestMode ? 'bg-white text-neutral-800 shadow-sm border border-neutral-200/20' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Registered Customer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsGuestMode(true);
                  setValue('customer_id', 0);
                  setSelectedCustomer(null);
                }}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${isGuestMode ? 'bg-white text-neutral-800 shadow-sm border border-neutral-200/20' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Guest / Walk-in
              </button>
            </div>

            {isGuestMode ? (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Customer Name (Guest)</label>
                  <input
                    type="text"
                    className="input-field w-full text-sm py-2 px-3 rounded-xl"
                    placeholder="Walk-in Customer"
                    {...register('guest_name')}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Mobile Number</label>
                  <input
                    type="text"
                    className="input-field w-full text-sm py-2 px-3 rounded-xl"
                    placeholder="0000000000"
                    {...register('guest_mobile')}
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Customer <span className="text-red-500">*</span></label>
                  <SearchableSelect
                    options={customers.map(c => ({
                      value: c.id,
                      label: c.name,
                      sub: [c.mobile, c.outstanding_balance !== undefined ? `Outstanding: ${formatCurrency(c.outstanding_balance)}` : null].filter(Boolean).join(' • ')
                    }))}
                    value={watch('customer_id') || ''}
                    onChange={(val) => {
                      const id = Number(val); setValue('customer_id', id);
                      setSelectedCustomer(customers.find(c => c.id === id) || null);
                    }}
                    placeholder="Search customer..."
                    error={errors.customer_id?.message}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(true)}
                  className="p-2 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center border border-indigo-700 shrink-0"
                  style={{ height: '42px', width: '42px' }}
                  title="Add New Customer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="space-y-3.5 pt-1">
              <DatePicker
                label="Invoice Date *"
                value={watch('invoice_date')}
                onChange={(val) => setValue('invoice_date', val)}
                error={errors.invoice_date?.message}
              />
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">Remarks</label>
                <input
                  type="text"
                  className="input-field w-full text-sm py-2 px-3 rounded-xl"
                  placeholder="Any notes about this invoice..."
                  {...register('remarks')}
                />
              </div>
            </div>

            {selectedCustomer && (
              <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-100/50 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8.5 h-8.5 rounded-xl bg-blue-100/60 border border-blue-100/40 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0 select-none">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-neutral-800 text-xs truncate leading-tight">{selectedCustomer.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-semibold mt-0.5">
                      {selectedCustomer.mobile && <span>{selectedCustomer.mobile}</span>}
                      {selectedCustomer.gst_number && <span>• GST: {selectedCustomer.gst_number}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">Outstanding</span>
                  <span className="text-xs font-bold text-red-600 tabular-nums mt-0.5 block">{formatCurrency(selectedCustomer.outstanding_balance || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items Card */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900">Items ({items.length})</h2>
            <button type="button" onClick={addItem} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 shadow-md"><Plus className="w-4 h-4" /> Add Item</button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
              <ShoppingCart className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-sm text-neutral-500 mt-2">No items added yet. Tap Add Item.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-visible">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-neutral-500 font-semibold text-xs">
                      <th className="pb-2 w-8 px-2">#</th>
                      <th className="pb-2 px-2">Product</th>
                      <th className="pb-2 w-28 px-2">Unit</th>
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

                      const categoryName = category?.name?.toLowerCase() || '';
                      const isService = categoryName && (
                        categoryName.includes('service') ||
                        categoryName.includes('charge') ||
                        categoryName.includes('extra') ||
                        categoryName.includes('other')
                      );

                      return (
                        <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                          <td className="py-3 px-2 text-neutral-400 align-middle">{idx + 1}</td>
                          <td className="py-3 px-2 align-middle overflow-visible">
                            <SearchableSelect
                              compact
                              options={products.map(p => ({ value: p.id, label: p.name }))}
                              value={item.product_id || ''}
                              onChange={(val) => updateItem(idx, 'product_id', Number(val))}
                              placeholder="Select..."
                            />
                            {isService && (
                              <input
                                type="text"
                                className="input-field w-full text-xs mt-1.5 !py-1 !px-2"
                                value={item.product_name_snapshot || ''}
                                onChange={(e) => updateItem(idx, 'product_name_snapshot', e.target.value)}
                                placeholder="Enter custom description..."
                              />
                            )}
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
                          <td className="py-3 px-2 align-middle"><input type="number" inputMode="decimal" className="input-field w-full text-right text-sm !py-1.5 !px-2" min="0.001" step="0.001" value={item.quantity || ''} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} onFocus={(e) => e.target.select()} /></td>
                          <td className="py-3 px-2 align-middle"><input type="number" inputMode="decimal" className="input-field w-full text-right text-sm !py-1.5 !px-2" min="0" step="0.01" value={item.rate || ''} onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))} onFocus={(e) => e.target.select()} /></td>
                          <td className="py-3 px-2 align-middle"><input type="number" inputMode="decimal" className="input-field w-full text-right text-sm !py-1.5 !px-2" min="0" step="0.01" value={item.discount_amount || ''} onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))} onFocus={(e) => e.target.select()} /></td>
                          <td className="py-3 px-2 align-middle"><input type="number" inputMode="decimal" className="input-field w-full text-right text-sm !py-1.5 !px-2" min="0" step="0.01" value={item.gst_rate || ''} onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))} onFocus={(e) => e.target.select()} /></td>
                          <td className="py-3 px-2 text-right tabular-nums text-neutral-600 align-middle">{formatCurrency(item.tax_amount)}</td>
                          <td className="py-3 px-2 text-right font-semibold tabular-nums align-middle">{formatCurrency(item.line_total)}</td>
                          <td className="py-3 align-middle"><button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card-based Items List */}
              <div className="md:hidden space-y-4">
                {items.map((item, idx) => {
                  const product = products.find(p => p.id === Number(item.product_id));
                  const category = product ? categories.find(c => Number(c.id) === Number(product.category_id)) : null;
                  const allowedUnits = category?.units || [];
                  const unitOptions = allowedUnits.length > 0
                    ? allowedUnits.map((u: any) => ({ value: u.id, label: u.short_name }))
                    : (product?.unit ? [{ value: product.unit.id, label: product.unit.short_name }] : []);

                  const categoryName = category?.name?.toLowerCase() || '';
                  const isService = categoryName && (
                    categoryName.includes('service') ||
                    categoryName.includes('charge') ||
                    categoryName.includes('extra') ||
                    categoryName.includes('other')
                  );

                  return (
                    <div key={idx} className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm relative">
                      <div className="rounded-[20px] bg-white p-4 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                        <button type="button" onClick={() => removeItem(idx)} className="absolute top-4 right-4 text-neutral-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Item #{idx + 1}</div>
                      <div>
                        <label className="label">Product</label>
                        <SearchableSelect
                          compact
                          options={products.map(p => ({ value: p.id, label: p.name }))}
                          value={item.product_id || ''}
                          onChange={(val) => updateItem(idx, 'product_id', Number(val))}
                          placeholder="Select product..."
                        />
                        {isService && (
                          <input
                            type="text"
                            className="input-field w-full text-xs mt-1.5 !py-1 !px-2"
                            value={item.product_name_snapshot || ''}
                            onChange={(e) => updateItem(idx, 'product_name_snapshot', e.target.value)}
                            placeholder="Enter custom description..."
                          />
                        )}
                      </div>
                      
                       <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-neutral-405 uppercase tracking-wider block mb-1">Unit</label>
                          <Select
                            compact
                            options={unitOptions}
                            value={item.unit_id || ''}
                            onChange={(val) => updateItem(idx, 'unit_id', Number(val))}
                            disabled={!item.product_id}
                            placeholder="Select..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-neutral-405 uppercase tracking-wider block mb-1">Qty</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-sm"
                            min="0.001"
                            step="0.001"
                            value={item.quantity || ''}
                            onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                          {product && (
                            <span className="text-[9px] text-neutral-400 font-bold block mt-1 text-right">
                              Stock: {product.minimum_stock ?? 0}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block text-right pr-1 mb-1">Rate</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-xs"
                            min="0"
                            step="0.01"
                            value={item.rate || ''}
                            onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block text-right pr-1 mb-1">Disc.</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-xs"
                            min="0"
                            step="0.01"
                            value={item.discount_amount || ''}
                            onChange={(e) => updateItem(idx, 'discount_amount', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block text-right pr-1 mb-1">GST%</label>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="input-field w-full text-right text-xs"
                            min="0"
                            step="0.01"
                            value={item.gst_rate || ''}
                            onChange={(e) => updateItem(idx, 'gst_rate', Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-400">
                        <span>Tax: {formatCurrency(item.tax_amount)}</span>
                        <span className="font-bold text-neutral-700">Total: {formatCurrency(item.line_total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}

          {/* Desktop Summary View */}
          {items.length > 0 && (
            <div className="hidden md:block mt-6 border-t pt-4 flex justify-end">
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

        {/* Desktop Footer Actions */}
        <div className="hidden md:flex items-center gap-3 justify-end">
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

      {/* Sticky Invoice Summary Bar (Mobile Only) */}
      {items.length > 0 && (
        <div className="md:hidden fixed bottom-[64px] left-0 right-0 bg-white/95 border-t border-neutral-200/90 backdrop-blur-md p-4 flex flex-col gap-3.5 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] pb-safe animate-[slideUp_200ms_ease]">
          
          {/* Top Row: Total and Detailed Totals Switch */}
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">{items.filter(i => Number(i.product_id) > 0).length} Items</span>
              <span className="text-xl font-black text-indigo-600 tabular-nums tracking-tight">{formatCurrency(totals.total)}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSummarySheet(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95 transition-all border border-neutral-200/60"
            >
              View Details
            </button>
          </div>

          {/* Bottom Row: Full Width Confirm Action */}
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => handleSubmit((data) => onSubmit(data, true))()}
            className="w-full py-4 rounded-2xl text-sm font-bold tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-md shadow-indigo-100/50 disabled:opacity-50 border border-indigo-700"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Confirm & Save Invoice
          </button>

        </div>
      )}

      {/* Mobile Detailed Totals Sheet */}
      {showSummarySheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSummarySheet(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-xl w-full p-6 space-y-4 max-h-[70vh] overflow-y-auto animate-[slideUp_200ms_ease] pb-safe">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-neutral-900 text-base">Invoice Break-down</h3>
              <button onClick={() => setShowSummarySheet(false)} className="p-1 hover:bg-neutral-100 rounded-full"><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span className="tabular-nums">{formatCurrency(totals.subtotal)}</span></div>
              <div className="flex justify-between text-neutral-500"><span>Discount</span><span className="tabular-nums text-red-600">-{formatCurrency(totals.discount)}</span></div>
              <div className="flex justify-between text-neutral-500"><span>Taxable Amount</span><span className="tabular-nums">{formatCurrency(totals.taxable)}</span></div>
              <div className="flex justify-between text-neutral-500"><span>GST (IGST)</span><span className="tabular-nums">{formatCurrency(totals.tax)}</span></div>
              <div className="flex justify-between font-bold text-base text-neutral-900 border-t pt-2 mt-2"><span>Grand Total</span><span className="tabular-nums">{formatCurrency(totals.total)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => {
                  setShowSummarySheet(false);
                  handleSubmit((data) => onSubmit(data, false))();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => {
                  setShowSummarySheet(false);
                  handleSubmit((data) => onSubmit(data, true))();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary-600 text-white hover:bg-primary-500 transition-colors shadow-md"
              >
                Save & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* PWA Sales Invoice Success Modal */}
      {showSuccessModal && createdInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 overflow-hidden animate-[fadeIn_200ms_ease] flex flex-col items-center text-center">
            
            {/* Header Success Animation */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>

            <h3 className="text-xl font-bold text-neutral-900">Invoice Created Successfully</h3>
            <p className="text-xs text-neutral-400 mt-1">Invoice #{createdInvoice.invoice_number} is now locked in database.</p>

            {/* Quick Summary Card */}
            <div className="w-full bg-neutral-50 rounded-2xl p-4 border border-neutral-100 my-5 space-y-2 text-left">
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Customer:</span>
                <span className="font-semibold text-neutral-800">{createdInvoice.customer_name_snapshot}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Invoice Date:</span>
                <span className="font-semibold text-neutral-800">{formatDate(createdInvoice.invoice_date)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Total Amount:</span>
                <span className="font-bold text-neutral-800 font-mono">{formatCurrency(createdInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500">
                <span>Paid Amount:</span>
                <span className="font-semibold text-emerald-600 font-mono">{formatCurrency(createdInvoice.paid_amount || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-500 border-t pt-2">
                <span>Payment Status:</span>
                <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {createdInvoice.status}
                </span>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="w-full grid grid-cols-2 gap-2">
              <button onClick={handleDownloadPdf} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Download className="w-4 h-4 text-neutral-400" /> Download PDF
              </button>
              <button onClick={handleSharePdf} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Share2 className="w-4 h-4 text-neutral-400" /> Share Statement
              </button>
              <button onClick={handleWhatsAppShare} className="col-span-2 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md">
                <MessageSquare className="w-4 h-4" /> Share on WhatsApp
              </button>
              <button onClick={handlePrint} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Printer className="w-4 h-4 text-neutral-400" /> Print
              </button>
              <button onClick={() => navigate(`/invoices/${createdInvoice.id}`)} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors">
                <FileText className="w-4 h-4 text-neutral-400" /> View Details
              </button>
            </div>

            {/* Bottom Actions */}
            <div className="w-full flex items-center justify-between border-t mt-5 pt-4">
              <button onClick={() => navigate('/')} className="text-xs font-semibold text-neutral-400 hover:text-neutral-600">
                Back to Dashboard
              </button>
              <button onClick={handleResetForm} className="text-xs font-bold text-primary-600 hover:text-primary-500 flex items-center gap-1">
                + Create Next Sale
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
