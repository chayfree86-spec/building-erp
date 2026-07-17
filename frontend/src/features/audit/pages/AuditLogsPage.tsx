import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/services/api-endpoints';
import { formatDate } from '@/utils/format';
import { Search, RotateCcw, FileText } from 'lucide-react';

export function AuditLogsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['audit-logs', search],
    queryFn: async () => { const { data } = await auditApi.list({ search: search || undefined }); return data; },
  });
  const raw = (data as any)?.data;
  const logs = Array.isArray(raw) ? raw : (raw?.data || []);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Track all system activities and changes" />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search module, action, user..." className="input-field has-icon" />
          </div>
          <Button variant="ghost" icon={RotateCcw} onClick={() => setSearch('')}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={8} /> : isError ? (
        <EmptyState icon="error" title="Failed to load audit logs" action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : logs.length === 0 ? (
        <EmptyState icon={FileText} title="No audit logs" description="Activities will appear here as you use the system." />
      ) : (
        <DataTable
          data={logs}
          keyExtractor={(l: any) => l.id}
          columns={[
            { key: 'timestamp', header: 'Date & Time', render: (l: any) => (
              <div>
                <p className="text-sm font-medium">{formatDate(l.created_at)}</p>
                <p className="text-xs text-neutral-500">{l.created_at ? new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}</p>
              </div>
            )},
            { key: 'user', header: 'User', render: (l: any) => (
              <div>
                <p className="text-sm font-medium">{l.user?.name || 'System'}</p>
                <p className="text-xs text-neutral-500">ID: {l.user_id || 'N/A'}</p>
              </div>
            )},
            { key: 'module', header: 'Module', hideOnMobile: true, render: (l: any) => <span className="text-xs bg-neutral-100 px-2 py-0.5 rounded-full font-medium">{l.module}</span> },
            { key: 'action', header: 'Action', render: (l: any) => <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.action === 'delete' || l.action === 'destroy' ? 'bg-red-50 text-red-700' : l.action === 'create' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{l.action}</span> },
            { key: 'record', header: 'Record', hideOnMobile: true, render: (l: any) => (
              <span className="text-xs text-neutral-500">{l.record_type}{l.record_id ? ` #${l.record_id}` : ''}</span>
            )},
            { key: 'summary', header: 'Summary', hideOnMobile: true, render: (l: any) => l.summary || l.description || '-' },
            { key: 'ip', header: 'IP', hideOnMobile: true, render: (l: any) => <span className="text-xs text-neutral-400 font-mono">{l.ip_address || '-'}</span> },
          ]}
        />
      )}
    </div>
  );
}
