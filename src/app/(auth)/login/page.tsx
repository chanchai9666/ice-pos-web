'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { AuthResponse } from '@/types/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === '1';
  const isTimeout = searchParams.get('timeout') === '1';

  const handleLoginSuccess = (auth: AuthResponse) => {
    // หากเป็นแคชเชียร์ ให้นำทางไปยังหน้าขาย POS
    // หากเป็นบทบาทอื่น (เช่น ADMIN, MANAGER) ให้นำทางไปยังหน้าจัดการสินค้าและหมวดหมู่
    if (auth.user.role === 'CASHIER') {
      router.push('/pos');
    } else {
      router.push('/catalog');
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* การแจ้งเตือนเซสชันหมดอายุตามมาตรฐาน Elderly-Friendly (ข้อความชัดเจน, คอนทราสต์สูง) */}
      {isExpired && !isTimeout && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 shadow-sm flex items-start space-x-3.5 animate-fadeIn">
          <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 font-bold text-base mt-0.5 shadow-sm">
            !
          </div>
          <div>
            <h4 className="text-base font-bold text-amber-900 dark:text-amber-200">เซสชันหมดอายุ</h4>
            <p className="text-sm text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed font-medium">
              เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อปฏิบัติงานต่อ
            </p>
          </div>
        </div>
      )}

      {/* การแจ้งเตือนการเชื่อมต่อขัดข้องหรือหมดเวลาตามมาตรฐาน Elderly-Friendly */}
      {isTimeout && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100 shadow-sm flex items-start space-x-3.5 animate-fadeIn">
          <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-base mt-0.5 shadow-sm">
            !
          </div>
          <div>
            <h4 className="text-base font-bold text-rose-900 dark:text-rose-200">การเชื่อมต่อขัดข้องหรือหมดเวลา</h4>
            <p className="text-sm text-rose-700 dark:text-rose-300/90 mt-0.5 leading-relaxed font-medium">
              การเชื่อมต่อขัดข้องหรือหมดเวลา กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตและเข้าสู่ระบบใหม่อีกครั้ง
            </p>
          </div>
        </div>
      )}

      {/* Card Header & Brand */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-9 h-9"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          ICE POS
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          ระบบจัดการขายหน้าร้านและคลังสินค้า
        </p>
      </div>

      {/* Card Body */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 transition-all duration-200">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>

      {/* Card Footer */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
        เข้าสู่ระบบเพื่อปฏิบัติงานหน้าร้าน • ICE POS v1.2
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* ปุ่มสลับโหมด Dark/Light บนหน้าจอเข้าสู่ระบบ */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <Suspense fallback={<div className="w-full max-w-md h-96 animate-pulse bg-slate-200 dark:bg-slate-900/40 rounded-3xl" />}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
