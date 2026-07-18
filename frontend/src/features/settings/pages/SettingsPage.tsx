import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/services/api-endpoints';
import { Save, Building2, Receipt, Package, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SettingDef {
  key: string;
  label: string;
  group: string;
  type: 'string' | 'number' | 'boolean';
  placeholder?: string;
}

const SETTING_DEFS: SettingDef[] = [
  { key: 'company_name', label: 'Company Name', group: 'General', type: 'string', placeholder: 'Your business name' },
  { key: 'company_address', label: 'Address', group: 'General', type: 'string', placeholder: 'Business address' },
  { key: 'company_phone', label: 'Phone', group: 'General', type: 'string', placeholder: 'Contact number' },
  { key: 'company_email', label: 'Email', group: 'General', type: 'string', placeholder: 'Business email' },
  { key: 'company_gst', label: 'GST Number', group: 'General', type: 'string', placeholder: 'GSTIN' },
  { key: 'currency_symbol', label: 'Currency Symbol', group: 'General', type: 'string', placeholder: '₹' },
  { key: 'date_format', label: 'Date Format', group: 'General', type: 'string', placeholder: 'DD/MM/YYYY' },
  { key: 'enable_gst', label: 'Enable GST', group: 'General', type: 'boolean' },
  { key: 'invoice_prefix', label: 'Invoice Prefix', group: 'Invoicing', type: 'string', placeholder: 'INV' },
  { key: 'purchase_prefix', label: 'Purchase Prefix', group: 'Invoicing', type: 'string', placeholder: 'PUR' },
  { key: 'round_off', label: 'Round Off Totals', group: 'Invoicing', type: 'boolean' },
  { key: 'default_credit_limit', label: 'Default Credit Limit', group: 'Customers', type: 'number', placeholder: '100000' },
  { key: 'low_stock_threshold', label: 'Low Stock Threshold', group: 'Inventory', type: 'number', placeholder: '10' },
];

const groupIcons: Record<string, React.ElementType> = {
  General: Building2, Invoicing: Receipt, Inventory: Package, Customers: Users,
};

export function SettingsPage() {
  const queryClient = useQueryClient();
  const hasLoadedRef = useRef(false);
  const [saving, setSaving] = useState(false);

  // Default values
  const defaultFormData = useMemo(() => {
    const map: Record<string, string> = {};
    SETTING_DEFS.forEach(d => { map[d.key] = ''; });
    return map;
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await settingsApi.get(); return data; },
  });

  // Compute form data directly — no useEffect, no state loop
  const [formData, setFormData] = useState<Record<string, string>>(defaultFormData);
  
  // Derive form data from API response only on first load or when data changes structurally
  const apiDataJson = JSON.stringify((data as any)?.data ?? []);
  const prevApiJson = useRef('');
  if (apiDataJson !== prevApiJson.current && apiDataJson !== '[]') {
    prevApiJson.current = apiDataJson;
    const settingsArr = ((data as any)?.data) || [];
    if (Array.isArray(settingsArr) && settingsArr.length > 0) {
      const fromApi: Record<string, string> = { ...defaultFormData };
      settingsArr.forEach((s: any) => {
        if (s.key) fromApi[s.key] = s.value?.toString() ?? '';
      });
      // Only update if different from current
      const currentJson = JSON.stringify(formData);
      const newJson = JSON.stringify(fromApi);
      if (currentJson !== newJson && !hasLoadedRef.current) {
        hasLoadedRef.current = true;
        // Use setTimeout to break the render cycle
        setTimeout(() => setFormData(fromApi), 0);
      }
    }
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsArray = Object.entries(formData).map(([key, value]) => ({ key, value }));
      await settingsApi.update(settingsArray);
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading && !hasLoadedRef.current) return <div className="space-y-6"><PageHeader title="Settings" description="Configure system preferences" /><CardSkeleton count={4} /></div>;
  if (isError) return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure system preferences" />
      <div className="card p-12 text-center">
        <p className="text-neutral-500 mb-4">Failed to load settings</p>
        <Button variant="primary" onClick={() => refetch()}>Retry</Button>
      </div>
    </div>
  );

  // Group settings
  const groups = SETTING_DEFS.reduce((acc, def) => {
    if (!acc[def.group]) acc[def.group] = [];
    acc[def.group].push(def);
    return acc;
  }, {} as Record<string, SettingDef[]>);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure system preferences" action={{ label: 'Save Settings', onClick: handleSave, loading: saving, icon: Save }} />

      {Object.entries(groups).map(([group, defs]) => {
        const Icon = groupIcons[group] || Building2;
        return (
          <div key={group} className="card">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">{group}</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {defs.map(def => (
                <div key={def.key}>
                  <label className="label">{def.label}</label>
                  {def.type === 'boolean' ? (
                    <label className="flex items-center gap-3 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={formData[def.key] === 'true' || formData[def.key] === '1'}
                        onChange={e => handleChange(def.key, e.target.checked ? 'true' : 'false')}
                        className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <span className="text-sm text-neutral-700">Enabled</span>
                    </label>
                  ) : (
                    <input
                      value={formData[def.key] || ''}
                      onChange={e => handleChange(def.key, e.target.value)}
                      className="input-field"
                      placeholder={def.placeholder || `Enter ${def.label.toLowerCase()}`}
                      type={def.type === 'number' ? 'number' : 'text'}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* System Modules Quick Access */}
      <div className="card">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-neutral-900">System Modules (Quick Access)</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/purchase-returns" className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-all group">
            <div>
              <h4 className="font-semibold text-neutral-800 text-sm">Returns</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Manage customer & purchase returns</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-primary-50 transition-all">
              <span className="text-neutral-500 group-hover:text-primary-600 font-semibold text-sm">→</span>
            </div>
          </Link>
          <Link to="/stock-transfers" className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-all group">
            <div>
              <h4 className="font-semibold text-neutral-800 text-sm">Transfers</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Transfer inventory between stores</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-primary-50 transition-all">
              <span className="text-neutral-500 group-hover:text-primary-600 font-semibold text-sm">→</span>
            </div>
          </Link>
          <Link to="/users" className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-all group">
            <div>
              <h4 className="font-semibold text-neutral-800 text-sm">Users & Roles</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Manage staff access & roles</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-primary-50 transition-all">
              <span className="text-neutral-500 group-hover:text-primary-600 font-semibold text-sm">→</span>
            </div>
          </Link>
          <Link to="/audit-logs" className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-all group">
            <div>
              <h4 className="font-semibold text-neutral-800 text-sm">Audit Logs</h4>
              <p className="text-xs text-neutral-400 mt-0.5">View system logs & track actions</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-primary-50 transition-all">
              <span className="text-neutral-500 group-hover:text-primary-600 font-semibold text-sm">→</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} icon={Save} size="lg">Save Settings</Button>
      </div>
    </div>
  );
}
