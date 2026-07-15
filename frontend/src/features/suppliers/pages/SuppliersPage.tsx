import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { MasterFormModal, type FieldDef } from '@/components/shared/MasterFormModal';
import { useSuppliers } from '@/features/customers/api/queries';
import { suppliersApi } from '@/services/api-endpoints';
import { formatCurrency } from '@/utils/format';
import { Search, RotateCcw, Truck, Pencil, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Supplier } from '@/types';

const supplierFields: FieldDef[] = [
  { key: 'name', label: 'Supplier Name', required: true, placeholder: 'Company or individual name' },
  { key: 'mobile', label: 'Mobile', required: true, placeholder: '10-digit mobile number' },
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

  const handleSave = async (formData: Record<string, any>) => {
    if (editingItem?.id) { await suppliersApi.update(editingItem.id, formData); toast.success('Supplier updated'); }
    else { await suppliersApi.create(formData); toast.success('Supplier created'); }
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, mobile..." className="input-field pl-10" /></div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="input-field"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? <EmptyState icon="error" title="Failed to load suppliers" action={{ label: 'Retry', onClick: () => refetch() }} /> : (
        <DataTable
          data={suppliers} keyExtractor={s => s.id}
          columns={[
            { key: 'name', header: 'Supplier', render: (s: Supplier) => (
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center"><Truck className="w-4 h-4 text-cyan-600" /></div><div><p className="font-medium text-neutral-900">{s.name}</p><p className="text-xs text-neutral-500">{s.mobile || 'No mobile'}</p></div></div>
            )},
            { key: 'gst', header: 'GST', hideOnMobile: true, render: (s: Supplier) => s.gst_number || '-' },
            { key: 'balance', header: 'Outstanding', className: 'text-right tabular-nums', render: (s: Supplier) => <span className="text-cyan-600 font-semibold">{formatCurrency(s.opening_balance)}</span> },
            { key: 'status', header: 'Status', render: (s: Supplier) => <StatusBadge status={s.status} /> },
            { key: 'actions', header: '', hideOnMobile: true, render: (s: Supplier) => (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => { setEditingItem(s); setModalOpen(true); }} title="Edit"><Pencil className="w-4 h-4 text-neutral-400 hover:text-primary-600" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} title="Delete"><Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-500" /></Button>
              </div>
            )},
          ]}
          onRowClick={s => navigate(`/suppliers/${s.id}`)}
        />
      )}
      <MasterFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingItem(null); }} title={editingItem ? 'Edit Supplier' : 'Add Supplier'} fields={supplierFields} initialData={editingItem as any} onSave={handleSave} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })} />
    </div>
  );
}
