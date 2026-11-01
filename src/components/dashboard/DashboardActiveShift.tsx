'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';
import { DashboardActiveShift as ActiveShiftType } from '@/types/dashboard';
import { formatSatangToBaht } from '@/utils/currencyHelper';

interface DashboardActiveShiftProps {
  shift?: ActiveShiftType | null;
  isLoading?: boolean;
}

export function DashboardActiveShift({ shift, isLoading }: DashboardActiveShiftProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-28 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-full" />
      </div>
    );
  }

  const formatThaiTime = (rfcString: string | null) => {
    if (!rfcString) return '-';
    try {
      const d = new Date(rfcString);
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    } catch {
      return rfcString;
    }
  };

  const isActive = shift?.hasActiveShift;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Icons.Clock className="w-4 h-4" />
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">สถานะกะหน้าร้าน (Shift)</h2>
        </div>

        {isActive ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            กำลังเปิดกะ
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            ยังไม่เปิดกะ
          </span>
        )}
      </div>

      {/* Body */}
      {isActive ? (
        <div className="space-y-4">
          {/* ข้อมูลพนักงานและเวลาเปิดกะ */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">พนักงานประจำกะ</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {shift.cashierName || 'แคชเชียร์ประจำสาขา'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block">เวลาเปิดกะ</span>
              <span className="font-bold text-cyan-700 dark:text-cyan-400">
                {formatThaiTime(shift.openedAt)}
              </span>
            </div>
          </div>

          {/* สรุปเงินในลิ้นชัก */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-3">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">เงินทอนเริ่มต้น</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200">
                ฿{formatSatangToBaht(shift.openingCash)}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl p-3">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">เงินสดในลิ้นชักปัจจุบัน</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                ฿{formatSatangToBaht(shift.currentCashInDrawer || shift.expectedCash)}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/pos"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 font-bold text-xs transition-colors"
            >
              <span>ไปที่หน้าขายหน้าร้าน (POS)</span>
              <Icons.ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl my-auto">
          <Icons.AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400 mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">ยังไม่มีกะที่เปิดใช้งาน</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            แคชเชียร์ยังไม่ได้ทำการเปิดกะและบันทึกเงินทอนเริ่มต้นประจำวัน
          </p>
          <Link
            href="/pos"
            className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
          >
            เปิดกะขายที่หน้า POS
          </Link>
        </div>
      )}
    </div>
  );
}

