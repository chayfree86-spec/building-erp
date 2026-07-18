import { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, User, Settings, ChevronDown, Store as StoreIcon, Boxes, Receipt, ShoppingCart, Users, Truck } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/services/api';

export function Header() {
  const { user, stores, activeStoreId, setActiveStore, logout } = useAuth();
  const [storeOpen, setStoreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const storeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (storeRef.current && !storeRef.current.contains(e.target as Node)) setStoreOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const { data } = await apiClient.get('/reports/global-search', { params: { query: searchQuery } });
        if (data?.success) {
          setResults(data.data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

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
      <div className="hidden md:flex flex-1 max-w-md mx-4 relative" ref={searchContainerRef}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search products, invoices, customers..."
            value={searchQuery || ''}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
          {showDropdown && results && (
            <div className="absolute top-full mt-1.5 left-0 w-full bg-white border border-neutral-200 rounded-xl shadow-xl z-50 max-h-[480px] overflow-y-auto p-4 space-y-4">
              {loading && (
                <div className="text-center py-2 text-xs text-neutral-400 flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-500"></span>
                  Searching...
                </div>
              )}

              {/* No results condition */}
              {!loading && 
               (!results.products?.length && 
                !results.customers?.length && 
                !results.suppliers?.length && 
                !results.invoices?.length && 
                !results.purchases?.length) && (
                  <div className="text-center py-4 text-sm text-neutral-400">
                    No matches found for "{searchQuery}"
                  </div>
              )}

              {/* Products */}
              {results.products?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-primary-500" /> Products
                  </h4>
                  <div className="space-y-1">
                    {results.products.map((p: any) => (
                      <Link
                        key={p.id}
                        to="/products"
                        onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                        className="block px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-neutral-400">SKU: {p.sku} • Min Stock: {p.minimum_stock}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {results.invoices?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-500" /> Sales Invoices
                  </h4>
                  <div className="space-y-1">
                    {results.invoices.map((inv: any) => (
                      <Link
                        key={inv.id}
                        to={`/invoices/${inv.id}`}
                        onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                        className="block px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{inv.invoice_number}</span>
                          <span className="text-xs text-neutral-500 font-mono">₹{Number(inv.total_amount).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {inv.customer_name_snapshot || inv.customer?.name || 'Walk-in'} • {inv.invoice_date}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchases */}
              {results.purchases?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" /> Purchases
                  </h4>
                  <div className="space-y-1">
                    {results.purchases.map((pur: any) => (
                      <Link
                        key={pur.id}
                        to={`/purchases/${pur.id}`}
                        onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                        className="block px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{pur.purchase_number}</span>
                          <span className="text-xs text-neutral-500 font-mono">₹{Number(pur.total_amount).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-neutral-400">
                          {pur.supplier?.name} • Invoice: {pur.supplier_invoice_number || 'N/A'}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {results.customers?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-orange-500" /> Customers
                  </h4>
                  <div className="space-y-1">
                    {results.customers.map((c: any) => (
                      <Link
                        key={c.id}
                        to="/customers"
                        onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                        className="block px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-neutral-400">Mobile: {c.mobile} • GSTIN: {c.gstin || 'N/A'}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers */}
              {results.suppliers?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-cyan-500" /> Suppliers
                  </h4>
                  <div className="space-y-1">
                    {results.suppliers.map((s: any) => (
                      <Link
                        key={s.id}
                        to="/suppliers"
                        onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                        className="block px-3 py-2 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-neutral-400">Mobile: {s.mobile} • GSTIN: {s.gstin || 'N/A'}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">

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
