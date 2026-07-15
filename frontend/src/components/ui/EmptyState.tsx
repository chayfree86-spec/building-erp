import { AlertCircle, FileX, WifiOff, ShieldOff, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

type IconKey = 'empty' | 'error' | 'offline' | 'denied';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: IconKey | LucideIcon;
  action?: { label: string; onClick: () => void };
}

const builtinIcons: Record<IconKey, LucideIcon> = {
  empty: FileX,
  error: AlertCircle,
  offline: WifiOff,
  denied: ShieldOff,
};

export function EmptyState({ title = 'No data found', description, icon = 'empty', action }: EmptyStateProps) {
  const Icon: LucideIcon = typeof icon === 'string' ? builtinIcons[icon] || FileX : icon;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-500 mb-4 text-center max-w-sm">{description}</p>}
      {action && <Button variant="primary" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
