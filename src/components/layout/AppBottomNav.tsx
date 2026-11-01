'use client';

/**
 * แถบนำทางด้านล่างสำหรับอุปกรณ์พกพา (Global App Bottom Navigation)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, คอนทราสต์สูง, รองรับ Safe Area Inset)
 */

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNavItemsForRole } from '@/constants/navigation';
import { Icons } from '@/components/ui/Icons';
import { triggerCameraScanner } from '@/utils/navigation';

export interface AppBottomNavProps {
  onToggleMenu: () => void;
}

export function AppBottomNav({ onToggleMenu }: AppBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const roleNavItems = getNavItemsForRole(user?.role);

  // เลือกเมนูหลักแสดงผลบน Bottom Bar ควบคู่กับปุ่มสแกนด่วน (จำกัดรวมไม่เกิน 4 ปุ่ม เพื่อให้แต่ละปุ่มกว้าง >= 48px)
  const primaryNavItems = roleNavItems.slice(0, 2);

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
    <nav
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800/90 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 pb-[env(safe-area-inset-bottom)]"
      aria-label="แถบนำทางหลักด้านล่างสำหรับอุปกรณ์พกพา"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {/* เมนูหลักแรก (POS) */}
        {primaryNavItems.slice(0, 1).map((item) => {
          const active = isItemActive(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl transition-all ${
                active
                  ? 'text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800/60 font-medium'
              }`}
            >
              <div className="relative">
                {renderIcon(item.iconName, `w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`)}
              </div>
              <span className="text-[11px] sm:text-xs tracking-tight mt-1 truncate max-w-[80px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* ปุ่มด่วนสแกนสินค้าแบบ Hero Floating Action Button (Elderly-Friendly 56x56px) */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-6 relative z-10">
          <button
            type="button"
            onClick={() => triggerCameraScanner(router, pathname)}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-cyan-400 to-blue-600 text-slate-950 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/40 ring-4 ring-white dark:ring-slate-900 hover:shadow-cyan-400/60 active:scale-95 transition-all duration-200 cursor-pointer group"
            aria-label="สแกนสินค้าด้วยกล้อง"
          >
            <Icons.Camera className="w-6 h-6 text-slate-950 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black tracking-tight leading-none mt-0.5 text-slate-950">
              สแกน
            </span>
          </button>
        </div>

        {/* เมนูหลักถัดไป (เช่น จัดการสินค้า ถ้ามี) */}
        {primaryNavItems.slice(1).map((item) => {
          const active = isItemActive(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl transition-all ${
                active
                  ? 'text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800/60 font-medium'
              }`}
            >
              <div className="relative">
                {renderIcon(item.iconName, `w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`)}
              </div>
              <span className="text-[11px] sm:text-xs tracking-tight mt-1 truncate max-w-[80px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* ปุ่มเปิดเมนูข้าง (Drawer Toggle) */}
        <button
          type="button"
          onClick={onToggleMenu}
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800/60 font-medium transition-all"
          aria-label="เปิดเมนูทั้งหมด"
        >
          <Icons.Menu className="w-6 h-6" />
          <span className="text-[11px] sm:text-xs tracking-tight mt-1 truncate">
            เมนูอื่น ๆ
          </span>
        </button>
      </div>
    </nav>
  );
}
