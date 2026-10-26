'use client';

import React, { useState } from 'react';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppBottomNav } from '@/components/layout/AppBottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    // บนหน้าจอเล็กให้สลับ Drawer Mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <RouteGuard>
      <div className="min-h-screen bg-slate-950 flex flex-col antialiased text-slate-100">
        <AppHeader
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <div className="flex-1 flex overflow-hidden">
          <AppSidebar
            isCollapsed={isSidebarCollapsed}
            isMobileOpen={isMobileOpen}
            onCloseMobile={() => setIsMobileOpen(false)}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950/50 pb-20 lg:pb-6">
            {children}
          </main>
        </div>

        {/* แถบนำทางด้านล่างสำหรับอุปกรณ์พกพา */}
        <AppBottomNav onToggleMenu={() => setIsMobileOpen((prev) => !prev)} />
      </div>
    </RouteGuard>
  );
}
