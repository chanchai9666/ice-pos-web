'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNavItemsForRole, NavItem } from '@/constants/navigation';
import { Icons } from '@/components/ui/Icons';

export interface AppSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({ isCollapsed, isMobileOpen, onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = getNavItemsForRole(user?.role);

  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'ShoppingCart':
        return <Icons.ShoppingCart className={className} />;
      case 'Package':
        return <Icons.Package className={className} />;
      case 'Boxes':
        return <Icons.Boxes className={className} />;
      case 'Users':
        return <Icons.Users className={className} />;
      case 'BarChart3':
        return <Icons.BarChart3 className={className} />;
      case 'UserCog':
        return <Icons.UserCog className={className} />;
      default:
        return <Icons.Folder className={className} />;
    }
  };

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/pos') {
      return pathname === '/pos' || pathname.startsWith('/pos/');
    }
    return pathname === itemPath || pathname.startsWith(itemPath + '/');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-18' : 'w-64'}`}
      >
        {/* Mobile Header Inside Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <span className="font-bold text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            ICE POS เมนู
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1.5">
          {navItems.map((item: NavItem) => {
            const active = isItemActive(item.path);

            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={`flex items-center justify-center transition-colors ${
                    active ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {renderIcon(item.iconName, 'w-5 h-5')}
                </span>

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
            ICE POS v1.2.0 • ระบบหน้าร้าน
          </div>
        )}
      </aside>
    </>
  );
}
