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
import { useProducts, useCategories, useBrands, useUnits, useGstRates } from '../api/queries';
import { productsApi } from '@/services/api-endpoints';
import { Search, RotateCcw, Package, Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/types';

const productFields: FieldDef[] = [
  { key: 'name', label: 'Product Name', required: true, placeholder: 'e.g. OPC Cement 53 Grade' },
  { key: 'sku', label: 'SKU Code', required: true, placeholder: 'e.g. CEM-001' },
  { key: 'category_id', label: 'Category', type: 'select', placeholder: 'Select category' },
  { key: 'unit_id', label: 'Unit', type: 'select', required: true, placeholder: 'Select unit' },
  { key: 'brand_id', label: 'Brand', type: 'select', placeholder: 'Select brand' },
  { key: 'gst_rate_id', label: 'GST Rate', type: 'select', required: true, placeholder: 'Select GST rate' },
  { key: 'barcode', label: 'Barcode', placeholder: 'Scan or enter barcode' },
  { key: 'hsn_code', label: 'HSN Code', placeholder: 'e.g. 2523' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
  { key: 'minimum_stock', label: 'Min Stock Alert', type: 'number', placeholder: '0', defaultValue: '0' },
  { key: 'status', label: 'Active', type: 'switch', defaultValue: 'active' },
];

export function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: products, isLoading, isError, refetch } = useProducts({ search: search || undefined, category_id: categoryId || undefined, brand_id: brandId || undefined, status: status || undefined });
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: units } = useUnits();
  const { data: gstRates } = useGstRates();

  const resetFilters = () => { setSearch(''); setCategoryId(''); setBrandId(''); setStatus(''); };
  const productList = Array.isArray(products) ? products : [];

  // Dropdown options from masters
  const catOptions = (categories || []).map((c: any) => ({ value: String(c.id), label: c.name }));
  const brandOptions = (brands || []).map((b: any) => ({ value: String(b.id), label: b.name }));
  const unitOptions = (units || []).map((u: any) => ({ value: String(u.id), label: `${u.name} (${u.short_name})` }));
  const gstOptions = (gstRates || []).map((g: any) => ({ value: String(g.id), label: `${g.name} (${g.rate}%)` }));

  const fieldsWithOptions = productFields.map(f => {
    if (f.key === 'category_id') return { ...f, options: catOptions };
    if (f.key === 'unit_id') return { ...f, options: unitOptions };
    if (f.key === 'brand_id') return { ...f, options: brandOptions };
    if (f.key === 'gst_rate_id') return { ...f, options: gstOptions };
    return f;
  });

  const handleSave = async (formData: Record<string, any>) => {
    const payload = { ...formData };
    if (editingProduct && editingProduct.id) {
      await productsApi.update(editingProduct.id, payload);
      toast.success('Product updated');
    } else {
      await productsApi.create(payload);
      toast.success('Product created');
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productsApi.remove(deleteTarget.id);
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your construction material products"
        action={{ label: 'Add Product', icon: Plus, onClick: () => { setEditingProduct(null); setModalOpen(true); } }}
      />

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, SKU, barcode..." className="input-field has-icon" />
          </div>
          <SearchableSelect placeholder="All Categories" options={catOptions} value={categoryId} onChange={setCategoryId} />
          <SearchableSelect placeholder="All Brands" options={brandOptions} value={brandId} onChange={setBrandId} />
          <SearchableSelect placeholder="All Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load products" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : productList.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="Add your first product to get started." action={{ label: 'Add Product', onClick: () => { setEditingProduct(null); setModalOpen(true); } }} />
      ) : (
        <DataTable
          data={productList}
          keyExtractor={p => p.id}
          columns={[
            { key: 'name', header: 'Product', render: (p: Product) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{p.name}</p>
                  <p className="text-xs text-neutral-500">{p.sku}</p>
                </div>
              </div>
            )},
            { key: 'category', header: 'Category', hideOnMobile: true, render: (p: Product) => p.category?.name || '-' },
            { key: 'brand', header: 'Brand', hideOnMobile: true, render: (p: Product) => p.brand?.name || '-' },
            { key: 'unit', header: 'Unit', hideOnMobile: true, render: (p: Product) => p.unit?.short_name || '-' },
            { key: 'gst', header: 'GST', hideOnMobile: true, render: (p: Product) => p.gstRate ? `${p.gstRate.rate}%` : '-' },
            { key: 'status', header: 'Status', render: (p: Product) => <StatusBadge status={p.status} /> },
            { key: 'actions', header: '', hideOnMobile: true, render: (p: Product) => (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => { setEditingProduct(p); setModalOpen(true); }} title="Edit">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)} title="Delete">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )},
          ]}
          onRowClick={p => navigate(`/products/${p.id}`)}
        />
      )}

      {/* Add/Edit Modal */}
      <MasterFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        fields={fieldsWithOptions}
        initialData={editingProduct as any}
        onSave={handleSave}
        onSuccess={() => { queryClient.invalidateQueries({ queryKey: ['products'] }); }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete Product?</h3>
              <p className="text-sm text-neutral-500 mb-6">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
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
