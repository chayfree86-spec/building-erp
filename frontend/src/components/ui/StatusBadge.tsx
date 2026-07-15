export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'badge-draft',
    submitted: 'badge-submitted',
    pending: 'badge-pending',
    approved: 'badge-approved',
    confirmed: 'badge-confirmed',
    paid: 'badge-paid',
    partially_paid: 'badge-partial',
    unpaid: 'badge-unpaid',
    cancelled: 'badge-cancelled',
    reversed: 'badge-reversed',
    returned: 'badge-returned',
    low_stock: 'badge-low-stock',
    out_of_stock: 'badge-out-stock',
    inactive: 'badge-inactive',
    active: 'badge-confirmed',
    dispatched: 'badge-submitted',
    received: 'badge-confirmed',
  };

  const cls = map[status] || 'badge-draft';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return <span className={cls}>{label}</span>;
}
