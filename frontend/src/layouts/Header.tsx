import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Bell, Wifi, WifiOff, LogOut, User, Settings, ChevronDown, Store as StoreIcon } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const { user, stores, activeStoreId, setActiveStore, logout } = useAuth();
  const [storeOpen, setStoreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const storeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [online] = useState(navigator.onLine);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeStore = activeStoreId === 'all' ? null : stores.find(s => s.id.toString() === activeStoreId);

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left: Store Selector */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={storeRef}>
          <button
            onClick={() => setStoreOpen(!storeOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-sm font-medium text-neutral-700 transition-colors"
          >
            <StoreIcon className="w-4 h-4 text-primary-600" />
            <span className="max-w-[120px] truncate hidden sm:inline">
              {activeStoreId === 'all' ? 'All Stores' : activeStore?.name || 'Select Store'}
            </span>
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>

          {storeOpen && (
            <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 py-1 max-h-64 overflow-y-auto">
              <button
                onClick={() => { setActiveStore('all'); setStoreOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 ${activeStoreId === 'all' ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700'}`}
              >
                All Stores
              </button>
              {stores.map(store => (
                <button
                  key={store.id}
                  onClick={() => { setActiveStore(store.id.toString()); setStoreOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 ${activeStoreId === store.id.toString() ? 'bg-primary-50 text-primary-700 font-medium' : 'text-neutral-700'}`}
                >
                  {store.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products, invoices, customers..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            onKeyDown={(e) => { if (e.key === 'Enter') { navigate('/products?search=' + e.currentTarget.value); setSearchOpen(false); } }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Online Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium">
          {online ? (
            <><Wifi className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">Online</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-red-500" /><span className="text-red-600">Offline</span></>
          )}
        </div>

        {/* Quick Create */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="btn-warning gap-1.5 !py-2 !px-3 text-xs sm:text-sm hidden sm:flex"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Create</span>
        </button>

        {/* Notifications */}
        <button className="btn-icon relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-neutral-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg z-30 py-1">
              <div className="px-4 py-2.5 border-b border-neutral-100">
                <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                <p className="text-xs text-neutral-500">{user?.mobile}</p>
              </div>
              <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50">
                <User className="w-4 h-4" /> Profile
              </Link>
              <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button onClick={() => { setUserMenuOpen(false); logout(); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
