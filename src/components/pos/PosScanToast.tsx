'use client';

/**
 * แบนเนอร์แจ้งเตือนสถานะการสแกนบาร์โค้ดแบบ Non-blocking (PosScanToast)
 * โครงการ ice-pos-web
 *
 * แสดงเตือนสีแดงเด่นชัดเมื่อไม่พบบาร์โค้ด หรือสีเขียวเมื่อสำเร็จ โดยไม่บล็อกการทำงานของแคชเชียร์
 */

import React from 'react';
import { usePosCart } from '@/context/PosCartContext';
import { Icons } from '@/components/ui/Icons';

export function PosScanToast() {
  const { toasts, removeToast } = usePosCart();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'ERROR';
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-4 border-2 shadow-2xl flex items-start gap-3.5 transition-all transform animate-slide-in-right ${
              isError
                ? 'bg-rose-50 dark:bg-rose-950/95 border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-100 shadow-slate-900/10 dark:shadow-rose-950/50'
                : 'bg-emerald-50 dark:bg-emerald-950/95 border-emerald-400 dark:border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-slate-900/10 dark:shadow-emerald-950/50'
            }`}
          >
            {/* ไอคอนสถานะ */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isError
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {isError ? (
                <Icons.AlertTriangle className="w-5 h-5" />
              ) : (
                <Icons.Check className="w-5 h-5" />
              )}
            </div>

            {/* ข้อความแจ้งเตือน */}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-base font-bold leading-snug">{toast.title}</h4>
              <p className="text-sm mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>
              {toast.code && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-black/40 text-xs font-mono font-bold tracking-wider">
                  บาร์โค้ด: {toast.code}
                </span>
              )}
            </div>

            {/* ปุ่มปิด */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="p-1.5 rounded-lg hover:bg-black/30 text-current transition-colors cursor-pointer shrink-0"
              aria-label="ปิดการแจ้งเตือน"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
