import { TrendingUp, TrendingDown, DollarSign, Users, Package, AlertTriangle, Clock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const kpiCards = [
  { title: 'Today Sales', value: '₹1,25,500', change: '+12.5%', trend: 'up', color: 'blue', icon: TrendingUp },
  { title: 'Today Collection', value: '₹98,200', change: '+8.2%', trend: 'up', color: 'emerald', icon: DollarSign },
  { title: 'Today Purchase', value: '₹45,800', change: '-3.1%', trend: 'down', color: 'indigo', icon: TrendingDown },
  { title: 'Customer Outstanding', value: '₹3,52,400', change: '+5.7%', trend: 'up', color: 'orange', icon: Users },
  { title: 'Supplier Outstanding', value: '₹2,15,600', change: '-2.1%', trend: 'down', color: 'cyan', icon: Users },
  { title: 'Stock Value', value: '₹18,50,000', change: '+1.2%', trend: 'up', color: 'purple', icon: Package },
  { title: 'Low Stock Items', value: '12', change: '', trend: '', color: 'red', icon: AlertTriangle },
  { title: 'Pending Approval', value: '5', change: '', trend: '', color: 'amber', icon: Clock },
];

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
  red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
};

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Overview of your building materials business</p>
        </div>
        <div className="flex gap-2">
          {['Today', 'Week', 'Month'].map((p) => (
            <button key={p} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${p === 'Today' ? 'btn-primary !py-2' : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <Link key={card.title} to="/reports" className="card hover:shadow-md transition-shadow p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${c.icon}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="text-sm text-neutral-500 mb-1">{card.title}</p>
              <p className="text-xl lg:text-2xl font-bold text-neutral-900 tabular-nums">{card.value}</p>
              {card.change && (
                <p className={`text-xs font-medium mt-1 ${card.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {card.change} vs last period
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-base font-semibold text-neutral-900 mb-4">Daily Sales Trend</h3>
          <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <p className="text-neutral-400 text-sm">Chart will appear here</p>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-base font-semibold text-neutral-900 mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {['Cement (OPC 53)', 'TMT Steel Bar', 'M Sand', 'Clay Bricks', 'Granite Slab'].map((p, i) => (
              <div key={p} className="flex items-center gap-3">
                <span className="text-sm font-bold text-neutral-400 w-6">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">{p}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${90 - i * 15}%` }} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-neutral-900 tabular-nums">₹{((5 - i) * 28500).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-900">Recent Transactions</h3>
          <Link to="/invoices" className="text-sm text-primary-600 font-medium hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left py-3 px-3 font-medium text-neutral-500">Type</th>
                <th className="text-left py-3 px-3 font-medium text-neutral-500">Number</th>
                <th className="text-left py-3 px-3 font-medium text-neutral-500">Party</th>
                <th className="text-right py-3 px-3 font-medium text-neutral-500">Amount</th>
                <th className="text-left py-3 px-3 font-medium text-neutral-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Invoice', num: 'INV-2026-00125', party: 'Mohan Construction', amount: '₹85,500', status: 'confirmed' },
                { type: 'Payment', num: 'RCPT-2026-00089', party: 'Ravi Builders', amount: '₹52,000', status: 'confirmed' },
                { type: 'Purchase', num: 'PO-2026-00056', party: 'Cement Corp Ltd', amount: '₹1,25,000', status: 'confirmed' },
                { type: 'Return', num: 'SR-2026-00012', party: 'Gupta Hardware', amount: '₹8,200', status: 'confirmed' },
                { type: 'Transfer', num: 'TRF-2026-00008', party: 'Store A → Store B', amount: '₹35,000', status: 'dispatched' },
              ].map((t) => (
                <tr key={t.num} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-3"><span className={`badge-${t.status === 'dispatched' ? 'pending' : t.status}`}>{t.type}</span></td>
                  <td className="py-3 px-3 font-medium text-neutral-700">{t.num}</td>
                  <td className="py-3 px-3 text-neutral-600">{t.party}</td>
                  <td className="py-3 px-3 text-right font-semibold tabular-nums">{t.amount}</td>
                  <td className="py-3 px-3"><span className={`badge-${t.status === 'dispatched' ? 'pending' : t.status}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
