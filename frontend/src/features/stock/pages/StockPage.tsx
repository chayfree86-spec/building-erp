import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useStock } from '@/features/purchases/api/queries';
import { useCategories, useProducts } from '@/features/products/api/queries';
import { useSuppliers } from '@/features/customers/api/queries';
import { formatCurrency, formatDate } from '@/utils/format';
import { Search, RotateCcw, Package, TrendingUp, AlertTriangle } from 'lucide-react';

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-06', label: 'June 2026' },
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-03', label: 'March 2026' },
  { value: '2026-02', label: 'February 2026' },
  { value: '2026-01', label: 'January 2026' },
];

export function StockPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'product' | 'batch'>('product');
  
  // Advanced Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // low stock filter state
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // detail modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Queries
  const { data, isLoading, isError, refetch } = useStock({
    include_empty: 1,
    search: search || undefined,
    category_id: selectedCategory || undefined,
    supplier_id: selectedSupplier || undefined,
    product_id: selectedProductFilter || undefined,
    month: selectedMonth || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const { data: categoriesData } = useCategories();
  const { data: suppliersData } = useSuppliers({ per_page: 100 });
  const { data: productsData } = useProducts({ per_page: 200 });

  const categories = Array.isArray(categoriesData) ? categoriesData : ((categoriesData as any)?.data || []);
  const rawSuppliers = (suppliersData as any)?.data;
  const suppliers = Array.isArray(rawSuppliers) ? rawSuppliers : (rawSuppliers?.data || []);
  const products = Array.isArray(productsData) ? productsData : ((productsData as any)?.data || []);

  const items = (data as any)?.items || [];
  const safeItems = Array.isArray(items) ? items : [];

  // Reset Filters
  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSupplier('');
    setSelectedProductFilter('');
    setSelectedMonth('');
    setDateFrom('');
    setDateTo('');
    setFilterLowStockOnly(false);
  };

  // Group all batches by product_id
  const aggregatedProducts: any[] = [];
  const productMap: Record<number, any> = {};

  safeItems.forEach((item: any) => {
    if (!item.product) return;
    const pid = item.product_id;
    const qtyLeft = Number(item.available_quantity) || 0;
    const qtySold = Number(item.sold_quantity) || 0;
    
    const costPrice = Number(item.landed_cost || item.purchase_price) || 0;
    const valueLeft = qtyLeft * costPrice;
    
    const sellPrice = Number(item.selling_price) || 0;
    const valueSold = qtySold * sellPrice;

    if (!productMap[pid]) {
      productMap[pid] = {
        product: item.product,
        totalAvailableQty: 0,
        totalSoldQty: 0,
        totalAvailableValue: 0,
        totalSoldValue: 0,
        purchasePrices: [],
        sellingPrices: [],
        batches: [],
      };
      aggregatedProducts.push(productMap[pid]);
    }

    const p = productMap[pid];
    p.totalAvailableQty += qtyLeft;
    p.totalSoldQty += qtySold;
    p.totalAvailableValue += valueLeft;
    p.totalSoldValue += valueSold;
    p.purchasePrices.push(costPrice);
    p.sellingPrices.push(sellPrice);
    p.batches.push(item);
  });

  // Calculate averages and safety alerts
  aggregatedProducts.forEach(p => {
    p.avgPurchasePrice = p.purchasePrices.length > 0 
      ? p.purchasePrices.reduce((a: number, b: number) => a + b, 0) / p.purchasePrices.length 
      : 0;
    p.avgSellingPrice = p.sellingPrices.length > 0 
      ? p.sellingPrices.reduce((a: number, b: number) => a + b, 0) / p.sellingPrices.length 
      : 0;
    
    const minStock = Number(p.product.minimum_stock) || 0;
    p.isLowStock = p.totalAvailableQty <= minStock;
  });

  // Totals for Master Card
  let totalAvailableQty = 0;
  let totalAvailableValue = 0;
  let totalSoldQty = 0;
  let totalSoldValue = 0;
  let totalLowStock = 0;
  let totalUniqueProducts = aggregatedProducts.length;

  safeItems.forEach((item: any) => {
    const qtyLeft = Number(item.available_quantity) || 0;
    const qtySold = Number(item.sold_quantity) || 0;
    const cost = Number(item.landed_cost || item.purchase_price) || 0;
    const sell = Number(item.selling_price) || 0;

    totalAvailableQty += qtyLeft;
    totalAvailableValue += (qtyLeft * cost);
    totalSoldQty += qtySold;
    totalSoldValue += (qtySold * sell);
  });

  aggregatedProducts.forEach(p => {
    if (p.isLowStock) {
      totalLowStock++;
    }
  });

  const formatQtySummary = (qty: number) => {
    return qty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const displayedProducts = filterLowStockOnly 
    ? aggregatedProducts.filter(p => p.isLowStock)
    : aggregatedProducts;

  const displayedBatches = filterLowStockOnly 
    ? safeItems.filter((item: any) => {
        const pid = item.product_id;
        const prodGroup = productMap[pid];
        return prodGroup ? prodGroup.isLowStock : false;
      })
    : safeItems;

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Inventory" description="Live stock levels, batch tracking, and sales analytics" />

      {/* Stock Summary Master Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <Package className="w-64 h-64" />
        </div>
        
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Stock Overview & Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
          {/* Section 1: Stock Left */}
          <div className="space-y-2 md:pr-6">
            <p className="text-xs text-slate-400 font-medium">Stock Left</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">{formatQtySummary(totalAvailableQty)}</span>
              <span className="text-sm text-slate-300">items</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Value: <span className="font-mono text-cyan-400 font-bold">{formatCurrency(totalAvailableValue)}</span>
            </p>
          </div>

          {/* Section 2: Stock Sold */}
          <div className="space-y-2 pt-4 md:pt-0 md:px-6">
            <p className="text-xs text-slate-400 font-medium">Stock Sold</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">{formatQtySummary(totalSoldQty)}</span>
              <span className="text-sm text-slate-300">items</span>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Est. Sales Value: <span className="font-mono text-emerald-400 font-bold">{formatCurrency(totalSoldValue)}</span>
            </p>
          </div>

          {/* Section 3: Safety & Health */}
          <div className="space-y-2 pt-4 md:pt-0 md:pl-6">
            <p className="text-xs text-slate-400 font-medium">Safety & Alerts</p>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`rounded-xl p-2.5 border transition-all cursor-pointer select-none ${
                  filterLowStockOnly 
                    ? 'bg-red-950/60 border-[#e25c6a] ring-2 ring-[#e25c6a]/30' 
                    : 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-850 hover:border-slate-650'
                }`}
              >
                <span className="text-xs text-slate-300 block font-semibold mb-1 flex items-center gap-1.5">
                  Low Stock
                  {filterLowStockOnly && <span className="w-1.5 h-1.5 rounded-full bg-[#e25c6a] animate-ping" />}
                </span>
                <span className={`text-xl font-bold font-mono ${totalLowStock > 0 ? 'text-[#e25c6a]' : 'text-slate-200'}`}>
                  {totalLowStock}
                </span>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/50">
                <span className="text-xs text-slate-300 block font-semibold mb-1">Unique Products</span>
                <span className="text-xl font-bold font-mono text-slate-200">
                  {totalUniqueProducts}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Filters Bar */}
      <div className="card p-5 space-y-4">
        {/* Row 1: Primary Search & Basic Toggles */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product name, SKU or batch..."
              className="input-field has-icon w-full"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-neutral-100 rounded-xl p-1 w-full md:w-auto justify-between">
              <button
                type="button"
                onClick={() => setViewMode('product')}
                className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'product' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Product Summary
              </button>
              <button
                type="button"
                onClick={() => setViewMode('batch')}
                className={`flex-1 md:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'batch' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
              >
                Batch-wise Detailed
              </button>
            </div>
            
            <Button
              variant="ghost"
              icon={RotateCcw}
              onClick={resetFilters}
              className="px-3"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Row 2: Advanced Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2 border-t border-neutral-100">
          <div>
            <label className="text-xs font-semibold text-neutral-500 block mb-1">Category</label>
            <SearchableSelect
              options={[{ value: '', label: 'All Categories' }, ...categories.map((c: any) => ({ value: String(c.id), label: c.name }))]}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(String(val))}
              placeholder="Select Category"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 block mb-1">Supplier</label>
            <SearchableSelect
              options={[{ value: '', label: 'All Suppliers' }, ...suppliers.map((s: any) => ({ value: String(s.id), label: s.name }))]}
              value={selectedSupplier}
              onChange={(val) => setSelectedSupplier(String(val))}
              placeholder="Select Supplier"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 block mb-1">Product</label>
            <SearchableSelect
              options={[{ value: '', label: 'All Products' }, ...products.map((p: any) => ({ value: String(p.id), label: p.name }))]}
              value={selectedProductFilter}
              onChange={(val) => setSelectedProductFilter(String(val))}
              placeholder="Select Product"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 block mb-1">Month</label>
            <Select
              options={MONTHS}
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(String(val))}
              placeholder="Select Month"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 block mb-1">From Date</label>
            <DatePicker
              value={dateFrom}
              onChange={(val) => setDateFrom(val)}
              placeholder="From Date"
              className="py-1.5 text-xs w-full"
              align="right"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 block mb-1">To Date</label>
            <DatePicker
              value={dateTo}
              onChange={(val) => setDateTo(val)}
              placeholder="To Date"
              className="py-1.5 text-xs w-full"
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Loading & Data Table States */}
      {isLoading ? <CardSkeleton count={6} /> : isError ? (
        <EmptyState icon="error" title="Failed to load stock" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : safeItems.length === 0 ? (
        <EmptyState icon={Package} title="No stock records" description="No stock matching the selected filters found." />
      ) : viewMode === 'product' ? (
        <DataTable
          data={displayedProducts}
          keyExtractor={(item: any) => String(item.product.id)}
          onRowClick={(item: any) => setSelectedProduct(item)}
          columns={[
            { key: 'product', header: 'Product', render: (item: any) => (
              <div>
                <p className="font-semibold text-neutral-900">{item.product?.name || 'Unknown'}</p>
                <p className="text-xs text-neutral-500">{item.product?.category?.name || '-'}</p>
              </div>
            )},
            { key: 'available_qty', header: 'Stock Left', render: (item: any) => (
              <span className="font-semibold text-neutral-800">{item.totalAvailableQty.toFixed(2)}</span>
            )},
            { key: 'sold_qty', header: 'Stock Sold', render: (item: any) => (
              <span className="text-neutral-500">{item.totalSoldQty.toFixed(2)}</span>
            )},
            { key: 'unit', header: 'Unit', hideOnMobile: true, render: (item: any) => item.product?.unit?.short_name || '-' },
            { key: 'purchase_price', header: 'Avg Purch. Price', hideOnMobile: true, render: (item: any) => (
              <span className="font-mono text-sm">{formatCurrency(item.avgPurchasePrice)}</span>
            )},
            { key: 'selling_price', header: 'Avg Sell Price', hideOnMobile: true, render: (item: any) => (
              <span className="font-mono text-sm">{formatCurrency(item.avgSellingPrice)}</span>
            )},
            { key: 'value', header: 'Value Left', render: (item: any) => (
              <span className="font-semibold text-cyan-600">{formatCurrency(item.totalAvailableValue)}</span>
            )},
            { key: 'status', header: 'Status', render: (item: any) => (
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${item.isLowStock ? 'bg-red-50 text-[#e25c6a]' : 'bg-green-50 text-emerald-700'}`}>
                {item.isLowStock ? 'Low Stock' : 'In Stock'}
              </span>
            )},
          ]}
        />
      ) : (
        <DataTable
          data={displayedBatches}
          keyExtractor={(item: any) => `${item.id}-${item.batch_number || ''}`}
          columns={[
            { key: 'product', header: 'Product', render: (item: any) => (
              <div>
                <p className="font-medium text-neutral-900">{item.product?.name || 'Unknown'}</p>
                <p className="text-xs text-neutral-500">SKU: {item.product?.sku || '-'}</p>
              </div>
            )},
            { key: 'batch', header: 'Batch #', render: (item: any) => (
              <span className="font-mono text-xs font-medium">{item.batch_number || `#${item.id}`}</span>
            )},
            { key: 'store', header: 'Store', hideOnMobile: true, render: (item: any) => item.store?.name || '-' },
            { key: 'supplier', header: 'Supplier', hideOnMobile: true, render: (item: any) => item.supplier?.name || '-' },
            { key: 'qty', header: 'Stock Left', render: (item: any) => (
              <span className="font-semibold text-neutral-800">{Number(item.available_quantity).toFixed(2)}</span>
            )},
            { key: 'sold', header: 'Stock Sold', render: (item: any) => (
              <span className="text-neutral-500">{Number(item.sold_quantity).toFixed(2)}</span>
            )},
            { key: 'unit', header: 'Unit', hideOnMobile: true, render: (item: any) => item.product?.unit?.short_name || '-' },
            { key: 'purchase_price', header: 'Purch. Price', hideOnMobile: true, render: (item: any) => (
              <span className="font-mono text-sm">{formatCurrency(item.purchase_price)}</span>
            )},
            { key: 'selling_price', header: 'Sell Price', hideOnMobile: true, render: (item: any) => (
              <span className="font-mono text-sm">{formatCurrency(item.selling_price)}</span>
            )},
            { key: 'value', header: 'Value Left', render: (item: any) => {
              const value = Number(item.available_quantity) * Number(item.landed_cost || item.purchase_price || 0);
              return <span className="font-semibold text-cyan-600">{formatCurrency(value)}</span>;
            }},
          ]}
        />
      )}

      {/* Batch Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-neutral-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{selectedProduct.product.name}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  SKU: {selectedProduct.product.sku || '-'} | Category: {selectedProduct.product.category?.name || '-'} | Min Stock: {Number(selectedProduct.product.minimum_stock || 0).toFixed(2)} {selectedProduct.product.unit?.short_name}
                </p>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="p-2 hover:bg-neutral-200 rounded-lg transition-colors text-neutral-500 hover:text-neutral-700"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <Package className="w-4.5 h-4.5 text-neutral-400" /> Active Batches Breakdown
              </h4>
              
              <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 border-b border-neutral-100">
                      <th className="px-4 py-3 font-medium">Batch #</th>
                      <th className="px-4 py-3 font-medium">Store</th>
                      <th className="px-4 py-3 font-medium">Supplier</th>
                      <th className="px-4 py-3 font-medium">Purchase Date</th>
                      <th className="px-4 py-3 font-medium text-right">Available Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Sold Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Purch. Price</th>
                      <th className="px-4 py-3 font-medium text-right">Sell Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.batches.map((batch: any) => (
                      <tr key={batch.id} className="border-b border-neutral-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium font-mono text-xs">{batch.batch_number || `#${batch.id}`}</td>
                        <td className="px-4 py-3 text-neutral-700">{batch.store?.name || '-'}</td>
                        <td className="px-4 py-3 text-neutral-600 text-xs">{batch.supplier?.name || '-'}</td>
                        <td className="px-4 py-3 text-neutral-500 text-xs">{batch.purchase_date ? formatDate(batch.purchase_date) : '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold">{Number(batch.available_quantity).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{Number(batch.sold_quantity).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{formatCurrency(batch.purchase_price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-900">{formatCurrency(batch.selling_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-neutral-100 flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedProduct(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
