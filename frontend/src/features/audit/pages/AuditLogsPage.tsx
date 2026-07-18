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

  const getActionBadge = (action: string) => {
    const act = action?.toLowerCase() || '';
    if (act === 'delete' || act === 'destroy') return 'bg-red-50 text-red-700 border-red-100';
    if (act === 'create' || act === 'store') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  return (
    <div className="space-y-6">
      
      {/* ─── DESKTOP VERSION (Unchanged) ─── */}
      <div className="hidden md:block space-y-6">
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

      {/* ─── PWA MOBILE VERSION (Optimized Cards Layout) ─── */}
      <div className="md:hidden space-y-4 pb-16">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Audit Logs</h1>
          <p className="text-neutral-500 text-xs mt-0.5">Track system activities and changes</p>
        </div>

        {/* Filter Card */}
        <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm space-y-2">
          <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search module, action, user..."
                className="input-field has-icon w-full py-1.5 text-xs rounded-xl"
              />
            </div>
            <button
              onClick={() => setSearch('')}
              className="w-full py-2 bg-neutral-50 border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Search
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
          <EmptyState icon="error" title="Failed to load audit logs" action={{ label: 'Retry', onClick: () => refetch() }} />
        ) : logs.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[24px] border border-neutral-200/50 p-6 space-y-2 shadow-sm">
            <FileText className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">No logs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((l: any) => (
              <div
                key={l.id}
                className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm"
              >
                <div className="rounded-[20px] bg-white p-3.5 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,1)] text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-neutral-800">{l.user?.name || 'System'}</h3>
                      <span className="text-[10px] text-neutral-400 font-semibold block mt-0.5">
                        {formatDate(l.created_at)} {l.created_at ? new Date(l.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider scale-95 origin-right ${getActionBadge(l.action)}`}>
                      {l.action}
                    </span>
                  </div>

                  <div className="py-2.5 px-3 bg-neutral-50/50 rounded-xl border border-neutral-100/70 text-[10px] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="font-bold text-neutral-400 uppercase tracking-wider scale-95 origin-left">Module</span>
                      <span className="font-bold text-neutral-700">{l.module}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-neutral-400 uppercase tracking-wider scale-95 origin-left">Record</span>
                      <span className="font-semibold text-neutral-600">{l.record_type}{l.record_id ? ` #${l.record_id}` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-neutral-400 uppercase tracking-wider scale-95 origin-left">IP Address</span>
                      <span className="font-mono text-neutral-400">{l.ip_address || '-'}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-600 leading-normal font-medium pl-1">
                    {l.summary || l.description || '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
