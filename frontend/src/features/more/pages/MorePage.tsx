import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  CreditCard, RotateCcw, Sliders, ArrowRightLeft, BookOpen,
  BarChart3, Users, Shield, FileText, Settings,
  User, LogOut
} from 'lucide-react';

export function MorePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const groups = [
    {
      title: 'Transactions',
      items: [
        { label: 'Customer Payments', icon: CreditCard, path: '/customer-payments', desc: 'Received payments' },
        { label: 'Supplier Payments', icon: CreditCard, path: '/supplier-payments', desc: 'Paid amounts' },
        { label: 'Sales Returns', icon: RotateCcw, path: '/sales-returns', desc: 'Customer returns' },
        { label: 'Purchase Returns', icon: RotateCcw, path: '/purchase-returns', desc: 'Supplier returns' },
        { label: 'Stock Adjustments', icon: Sliders, path: '/stock-adjustments', desc: 'Manual stock fixes' },
        { label: 'Store Transfers', icon: ArrowRightLeft, path: '/stock-transfers', desc: 'Stock between stores' },
      ]
    },
    {
      title: 'Ledgers',
      items: [
        { label: 'Customer Ledger', icon: BookOpen, path: '/ledgers/customer', desc: 'Customer transactions' },
        { label: 'Supplier Ledger', icon: BookOpen, path: '/ledgers/supplier', desc: 'Supplier transactions' },
        { label: 'Inventory Ledger', icon: BookOpen, path: '/ledgers/inventory', desc: 'Stock movements' },
      ]
    },
    {
      title: 'Reports & Analytics',
      items: [
        { label: 'All Reports & BI', icon: BarChart3, path: '/reports', desc: 'Sales, Purchase, Stock & Profit analysis' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'Suppliers', icon: Users, path: '/suppliers', desc: 'Manage suppliers list' },
        { label: 'Staff Users', icon: Users, path: '/users', desc: 'System users management' },
        { label: 'Roles & Permissions', icon: Shield, path: '/roles', desc: 'Access rights control' },
        { label: 'Audit Logs', icon: FileText, path: '/audit-logs', desc: 'System event logs' },
        { label: 'General Settings', icon: Settings, path: '/settings', desc: 'System configuration' },
      ]
    },
    {
      title: 'Account',
      items: [
        { label: 'My Profile', icon: User, path: '/settings', desc: 'User information' },
        { label: 'Logout', icon: LogOut, action: () => logout(), desc: 'Sign out of the system', isDanger: true },
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* ─── DESKTOP VERSION (Unchanged) ─── */}
      <div className="hidden md:block space-y-8">
        <PageHeader title="More Modules" description="All additional modules and system management" />

        {groups.map((group) => (
          <div key={group.title} className="space-y-3">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">{group.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.action ? item.action() : navigate(item.path!)}
                  className={`flex items-start gap-4 p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm text-left hover:shadow-md transition-all active:scale-98 ${
                    item.isDanger ? 'hover:border-red-200' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    item.isDanger 
                      ? 'bg-red-50 text-red-600 border-red-100' 
                      : 'bg-neutral-50 text-neutral-600 border-neutral-100'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm ${item.isDanger ? 'text-red-600' : 'text-neutral-800'}`}>{item.label}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ─── PWA MOBILE VERSION (Optimized Settings List) ─── */}
      <div className="md:hidden space-y-6 pb-16">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">More Modules</h1>
          <p className="text-neutral-500 text-xs mt-0.5">Access additional business modules</p>
        </div>

        {groups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1">{group.title}</h2>
            
            {/* Doppelrand nested list shell */}
            <div className="rounded-[24px] p-1 bg-neutral-100/60 border border-neutral-200/50 shadow-sm">
              <div className="rounded-[20px] bg-white overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,1)] divide-y divide-neutral-100/70">
                {group.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => item.action ? item.action() : navigate(item.path!)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 active:bg-neutral-100/50 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        item.isDanger 
                          ? 'bg-red-50 text-red-600 border-red-100/60' 
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200/60'
                      }`}>
                        <item.icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className={`text-xs font-bold ${item.isDanger ? 'text-red-600' : 'text-neutral-800'}`}>{item.label}</h3>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <span className="text-neutral-400 font-bold text-xs pr-1">&rarr;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
