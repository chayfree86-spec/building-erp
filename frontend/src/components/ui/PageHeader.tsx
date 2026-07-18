import type { ReactNode } from 'react';
import { Button } from './Button';
import { Plus, type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon; loading?: boolean };
  children?: ReactNode;
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {description && <p className="text-neutral-500 text-sm mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {children}
        {action && (
          <Button variant="primary" icon={action.icon ?? Plus} loading={action.loading} onClick={action.onClick} className="w-full sm:w-auto justify-center">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
