import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, CreditCard, Receipt, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { paymentsApi, customersApi, salesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Customer } from '@/types';

const formSchema = z.object({
  customer_id: z.number().min(1, 'Customer is required'),
  payment_date: z.string().min(1, 'Date is required'),
  payment_mode_id: z.number().min(1, 'Payment mode is required'),
  amount: z.number().min(0.01, 'Amount must be > 0'),
  transaction_reference: z.string().optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface InvoiceAllocation {
  invoice_id: number;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  allocated: number;
}

export function CustomerPaymentNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { activeStoreId, stores } = useAuth();
  const resolvedStoreId = activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 1);
  const [allocations, setAllocations] = useState<InvoiceAllocation[]>([]);
  const [allocationMode, setAllocationMode] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: Number(searchParams.get('customer')) || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode_id: 0,
      amount: 0,
      transaction_reference: '',
      remarks: '',
    },
  });

  const customerId = watch('customer_id');
  const paymentAmount = watch('amount');

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => { const { data } = await customersApi.list(); return data.data || []; },
  });
  const { data: paymentModes } = useQuery({
    queryKey: ['payment-modes'],
    queryFn: async () => { const { data } = await (await import('@/services/api-endpoints')).paymentModesApi.list(); return data.data || []; },
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['customer-outstanding', customerId],
    queryFn: async () => {
      const { data } = await salesApi.list({ customer_id: customerId, status: 'confirmed', per_page: 50 });
      return data.data?.data || data.data || [];
    },
    enabled: !!customerId,
  });

  const customers: Customer[] = Array.isArray(customersData) ? customersData : [];
  const modes: any[] = Array.isArray(paymentModes) ? paymentModes : [];
  const outstandingInvoices: any[] = Array.isArray(invoicesData) ? invoicesData : [];

  useEffect(() => {
    if (outstandingInvoices.length > 0) {
      setAllocations(outstandingInvoices.map((inv: any) => ({
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        total_amount: Number(inv.total_amount) || 0,
        paid_amount: Number(inv.paid_amount) || 0,
        balance: (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0),
        allocated: 0,
      })));
    }
  }, [outstandingInvoices]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: any) => paymentsApi.customerCreate(payload),
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customer-payments');
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        const msg = Array.isArray(firstError) ? firstError[0] : firstError;
        toast.error(String(msg));
      } else {
        toast.error(err?.response?.data?.message || 'Failed to create payment');
      }
    },
  });

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0);
  const remainingAmount = paymentAmount - totalAllocated;

  const updateAllocation = (invoiceId: number, value: number) => {
    setAllocations(prev => prev.map(a =>
      a.invoice_id === invoiceId ? { ...a, allocated: Math.min(Math.max(0, value), a.balance) } : a
    ));
  };

  const autoFillAllocations = () => {
    if (!paymentAmount || paymentAmount <= 0) return;
    let remaining = paymentAmount;
    setAllocations(prev => prev.map(a => {
      if (remaining <= 0) return { ...a, allocated: 0 };
      const alloc = Math.min(remaining, a.balance);
      remaining -= alloc;
      return { ...a, allocated: alloc };
    }));
  };

  const onSubmit = (data: FormData) => {
    const payload: any = {
      store_id: resolvedStoreId,
      customer_id: data.customer_id,
      payment_date: data.payment_date,
      payment_mode_id: data.payment_mode_id,
      amount: data.amount,
      transaction_reference: data.transaction_reference || undefined,
      remarks: data.remarks || undefined,
    };

    if (allocationMode && allocations.length > 0) {
      const validAllocations = allocations.filter(a => a.allocated > 0);
      if (validAllocations.length > 0) {
        payload.allocations = validAllocations.map(a => ({
          invoice_id: a.invoice_id,
          allocated_amount: a.allocated,
        }));
      }
    }

    createMutation.mutate(payload);
  };

  const navToPayment = () => navigate('/customer-payments');
  const navToInvoice = (id: number) => navigate('/invoices/' + id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={navToPayment} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-500" />
        </button>
        <div>
          <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight">New Customer Payment</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Record payment received from customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Payment Details Card */}
        <div className="card rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Details
          </h2>

          <Select
            label="Customer *"
            options={customers.map(c => ({ value: c.id, label: c.name, sub: c.mobile || '' }))}
            value={customerId || ''}
            onChange={(val) => {
              const id = Number(val); setValue('customer_id', id);
              setSelectedCustomer(customers.find(c => c.id === id) || null);
            }}
            placeholder="Select customer..."
            error={errors.customer_id?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <DatePicker label="Payment Date *" value={watch('payment_date')} onChange={(val) => setValue('payment_date', val)} />
            <Select
              label="Payment Mode *"
              options={modes.map((m: any) => ({ value: m.id, label: m.name }))}
              value={watch('payment_mode_id') || ''}
              onChange={(val) => setValue('payment_mode_id', Number(val))}
              placeholder="Select mode..."
              error={errors.payment_mode_id?.message}
            />
          </div>

          <div>
            <label className="label">Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-lg pointer-events-none z-10">₹</span>
              <input type="number" className="input-field pl-10 text-lg font-semibold tabular-nums" placeholder="0.00" step="0.01" min="0.01" {...register('amount', { valueAsNumber: true })} />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Transaction Reference</label>
              <input type="text" className="input-field" placeholder="Cheque #, UPI Ref" {...register('transaction_reference')} />
            </div>
            <div>
              <label className="label">Remarks</label>
              <input type="text" className="input-field" placeholder="Optional note" {...register('remarks')} />
            </div>
          </div>

          {selectedCustomer && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-800">{selectedCustomer.name}</p>
                <p className="text-xs text-neutral-500">GST: {selectedCustomer.gst_number || 'N/A'} | {selectedCustomer.mobile}</p>
              </div>
            </div>
          )}
        </div>

        {/* Invoice-wise Allocation */}
        {customerId > 0 && outstandingInvoices.length > 0 && (
          <div className="card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" /> Allocate to Invoices
              </h2>
              <button
                type="button"
                onClick={() => setAllocationMode(!allocationMode)}
                className={'text-sm font-medium px-3 py-1.5 rounded-xl transition-colors ' + (allocationMode ? 'bg-blue-50 text-blue-700' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')}
              >
                {allocationMode ? 'Invoice-wise ON' : 'Invoice-wise OFF'}
              </button>
            </div>

            {allocationMode && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-neutral-500">
                    Allocated: <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(totalAllocated)}</span>
                    {paymentAmount > 0 ? ' / ' + formatCurrency(paymentAmount) : ''}
                  </p>
                  <button type="button" onClick={autoFillAllocations} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Auto-fill
                  </button>
                </div>

                {remainingAmount !== 0 && paymentAmount > 0 && (
                  <div className={'text-xs px-3 py-1.5 rounded-lg font-medium ' + (remainingAmount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
                    {remainingAmount > 0 ? 'Unallocated: ' + formatCurrency(remainingAmount) + ' (treated as advance)' : 'Over-allocated: ' + formatCurrency(Math.abs(remainingAmount))}
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {invoicesLoading ? (
                    <div className="space-y-2">
                      <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
                      <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
                    </div>
                  ) : allocations.map(a => (
                    <div key={a.invoice_id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <button type="button" onClick={() => navToInvoice(a.invoice_id)} className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-neutral-800 truncate hover:text-primary-600">{a.invoice_number}</p>
                        <p className="text-xs text-neutral-400">{formatDate(a.invoice_date)} | Balance: <span className="font-medium text-neutral-600 tabular-nums">{formatCurrency(a.balance)}</span></p>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => updateAllocation(a.invoice_id, Math.max(0, a.allocated - 1000))} className="p-1 hover:bg-neutral-200 rounded-lg">
                          <Minus className="w-3.5 h-3.5 text-neutral-400" />
                        </button>
                        <input type="number" className="w-24 input-field text-right text-sm py-1.5 tabular-nums font-medium" min="0" max={a.balance} step="0.01" value={a.allocated || ''} onChange={(e) => updateAllocation(a.invoice_id, Number(e.target.value))} />
                        <button type="button" onClick={() => updateAllocation(a.invoice_id, Math.min(a.balance, a.allocated + 1000))} className="p-1 hover:bg-neutral-200 rounded-lg">
                          <Plus className="w-3.5 h-3.5 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* No invoices state */}
        {customerId > 0 && outstandingInvoices.length === 0 && !invoicesLoading && (
          <div className="card rounded-2xl p-8 text-center">
            <Receipt className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">No outstanding invoices</p>
            <p className="text-sm text-neutral-400 mt-1">All invoices are fully paid. Payment will be recorded as advance.</p>
          </div>
        )}

        {/* Actions */}
        <div className="card rounded-2xl p-4 flex items-center justify-end gap-3">
          <button type="button" onClick={navToPayment} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Payment
          </button>
        </div>
      </form>
    </div>
  );
}
