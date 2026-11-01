'use client';

/**
 * หน้าต่าง Modal เปิดกะการขาย (PosOpenShiftModal)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (ปุ่มลัดเลือกเงินทอน, แป้นตัวเลขขนาดใหญ่, ปุ่มยืนยันสูง 56px)
 */

import React, { useState } from 'react';
import { shiftService } from '@/services/shift.service';
import { ShiftInfo } from '@/types/shift';
import { VirtualNumericKeypad } from '@/components/ui/VirtualNumericKeypad';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';
import { bahtToSatang } from '@/utils/currency';

interface PosOpenShiftModalProps {
  isOpen: boolean;
  branchId?: string;
  onClose: () => void;
  onSuccess: (shift: ShiftInfo) => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 3000, 5000];

export function PosOpenShiftModal({
  isOpen,
  branchId,
  onClose,
  onSuccess,
}: PosOpenShiftModalProps) {
  const [startingCashBaht, setStartingCashBaht] = useState<string>('1000');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleQuickSelect = (amt: number) => {
    setStartingCashBaht(String(amt));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!branchId) {
      setErrorMessage('ไม่พบข้อมูลสาขา กรุณาเข้าสู่ระบบใหม่');
      playErrorBuzzer();
      return;
    }

    const cashNum = parseFloat(startingCashBaht);
    if (isNaN(cashNum) || cashNum < 0) {
      setErrorMessage('กรุณาระบุจำนวนเงินทอนเริ่มต้นที่ถูกต้อง');
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    try {
      // แปลงบาทเป็นสตางค์ (1 บาท = 100 สตางค์) และส่งตามชื่อฟิลด์ที่ API กำหนด
      const openingCash = bahtToSatang(startingCashBaht);
      const res = await shiftService.openShift({
        branchId,
        openingCash,
      });

      if (res.data) {
        playSuccessBeep();
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMessage(res.message || 'ไม่สามารถเปิดกะได้ กรุณาลองใหม่อีกครั้ง');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* ส่วนหัวของ Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Icons.Clock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">เปิดกะการขาย (Open Shift)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ระบุเงินสดเริ่มต้นในลิ้นชักสำหรับทอนลูกค้า</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer min-h-[44px]"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* เนื้อหาฟอร์ม */}
        <div className="p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 rounded-xl text-rose-800 dark:text-rose-300 text-sm flex items-center gap-2.5">
              <Icons.AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ปุ่มลัดเลือกจำนวนเงินทอน (Quick Amount Pills) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              เลือกด่วนจำนวนเงินทอนเริ่มต้น:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_AMOUNTS.map((amt) => {
                const isSelected = startingCashBaht === String(amt);
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickSelect(amt)}
                    className={`min-h-[48px] rounded-xl font-bold text-sm transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-md shadow-amber-500/20'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ฿{amt.toLocaleString()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* แป้นตัวเลขสัมผัส (Virtual Numeric Keypad) */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <VirtualNumericKeypad
              value={startingCashBaht}
              onChange={setStartingCashBaht}
              label="เงินทอนเริ่มต้น (บาท)"
              allowDecimal={true}
              maxValue={100000}
            />
          </div>
        </div>

        {/* ส่วนปุ่มดำเนินการ */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-base transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !startingCashBaht}
            className={`min-h-[56px] rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isSubmitting || !startingCashBaht
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-98'
            }`}
          >
            {isSubmitting ? (
              <>
                <Icons.Refresh className="w-5 h-5 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Icons.Check className="w-6 h-6 stroke-[3]" />
                <span>ยืนยันเปิดกะการขาย</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
