import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { MasterFormModal, type FieldDef } from '@/components/shared/MasterFormModal';
import { useCustomers } from '../api/queries';
import { customersApi } from '@/services/api-endpoints';
import { formatCurrency } from '@/utils/format';
import { Search, Users, Pencil, Trash2, Plus, CreditCard, Phone, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer } from '@/types';

const customerFields: FieldDef[] = [
  { key: 'name', label: 'Customer Name', required: true, placeholder: 'Full name or business name' },
  { key: 'mobile', label: 'Mobile', placeholder: '10-digit mobile number' },
  { key: 'email', label: 'Email', placeholder: 'customer@example.com' },
  { key: 'gst_number', label: 'GST Number', placeholder: 'GSTIN' },
  { key: 'opening_balance', label: 'Opening Balance', type: 'number', placeholder: '0', defaultValue: '0' },
  { key: 'credit_limit', label: 'Credit Limit', type: 'number', placeholder: '0', defaultValue: '0' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Billing address' },
  { key: 'city', label: 'City', placeholder: 'City' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'pincode', label: 'Pincode', placeholder: 'Pincode' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

export function CustomersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Customer | null>(null);

  const { data, isLoading, isError, refetch } = useCustomers({ search: search || undefined, status: status || undefined });
  const raw = (data as any)?.data;
  const customers = Array.isArray(raw) ? raw : (raw?.data || []);
  const totalOutstanding = customers.reduce((sum: number, c: Customer) => sum + (Number(c.outstanding_balance ?? c.opening_balance) || 0), 0);

  const handleSave = async (formData: Record<string, any>) => {
    const payload = {
      ...formData,
      opening_balance: Number(formData.opening_balance) || 0,
      credit_limit: Number(formData.credit_limit) || 0,
    };
    if (editingItem && editingItem.id) {
      await customersApi.update(editingItem.id, payload);
      toast.success('Customer updated');
    } else {
      await customersApi.create(payload);
      toast.success('Customer created');
    }
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await customersApi.remove(id);
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your building material customers"
        action={{ label: 'Add Customer', icon: Plus, onClick: () => { setEditingItem(null); setModalOpen(true); } }}
      />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile..." className="input-field has-icon animate-focus" />
          </div>
          <SearchableSelect placeholder="All Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={status} onChange={setStatus} />
          <div className="flex items-center justify-between sm:justify-end gap-2 text-sm sm:text-base font-semibold">
            <span className="text-neutral-500">Total Outstanding:</span>
            <span className="font-bold tabular-nums text-red-600">{formatCurrency(totalOutstanding)}</span>
          </div>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load customers" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DataTable
              data={customers}
              keyExtractor={c => c.id}
              columns={[
                { key: 'name', header: 'Customer', render: (c: Customer) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm"><Users className="w-4 h-4 text-orange-600" /></div>
                    <div><p className="font-semibold text-neutral-900">{c.name}</p><p className="text-xs text-neutral-400">{c.mobile || 'No mobile'}</p></div>
                  </div>
                )},
                { key: 'balance', header: 'Outstanding', className: 'text-right tabular-nums text-red-600', render: (c: Customer) => (
                  <span className="font-bold">
                    {formatCurrency(c.outstanding_balance ?? c.opening_balance)}
                  </span>
                )},
                { key: 'status', header: 'Status', render: (c: Customer) => <StatusBadge status={c.status} /> },
                { key: 'actions', header: 'Actions', className: 'text-right w-36', render: (c: Customer) => (
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/customer-payments/new?customer=${c.id}`)} title="Receive Payment"><CreditCard className="w-4 h-4 text-emerald-500 hover:text-emerald-700" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingItem(c); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4 text-neutral-400 hover:text-primary-600" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" /></Button>
                  </div>
                )},
              ]}
              onRowClick={c => navigate(`/customers/${c.id}`)}
            />
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {customers.map((c: Customer) => {
              const balance = Number(c.outstanding_balance ?? c.opening_balance) || 0;
              const hasOutstanding = balance > 0;
              const hasAdvance = balance < 0;
              const waText = `नमस्ते ${c.name},\n\nआपके खाते का आउटस्टैंडिंग बैलेंस ${formatCurrency(Math.abs(balance))} है।\n\nसॉफ्टवेयर द्वारा साझा किया गया रिमाइंडर।\nधन्यवाद।`;

              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer"
                >
                  <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50/70 flex items-center justify-center border border-orange-100/60 shrink-0">
                          <Users className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-800 text-[15px]">{c.name}</h4>
                          <p className="text-xs text-neutral-400 mt-0.5 font-medium">{c.mobile || 'No mobile'}</p>
                        </div>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="flex justify-between items-center py-2.5 px-3 bg-neutral-50/50 rounded-xl border border-neutral-100/70">
                      <span className="text-xs text-neutral-500 font-semibold">Outstanding Bal:</span>
                      <span className={`font-bold font-mono text-sm ${
                        hasOutstanding ? 'text-red-600' : hasAdvance ? 'text-emerald-600' : 'text-neutral-600'
                      }`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                      {c.mobile ? (
                        <>
                          <a
                            href={`tel:${c.mobile}`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50/50 text-blue-600 hover:bg-blue-100/60 font-bold text-xs border border-blue-100/60 active:scale-95 transition-all"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call
                          </a>
                          <a
                            href={`https://wa.me/${c.mobile}?text=${encodeURIComponent(waText)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100/60 font-bold text-xs border border-emerald-100/60 active:scale-95 transition-all"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                          </a>
                        </>
                      ) : (
                        <div className="flex-1 text-xs text-neutral-400 py-2.5 italic">No mobile registered</div>
                      )}
                      <button
                        onClick={() => navigate(`/customer-payments/new?customer=${c.id}`)}
                        className="p-2.5 rounded-xl bg-neutral-50/50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200/60 transition-all active:scale-95"
                        title="Receive Payment"
                      >
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <MasterFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingItem(null); }} title={editingItem ? 'Edit Customer' : 'Add Customer'} fields={customerFields} initialData={editingItem as any} onSave={handleSave} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })} />
    </div>
  );
}
