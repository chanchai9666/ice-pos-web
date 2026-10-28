'use client';

/**
 * หน้าต่าง Modal ปิดกะการขาย (PosCloseShiftModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: POST /shifts/{id}/close
 * ออกแบบตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, แป้นตัวเลขขนาดใหญ่, กระทบยอดเงินสดขาด/เกินชัดเจน)
 */

import React, { useState } from 'react';
import { shiftService } from '@/services/shift.service';
import { ShiftInfo } from '@/types/shift';
import { VirtualNumericKeypad } from '@/components/ui/VirtualNumericKeypad';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';
import { bahtToSatang, formatSatangToBaht } from '@/utils/currency';

interface PosCloseShiftModalProps {
  isOpen: boolean;
  shift: ShiftInfo | null;
  onClose: () => void;
  onSuccess: (closedShift: ShiftInfo) => void;
}

export function PosCloseShiftModal({
  isOpen,
  shift,
  onClose,
  onSuccess,
}: PosCloseShiftModalProps) {
  const [countedCashBaht, setCountedCashBaht] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [closedResult, setClosedResult] = useState<ShiftInfo | null>(null);

  if (!isOpen || !shift) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cashNum = parseFloat(countedCashBaht);
    if (isNaN(cashNum) || cashNum < 0) {
      setErrorMessage('กรุณาระบุจำนวนเงินสดที่นับได้จริงในลิ้นชัก');
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    try {
      // แปลงเป็นสตางค์สำหรับส่งให้ API
      const countedCash = bahtToSatang(countedCashBaht);
      const res = await shiftService.closeShift(shift.id, {
        countedCash,
      });

      if (res.data) {
        playSuccessBeep();
        setClosedResult(res.data);
      } else {
        setErrorMessage(res.message || 'ไม่สามารถปิดกะได้ กรุณาลองใหม่อีกครั้ง');
        playErrorBuzzer();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      setErrorMessage(msg);
      playErrorBuzzer();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (closedResult) {
      onSuccess(closedResult);
    }
    onClose();
    setClosedResult(null);
    setCountedCashBaht('');
  };

  // กรณีปิดกะเรียบร้อยแล้ว แสดงหน้าต่างสรุปกระทบยอด (Reconciliation Summary)
  if (closedResult) {
    const difference = closedResult.difference ?? 0;
    const isExact = difference === 0;
    const isOverage = difference > 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
          {/* ส่วนหัวแสดงผลสำเร็จ */}
          <div className="p-5 border-b border-slate-800 bg-emerald-500/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Icons.Check className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">ปิดกะการขายสำเร็จ</h3>
              <p className="text-xs text-emerald-400">บันทึกกระทบยอดเงินสดเรียบร้อยแล้ว</p>
            </div>
          </div>

          {/* รายละเอียดสรุปยอดกะ */}
          <div className="p-6 space-y-4">
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">เงินทอนเริ่มต้นกะ:</span>
                <span className="font-semibold text-white">฿{formatSatangToBaht(closedResult.openingCash)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">ยอดเงินสดในลิ้นชักที่ควรมี (Expected):</span>
                <span className="font-semibold text-white">
                  ฿{formatSatangToBaht(closedResult.expectedCash ?? closedResult.openingCash)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-700/60 pt-2">
                <span className="text-slate-300 font-medium">เงินสดที่นับได้จริง (Counted):</span>
                <span className="font-bold text-cyan-400 text-base">
                  ฿{formatSatangToBaht(closedResult.countedCash)}
                </span>
              </div>
            </div>

            {/* แสดงสถานะเงินสดขาด / เกิน / พอดี */}
            <div
              className={`p-4 rounded-2xl border text-center ${
                isExact
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : isOverage
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="text-xs uppercase font-bold tracking-wider mb-1">
                {isExact ? 'ยอดเงินสดตรงพอดี' : isOverage ? 'ยอดเงินสดเกิน (Overage)' : 'ยอดเงินสดขาด (Shortage)'}
              </div>
              <div className="text-2xl font-black">
                {isExact
                  ? '฿0.00'
                  : `${isOverage ? '+' : '-'}฿${formatSatangToBaht(Math.abs(difference))}`}
              </div>
            </div>

            <div className="text-xs text-slate-400 text-center">
              ปิดกะเมื่อ: {closedResult.closedAt ? new Date(closedResult.closedAt).toLocaleString('th-TH') : 'ปัจจุบัน'}
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full min-h-[52px] rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <Icons.Check className="w-5 h-5 stroke-[2.5]" />
              <span>เสร็จสิ้นและออกจากกะ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // หน้าต่างบันทึกเงินสดที่นับได้จริง
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* ส่วนหัวของ Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Icons.LogOut className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">ปิดกะการขาย (Close Shift)</h3>
              <p className="text-xs text-slate-400">นับยอดเงินสดทั้งหมดในลิ้นชักเพื่อกระทบยอด</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* ข้อมูลกะปัจจุบัน */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 flex justify-between items-center text-xs sm:text-sm">
            <span className="text-slate-400">เงินทอนเริ่มต้นกะ:</span>
            <span className="font-bold text-amber-400">฿{formatSatangToBaht(shift.openingCash)}</span>
          </div>

          {/* ช่องกรอกยอดเงินสดที่นับได้ */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              เงินสดที่นับได้จริงในลิ้นชัก (บาท) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={countedCashBaht}
                onChange={(e) => setCountedCashBaht(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 pl-12 pr-4 bg-slate-950 border-2 border-slate-700 focus:border-rose-500 rounded-2xl text-2xl font-bold text-white text-right focus:outline-none transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">
                ฿
              </span>
            </div>
          </div>

          {/* แป้นพิมพ์ตัวเลขสัมผัส (Virtual Keypad) สำหรับหน้าจอ POS */}
          <div className="pt-1">
            <VirtualNumericKeypad
              value={countedCashBaht}
              onChange={setCountedCashBaht}
              onConfirm={() => handleSubmit()}
            />
          </div>

          {/* ข้อความแจ้งเตือนความผิดพลาด */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2.5 text-rose-300 text-sm animate-shake">
              <Icons.AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ปุ่มบันทึกปิดกะและยกเลิก */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[52px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-base transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="flex-2 min-h-[52px] rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-5 h-5 animate-spin" />
                  <span>กำลังปิดกะ...</span>
                </>
              ) : (
                <>
                  <Icons.LogOut className="w-5 h-5 stroke-[2.5]" />
                  <span>ยืนยันปิดกะการขาย</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
