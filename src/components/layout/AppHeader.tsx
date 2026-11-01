'use client';

/**
 * แถบส่วนหัวด้านบนของระบบ (AppHeader)
 * โครงการ ice-pos-web
 *
 * ประกอบด้วย:
 * - ฝั่งซ้าย: ปุ่มเปิด/พับ Sidebar, โลโก้ ICE POS, ป้ายสถานะ Online/Offline
 * - ฝั่งขวา: ป้ายสาขาปัจจุบัน, ปุ่มสแกนสินค้าด้วยกล้อง
 */

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Icons } from '@/components/ui/Icons';
import { triggerCameraScanner } from '@/utils/navigation';
import { healthService } from '@/services/health.service';

export interface AppHeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function AppHeader({
  onToggleSidebar,
  isSidebarCollapsed,
}: AppHeaderProps) {
  const { branch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

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
      </div>
    </header>
  );
}
