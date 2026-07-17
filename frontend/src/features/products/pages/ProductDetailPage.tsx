import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Package, Hash, Barcode, Shield } from 'lucide-react';
import { productsApi } from '@/services/api-endpoints';
import { formatCurrency } from '@/utils/format';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['products', Number(id)],
    queryFn: async () => { const { data } = await productsApi.get(Number(id)); return data.data; },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>;
  if (isError || !product) return <div className="card p-8 text-center text-red-500">Failed to load product.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{product.name}</h1>
          <p className="text-sm text-neutral-500">SKU: {product.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Package className="w-4 h-4" /> Category</div>
          <p className="font-semibold">{product.category?.name || 'Uncategorized'}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Hash className="w-4 h-4" /> Unit & Brand</div>
          <p className="font-semibold">{product.unit?.short_name || '-'} | {product.brand?.name || 'No brand'}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-sm mb-2"><Shield className="w-4 h-4" /> GST & HSN</div>
          <p className="font-semibold">{product.gstRate?.name || 'N/A'} | HSN: {product.hsn_code || '-'}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-neutral-500">Barcode</span><p className="font-medium">{product.barcode || '-'}</p></div>
          <div><span className="text-neutral-500">Min Stock</span><p className="font-medium">{product.minimum_stock}</p></div>
          <div><span className="text-neutral-500">Status</span><p className={`font-medium ${product.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{product.status}</p></div>
          <div><span className="text-neutral-500">GST Rate</span><p className="font-medium">{product.gstRate?.rate || 0}%</p></div>
        </div>
        {product.description && <div className="mt-4 pt-4 border-t"><span className="text-sm text-neutral-500">Description</span><p className="mt-1 text-neutral-700">{product.description}</p></div>}
      </div>

      {product.barcodes?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Barcodes</h2>
          <div className="space-y-2">
            {product.barcodes.map((b: any) => (
              <div key={b.id} className="flex items-center gap-2 p-2 bg-neutral-50 rounded"><Barcode className="w-4 h-4 text-neutral-400" /><span className="font-mono">{b.barcode}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
