'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Icons } from '@/components/ui/Icons';
import { Badge } from '@/components/ui/Badge';

export interface AppHeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export function AppHeader({ onToggleSidebar, isSidebarCollapsed }: AppHeaderProps) {
  const router = useRouter();
  const { user, branch, logout } = useAuth();

  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
      logout();
      router.push('/login');
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

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* ฝั่งซ้าย: ปุ่มพับเมนู + ข้อมูลระบบ */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? 'ขยายแถบเมนู' : 'พับเก็บแถบเมนู'}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Icons.Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            ICE POS
          </span>
        </div>
      </div>

      {/* ฝั่งขวา: สาขา, ข้อมูลผู้ใช้, ปุ่มออกจากระบบ */}
      <div className="flex items-center gap-3">
        {/* สาขาปัจจุบัน */}
        {branch && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Icons.Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium text-slate-200">{branch.name}</span>
            <span className="text-slate-500 font-mono">({branch.code})</span>
          </div>
        )}

        {/* ผู้ใช้งานและระดับสิทธิ์ */}
        {user && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/40">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user.fullName || user.username}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                @{user.username}
              </span>
            </div>
            <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
              {getRoleLabel(user.role)}
            </Badge>
          </div>
        )}

        {/* ปุ่มออกจากระบบ */}
        <button
          type="button"
          onClick={handleLogout}
          title="ออกจากระบบ"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all text-xs font-medium cursor-pointer"
        >
          <Icons.LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}
