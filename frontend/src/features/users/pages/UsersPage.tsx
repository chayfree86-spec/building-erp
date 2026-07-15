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
import { Search, RotateCcw, Shield, UserPlus } from 'lucide-react';
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
      <PageHeader title="Users & Roles" description="Manage system users and their roles" action={{ label: 'Add User', onClick: () => navigate('/users/new') }} />
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, mobile..." className="input-field pl-10" />
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
            { key: 'last_login', header: 'Last Login', hideOnMobile: true, render: (u: any) => u.last_login_at ? formatDate(u.last_login_at) : 'Never' },
            { key: 'status', header: 'Status', render: (u: any) => <StatusBadge status={u.status} /> },
          ]}
        />
      )}
    </div>
  );
}
