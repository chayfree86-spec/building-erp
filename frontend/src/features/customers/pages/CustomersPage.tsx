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
import { Search, RotateCcw, Users, Pencil, Trash2, Plus, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Customer } from '@/types';

const customerFields: FieldDef[] = [
  { key: 'name', label: 'Customer Name', required: true, placeholder: 'Full name or business name' },
  { key: 'mobile', label: 'Mobile', required: true, placeholder: '10-digit mobile number' },
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile..." className="input-field has-icon" />
          </div>
          <SearchableSelect placeholder="All Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load customers" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : (
        <DataTable
          data={customers}
          keyExtractor={c => c.id}
          columns={[
            { key: 'name', header: 'Customer', render: (c: Customer) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center"><Users className="w-4 h-4 text-orange-600" /></div>
                <div><p className="font-medium text-neutral-900">{c.name}</p><p className="text-xs text-neutral-500">{c.mobile || 'No mobile'}</p></div>
              </div>
            )},
            { key: 'gst', header: 'GST', hideOnMobile: true, render: (c: Customer) => c.gst_number || '-' },
            { key: 'balance', header: 'Outstanding', className: 'text-right tabular-nums', render: (c: Customer) => (
              <span className={c.opening_balance > 0 ? 'text-orange-600 font-semibold' : 'text-neutral-600'}>{formatCurrency(c.opening_balance)}</span>
            )},
            { key: 'status', header: 'Status', render: (c: Customer) => <StatusBadge status={c.status} /> },
            { key: 'actions', header: '', hideOnMobile: true, render: (c: Customer) => (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/customer-payments/new?customer=${c.id}`)} title="Receive Payment"><CreditCard className="w-4 h-4 text-emerald-500 hover:text-emerald-700" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingItem(c); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4 text-neutral-400 hover:text-primary-600" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" /></Button>
              </div>
            )},
          ]}
          onRowClick={c => navigate(`/customers/${c.id}`)}
        />
      )}
      <MasterFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingItem(null); }} title={editingItem ? 'Edit Customer' : 'Add Customer'} fields={customerFields} initialData={editingItem as any} onSave={handleSave} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['customers'] })} />
    </div>
  );
}
