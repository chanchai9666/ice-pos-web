'use client';

/**
 * ช่องค้นหาสินค้าด่วนสำหรับหน้า POS (PosSearchBar)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (ความสูง >= 48px, ฟอนต์ >= 16px, ปุ่มล้างขนาดใหญ่)
 */

import React from 'react';
import { Icons } from '@/components/ui/Icons';

interface PosSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function PosSearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'ค้นหาชื่อสินค้า, รหัส SKU หรือ บาร์โค้ด...',
  className = '',
}: PosSearchBarProps) {
  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
        <Icons.Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[48px] pl-11 pr-14 py-3 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder-slate-400 text-base rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all shadow-sm"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="ล้างคำค้นหา"
          className="absolute inset-y-0 right-0 pr-3 pl-3 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer min-w-[48px] min-h-[48px]"
        >
          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
            <Icons.X className="w-4 h-4" />
          </div>
        </button>
      )}
    </div>
  );
}
