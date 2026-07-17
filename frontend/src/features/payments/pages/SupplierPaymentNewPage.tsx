import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, CreditCard, ShoppingCart, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Select } from '@/components/ui/Select';
import { paymentsApi, suppliersApi, purchasesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Supplier } from '@/types';

const formSchema = z.object({
  supplier_id: z.number().min(1, 'Supplier is required'),
  payment_date: z.string().min(1, 'Date is required'),
  payment_mode_id: z.number().min(1, 'Payment mode is required'),
  amount: z.number().min(0.01, 'Amount must be > 0'),
  transaction_reference: z.string().optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PurchaseAllocation {
  purchase_id: number;
  purchase_number: string;
  purchase_date: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  allocated: number;
}

export function SupplierPaymentNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { activeStoreId } = useAuth();
  const [allocations, setAllocations] = useState<PurchaseAllocation[]>([]);
  const [allocationMode, setAllocationMode] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_id: Number(searchParams.get('supplier')) || 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode_id: 0,
      amount: 0,
      transaction_reference: '',
      remarks: '',
    },
  });

  const supplierId = watch('supplier_id');
  const paymentAmount = watch('amount');

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => { const { data } = await suppliersApi.list(); return data.data || []; },
  });
  const { data: paymentModes } = useQuery({
    queryKey: ['payment-modes'],
    queryFn: async () => { const { data } = await (await import('@/services/api-endpoints')).paymentModesApi.list(); return data.data || []; },
  });

  const { data: purchasesData, isLoading: purchasesLoading } = useQuery({
    queryKey: ['supplier-outstanding', supplierId],
    queryFn: async () => {
      const { data } = await purchasesApi.list({ supplier_id: supplierId, status: 'confirmed', per_page: 50 });
      return data.data?.data || data.data || [];
    },
    enabled: !!supplierId,
  });

  const suppliers: Supplier[] = Array.isArray(suppliersData) ? suppliersData : [];
  const modes: any[] = Array.isArray(paymentModes) ? paymentModes : [];
  const outstandingPurchases: any[] = Array.isArray(purchasesData) ? purchasesData : [];

  useEffect(() => {
    if (outstandingPurchases.length > 0) {
      setAllocations(outstandingPurchases.map((p: any) => ({
        purchase_id: p.id,
        purchase_number: p.purchase_number,
        purchase_date: p.purchase_date,
        total_amount: Number(p.total_amount) || 0,
        paid_amount: Number(p.paid_amount) || 0,
        balance: (Number(p.total_amount) || 0) - (Number(p.paid_amount) || 0),
        allocated: 0,
      })));
    }
  }, [outstandingPurchases]);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: any) => paymentsApi.supplierCreate(payload),
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/supplier-payments');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create payment'),
  });

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0);
  const remainingAmount = paymentAmount - totalAllocated;

  const updateAllocation = (purchaseId: number, value: number) => {
    setAllocations(prev => prev.map(a =>
      a.purchase_id === purchaseId ? { ...a, allocated: Math.min(Math.max(0, value), a.balance) } : a
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
      store_id: activeStoreId,
      supplier_id: data.supplier_id,
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
          purchase_id: a.purchase_id,
          allocated_amount: a.allocated,
        }));
      }
    }

    createMutation.mutate(payload);
  };

  const navToPayment = () => navigate('/supplier-payments');
  const navToPurchase = (id: number) => navigate('/purchases/' + id);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={navToPayment} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-500" />
        </button>
        <div>
          <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight">New Supplier Payment</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Record payment made to supplier</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Payment Details Card */}
        <div className="card rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Details
          </h2>

          <Select
            label="Supplier *"
            options={suppliers.map(s => ({ value: s.id, label: s.name, sub: s.mobile || '' }))}
            value={supplierId || ''}
            onChange={(val) => {
              const id = Number(val); setValue('supplier_id', id);
              setSelectedSupplier(suppliers.find(s => s.id === id) || null);
            }}
            placeholder="Select supplier..."
            error={errors.supplier_id?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Date *</label>
              <input type="date" className="input-field" {...register('payment_date')} />
            </div>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">₹</span>
              <input type="number" className="input-field pl-8 text-lg font-semibold tabular-nums" placeholder="0.00" step="0.01" min="0.01" {...register('amount', { valueAsNumber: true })} />
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

          {selectedSupplier && (
            <div className="flex items-center gap-3 p-3 bg-cyan-50 rounded-xl text-sm">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-800">{selectedSupplier.name}</p>
                <p className="text-xs text-neutral-500">GST: {selectedSupplier.gst_number || 'N/A'} | {selectedSupplier.mobile}</p>
              </div>
            </div>
          )}
        </div>

        {/* Invoice-wise Allocation */}
        {supplierId > 0 && outstandingPurchases.length > 0 && (
          <div className="card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" /> Allocate to Purchases
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
                  {purchasesLoading ? (
                    <div className="space-y-2">
                      <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
                      <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
                      <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
                    </div>
                  ) : allocations.map(a => (
                    <div key={a.purchase_id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{a.purchase_number}</p>
                        <p className="text-xs text-neutral-400">{formatDate(a.purchase_date)} | Balance: <span className="font-medium text-neutral-600 tabular-nums">{formatCurrency(a.balance)}</span></p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => updateAllocation(a.purchase_id, Math.max(0, a.allocated - 1000))} className="p-1 hover:bg-neutral-200 rounded-lg">
                          <Minus className="w-3.5 h-3.5 text-neutral-400" />
                        </button>
                        <input type="number" className="w-24 input-field text-right text-sm py-1.5 tabular-nums font-medium" min="0" max={a.balance} step="0.01" value={a.allocated || ''} onChange={(e) => updateAllocation(a.purchase_id, Number(e.target.value))} />
                        <button type="button" onClick={() => updateAllocation(a.purchase_id, Math.min(a.balance, a.allocated + 1000))} className="p-1 hover:bg-neutral-200 rounded-lg">
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

        {/* No purchases state */}
        {supplierId > 0 && outstandingPurchases.length === 0 && !purchasesLoading && (
          <div className="card rounded-2xl p-8 text-center">
            <ShoppingCart className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">No outstanding purchases</p>
            <p className="text-sm text-neutral-400 mt-1">All purchases are fully paid. Payment will be recorded as advance.</p>
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
