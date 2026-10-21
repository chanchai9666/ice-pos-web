'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';

interface VirtualNumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  onConfirm?: () => void;
  label?: string;
  allowDecimal?: boolean;
  maxValue?: number;
}

export function VirtualNumericKeypad({
  value,
  onChange,
  onClose,
  onConfirm,
  label = 'ระบุตัวเลข',
  allowDecimal = true,
  maxValue = 999999.99,
}: VirtualNumericKeypadProps) {
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
      className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 p-4 w-full max-w-sm mx-auto select-none"
      role="dialog"
      aria-label={label}
    >
      {/* Header & Display */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
        <span className="text-base font-bold text-slate-800">{label}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition"
            aria-label="ปิดแป้นตัวเลข"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Screen Value */}
      <div className="bg-slate-50 border-2 border-blue-500 rounded-xl p-3 mb-4 text-right">
        <span className="text-xs text-slate-500 block mb-1 font-medium">ค่าปัจจุบัน:</span>
        <div className="text-3xl font-extrabold text-slate-900 tracking-wider truncate">
          {value || '0.00'}
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          '1', '2', '3',
          '4', '5', '6',
          '7', '8', '9',
        ].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="min-h-[56px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 active:bg-blue-600 active:text-white border-2 border-slate-200 hover:border-blue-400 text-2xl font-bold text-slate-800 shadow-sm active:scale-95 transition-all"
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
            className="min-h-[56px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 active:bg-blue-600 active:text-white border-2 border-slate-200 hover:border-blue-400 text-2xl font-bold text-slate-800 shadow-sm active:scale-95 transition-all"
            aria-label="จุดทศนิยม"
          >
            .
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleDigit('00')}
            className="min-h-[56px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 active:bg-blue-600 active:text-white border-2 border-slate-200 hover:border-blue-400 text-xl font-bold text-slate-800 shadow-sm active:scale-95 transition-all"
            aria-label="ศูนย์สองตัว"
          >
            00
          </button>
        )}

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="min-h-[56px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 active:bg-blue-600 active:text-white border-2 border-slate-200 hover:border-blue-400 text-2xl font-bold text-slate-800 shadow-sm active:scale-95 transition-all"
          aria-label="ตัวเลข 0"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="min-h-[56px] flex items-center justify-center rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-600 active:text-white border-2 border-amber-300 text-amber-800 shadow-sm active:scale-95 transition-all"
          aria-label="ลบหนึ่งหลัก"
        >
          <Icons.Delete className="w-7 h-7" />
        </button>
      </div>

      {/* Action Buttons: Clear & Confirm */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <button
          type="button"
          onClick={handleClear}
          className="min-h-[48px] px-3 flex items-center justify-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-600 active:text-white border-2 border-rose-300 text-rose-800 font-bold text-base active:scale-95 transition-all"
          aria-label="ล้างค่าทั้งหมด"
        >
          <Icons.RotateCcw className="w-5 h-5" />
          <span>ล้างค่า</span>
        </button>

        <button
          type="button"
          onClick={onConfirm || onClose}
          className="min-h-[48px] px-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border-2 border-emerald-700 text-white font-bold text-base shadow-md active:scale-95 transition-all"
          aria-label="ตกลง"
        >
          <Icons.Check className="w-6 h-6 stroke-[3]" />
          <span>ตกลง</span>
        </button>
      </div>
    </div>
  );
}
