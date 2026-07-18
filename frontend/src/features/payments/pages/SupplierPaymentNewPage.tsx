import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, CreditCard, ShoppingCart, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { paymentsApi, suppliersApi, purchasesApi } from '@/services/api-endpoints';
import { useAuth } from '@/features/auth/auth-context';
import { formatCurrency, formatDate, getLocalDateString } from '@/utils/format';
import { handleFormKeyDown } from '@/utils/formNavigation';
import type { Supplier } from '@/types';

const formSchema = z.object({
  supplier_id: z.number().min(1, 'Supplier is required'),
  payment_date: z.string().min(1, 'Date is required'),
  payment_mode_id: z.number().optional(),
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
  const { activeStoreId, stores } = useAuth();
  const resolvedStoreId = activeStoreId !== 'all' ? Number(activeStoreId) : (stores[0]?.id || 1);
  const [allocations, setAllocations] = useState<PurchaseAllocation[]>([]);
  const [allocationMode, setAllocationMode] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedModalMode, setSelectedModalMode] = useState<number | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_id: Number(searchParams.get('supplier')) || 0,
      payment_date: getLocalDateString(),
      payment_mode_id: 0,
      amount: 0,
      transaction_reference: '',
      remarks: '',
    },
  });

  const supplierId = watch('supplier_id');
  const paymentAmount = watch('amount');

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
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

  useEffect(() => {
    if (supplierId > 0 && suppliers.length > 0) {
      setSelectedSupplier(suppliers.find(s => s.id === supplierId) || null);
    }
  }, [supplierId, suppliers]);

  useEffect(() => {
    if (selectedSupplier) {
      const outBal = Number(selectedSupplier.outstanding_balance) || 0;
      setValue('amount', outBal > 0 ? outBal : 0);
    }
  }, [selectedSupplier, setValue]);

  const defaultAmount = selectedSupplier ? Math.max(0, Number(selectedSupplier.outstanding_balance) || 0) : 0;
  const isMatchingDefault = Number(paymentAmount) === defaultAmount && defaultAmount > 0;
  const inputColorClass = isMatchingDefault ? 'text-[#e25c6a]' : 'text-emerald-600';
  const iconColorClass = isMatchingDefault ? 'text-[#e25c6a]' : 'text-emerald-500';

  const createMutation = useMutation({
    mutationFn: (payload: any) => paymentsApi.supplierCreate(payload),
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      navigate('/supplier-payments');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create payment'),
  });

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated, 0);
  const remainingAmount = paymentAmount - totalAllocated;

  const updateAllocation = (purchaseId: number, value: number) => {
    setAllocations(prev => {
      const next = prev.map(a =>
        a.purchase_id === purchaseId ? { ...a, allocated: Math.min(Math.max(0, value), a.balance) } : a
      );
      const newTotal = next.reduce((sum, a) => sum + a.allocated, 0);
      setValue('amount', newTotal);
      return next;
    });
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

  const handleModalConfirm = () => {
    if (!selectedModalMode) return;
    setValue('payment_mode_id', selectedModalMode);
    setShowModeModal(false);
    
    // Trigger submit with updated value
    handleSubmit((data) => {
      onSubmit({ ...data, payment_mode_id: selectedModalMode });
    })();
  };

  const onSubmit = (data: FormData) => {
    if (!data.payment_mode_id || data.payment_mode_id === 0) {
      setShowModeModal(true);
      return;
    }

    const payload: any = {
      store_id: resolvedStoreId,
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
  const isSupplierPreselected = searchParams.has('supplier');

  return (
    <div className="space-y-6">
      <div className="hidden md:block space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={navToPayment} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-500" />
          </button>
          <div>
            <h1 className="text-[26px] font-bold text-neutral-900 tracking-tight">
              {isSupplierPreselected && selectedSupplier ? `Payment to ${selectedSupplier.name}` : 'New Supplier Payment'}
            </h1>
            <p className="text-sm text-neutral-500 mt-0.5">Record payment made to supplier</p>
          </div>
        </div>
  
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-5">
          <div className="card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Details
            </h2>
            {isSupplierPreselected ? (
              <div className="flex items-center gap-3.5 p-4 bg-cyan-50/50 rounded-xl border border-cyan-100/80">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-cyan-700 tracking-wider">Supplier</span>
                  <p className="font-semibold text-neutral-900 text-[15px] leading-tight mt-0.5">{selectedSupplier?.name || 'Loading supplier...'}</p>
                  {selectedSupplier && (
                    <p className="text-xs text-neutral-500 mt-1">
                      GSTIN: <span className="font-medium text-neutral-700">{selectedSupplier.gst_number || 'N/A'}</span> &bull; Mobile: <span className="font-medium text-neutral-700">{selectedSupplier.mobile || 'N/A'}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <SearchableSelect
                label="Supplier *"
                options={suppliers.map(s => ({
                  value: s.id,
                  label: s.name,
                  sub: (
                    <span className="flex items-center gap-1.5">
                      {s.mobile && <span>{s.mobile}</span>}
                      {s.mobile && <span className="text-neutral-300">•</span>}
                      <span>Outstanding: <span className="text-red-600 font-semibold">{formatCurrency(s.outstanding_balance || 0)}</span></span>
                    </span>
                  ),
                  subSearch: [s.mobile, s.outstanding_balance !== undefined ? String(s.outstanding_balance) : ''].filter(Boolean).join(' ')
                }))}
                value={supplierId || ''}
                onChange={(val) => {
                  const id = Number(val); setValue('supplier_id', id);
                  setSelectedSupplier(suppliers.find(s => s.id === id) || null);
                }}
                placeholder="Select supplier..."
                error={errors.supplier_id?.message}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label="Payment Date *" value={watch('payment_date')} onChange={(val) => setValue('payment_date', val)} />
              <SearchableSelect
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
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-lg pointer-events-none z-10 transition-colors duration-200 ${iconColorClass}`}>₹</span>
                <input
                  type="number"
                  style={{ paddingLeft: '2.75rem', color: isMatchingDefault ? '#e25c6a' : '#10B981' }}
                  className="input-field text-lg font-semibold tabular-nums transition-colors duration-200"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { valueAsNumber: true })}
                />
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

            {selectedSupplier && !isSupplierPreselected && (
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
                      <div key={a.purchase_id} className="flex items-center gap-3.5 p-3 bg-neutral-50 rounded-xl border border-neutral-100 hover:bg-neutral-100/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={a.allocated > 0}
                          onChange={(e) => {
                            updateAllocation(a.purchase_id, e.target.checked ? a.balance : 0);
                          }}
                          className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-neutral-300 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate">{a.purchase_number}</p>
                          <p className="text-xs text-neutral-400">{formatDate(a.purchase_date)} | Balance: <span className="font-medium text-neutral-600 tabular-nums">{formatCurrency(a.balance)}</span></p>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="number"
                            className="w-28 input-field text-right text-sm py-1.5 tabular-nums font-medium"
                            min="0"
                            max={a.balance}
                            step="0.01"
                            value={a.allocated || ''}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => updateAllocation(a.purchase_id, Number(e.target.value))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
  
          {supplierId > 0 && outstandingPurchases.length === 0 && !purchasesLoading && (
            <div className="card rounded-2xl p-8 text-center">
              <ShoppingCart className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">No outstanding purchases</p>
              <p className="text-sm text-neutral-400 mt-1">All purchases are fully paid. Payment will be recorded as advance.</p>
            </div>
          )}

          <div className="card rounded-2xl p-4 flex items-center justify-end gap-3">
            <button type="button" onClick={navToPayment} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn btn-primary">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Payment
            </button>
          </div>
        </form>
      </div>

      <div className="md:hidden space-y-5 pb-20">
        <div className="flex items-center gap-3">
          <button onClick={navToPayment} className="p-2.5 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 shadow-sm rounded-xl active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-neutral-900 tracking-tight leading-tight">
              {isSupplierPreselected && selectedSupplier ? `Payment to ${selectedSupplier.name}` : 'Record Payment'}
            </h1>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleFormKeyDown} className="space-y-4">
          <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
            <div className="rounded-[20px] bg-white p-4 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-neutral-500" /> Payment details
              </h2>
              {isSupplierPreselected ? (
                <div className="flex items-center gap-3 p-3 bg-cyan-50/40 rounded-2xl border border-cyan-100/50">
                  <div className="w-9 h-9 rounded-xl bg-cyan-100/60 flex items-center justify-center shrink-0 border border-cyan-100/40">
                    <ShoppingCart className="w-4.5 h-4.5 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] uppercase font-bold text-cyan-500 tracking-wider block">Supplier</span>
                    <p className="font-bold text-neutral-800 text-sm leading-tight mt-0.5">{selectedSupplier?.name || 'Loading...'}</p>
                  </div>
                </div>
              ) : (
                <SearchableSelect
                  label="Supplier *"
                  options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                  value={supplierId || ''}
                  onChange={(val) => {
                    const id = Number(val); setValue('supplier_id', id);
                    setSelectedSupplier(suppliers.find(s => s.id === id) || null);
                  }}
                  placeholder="Select supplier..."
                  error={errors.supplier_id?.message}
                />
              )}
              <div className="space-y-3.5">
                <DatePicker label="Payment Date *" value={watch('payment_date')} onChange={(val) => setValue('payment_date', val)} />
                <SearchableSelect
                  label="Payment Mode *"
                  options={modes.map((m: any) => ({ value: m.id, label: m.name }))}
                  value={watch('payment_mode_id') || ''}
                  onChange={(val) => setValue('payment_mode_id', Number(val))}
                  placeholder="Select mode..."
                  error={errors.payment_mode_id?.message}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Amount *</label>
                <div className="relative rounded-2xl bg-neutral-50/60 border border-neutral-200/70 p-1 flex items-center">
                  <span className="pl-3 text-lg font-bold text-neutral-400 select-none">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-full bg-transparent border-0 focus:ring-0 text-base font-bold tabular-nums text-neutral-800 py-2.5 px-2"
                    placeholder="0.00"
                    {...register('amount', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-[24px] p-3 bg-white border border-neutral-200/60 shadow-sm flex items-center gap-3">
            <button type="button" onClick={navToPayment} className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-xs active:scale-95 transition-all text-center">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md">
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </form>
      </div>
  
      {showModeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Select Payment Mode</h3>
                <p className="text-xs text-neutral-500">Please choose a payment mode to proceed</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              {modes.map((m: any) => {
                const isSelected = selectedModalMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModalMode(m.id)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-800 font-semibold shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <p className="text-sm">{m.name}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setShowModeModal(false);
                  setSelectedModalMode(null);
                }}
                className="btn btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedModalMode}
                onClick={handleModalConfirm}
                className="btn btn-primary px-4 py-2 text-sm"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
