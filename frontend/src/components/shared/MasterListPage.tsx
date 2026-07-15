import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Input } from '@/components/ui/Input';
import { Search, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import type { ApiResponse } from '@/types';

interface MasterListConfig<T> {
  title: string;
  description: string;
  addLabel: string;
  addPath: string;
  queryKey: string;
  queryFn: () => Promise<{ data: ApiResponse<T[]> }>;
  columns: {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
    hideOnMobile?: boolean;
  }[];
  statusField?: string;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
}

export function MasterListPage<T extends { id: number; status?: string }>({
  title, description, addLabel, addPath, queryKey, queryFn, columns, statusField, onRowClick, searchPlaceholder,
}: MasterListConfig<T>) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [queryKey, search, status],
    queryFn,
  });

  const items = data?.data || [];
  const filtered = search ? items.filter((item: any) =>
    Object.values(item).some(v => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase()))
  ) : items;
  const finalItems = status ? filtered.filter((item: any) => item.status === status || item[statusField || 'status'] === status) : filtered;

  const cols = [...columns];
  if (statusField !== false) {
    cols.push({
      key: 'status', header: 'Status',
      render: (item: T) => <StatusBadge status={(item as any)[statusField || 'status'] || item.status || 'active'} />,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} action={{ label: addLabel, onClick: () => window.location.href = addPath }} />
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`} className="input-field pl-10" />
          </div>
          <SearchableSelect placeholder="All Status" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={status} onChange={setStatus} />
          <Button variant="ghost" icon={RotateCcw} onClick={() => { setSearch(''); setStatus(''); }}>Reset</Button>
        </div>
      </div>
      {isLoading ? <CardSkeleton count={5} /> : isError ? (
        <EmptyState icon="error" title={`Failed to load ${title.toLowerCase()}`} action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : (
        <DataTable data={finalItems} keyExtractor={item => item.id} columns={cols} onRowClick={onRowClick} />
      )}
    </div>
  );
}
