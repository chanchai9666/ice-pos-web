'use client';

/**
 * PwaNotificationBar - คอมโพเนนต์แจ้งเตือนสถานะเครือข่ายและอัปเดตเวอร์ชัน PWA
 * - แสดงแถบเตือนสีแดงสดใสเมื่อขาดการเชื่อมต่ออินเทอร์เน็ต (Offline Banner)
 * - แสดงการแจ้งเตือนเวอร์ชันใหม่พร้อมปุ่มกดอัปเดต (Update Prompt)
 * มาตรฐาน Elderly-Friendly & High Contrast
 * โครงการ ice-pos-web
 */

import React, { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { usePwa } from '@/hooks/usePwa';

export function PwaNotificationBar() {
  const { isOnline, isUpdateAvailable, updateApp } = usePwa();
  const [isUpdateDismissed, setIsUpdateDismissed] = useState<boolean>(false);

  return (
    <>
      {/* แถบแจ้งเตือนเมื่อขาดการเชื่อมต่ออินเทอร์เน็ต (Offline Banner) */}
      {!isOnline && (
        <div
          role="alert"
          aria-live="assertive"
          className="sticky top-0 z-50 w-full bg-rose-600 text-white px-4 py-2.5 shadow-lg border-b border-rose-700 flex items-center justify-center gap-2.5 text-sm sm:text-base font-bold animate-fadeIn select-none"
        >
          <Icons.WifiOff className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 animate-pulse text-white" />
          <span>
            ขาดการเชื่อมต่ออินเทอร์เน็ต — ไม่สามารถส่งบิลขายหรือตัดสต็อกได้ชั่วคราว
          </span>
        </div>
      )}

      {/* กล่องแจ้งเตือนเวอร์ชันใหม่ (New Version Update Prompt) */}
      {isUpdateAvailable && !isUpdateDismissed && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border-2 border-cyan-500 rounded-2xl shadow-2xl p-4 text-slate-900 dark:text-white animate-fadeIn"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-600/20 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Icons.Sparkles className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">มีเวอร์ชันใหม่พร้อมใช้งาน</h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                ICE POS ได้รับการปรับปรุงระบบใหม่ กดอัปเดตเพื่อโหลดข้อมูลล่าสุด
              </p>

              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={updateApp}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-bold text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-cyan-600/30"
                >
                  <Icons.Refresh className="w-4 h-4" />
                  <span>อัปเดตทันที</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUpdateDismissed(true)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm transition-all cursor-pointer font-medium"
                >
                  ไว้ทีหลัง
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsUpdateDismissed(true)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
              title="ปิด"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

