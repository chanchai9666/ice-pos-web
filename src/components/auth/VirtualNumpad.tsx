'use client';

import React, { useEffect, useCallback } from 'react';

interface VirtualNumpadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export function VirtualNumpad({
  onDigit,
  onBackspace,
  onClear,
  onSubmit,
  disabled = false,
}: VirtualNumpadProps) {
  // รองรับการกดแป้นพิมพ์จริง (Physical Keyboard) ควบคู่กับ Numpad เสมือน
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      // ตรวจสอบตัวเลข 0-9
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        onDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        onClear();
      } else if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    },
    [disabled, onDigit, onBackspace, onClear, onSubmit]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const numpadButtons = [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: 'C', value: 'clear', isAction: true },
    { label: '0', value: '0' },
    { label: '⌫', value: 'backspace', isAction: true },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto">
      {numpadButtons.map((btn) => {
        const isClear = btn.value === 'clear';
        const isBackspace = btn.value === 'backspace';

        return (
          <button
            key={btn.value}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (isClear) onClear();
              else if (isBackspace) onBackspace();
              else onDigit(btn.value);
            }}
            className={`h-16 rounded-2xl font-semibold text-2xl flex items-center justify-center transition-all select-none active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isClear
                ? 'bg-slate-100 dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                : isBackspace
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xl'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-700/60 shadow-sm'
            }`}
            aria-label={
              isClear ? 'ล้างทั้งหมด' : isBackspace ? 'ลบตัวเลข' : `เลข ${btn.label}`
            }
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}
