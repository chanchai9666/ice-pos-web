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
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-slate-800 text-xs text-slate-400 ${className}`}
    >
      {/* สรุปจำนวนรายการ */}
      <div className="flex items-center gap-2">
        <span>
          แสดง <strong className="text-slate-200">{startItem}</strong> -{' '}
          <strong className="text-slate-200">{endItem}</strong> จาก{' '}
          <strong className="text-slate-200">{totalItems}</strong> รายการ
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-4">
            <span>แสดงต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-cyan-400 outline-none cursor-pointer"
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
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="หน้าก่อนหน้า"
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Icons.ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-medium text-slate-200">
          หน้า {page} / {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="หน้าถัดไป"
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <Icons.ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
