import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, ShoppingCart, Package, MoreHorizontal, Plus } from 'lucide-react';

const mobileItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Sales', icon: Receipt, path: '/invoices' },
  { label: 'Purchase', icon: ShoppingCart, path: '/purchases' },
  { label: 'Products', icon: Package, path: '/products' },
  { label: 'Stock', icon: Package, path: '/stock' },
  { label: 'More', icon: MoreHorizontal, path: '/more' },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-30 pb-safe">
      <div className="flex items-center justify-around h-16">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 px-2 py-1 rounded-lg transition-colors ${
                isActive ? 'text-primary-600' : 'text-neutral-400'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Floating Quick Action Button */}
      <button className="absolute -top-6 right-4 w-12 h-12 rounded-full btn-warning !p-0 shadow-lg !rounded-full
        flex items-center justify-center active:scale-95 !text-lg">
        <Plus className="w-6 h-6" />
      </button>
    </nav>
  );
}
