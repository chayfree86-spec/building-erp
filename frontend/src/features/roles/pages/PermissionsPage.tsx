import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '@/services/api-endpoints';
import { Search, RotateCcw, Key } from 'lucide-react';

export function PermissionsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => { const { data } = await permissionsApi.list(); return data; },
  });
  const raw = (data as any)?.data;
  const permissions = Array.isArray(raw) ? raw : (raw?.data || []);
  const filtered = search
    ? permissions.filter((p: any) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.module.toLowerCase().includes(search.toLowerCase())
      )
    : permissions;

  const moduleColors: Record<string, string> = {
    products: 'bg-blue-50 text-blue-700', customers: 'bg-green-50 text-green-700',
    suppliers: 'bg-purple-50 text-purple-700', purchases: 'bg-orange-50 text-orange-700',
    sales: 'bg-emerald-50 text-emerald-700', stock: 'bg-cyan-50 text-cyan-700',
    users: 'bg-pink-50 text-pink-700', roles: 'bg-indigo-50 text-indigo-700',
    settings: 'bg-neutral-100 text-neutral-700', reports: 'bg-teal-50 text-teal-700',
    auth: 'bg-red-50 text-red-700', stores: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Permissions" description="All system permissions organized by module" />
      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search permission name, module..." className="input-field has-icon" />
        </div>
      </div>
      {isLoading ? <CardSkeleton count={8} /> : isError ? (
        <EmptyState icon="error" title="Failed to load" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Key} title="No permissions found" />
      ) : (
        <DataTable
          data={filtered} keyExtractor={(p: any) => p.id}
          columns={[
            { key: 'name', header: 'Permission', render: (p: any) => (
              <div><p className="font-medium text-neutral-900">{p.name}</p><p className="text-xs text-neutral-500 font-mono">{p.slug}</p></div>
            )},
            { key: 'module', header: 'Module', render: (p: any) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${moduleColors[p.module] || 'bg-neutral-100 text-neutral-600'}`}>{p.module}</span>
            )},
            { key: 'action', header: 'Action', hideOnMobile: true, render: (p: any) => (
              <span className="text-sm font-medium capitalize">{p.action}</span>
            )},
            { key: 'description', header: 'Description', hideOnMobile: true, render: (p: any) => (
              <span className="text-sm text-neutral-500">{p.description || '-'}</span>
            )},
          ]}
        />
      )}
    </div>
  );
}
