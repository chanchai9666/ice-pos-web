'use client';

/**
 * แผงรับชำระเงินสด (Cash Payment Screen with Virtual Numpad & Change Calculation)
 * มาตรฐาน Elderly-Friendly & Touchscreen Design (Touch Targets >= 48px, High Contrast)
 * โครงการ ice-pos-web
 */

import React, { useMemo } from 'react';
import { Icons } from '@/components/ui/Icons';
import { VirtualNumericKeypad } from '@/components/ui/VirtualNumericKeypad';
import { bahtToSatang, formatSatangToBaht } from '@/utils/currency';

interface PosPaymentCashProps {
  grandTotalSatang: number;
  tenderedString: string;
  onTenderedChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PosPaymentCash({
  grandTotalSatang,
  tenderedString,
  onTenderedChange,
  onSubmit,
  isSubmitting,
}: PosPaymentCashProps) {
  // แปลงจำนวนเงินรับเป็นสตางค์
  const tenderedSatang = useMemo(() => {
    const num = parseFloat(tenderedString);
    if (isNaN(num) || num <= 0) return 0;
    return bahtToSatang(num);
  }, [tenderedString]);

  // คำนวณเงินทอน
  const changeSatang = tenderedSatang - grandTotalSatang;
  const isEnough = tenderedSatang >= grandTotalSatang;
  const grandTotalBaht = grandTotalSatang / 100;

  // ปุ่มลัดจำนวนเงินด่วน (Quick Cash Buttons)
  const quickCashOptions = useMemo(() => {
    const options: { label: string; value: number }[] = [
      { label: 'จ่ายพอดี', value: grandTotalBaht },
    ];

    // คำนวณแบงก์ที่มากกว่ายอดรวม
    const commonBills = [50, 100, 500, 1000];
    commonBills.forEach((bill) => {
      if (bill >= grandTotalBaht && !options.some((o) => o.value === bill)) {
        options.push({ label: `฿${bill}`, value: bill });
      }
    });

    // เพิ่มแบงก์ 1,000 เสมอถ้ายังไม่มี
    if (!options.some((o) => o.value === 1000) && grandTotalBaht < 1000) {
      options.push({ label: '฿1,000', value: 1000 });
    }

    return options.slice(0, 4); // แสดงสูงสุด 4 ปุ่ม
  }, [grandTotalBaht]);

  const handleQuickCash = (amount: number) => {
    onTenderedChange(amount.toFixed(2).replace(/\.00$/, ''));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 bg-slate-900 text-slate-100">
      {/* ฝั่งซ้าย: แสดงยอดเงินรับและคำนวณเงินทอน (5-6 คอลัมน์) */}
      <div className="md:col-span-5 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          {/* ช่องแสดงยอดรวมสุทธิที่ต้องชำระ */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-xs sm:text-sm text-slate-400 font-medium">ยอดที่ต้องชำระ</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              ฿{formatSatangToBaht(grandTotalSatang)}
            </div>
          </div>

          {/* ช่องแสดงจำนวนเงินที่รับจากลูกค้า */}
          <div className="bg-slate-800 border-2 border-cyan-500/60 rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs sm:text-sm text-cyan-300 font-semibold">เงินสดที่รับ (บาท)</span>
              {tenderedString && (
                <button
                  type="button"
                  onClick={() => onTenderedChange('')}
                  className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-700"
                >
                  ล้างค่า
                </button>
              )}
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-cyan-300 min-h-[48px] flex items-center">
              {tenderedString ? `฿${parseFloat(tenderedString).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '฿0.00'}
            </div>
          </div>

          {/* ช่องแสดงเงินทอน หรือแจ้งเตือนเงินไม่พอ */}
          <div
            className={`rounded-2xl p-4 border transition-colors ${
              isEnough
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            <span className="text-xs sm:text-sm font-semibold">
              {isEnough ? 'เงินทอนที่ต้องคืน' : 'สถานะยอดเงินรับ'}
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              {isEnough ? (
                <span className="text-emerald-400">
                  ฿{formatSatangToBaht(changeSatang)}
                </span>
              ) : (
                <span className="text-rose-400 text-lg sm:text-xl">
                  ยังขาดอีก ฿{formatSatangToBaht(grandTotalSatang - tenderedSatang)}
                </span>
              )}
            </div>
          </div>

          {/* ปุ่มลัดจำนวนเงินด่วน (Quick Cash Shortcuts) */}
          <div>
            <span className="text-xs text-slate-400 mb-2 block font-medium">ปุ่มเงินด่วน:</span>
            <div className="grid grid-cols-2 gap-2">
              {quickCashOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleQuickCash(opt.value)}
                  className="h-12 min-h-[48px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-cyan-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-sm sm:text-base transition-all active:scale-95 shadow-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ปุ่มยืนยันการชำระเงินสด */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isEnough || isSubmitting}
          className="w-full h-14 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-white font-bold text-lg sm:text-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-emerald-400/40 mt-4 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Icons.Loader className="w-6 h-6 animate-spin text-white" />
              <span>กำลังบันทึกการขาย...</span>
            </>
          ) : (
            <>
              <Icons.Check className="w-6 h-6 stroke-[3]" />
              <span>ยืนยันการขาย (รับ ฿{tenderedString || '0'})</span>
            </>
          )}
        </button>
      </div>

      {/* ฝั่งขวา: แป้นตัวเลขสัมผัส (Virtual Numeric Keypad) 7 คอลัมน์ */}
      <div className="md:col-span-7 flex flex-col justify-center bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
        <VirtualNumericKeypad
          value={tenderedString}
          onChange={onTenderedChange}
          label="แป้นตัวเลขระบุเงินสด"
          allowDecimal={true}
          maxValue={999999}
        />
      </div>
    </div>
  );
}
