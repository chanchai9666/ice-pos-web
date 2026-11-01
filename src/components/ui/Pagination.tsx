'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  className = '',
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = Math.min((page - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-4 border-t-2 border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 ${className}`}
    >
      {/* สรุปจำนวนรายการ */}
      <div className="flex items-center flex-wrap gap-2">
        <span>
          แสดง <strong className="text-slate-900 dark:text-white font-bold">{startItem}</strong> -{' '}
          <strong className="text-slate-900 dark:text-white font-bold">{endItem}</strong> จาก{' '}
          <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{totalItems}</strong> รายการ
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-2 ml-2 sm:ml-4">
            <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">แสดงต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-sm focus:border-cyan-400 focus:outline-none cursor-pointer font-semibold shadow-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* ปุ่มเลื่อนหน้า */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="หน้าก่อนหน้า"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
        >
          <Icons.ChevronLeft className="w-5 h-5" />
        </button>

        <span className="px-3.5 py-1.5 font-bold text-slate-800 dark:text-slate-100 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
          หน้า {page} / {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="หน้าถัดไป"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
        >
          <Icons.ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
