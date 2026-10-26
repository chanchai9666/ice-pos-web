'use client';

/**
 * แถบนำทางด้านล่างสำหรับอุปกรณ์พกพา (Global App Bottom Navigation)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, คอนทราสต์สูง, รองรับ Safe Area Inset)
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNavItemsForRole } from '@/constants/navigation';
import { Icons } from '@/components/ui/Icons';

export interface AppBottomNavProps {
  onToggleMenu: () => void;
}

export function AppBottomNav({ onToggleMenu }: AppBottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const roleNavItems = getNavItemsForRole(user?.role);

  // เลือกเมนูหลักแสดงผลบน Bottom Bar (จำกัดไม่เกิน 3-4 เมนูหลัก เพื่อไม่ให้ปุ่มเล็กเกินไป)
  // หากเป็นแคชเชียร์จะแสดง POS + เมนู
  // หากเป็นแอดมินหรือผู้จัดการจะแสดง POS + จัดการสินค้า + สต็อก/รายงาน + เมนู
  const primaryNavItems = roleNavItems.slice(0, 3);

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
    <nav
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 shadow-2xl shadow-black/60 pb-[env(safe-area-inset-bottom)]"
      aria-label="แถบนำทางหลักด้านล่างสำหรับอุปกรณ์พกพา"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {primaryNavItems.map((item) => {
          const active = isItemActive(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl transition-all ${
                active
                  ? 'text-cyan-400 font-bold bg-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 active:bg-slate-800/60 font-medium'
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
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 active:bg-slate-800/60 font-medium transition-all"
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
