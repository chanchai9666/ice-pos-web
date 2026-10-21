'use client';

/**
 * แถบแสดงสถานะกะการขาย (PosShiftBanner)
 * โครงการ ice-pos-web
 *
 * แสดงเตือนอย่างชัดเจนเมื่อยังไม่ได้เปิดกะขาย และมีปุ่มเปิดกะขนาดใหญ่ตามมาตรฐาน Elderly-Friendly
 */

import React from 'react';
import { ShiftInfo } from '@/types/shift';
import { Icons } from '@/components/ui/Icons';
import { formatSatangToBaht } from '@/utils/currency';

interface PosShiftBannerProps {
  shift: ShiftInfo | null;
  isLoading: boolean;
  onOpenShiftClick: () => void;
}

export function PosShiftBanner({
  shift,
  isLoading,
  onOpenShiftClick,
}: PosShiftBannerProps) {
  if (isLoading) {
    return (
      <div className="h-12 w-full bg-slate-800/40 border border-slate-700/50 rounded-xl animate-pulse flex items-center px-4">
        <div className="h-4 w-48 bg-slate-700 rounded" />
      </div>
    );
  }

  // หากยังไม่ได้เปิดกะการขาย แสดงแบนเนอร์แจ้งเตือนสีส้มเด่นชัด
  if (!shift) {
    return (
      <div className="w-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border-2 border-amber-500/40 rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Icons.AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-amber-300 flex items-center gap-2">
              ยังไม่ได้เปิดกะการขาย
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ต้องเปิดกะก่อนคิดเงิน
              </span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              เลือกสินค้าใส่ตะกร้าได้ตามปกติ แต่ต้องระบุเงินทอนเริ่มต้นในลิ้นชักก่อนรับชำระเงิน
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenShiftClick}
          className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Icons.Clock className="w-5 h-5 text-slate-950" />
          <span>เปิดกะการขายเดี๋ยวนี้</span>
        </button>
      </div>
    );
  }

  // กรณีมีกะการขายเปิดอยู่แล้ว
  const formattedTime = new Date(shift.openedAt).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-full bg-slate-900/80 border border-emerald-500/30 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
      <div className="flex items-center gap-2.5 text-slate-300">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-emerald-400 font-semibold">กะการขายเปิดอยู่</span>
        <span className="text-slate-500">•</span>
        <span>เปิดเมื่อ: <span className="text-white font-medium">{formattedTime} น.</span></span>
        <span className="text-slate-500">•</span>
        <span>เงินทอนเริ่มต้น: <span className="text-cyan-400 font-bold">฿{formatSatangToBaht(shift.startingCash)}</span></span>
      </div>

      <div className="text-xs text-slate-400">
        แคชเชียร์: <span className="text-slate-200 font-medium">{shift.cashierName || 'แคชเชียร์'}</span>
      </div>
    </div>
  );
}
