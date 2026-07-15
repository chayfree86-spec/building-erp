import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useProducts, useCategories, useBrands } from '../api/queries';
import { formatCurrency } from '@/utils/format';
import { Search, RotateCcw, Package } from 'lucide-react';
import type { Product } from '@/types';

export function ProductsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [status, setStatus] = useState('');

  const { data: products, isLoading, isError, refetch } = useProducts({ search: search || undefined, category_id: categoryId || undefined, brand_id: brandId || undefined, status: status || undefined });
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const resetFilters = () => { setSearch(''); setCategoryId(''); setBrandId(''); setStatus(''); };

  const productList = Array.isArray(products) ? products : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your construction material products"
        action={{ label: 'Add Product', onClick: () => navigate('/products/new') }}
      />

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, SKU, barcode..."
              className="input-field pl-10"
            />
          </div>
          <SearchableSelect
            placeholder="All Categories"
            options={categories?.map(c => ({ value: c.id.toString(), label: c.name })) || []}
            value={categoryId}
            onChange={setCategoryId}
          />
          <SearchableSelect
            placeholder="All Brands"
            options={brands?.map(b => ({ value: b.id.toString(), label: b.name })) || []}
            value={brandId}
            onChange={setBrandId}
          />
          <SearchableSelect
            placeholder="All Status"
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            value={status}
            onChange={setStatus}
          />
          <Button variant="ghost" icon={RotateCcw} onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load products" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : (
        <DataTable
          data={productList}
          keyExtractor={p => p.id}
          columns={[
            { key: 'name', header: 'Product', render: (p: Product) => (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary-600" />
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
          ]}
          onRowClick={p => navigate(`/products/${p.id}`)}
        />
      )}
    </div>
  );
}
