import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '@/services/api-endpoints';
import { Search, RotateCcw, Shield } from 'lucide-react';

export function RolesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => { const { data } = await rolesApi.list(); return data; },
  });
  const raw = (data as any)?.data;
  const roles = Array.isArray(raw) ? raw : (raw?.data || []);
  const filtered = search ? roles.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase())) : roles;
  const final = status ? filtered.filter((r: any) => r.status === status) : filtered;

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Manage user roles and their permissions" action={{ label: 'Add Role', onClick: () => {} }} />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search role name..." className="input-field has-icon" />
          </div>
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={4} /> : isError ? (
        <EmptyState icon="error" title="Failed to load roles" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : final.length === 0 ? (
        <EmptyState icon={Shield} title="No roles found" />
      ) : (
        <DataTable
          data={final}
          keyExtractor={(r: any) => r.id}
          columns={[
            { key: 'name', header: 'Role', render: (r: any) => (
              <div>
                <p className="font-medium text-neutral-900">{r.name}</p>
                <p className="text-xs text-neutral-500">{r.slug}</p>
              </div>
            )},
            { key: 'description', header: 'Description', hideOnMobile: true, render: (r: any) => r.description || '-' },
            { key: 'permissions', header: 'Permissions', hideOnMobile: true, render: (r: any) => (
              <span className="text-sm text-neutral-600">{r.permissions?.length || 0} permissions</span>
            )},
            { key: 'is_system', header: 'Type', hideOnMobile: true, render: (r: any) => r.is_system ? <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">System</span> : <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Custom</span> },
            { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
          ]}
        />
      )}
    </div>
  );
}
