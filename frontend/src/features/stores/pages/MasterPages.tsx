import { MasterListPage } from '@/components/shared/MasterListPage';
import { storesApi, unitsApi, categoriesApi, brandsApi, gstRatesApi, paymentModesApi } from '@/services/api-endpoints';
import type { Store, Unit, Category, Brand, GstRate, PaymentMode } from '@/types';
import { Store as StoreIcon, Ruler, FolderTree, Tag, Receipt, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const iconWrapper = (Icon: React.ElementType, bg: string, fg: string) => (item: any) => (
  <div className="flex items-center gap-3">
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${fg}`} /></div>
    <div><p className="font-medium text-neutral-900">{item.name}</p>{item.code && <p className="text-xs text-neutral-500">{item.code}</p>}</div>
  </div>
);

export function StoresPage() {
  return <MasterListPage<Store>
    title="Stores" description="Manage your store locations" addLabel="Add Store" addPath="/stores/new"
    queryKey="stores" queryFn={() => storesApi.list()}
    columns={[
      { key: 'name', header: 'Store', render: iconWrapper(StoreIcon, 'bg-primary-50', 'text-primary-600') },
      { key: 'mobile', header: 'Mobile', hideOnMobile: true, render: (s) => s.mobile || '-' },
      { key: 'city', header: 'City', hideOnMobile: true, render: (s) => s.city || '-' },
    ]}
    searchPlaceholder="Search stores..."
  />;
}

export function UnitsPage() {
  return <MasterListPage<Unit>
    title="Units" description="Manage measurement units" addLabel="Add Unit" addPath="/units/new"
    queryKey="units" queryFn={() => unitsApi.list()}
    columns={[
      { key: 'name', header: 'Unit', render: iconWrapper(Ruler, 'bg-indigo-50', 'text-indigo-600') },
      { key: 'short_name', header: 'Short', render: (u) => u.short_name },
      { key: 'decimal_places', header: 'Decimals', hideOnMobile: true, render: (u) => u.decimal_places.toString() },
    ]}
    searchPlaceholder="Search units..."
  />;
}

export function CategoriesPage() {
  return <MasterListPage<Category>
    title="Categories" description="Manage product categories" addLabel="Add Category" addPath="/categories/new"
    queryKey="categories" queryFn={() => categoriesApi.list()}
    columns={[
      { key: 'name', header: 'Category', render: iconWrapper(FolderTree, 'bg-emerald-50', 'text-emerald-600') },
      { key: 'unit', header: 'Default Unit', hideOnMobile: true, render: (c) => c.unit?.short_name || '-' },
    ]}
    searchPlaceholder="Search categories..."
  />;
}

export function BrandsPage() {
  return <MasterListPage<Brand>
    title="Brands" description="Manage product brands" addLabel="Add Brand" addPath="/brands/new"
    queryKey="brands" queryFn={() => brandsApi.list()}
    columns={[
      { key: 'name', header: 'Brand', render: iconWrapper(Tag, 'bg-purple-50', 'text-purple-600') },
    ]}
    searchPlaceholder="Search brands..."
  />;
}

export function GstRatesPage() {
  return <MasterListPage<GstRate>
    title="GST Rates" description="Manage tax rates" addLabel="Add GST Rate" addPath="/gst-rates/new"
    queryKey="gstRates" queryFn={() => gstRatesApi.list()}
    columns={[
      { key: 'name', header: 'Name', render: iconWrapper(Receipt, 'bg-cyan-50', 'text-cyan-600') },
      { key: 'rate', header: 'Rate', render: (g) => `${g.rate}%`, className: 'text-right font-semibold' },
      { key: 'cgst', header: 'CGST', hideOnMobile: true, render: (g) => `${g.cgst_rate}%` },
      { key: 'sgst', header: 'SGST', hideOnMobile: true, render: (g) => `${g.sgst_rate}%` },
    ]}
    searchPlaceholder="Search GST rates..."
  />;
}

export function PaymentModesPage() {
  return <MasterListPage<PaymentMode>
    title="Payment Modes" description="Manage payment methods" addLabel="Add Payment Mode" addPath="/payment-modes/new"
    queryKey="paymentModes" queryFn={() => paymentModesApi.list()}
    columns={[
      { key: 'name', header: 'Name', render: iconWrapper(CreditCard, 'bg-amber-50', 'text-amber-600') },
      { key: 'code', header: 'Code', render: (p) => p.code },
    ]}
    statusField="is_active"
    searchPlaceholder="Search payment modes..."
  />;
}
