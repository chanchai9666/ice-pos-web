'use client';

import React from 'react';

interface CooldownTimerProps {
  secondsRemaining: number;
}

export function CooldownTimer({ secondsRemaining }: CooldownTimerProps) {
  if (secondsRemaining <= 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm flex items-center space-x-3 shadow-sm animate-pulse"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-200 dark:bg-amber-800/80 flex items-center justify-center font-bold text-base text-amber-900 dark:text-amber-100 shadow-inner">
        {secondsRemaining}s
      </div>
      <div>
        <p className="font-semibold text-amber-900 dark:text-amber-100">
          ระบบระงับการเข้าสู่ระบบชั่วคราว
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
          ป้อนข้อมูลผิดครบ 5 ครั้ง กรุณารออีก {secondsRemaining} วินาที ก่อนลองใหม่อีกครั้ง
        </p>
      </div>
    </div>
  );
}
