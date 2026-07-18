import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { ShoppingCart, Package, AlertTriangle, Plus, List, Boxes, Sliders, RotateCcw } from 'lucide-react';

export function PurchaseStockHub() {
  const navigate = useNavigate();

  const primaryCards = [
    {
      label: 'New Purchase',
      desc: 'Record a new supplier bill',
      icon: Plus,
      path: '/purchases/new',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: 'View Stock',
      desc: 'Check current stock levels',
      icon: Package,
      path: '/stock',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      label: 'Low Stock',
      desc: 'Items needing replenishment',
      icon: AlertTriangle,
      path: '/reports', // Redirects to reports, where they can click low stock
      color: 'bg-red-50 text-red-600 border-red-100',
    },
  ];

  const secondaryLinks = [
    { label: 'Purchase Invoices List', icon: List, path: '/purchases' },
    { label: 'Batch-wise Stock', icon: Boxes, path: '/stock/batch' },
    { label: 'Stock Adjustments', icon: Sliders, path: '/stock-adjustments' },
    { label: 'Purchase Returns', icon: RotateCcw, path: '/purchase-returns' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Purchase & Stock" description="Combined inventory and purchasing operations" />

      {/* Primary Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {primaryCards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm text-left hover:shadow-md transition-all active:scale-98"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-[15px]">{card.label}</h3>
              <p className="text-xs text-neutral-500 mt-1">{card.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Secondary List Links */}
      <div className="card rounded-2xl p-2 space-y-0.5">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">All Operations</h4>
        </div>
        <div className="divide-y divide-neutral-100">
          {secondaryLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 text-left transition-colors active:bg-neutral-100/50"
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-semibold text-neutral-700">{link.label}</span>
              </div>
              <span className="text-neutral-400 font-semibold text-sm">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
