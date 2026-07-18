import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { MasterFormModal, type FieldDef } from '@/components/shared/MasterFormModal';
import { useSuppliers } from '@/features/customers/api/queries';
import { useCategories } from '@/features/products/api/queries';
import { suppliersApi } from '@/services/api-endpoints';
import { formatCurrency } from '@/utils/format';
import { Search, RotateCcw, Truck, Pencil, Trash2, Plus, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Supplier } from '@/types';

const baseSupplierFields: FieldDef[] = [
  { key: 'name', label: 'Supplier Name', required: true, placeholder: 'Company or individual name' },
  { key: 'category_ids', label: 'Supplier Categories', type: 'multiselect', options: [], placeholder: 'Select categories' },
  { key: 'mobile', label: 'Mobile', placeholder: '10-digit mobile number' },
  { key: 'email', label: 'Email', placeholder: 'supplier@example.com' },
  { key: 'gst_number', label: 'GST Number', placeholder: 'GSTIN' },
  { key: 'opening_balance', label: 'Opening Balance', type: 'number', placeholder: '0', defaultValue: '0' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Address' },
  { key: 'city', label: 'City', placeholder: 'City' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'pincode', label: 'Pincode', placeholder: 'Pincode' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

export function SuppliersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supplier | null>(null);

  const { data, isLoading, isError, refetch } = useSuppliers({ search: search || undefined, status: status || undefined });
  const raw = (data as any)?.data;
  const suppliers = Array.isArray(raw) ? raw : (raw?.data || []);

  const { data: categories = [] } = useCategories();

  const totalOutstanding = suppliers.reduce((sum: number, s: Supplier) => sum + (Number(s.outstanding_balance ?? s.opening_balance) || 0), 0);

  const dynamicFields = baseSupplierFields.map(f => {
    if (f.key === 'category_ids') {
      return {
        ...f,
        options: categories.map(c => ({ value: String(c.id), label: c.name })),
      };
    }
    return f;
  });

  const handleSave = async (formData: Record<string, any>) => {
    const payload = {
      ...formData,
      category_ids: Array.isArray(formData.category_ids) ? formData.category_ids.map(Number) : [],
      opening_balance: Number(formData.opening_balance) || 0,
    };
    delete (payload as any).category_id;

    if (editingItem?.id) { await suppliersApi.update(editingItem.id, payload); toast.success('Supplier updated'); }
    else { await suppliersApi.create(payload); toast.success('Supplier created'); }
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    try { await suppliersApi.remove(id); toast.success('Supplier deleted'); queryClient.invalidateQueries({ queryKey: ['suppliers'] }); }
    catch (err: any) { toast.error(err?.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" description="Manage your material suppliers" action={{ label: 'Add Supplier', icon: Plus, onClick: () => { setEditingItem(null); setModalOpen(true); } }} />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile..." className="input-field has-icon" /></div>
          <Select options={[{value:'',label:'All Status'},{value:'active',label:'Active'},{value:'inactive',label:'Inactive'}]} value={status} onChange={(v) => setStatus(String(v))} />
          <div className="flex items-center justify-start sm:justify-end gap-2 text-sm sm:text-base font-semibold">
            <span className="text-neutral-500">Total Outstanding:</span>
            <span className="font-bold tabular-nums" style={{ color: '#e25c6a' }}>{formatCurrency(totalOutstanding)}</span>
          </div>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? <EmptyState icon="error" title="Failed to load suppliers" action={{ label: 'Retry', onClick: () => refetch() }} /> : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              data={suppliers} keyExtractor={s => s.id}
              columns={[
                { key: 'name', header: 'Supplier', render: (s: Supplier) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{s.name}</p>
                      <p className="text-xs text-neutral-500">{s.mobile || 'No mobile'}</p>
                    </div>
                  </div>
                )},
                { key: 'categories', header: 'Categories', hideOnMobile: true, render: (s: Supplier) => (
                  <div className="flex flex-wrap gap-1">
                    {s.categories && s.categories.length > 0 ? (
                      s.categories.map((c: any) => (
                        <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {c.name}
                        </span>
                      ))
                    ) : s.category ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-800 border border-neutral-200">
                        {s.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">-</span>
                    )}
                  </div>
                )},
                { key: 'balance', header: 'Outstanding', className: 'text-right tabular-nums', render: (s: Supplier) => <span className="font-semibold" style={{ color: '#e25c6a' }}>{formatCurrency(s.outstanding_balance ?? s.opening_balance)}</span> },
                { key: 'status', header: 'Status', render: (s: Supplier) => <StatusBadge status={s.status} /> },
                { key: 'actions', header: 'Actions', className: 'text-right w-36', render: (s: Supplier) => (
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/supplier-payments/new?supplier=${s.id}`)} title="Pay"><CreditCard className="w-4 h-4 text-emerald-500 hover:text-emerald-700" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingItem(s); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4 text-neutral-400 hover:text-primary-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} title="Delete"><Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" /></Button>
                  </div>
                )},
              ]}
              onRowClick={s => navigate(`/suppliers/${s.id}`)}
            />
          </div>

          {/* Mobile custom card list (PWA) */}
          <div className="md:hidden space-y-4 pb-20">
            {suppliers.map((s: Supplier) => {
              const outstandingAmt = Number(s.outstanding_balance ?? s.opening_balance) || 0;
              const isOwe = outstandingAmt > 0;
              const isAdv = outstandingAmt < 0;

              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/suppliers/${s.id}`)}
                  className="rounded-[24px] p-0.5 bg-neutral-100/60 border border-neutral-200/50 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                >
                  <div className="rounded-[20px] bg-white p-4 space-y-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                    {/* Top row: supplier name & status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0 border border-cyan-100/35">
                          <Truck className="w-4 h-4 text-cyan-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-800 text-xs truncate leading-tight">{s.name}</p>
                          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">{s.mobile || 'No mobile'}</p>
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>

                    {/* Middle: Categories & Outstanding */}
                    <div className="flex items-center justify-between gap-3 border-t border-neutral-50 pt-3">
                      <div className="flex flex-wrap gap-1 max-w-[60%]">
                        {s.categories && s.categories.length > 0 ? (
                          s.categories.map((c: any) => (
                            <span key={c.id} className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200/50">
                              {c.name}
                            </span>
                          ))
                        ) : s.category ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200/50">
                            {s.category.name}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400">-</span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider block">Outstanding</span>
                        <p className="font-black text-xs tabular-nums leading-none mt-1 text-red-600">
                          {outstandingAmt < 0 ? '-' : ''}{formatCurrency(Math.abs(outstandingAmt))}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Actions list */}
                    <div className="flex gap-2 pt-2 border-t border-neutral-50" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/supplier-payments/new?supplier=${s.id}`)}
                        className="w-full py-2.5 px-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Pay Supplier
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <MasterFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingItem(null); }} title={editingItem ? 'Edit Supplier' : 'Add Supplier'} fields={dynamicFields} initialData={editingItem as any} onSave={handleSave} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })} />
    </div>
  );
}
