'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isRouteAllowedForRole } from '@/constants/navigation';

export interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // กำลังโหลดข้อมูล Session
    if (isLoading) return;

    // หากยังไม่ได้เข้าสู่ระบบ ให้นำทางไปยังหน้า Login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // ตรวจสอบสิทธิ์ของ Role สำหรับ Path ปัจจุบัน
    const allowed = isRouteAllowedForRole(pathname, user?.role);
    if (!allowed) {
      // หากไม่มีสิทธิ์เข้าถึง เช่น แคชเชียร์พยายามเข้า /catalog
      // ให้นำทางกลับไปยังหน้าขายหน้าร้าน /pos
      router.replace('/pos');
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</span>
      </div>
    );
  }

  return <>{children}</>;
}
