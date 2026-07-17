import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Search, RotateCcw, Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { MasterFormModal, type FieldDef } from './MasterFormModal';
import toast from 'react-hot-toast';
import type { ApiResponse } from '@/types';

interface MasterListConfig<T> {
  title: string;
  description: string;
  addLabel: string;
  addPath?: string; // optional now — uses modal if not provided
  queryKey: string;
  queryFn: () => Promise<{ data: ApiResponse<T[]> }>;
  columns: {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
    hideOnMobile?: boolean;
  }[];
  statusField?: string;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  // CRUD API functions (optional — enables inline CRUD)
  createFn?: (data: Record<string, any>) => Promise<any>;
  updateFn?: (id: number, data: Record<string, any>) => Promise<any>;
  deleteFn?: (id: number) => Promise<any>;
  formFields?: FieldDef[];
  confirmDelete?: string; // message to show before delete
}

export function MasterListPage<T extends { id: number; status?: string; name?: string }>({
  title, description, addLabel, addPath, queryKey, queryFn, columns, statusField, onRowClick, searchPlaceholder,
  createFn, updateFn, deleteFn, formFields,
}: MasterListConfig<T>) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [queryKey, search, status],
    queryFn,
  });

  const items = (data as any)?.data?.data || (data as any)?.data || [];
  // Handle both: AxiosResponse → ApiResponse → array, or direct array
  const filtered = search ? items.filter((item: any) =>
    Object.values(item).some(v => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase()))
  ) : items;
  const finalItems = status ? filtered.filter((item: any) => item.status === status || item[statusField || 'status'] === status) : filtered;

  const cols = [...columns];
  if (statusField !== false) {
    cols.push({
      key: 'status', header: 'Status',
      render: (item: T) => <StatusBadge status={(item as any)[statusField || 'status'] || item.status || 'active'} />,
    });
  }

  // Add actions column if CRUD enabled
  const hasCrud = !!(createFn || updateFn || deleteFn);
  if (hasCrud) {
    cols.push({
      key: 'actions', header: '', hideOnMobile: true,
      render: (item: T) => (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {updateFn && formFields && (
            <Button size="sm" variant="ghost" onClick={() => { setEditingItem(item); setModalOpen(true); }} title="Edit">
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {deleteFn && (
            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(item)} title="Delete">
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    });
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteFn) return;
    try {
      await deleteFn(deleteTarget.id);
      toast.success('Deleted successfully');
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSave = async (formData: Record<string, any>) => {
    if (editingItem && updateFn) {
      await updateFn(editingItem.id, formData);
    } else if (createFn) {
      await createFn(formData);
    }
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  };

  const modalTitle = editingItem ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={{
          label: addLabel,
          onClick: () => {
            if (hasCrud) { setEditingItem(null); setModalOpen(true); }
            else if (addPath) window.location.href = addPath;
          },
          icon: hasCrud ? Plus : undefined,
        }}
      />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`} className="input-field has-icon" />
          </div>
          <SearchableSelect placeholder="All Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? (
        <EmptyState icon="error" title={`Failed to load ${title.toLowerCase()}`} action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : (
        <DataTable data={finalItems} keyExtractor={item => item.id} columns={cols} onRowClick={onRowClick} />
      )}

      {/* CRUD Modal */}
      {hasCrud && formFields && (
        <MasterFormModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditingItem(null); }}
          title={modalTitle}
          fields={formFields}
          initialData={editingItem as any}
          onSave={handleSave}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: [queryKey] })}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Are you sure you want to delete <strong>{(deleteTarget as any).name || 'this item'}</strong>?
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button variant="danger" className="flex-1" onClick={confirmDelete}>Delete</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
