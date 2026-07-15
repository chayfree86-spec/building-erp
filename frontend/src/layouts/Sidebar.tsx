import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, ShoppingCart, Package, Users, Truck, CreditCard,
  RotateCcw, ArrowRightLeft, BarChart3, Shield, FileText, Settings,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Sales', icon: Receipt, path: '/invoices' },
  { label: 'Purchases', icon: ShoppingCart, path: '/purchases' },
  { label: 'Inventory', icon: Package, path: '/stock' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Suppliers', icon: Truck, path: '/suppliers' },
  { label: 'Payments', icon: CreditCard, path: '/customer-payments' },
  { label: 'Returns', icon: RotateCcw, path: '/purchase-returns' },
  { label: 'Transfers', icon: ArrowRightLeft, path: '/stock-transfers' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Users & Roles', icon: Shield, path: '/users' },
  { label: 'Audit Logs', icon: FileText, path: '/audit-logs' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-neutral-200 shrink-0">
        <img src="/logo.png" alt="Build ERP" className="w-9 h-9 rounded-xl object-contain shrink-0" />
        {!collapsed && <span className="font-bold text-neutral-900 text-lg whitespace-nowrap">Build ERP</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive: active }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active || isActive(item.path)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`
            }
          >
            <item.icon className={`w-5 h-5 shrink-0 ${isActive(item.path) ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-neutral-200 p-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.mobile}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`relative hidden lg:flex flex-col h-screen bg-white border-r border-neutral-200 transition-all duration-300 shrink-0
        ${collapsed ? 'w-20' : 'w-64'}`}>
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 z-10 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronLeft className="w-3.5 h-3.5 text-neutral-500" />}
        </button>
        <NavContent />
      </aside>
    </>
  );
}
