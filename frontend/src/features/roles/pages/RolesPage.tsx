import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '@/services/api-endpoints';
import { Search, RotateCcw, Shield, Plus } from 'lucide-react';

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
      
      {/* ─── DESKTOP VERSION (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
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
              { key: 'is_system', header: 'Type', hideOnMobile: true, render: (r: any) => r.is_system ? <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">System</span> : <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">Custom</span> },
              { key: 'status', header: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
            ]}
          />
        )}
      </div>

      {/* ─── PWA MOBILE VERSION (Optimized Cards Layout) ─── */}
      <div className="md:hidden space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Roles</h1>
            <p className="text-neutral-500 text-xs mt-0.5">Manage user access permissions</p>
          </div>
          <button
            onClick={() => {}}
            className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md flex items-center justify-center active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm space-y-2">
          <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search role name..."
                className="input-field has-icon w-full py-1.5 text-xs rounded-xl"
              />
            </div>
            <button onClick={() => { setSearch(''); setStatus(''); }} className="w-full py-2 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold active:scale-95 transition-all">
              Reset Filters
            </button>
          </div>
        </div>

        {/* Mobile Cards List */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-neutral-100 rounded-[20px] animate-pulse" />
            <div className="h-20 bg-neutral-100 rounded-[20px] animate-pulse" />
          </div>
        ) : isError ? (
          <EmptyState icon="error" title="Failed to load roles" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : final.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[24px] border border-neutral-200/50 p-6 space-y-2 shadow-sm">
            <Shield className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">No roles found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {final.map((r: any) => (
              <div
                key={r.id}
                className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm"
              >
                <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-bold text-neutral-800">{r.name}</h3>
                      <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">{r.slug}</span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <p className="text-[11px] text-neutral-500 leading-normal bg-neutral-50/50 p-2.5 rounded-xl border border-neutral-100/70">
                    {r.description || 'No description provided.'}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold">
                    <span className={`px-2 py-0.5 rounded-full border ${
                      r.is_system ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {r.is_system ? 'System' : 'Custom'}
                    </span>
                    <span className="text-neutral-500">{r.permissions?.length || 0} permissions</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
