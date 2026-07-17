import { useNavigate } from 'react-router-dom';
import { Grid3X3 } from 'lucide-react';

const links = [
  { label: 'Customer Ledger', path: '/ledgers/customer', desc: 'View customer transaction history' },
  { label: 'Supplier Ledger', path: '/ledgers/supplier', desc: 'View supplier transaction history' },
  { label: 'Inventory Ledger', path: '/ledgers/inventory', desc: 'Track stock movements' },
  { label: 'Stock Adjustments', path: '/stock-adjustments', desc: 'Manual stock corrections' },
  { label: 'Stock Batches', path: '/stock/batch', desc: 'FIFO batch tracking' },
  { label: 'Permissions', path: '/permissions', desc: 'System permissions overview' },
];

export function MorePage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">More</h1>
      <p className="text-neutral-500">Additional modules and utilities</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {links.map(link => (
          <button key={link.path} onClick={() => navigate(link.path)} className="card p-5 text-left hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-neutral-900">{link.label}</h3>
            <p className="text-sm text-neutral-500 mt-1">{link.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
