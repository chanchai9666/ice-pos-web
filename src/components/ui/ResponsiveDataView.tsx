'use client';

/**
 * ResponsiveDataView - Deep Module สำหรับการแสดงผลชุดข้อมูลที่รองรับทุกอุปกรณ์
 * โครงการ ice-pos-web
 *
 * สลับการแสดงผลระหว่าง Table View บน Desktop และ Card Stack View บน Mobile/Tablet โดยอัตโนมัติ
 * พร้อมจัดการ Loading Skeleton, Empty State และ Touch Ergonomics แบบรวมศูนย์
 */

import React from 'react';
import { Icons } from '@/components/ui/Icons';

export interface ResponsiveDataViewProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  /** ฟังก์ชันเรนเดอร์การ์ดสำหรับหน้าจอขนาดพกพา (Mobile Card View) */
  renderCard: (item: T, index: number) => React.ReactNode;
  /** หัวตารางสำหรับการแสดงผลบนจอใหญ่ (Desktop Table View) */
  tableHeader: React.ReactNode;
  /** ฟังก์ชันเรนเดอร์แต่ละแถวในตาราง */
  renderRow: (item: T, index: number) => React.ReactNode;
  /** สถานะการดาวน์โหลดข้อมูล */
  isLoading?: boolean;
  /** ข้อความขณะกำลังดาวน์โหลด */
  loadingMessage?: string;
  /** จำนวนโครงร่างขณะโหลด (Skeleton rows/cards) */
  skeletonCount?: number;
  /** ส่วนประกอบแสดงผลเมื่อไม่มีข้อมูล */
  emptyState?: React.ReactNode;
  /** ส่วนท้าย เช่น Pagination */
  footer?: React.ReactNode;
  /** Breakpoint ที่จะเริ่มสลับไปเป็น Table ('md' | 'lg' | 'xl') ค่าเริ่มต้นคือ 'lg' */
  tableBreakpoint?: 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveDataView<T>({
  data,
  keyExtractor,
  renderCard,
  tableHeader,
  renderRow,
  isLoading = false,
  loadingMessage = 'กำลังโหลดข้อมูล...',
  skeletonCount = 5,
  emptyState,
  footer,
  tableBreakpoint = 'lg',
  className = '',
}: ResponsiveDataViewProps<T>) {
  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Mobile Skeleton Cards */}
        <div className={`space-y-3 ${tableBreakpoint === 'md' ? 'md:hidden' : tableBreakpoint === 'xl' ? 'xl:hidden' : 'lg:hidden'}`}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={`skeleton-card-${i}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-md w-3/4" />
              <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-full" />
            </div>
          ))}
        </div>

        {/* Desktop Skeleton Table */}
        <div className={`hidden ${tableBreakpoint === 'md' ? 'md:block' : tableBreakpoint === 'xl' ? 'xl:block' : 'lg:block'} bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-8`}>
          <div className="flex flex-col items-center justify-center space-y-3 text-slate-500 dark:text-slate-400">
            <div className="w-8 h-8 border-3 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">{loadingMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (data.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }
    return (
      <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
        <Icons.Folder className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600" />
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">ไม่พบรายการข้อมูล</h4>
        <p className="text-sm text-slate-500">ยังไม่มีรายการข้อมูลในระบบหรือเงื่อนไขการค้นหานี้</p>
      </div>
    );
  }

  const breakpointMobileHidden =
    tableBreakpoint === 'md'
      ? 'md:hidden'
      : tableBreakpoint === 'xl'
      ? 'xl:hidden'
      : 'lg:hidden';

  const breakpointDesktopBlock =
    tableBreakpoint === 'md'
      ? 'hidden md:block'
      : tableBreakpoint === 'xl'
      ? 'hidden xl:block'
      : 'hidden lg:block';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Mobile Card Stack View (แสดงบนหน้าจอเล็ก) */}
      <div className={`space-y-3 ${breakpointMobileHidden}`}>
        {data.map((item, index) => (
          <div key={keyExtractor(item)}>
            {renderCard(item, index)}
          </div>
        ))}
      </div>

      {/* 2. Desktop Table View (แสดงบนหน้าจอใหญ่) */}
      <div className={`${breakpointDesktopBlock} bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-md`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base text-slate-800 dark:text-slate-200">
            {tableHeader}
            <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800/80">
              {data.map((item, index) => renderRow(item, index))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ส่วนท้าย เช่น Pagination */}
      {footer && <div className="pt-2">{footer}</div>}
    </div>
  );
}
