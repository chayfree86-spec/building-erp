import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/services/api-endpoints';
import { formatDate } from '@/utils/format';
import { Search, RotateCcw, Shield, UserPlus, Pencil, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users', search, status],
    queryFn: async () => { const { data } = await usersApi.list({ search: search || undefined, status: status || undefined }); return data; },
  });
  const raw = (data as any)?.data;
  const users = Array.isArray(raw) ? raw : (raw?.data || []);

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP VERSION (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
        <PageHeader title="Users & Roles" description="Manage system users and their roles" action={{ label: 'Add User', onClick: () => navigate('/users/new') }} />
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, mobile..." className="input-field has-icon" />
            </div>
            <SearchableSelect placeholder="All Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={status} onChange={setStatus} />
            <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
          </div>
        </div>
        {isLoading ? <CardSkeleton count={5} /> : isError ? (
          <EmptyState icon="error" title="Failed to load users" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : users.length === 0 ? (
          <EmptyState icon={Shield} title="No users found" description="Add users to the system." action={{ label: 'Add User', onClick: () => navigate('/users/new') }} />
        ) : (
          <DataTable
            data={users}
            keyExtractor={(u: any) => u.id}
            columns={[
              { key: 'name', header: 'User', render: (u: any) => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {u.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{u.name}</p>
                    <p className="text-xs text-neutral-500">{u.email || u.mobile || 'No contact'}</p>
                  </div>
                </div>
              )},
              { key: 'roles', header: 'Roles', hideOnMobile: true, render: (u: any) => (
                <div className="flex flex-wrap gap-1">
                  {u.roles?.length ? u.roles.map((r: any) => <span key={r.id} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{r.name}</span>) : <span className="text-xs text-neutral-400">No roles</span>}
                </div>
              )},
              { key: 'stores', header: 'Assigned Stores', hideOnMobile: true, render: (u: any) => (
                <div className="flex flex-wrap gap-1">
                  {u.stores?.length ? u.stores.map((s: any) => <span key={s.id} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">{s.name}</span>) : <span className="text-xs text-neutral-400">-</span>}
                </div>
              )},
              { key: 'last_login', header: 'Last Login', hideOnMobile: true, render: (u: any) => u.last_login_at ? formatDate(u.last_login_at) : 'Never' },
              { key: 'status', header: 'Status', render: (u: any) => <StatusBadge status={u.status} /> },
              { key: 'actions', header: '', hideOnMobile: true, className: 'text-right w-16', render: (u: any) => (
                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/users/${u.id}`)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )},
            ]}
            onRowClick={u => navigate(`/users/${u.id}`)}
          />
        )}
      </div>

      {/* ─── PWA MOBILE VERSION (Optimized Cards Layout) ─── */}
      <div className="md:hidden space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Staff Users</h1>
            <p className="text-neutral-500 text-xs mt-0.5">Manage system users and access</p>
          </div>
          <button
            onClick={() => navigate('/users/new')}
            className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md flex items-center justify-center active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm space-y-2">
          <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email, mobile..."
                className="input-field has-icon w-full py-1.5 text-xs rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableSelect placeholder="All Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={status} onChange={setStatus} />
              </div>
              <button onClick={() => { setSearch(''); setStatus(''); }} className="px-3 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold active:scale-95 transition-all">
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cards List */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-neutral-100 rounded-[20px] animate-pulse" />
            <div className="h-20 bg-neutral-100 rounded-[20px] animate-pulse" />
          </div>
        ) : isError ? (
          <EmptyState icon="error" title="Failed to load users" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : users.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[24px] border border-neutral-200/50 p-6 space-y-2 shadow-sm">
            <Shield className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u: any) => (
              <div
                key={u.id}
                onClick={() => navigate(`/users/${u.id}`)}
                className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-neutral-800">{u.name}</h3>
                        <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">{u.email || u.mobile || 'No contact'}</p>
                      </div>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>

                  <div className="py-2 px-2.5 bg-neutral-50/50 rounded-xl border border-neutral-100/70 text-[10px] space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-neutral-400 uppercase tracking-wider scale-95 origin-left">Roles</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {u.roles?.length ? u.roles.map((r: any) => <span key={r.id} className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-md font-bold">{r.name}</span>) : <span className="text-neutral-400">-</span>}
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-neutral-400 uppercase tracking-wider scale-95 origin-left">Stores</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {u.stores?.length ? u.stores.map((s: any) => <span key={s.id} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">{s.name}</span>) : <span className="text-neutral-400">-</span>}
                      </div>
                    </div>
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
