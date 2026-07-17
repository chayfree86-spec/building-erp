import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi } from '@/services/api-endpoints';
import type { User, Store } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  stores: Store[];
  activeStoreId: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveStore: (storeId: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    stores: [],
    activeStoreId: localStorage.getItem('active_store_id') || 'all',
    isLoading: !!localStorage.getItem('auth_token'),
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const { data: userRes } = await authApi.me();
      const { data: storesRes } = await authApi.myStores();
      setState(s => ({
        ...s,
        user: userRes.data,
        stores: storesRes.data,
        isAuthenticated: true,
        isLoading: false,
        // Auto-select first store if none selected
        activeStoreId: s.activeStoreId === 'all' && storesRes.data?.length
          ? String(storesRes.data[0].id) : s.activeStoreId,
      }));
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setState(s => ({ ...s, user: null, token: null, isAuthenticated: false, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (state.token) refreshUser();
    else setState(s => ({ ...s, isLoading: false }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (login: string, password: string) => {
    const { data } = await authApi.login(login, password);
    const { user, token } = data.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setState(s => ({ ...s, user, token, isAuthenticated: true }));
    const { data: storesRes } = await authApi.myStores();
    const userStores = storesRes.data || [];
    setState(s => ({
      ...s,
      stores: userStores,
      activeStoreId: userStores.length ? String(userStores[0].id) : s.activeStoreId,
    }));
    if (userStores.length) {
      localStorage.setItem('active_store_id', String(userStores[0].id));
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('active_store_id');
    setState(s => ({ ...s, user: null, token: null, isAuthenticated: false, stores: [], activeStoreId: 'all' }));
  };

  const setActiveStore = (storeId: string) => {
    localStorage.setItem('active_store_id', storeId);
    setState(s => ({ ...s, activeStoreId: storeId }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setActiveStore, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
