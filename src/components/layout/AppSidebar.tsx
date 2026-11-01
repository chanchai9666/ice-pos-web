'use client';

/**
 * แถบเมนูด้านข้างระบบ ICE POS (AppSidebar)
 * - แสดงรายการเมนูหลักตามสิทธิ์บทบาท (Role-based Navigation)
 * - ส่วนล่างซ้าย: ปุ่มเมนูตั้งค่าระบบ (Settings), ข้อมูลผู้ใช้งาน และปุ่มออกจากระบบ
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNavItemsForRole, NavItem } from '@/constants/navigation';
import { Icons } from '@/components/ui/Icons';
import { Badge } from '@/components/ui/Badge';

export interface AppSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings?: () => void;
}

export function AppSidebar({
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
  onOpenSettings,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = getNavItemsForRole(user?.role);

  const handleLogout = async () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      await logout();
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'danger';
      case 'MANAGER':
        return 'info';
      default:
        return 'success';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'ผู้ดูแลระบบ';
      case 'MANAGER':
        return 'ผู้จัดการสาขา';
      case 'CASHIER':
        return 'แคชเชียร์';
      default:
        return role || 'พนักงาน';
    }
  };

  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'LayoutDashboard':
        return <Icons.LayoutDashboard className={className} />;
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
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-18' : 'w-64'}`}
      >
        {/* Mobile Header Inside Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <span className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            ICE POS เมนู
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
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
                    ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-blue-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span
                  className={`flex items-center justify-center transition-colors ${
                    active ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                  }`}
                >
                  {renderIcon(item.iconName, 'w-5 h-5')}
                </span>

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ส่วนขอบล่างซ้าย: ปุ่มตั้งค่าระบบ + ข้อมูลผู้ใช้งาน + ปุ่มออกจากระบบ */}
        {!isCollapsed ? (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5 shrink-0 bg-white dark:bg-slate-900">
            {/* ปุ่มตั้งค่าระบบ (เปิด SettingsModal) */}
            <button
              type="button"
              onClick={() => {
                onOpenSettings?.();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <Icons.Settings className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="flex-1 text-left truncate">ตั้งค่าระบบ</span>
            </button>

            {/* การ์ดข้อมูลผู้ใช้งาน & ปุ่มออกจากระบบ */}
            {user && (
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0">
                    {user.name ? user.name.charAt(0) : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                      {user.name || user.username}
                    </span>
                    <div className="mt-0.5">
                      <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="ออกจากระบบ"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  aria-label="ออกจากระบบ"
                >
                  <Icons.LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* เลขเวอร์ชันระบบ */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono pt-0.5">
              ICE POS v1.2.0 • ระบบหน้าร้าน
            </div>
          </div>
        ) : (
          /* สถานะพับเก็บ Sidebar (Collapsed w-18) */
          <div className="p-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col items-center gap-2 shrink-0 bg-white dark:bg-slate-900">
            {/* ปุ่มตั้งค่าระบบ (ไอคอนอย่างเดียว) */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="ตั้งค่าระบบ"
              aria-label="ตั้งค่าระบบ"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <Icons.Settings className="w-5 h-5" />
            </button>

            {/* Avatar ผู้ใช้งาน */}
            {user && (
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs"
                title={`${user.name || user.username} (${getRoleLabel(user.role)})`}
              >
                {user.name ? user.name.charAt(0) : user.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* ปุ่มออกจากระบบ */}
            <button
              type="button"
              onClick={handleLogout}
              title="ออกจากระบบ"
              aria-label="ออกจากระบบ"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer transition-colors"
            >
              <Icons.LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
