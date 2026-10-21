'use client';

import React from 'react';
import { LoginMode } from '@/types/auth';

interface ModeSwitcherProps {
  activeMode: LoginMode;
  onChangeMode: (mode: LoginMode) => void;
  disabled?: boolean;
}

export function ModeSwitcher({
  activeMode,
  onChangeMode,
  disabled = false,
}: ModeSwitcherProps) {
  return (
    <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 w-full mb-6">
      {/* แท็บโหมด PIN */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChangeMode('pin')}
        className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 select-none disabled:opacity-50 ${
          activeMode === 'pin'
            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm shadow-slate-200/50 dark:shadow-none'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M3.75 4.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm5.5-11a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm5.5-11a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Zm0 5.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75Z"
            clipRule="evenodd"
          />
        </svg>
        <span>รหัส PIN แคชเชียร์</span>
      </button>

      {/* แท็บโหมด Username / Password */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChangeMode('credentials')}
        className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 select-none disabled:opacity-50 ${
          activeMode === 'credentials'
            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm shadow-slate-200/50 dark:shadow-none'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
            clipRule="evenodd"
          />
        </svg>
        <span>ชื่อผู้ใช้ / รหัสผ่าน</span>
      </button>
    </div>
  );
}
