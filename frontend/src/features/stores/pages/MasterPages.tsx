import { useNavigate } from 'react-router-dom';
import { MasterListPage } from '@/components/shared/MasterListPage';
import type { FieldDef } from '@/components/shared/MasterFormModal';
import { useUnits } from '@/features/products/api/queries';
import { storesApi, unitsApi, categoriesApi, brandsApi, gstRatesApi, paymentModesApi } from '@/services/api-endpoints';
import type { Store, Unit, Category, Brand, GstRate, PaymentMode } from '@/types';
import { Store as StoreIcon, Ruler, FolderTree, Tag, Receipt, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const iconWrapper = (Icon: React.ElementType, bg: string, fg: string) => (item: any) => (
  <div className="flex items-center gap-3">
    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${fg}`} /></div>
    <div><p className="font-medium text-neutral-900">{item.name}</p>{item.code && <p className="text-xs text-neutral-500">{item.code}</p>}</div>
  </div>
);

const storeFields: FieldDef[] = [
  { key: 'name', label: 'Store Name', required: true, placeholder: 'Enter store name' },
  { key: 'code', label: 'Code', required: true, placeholder: 'e.g. MAIN' },
  { key: 'mobile', label: 'Mobile', placeholder: 'Contact number' },
  { key: 'email', label: 'Email', placeholder: 'Store email' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Store address' },
  { key: 'city', label: 'City', placeholder: 'City' },
  { key: 'state', label: 'State', placeholder: 'State' },
  { key: 'pincode', label: 'Pincode', placeholder: 'Pincode' },
  { key: 'invoice_prefix', label: 'Invoice Prefix', placeholder: 'INV' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

const unitFields: FieldDef[] = [
  { key: 'name', label: 'Unit Name', required: true, placeholder: 'e.g. Kilogram' },
  { key: 'short_name', label: 'Short Name', required: true, placeholder: 'e.g. KG' },
  { key: 'decimal_places', label: 'Decimal Places', type: 'number', placeholder: '2', defaultValue: '2' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

const categoryFields: FieldDef[] = [
  { key: 'name', label: 'Category Name', required: true, placeholder: 'e.g. Cement' },
  { key: 'unit_id', label: 'Default Unit', type: 'select', options: [], placeholder: 'Select default unit' },
  { key: 'unit_ids', label: 'Allowed Units', type: 'multiselect', options: [] },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

const brandFields: FieldDef[] = [
  { key: 'name', label: 'Brand Name', required: true, placeholder: 'e.g. UltraTech' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional description' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

const gstFields: FieldDef[] = [
  { key: 'name', label: 'GST Rate Name', required: true, placeholder: 'e.g. GST 18%' },
  { key: 'rate', label: 'Rate (%)', required: true, type: 'number', placeholder: '18' },
  { key: 'description', label: 'Description', placeholder: 'Optional' },
  { key: 'status', label: 'Status', type: 'switch', defaultValue: 'active' },
];

const paymentModeFields: FieldDef[] = [
  { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Cash' },
  { key: 'code', label: 'Code', required: true, placeholder: 'e.g. CASH' },
];

export function StoresPage() {
  return <MasterListPage<Store>
    title="Stores" description="Manage your store locations" addLabel="Add Store"
    queryKey="stores" queryFn={() => storesApi.list()}
    columns={[
      { key: 'name', header: 'Store', render: iconWrapper(StoreIcon, 'bg-primary-50', 'text-primary-600') },
      { key: 'mobile', header: 'Mobile', hideOnMobile: true, render: (s) => s.mobile || '-' },
      { key: 'city', header: 'City', hideOnMobile: true, render: (s) => s.city || '-' },
    ]}
    createFn={(d) => storesApi.create({ ...d, status: d.status || 'active' })}
    updateFn={(id, d) => storesApi.update(id, d)}
    deleteFn={(id) => storesApi.remove(id)}
    formFields={storeFields}
    searchPlaceholder="Search stores..."
  />;
}

export function UnitsPage() {
  return <MasterListPage<Unit>
    title="Units" description="Manage measurement units" addLabel="Add Unit"
    queryKey="units" queryFn={() => unitsApi.list()}
    columns={[
      { key: 'name', header: 'Unit', render: iconWrapper(Ruler, 'bg-indigo-50', 'text-indigo-600') },
      { key: 'short_name', header: 'Short', render: (u) => u.short_name },
      { key: 'decimal_places', header: 'Decimals', hideOnMobile: true, render: (u) => u.decimal_places.toString() },
    ]}
    createFn={(d) => unitsApi.create({ ...d, decimal_places: Number(d.decimal_places) || 0, allow_fraction: (parseInt(d.decimal_places || '0') > 0) })}
    updateFn={(id, d) => unitsApi.update(id, { ...d, decimal_places: Number(d.decimal_places) || 0, allow_fraction: (parseInt(d.decimal_places || '0') > 0) })}
    deleteFn={(id) => unitsApi.remove(id)}
    formFields={unitFields}
    searchPlaceholder="Search units..."
  />;
}

export function CategoriesPage() {
  const navigate = useNavigate();
  const { data: units = [] } = useUnits();

  const dynamicFields = categoryFields.map(f => {
    if (f.key === 'unit_id' || f.key === 'unit_ids') {
      return {
        ...f,
        options: units.map(u => ({ value: String(u.id), label: `${u.name} (${u.short_name})` })),
      };
    }
    return f;
  });

  return <MasterListPage<Category>
    title="Categories" description="Manage product categories" addLabel="Add Category"
    queryKey="categories" queryFn={() => categoriesApi.list()}
    columns={[
      { key: 'name', header: 'Category', render: iconWrapper(FolderTree, 'bg-emerald-50', 'text-emerald-600') },
      { key: 'unit', header: 'Default Unit', hideOnMobile: true, render: (c) => c.unit?.short_name || '-' },
      {
        key: 'units',
        header: 'Allowed Units',
        hideOnMobile: true,
        render: (c) => c.units && c.units.length > 0 ? c.units.map(u => u.short_name).join(', ') : '-'
      },
      {
        key: 'products_count',
        header: 'Products',
        render: (c) => {
          const count = c.products_count ?? 0;
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/products?category_id=${c.id}`);
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
            >
              {count} Product{count !== 1 ? 's' : ''}
            </button>
          );
        }
      }
    ]}
    createFn={(d) => categoriesApi.create({
      ...d,
      unit_id: d.unit_id ? Number(d.unit_id) : null,
      unit_ids: Array.isArray(d.unit_ids) ? d.unit_ids.map(Number) : []
    })}
    updateFn={(id, d) => categoriesApi.update(id, {
      ...d,
      unit_id: d.unit_id ? Number(d.unit_id) : null,
      unit_ids: Array.isArray(d.unit_ids) ? d.unit_ids.map(Number) : []
    })}
    deleteFn={(id) => categoriesApi.remove(id)}
    formFields={dynamicFields}
    searchPlaceholder="Search categories..."
  />;
}

export function BrandsPage() {
  return <MasterListPage<Brand>
    title="Brands" description="Manage product brands" addLabel="Add Brand"
    queryKey="brands" queryFn={() => brandsApi.list()}
    columns={[
      { key: 'name', header: 'Brand', render: iconWrapper(Tag, 'bg-purple-50', 'text-purple-600') },
    ]}
    createFn={(d) => brandsApi.create(d)}
    updateFn={(id, d) => brandsApi.update(id, d)}
    deleteFn={(id) => brandsApi.remove(id)}
    formFields={brandFields}
    searchPlaceholder="Search brands..."
  />;
}

export function GstRatesPage() {
  return <MasterListPage<GstRate>
    title="GST Rates" description="Manage tax rates" addLabel="Add GST Rate"
    queryKey="gstRates" queryFn={() => gstRatesApi.list()}
    columns={[
      { key: 'name', header: 'Name', render: iconWrapper(Receipt, 'bg-cyan-50', 'text-cyan-600') },
      { key: 'rate', header: 'Rate', render: (g) => `${Number(g.rate)}%`, className: 'text-right font-semibold' },
      { key: 'cgst', header: 'CGST', hideOnMobile: true, render: (g) => `${Number(g.cgst_rate)}%` },
      { key: 'sgst', header: 'SGST', hideOnMobile: true, render: (g) => `${Number(g.sgst_rate)}%` },
    ]}
    createFn={async (d) => {
      const rate = parseFloat(d.rate || '0');
      await gstRatesApi.create({ ...d, cgst_rate: rate / 2, sgst_rate: rate / 2, igst_rate: rate, rate });
    }}
    updateFn={async (id, d) => {
      const rate = parseFloat(d.rate || '0');
      await gstRatesApi.update(id, { ...d, cgst_rate: rate / 2, sgst_rate: rate / 2, igst_rate: rate, rate });
    }}
    deleteFn={(id) => gstRatesApi.remove(id)}
    formFields={gstFields}
    searchPlaceholder="Search GST rates..."
  />;
}

export function PaymentModesPage() {
  return <MasterListPage<PaymentMode>
    title="Payment Modes" description="Manage payment methods" addLabel="Add Payment Mode"
    queryKey="paymentModes" queryFn={() => paymentModesApi.list()}
    columns={[
      { key: 'name', header: 'Name', render: iconWrapper(CreditCard, 'bg-amber-50', 'text-amber-600') },
      { key: 'code', header: 'Code', render: (p) => p.code },
    ]}
    statusField="is_active"
    createFn={(d) => paymentModesApi.create({ ...d, is_active: true })}
    updateFn={(id, d) => paymentModesApi.update(id, d)}
    deleteFn={(id) => paymentModesApi.remove(id)}
    formFields={paymentModeFields}
    searchPlaceholder="Search payment modes..."
  />;
}
