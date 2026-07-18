import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Toaster } from 'react-hot-toast';
import { OfflineBanner, UpdatePrompt, InstallPrompt } from '@/components/shared/PwaComponents';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 flex-col">
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden w-full">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav />
      <UpdatePrompt />
      <InstallPrompt />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' },
        }}
      />
    </div>
  );
}
