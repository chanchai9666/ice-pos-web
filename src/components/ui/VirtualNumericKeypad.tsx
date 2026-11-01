'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { useTheme } from '@/context/ThemeContext';

interface VirtualNumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  onConfirm?: () => void;
  label?: string;
  allowDecimal?: boolean;
  maxValue?: number;
  theme?: 'light' | 'dark';
  hideDisplay?: boolean;
  hideHeader?: boolean;
}

export function VirtualNumericKeypad({
  value,
  onChange,
  onClose,
  onConfirm,
  label = 'ระบุตัวเลข',
  allowDecimal = true,
  maxValue = 999999.99,
  theme: themeProp,
  hideDisplay = false,
  hideHeader = false,
}: VirtualNumericKeypadProps) {
  const { resolvedTheme } = useTheme();
  const isDark = (themeProp ?? resolvedTheme) === 'dark';

  const handleDigit = (digit: string) => {
    let next = value;
    if (next === '0' && digit !== '.') {
      next = digit;
    } else {
      // Check decimal rules
      if (digit === '.') {
        if (!allowDecimal || next.includes('.')) return;
        if (!next) next = '0';
      }
      // If already has decimal, max 2 decimal places
      if (next.includes('.')) {
        const parts = next.split('.');
        if (parts[1] && parts[1].length >= 2 && digit !== '.') return;
      }
      next = next + digit;
    }

    const num = parseFloat(next);
    if (!isNaN(num) && num > maxValue) {
      return;
    }
    onChange(next);
  };

  const handleBackspace = () => {
    if (!value || value.length <= 1) {
      onChange('');
    } else {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div
      className={`rounded-2xl select-none p-3.5 sm:p-4 w-full max-w-sm mx-auto transition-colors ${
        isDark
          ? 'bg-slate-900/90 border border-slate-700/80 shadow-xl'
          : 'bg-white shadow-2xl border-2 border-slate-300'
      }`}
      role="dialog"
      aria-label={label}
    >
      {/* Header & Display */}
      {!hideHeader && (
        <div
          className={`flex items-center justify-between mb-3 pb-2 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <span
            className={`text-base font-bold ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {label}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl active:scale-95 transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              aria-label="ปิดแป้นตัวเลข"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Screen Value (ซ่อนได้เมื่อแสดงผลในหน้าจอที่มีช่องกรอกยอดอยู่แล้ว) */}
      {!hideDisplay && (
        <div
          className={`rounded-xl p-3 mb-3 text-right border-2 ${
            isDark
              ? 'bg-slate-950/80 border-cyan-500/60'
              : 'bg-slate-50 border-blue-500'
          }`}
        >
          <span
            className={`text-xs block mb-1 font-medium ${
              isDark ? 'text-cyan-400' : 'text-slate-500'
            }`}
          >
            ค่าปัจจุบัน:
          </span>
          <div
            className={`text-2xl sm:text-3xl font-extrabold tracking-wider truncate ${
              isDark ? 'text-cyan-200' : 'text-slate-900'
            }`}
          >
            {value || '0.00'}
          </div>
        </div>
      )}

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className={`min-h-[48px] sm:min-h-[52px] flex items-center justify-center rounded-xl text-xl sm:text-2xl font-bold shadow-sm active:scale-95 transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:text-white border border-slate-700 hover:border-cyan-500/50 text-white'
                : 'bg-slate-100 hover:bg-blue-50 active:bg-blue-600 active:text-white border-2 border-slate-200 hover:border-blue-400 text-slate-800'
            }`}
            aria-label={`ตัวเลข ${digit}`}
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Decimal or Double zero, 0, Backspace */}
        {allowDecimal ? (
          <button
            type="button"
            onClick={() => handleDigit('.')}
            className={`min-h-[48px] sm:min-h-[52px] flex items-center justify-center rounded-xl text-2xl font-bold shadow-sm active:scale-95 transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:text-white border border-slate-700 hover:border-cyan-500/50 text-white'
                : 'bg-slate-100 hover:bg-blue-50 active:bg-blue-600 active:text-white border-2 border-slate-200 hover:border-blue-400 text-slate-800'
            }`}
            aria-label="จุดทศนิยม"
          >
            .
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleDigit('00')}
            className={`min-h-[48px] sm:min-h-[52px] flex items-center justify-center rounded-xl text-xl font-bold shadow-sm active:scale-95 transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:text-white border border-slate-700 hover:border-cyan-500/50 text-white'
                : 'bg-slate-100 hover:bg-blue-50 active:bg-blue-600 active:text-white border-2 border-slate-200 hover:border-blue-400 text-slate-800'
            }`}
            aria-label="ศูนย์สองตัว"
          >
            00
          </button>
        )}

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className={`min-h-[48px] sm:min-h-[52px] flex items-center justify-center rounded-xl text-xl sm:text-2xl font-bold shadow-sm active:scale-95 transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 active:text-white border border-slate-700 hover:border-cyan-500/50 text-white'
              : 'bg-slate-100 hover:bg-blue-50 active:bg-blue-600 active:text-white border-2 border-slate-200 hover:border-blue-400 text-slate-800'
          }`}
          aria-label="ตัวเลข 0"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className={`min-h-[48px] sm:min-h-[52px] flex items-center justify-center rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer ${
            isDark
              ? 'bg-amber-950/40 hover:bg-amber-900/50 active:bg-amber-600 active:text-white border border-amber-600/50 text-amber-300'
              : 'bg-amber-50 hover:bg-amber-100 active:bg-amber-600 active:text-white border-2 border-amber-300 text-amber-800'
          }`}
          aria-label="ลบหนึ่งหลัก"
        >
          <Icons.Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Action Buttons: Clear & Confirm */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-2.5 sm:mt-3">
        <button
          type="button"
          onClick={handleClear}
          className={`min-h-[48px] px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-bold text-sm sm:text-base active:scale-95 transition-all cursor-pointer ${
            isDark
              ? 'bg-rose-950/40 hover:bg-rose-900/50 active:bg-rose-600 active:text-white border border-rose-600/50 text-rose-300'
              : 'bg-rose-50 hover:bg-rose-100 active:bg-rose-600 active:text-white border-2 border-rose-300 text-rose-800'
          }`}
          aria-label="ล้างค่าทั้งหมด"
        >
          <Icons.RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>ล้างค่า</span>
        </button>

        <button
          type="button"
          onClick={onConfirm || onClose}
          className={`min-h-[48px] px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-bold text-sm sm:text-base shadow-md active:scale-95 transition-all cursor-pointer ${
            isDark
              ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 border border-emerald-400/50 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border-2 border-emerald-700 text-white'
          }`}
          aria-label="ตกลง"
        >
          <Icons.Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
          <span>ตกลง</span>
        </button>
      </div>
    </div>
  );
}
