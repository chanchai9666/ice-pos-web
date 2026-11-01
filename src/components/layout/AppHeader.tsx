'use client';

/**
 * แถบส่วนหัวด้านบนของระบบ (AppHeader)
 * โครงการ ice-pos-web
 *
 * ประกอบด้วย:
 * - ฝั่งซ้าย: ปุ่มเปิด/พับ Sidebar, โลโก้ ICE POS, ป้ายสถานะ Online/Offline
 * - ฝั่งขวา: ป้ายสาขาปัจจุบัน, ปุ่มสแกนสินค้าด้วยกล้อง
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Icons } from '@/components/ui/Icons';
import { Badge } from '@/components/ui/Badge';
import { triggerCameraScanner } from '@/utils/navigation';
import { healthService } from '@/services/health.service';

export interface AppHeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onOpenSettings?: () => void;
}

const getRoleBadgeVariant = (role?: string): 'danger' | 'info' | 'success' | 'neutral' => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 'danger';
    case 'MANAGER':
      return 'info';
    case 'CASHIER':
      return 'success';
    default:
      return 'neutral';
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

export function AppHeader({
  onToggleSidebar,
  isSidebarCollapsed,
  onOpenSettings,
}: AppHeaderProps) {
  const { user, branch, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const checkServerHealth = async () => {
      try {
        const res = await healthService.checkHealth();
        if (isMounted) {
          setIsHealthy(res.data !== undefined || !res.message?.includes('network'));
        }
      } catch {
        if (isMounted) setIsHealthy(false);
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000); // ตรวจสอบทุก 30 วินาที
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ตรวจจับการคลิกนอกพื้นที่ Dropdown เพื่อปิดอัตโนมัติ
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    if (confirm('คุณต้องการออกจากระบบเพื่อสลับกะหรือเสร็จสิ้นการทำงานใช่หรือไม่?')) {
      await logout();
    }
  };

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-150">
      {/* ฝั่งซ้าย: ปุ่มพับเมนู + ข้อมูลระบบ */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? 'ขยายแถบเมนู' : 'พับเก็บแถบเมนู'}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Icons.Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-white text-base tracking-wide flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
              } animate-pulse`}
            />
            ICE POS
          </span>
          <span
            className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              isHealthy
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            {isHealthy ? 'ออนไลน์ (เชื่อมต่อ)' : 'ออฟไลน์'}
          </span>
        </div>
      </div>

      {/* ฝั่งขวา: สาขา, ปุ่มสแกนสินค้าด้วยกล้อง, ปุ่มตั้งค่าระบบ */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* สาขาปัจจุบัน */}
        {branch && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
            <Icons.Building2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-200 max-w-[120px] sm:max-w-[200px] truncate">
              {branch.name}
            </span>
            <span className="text-slate-500 font-mono hidden sm:inline">({branch.code})</span>
          </div>
        )}

        {/* ปุ่มสแกนสินค้าด้วยกล้องแบบ Primary Accent (เฉพาะหน้าจอ Desktop >= 1024px) */}
        <button
          type="button"
          onClick={() => triggerCameraScanner(router, pathname)}
          title="สแกนสินค้าด้วยกล้อง"
          className="hidden lg:flex items-center gap-2.5 px-4 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 font-bold text-sm transition-all duration-200 shadow-md shadow-cyan-500/30 hover:shadow-cyan-400/50 cursor-pointer"
        >
          <div className="p-1 rounded-lg bg-slate-950/20 text-slate-950">
            <Icons.Camera className="w-4 h-4" />
          </div>
          <span className="tracking-wide">สแกนสินค้า</span>
        </button>

        {/* เมนูโปรไฟล์ผู้ใช้งาน และออกจากระบบ */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              aria-label="เมนูบัญชีผู้ใช้"
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 transition-all cursor-pointer select-none"
            >
              {/* Avatar ย่อ */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0">
                {user.name ? user.name.charAt(0) : user.username.charAt(0).toUpperCase()}
              </div>

              {/* ข้อมูลชื่อและบทบาท (แสดงเฉพาะจอขนาดใหญ่ >= 1024px) */}
              <div className="hidden lg:flex flex-col text-left min-w-0 max-w-[130px]">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {user.name || user.username}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <Icons.ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-fadeIn divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* ข้อมูลบัญชีผู้ใช้ใน Dropdown */}
                <div className="p-3 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-xs shrink-0">
                    {user.name ? user.name.charAt(0) : user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user.name || user.username}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                      @{user.username}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                        {getRoleLabel(user.role)}
                      </Badge>
                      {branch && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          • {branch.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* เมนูตั้งค่าระบบ */}
                {onOpenSettings && (
                  <div className="py-1 px-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer text-left"
                    >
                      <Icons.Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>ตั้งค่าระบบ</span>
                    </button>
                  </div>
                )}

                {/* ปุ่มออกจากระบบ */}
                <div className="pt-1 px-1.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                  >
                    <Icons.LogOut className="w-4 h-4 shrink-0" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
