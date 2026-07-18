import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Plus, Package, MoreHorizontal } from 'lucide-react';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Customers', icon: Users, path: '/customers' },
    { label: 'New Sale', icon: Plus, path: '/invoices/new', isAction: true },
    { label: 'Stock', icon: Package, path: '/purchase-stock' },
    { label: 'More', icon: MoreHorizontal, path: '/more' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200/80 backdrop-blur-md z-40 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around h-16 relative px-2">
        {navItems.map((item) => {
          if (item.isAction) {
            const isActionActive = location.pathname === item.path;
            return (
              <div key={item.path} className="relative w-16 h-16 flex items-center justify-center -mt-6">
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex flex-col items-center justify-center shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 border-4 border-white ${
                    isActionActive ? 'scale-105 ring-2 ring-primary-500/30' : ''
                  }`}
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                </button>
              </div>
            );
          }

          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 w-14 py-1.5 transition-colors select-none ${
                isActive ? 'text-primary-600 font-semibold' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-primary-600 stroke-[2.2]' : ''}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
