'use client';

/**
 * แผงรับชำระเงินสด (Cash Payment Screen with Virtual Numpad & Change Calculation)
 * มาตรฐาน Elderly-Friendly & Touchscreen Design (Touch Targets >= 48px, High Contrast)
 * รองรับชุดปุ่มเงินด่วนมาตรฐานไทย: พอดี, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 500, 1000
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

// รายการมูลค่าปุ่มเงินสดด่วนมาตรฐานไทย
const QUICK_CASH_DENOMINATIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 500, 1000];

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

  // ฟังก์ชันกำหนดยอดเงินสดด่วน (Set/Replace พฤติกรรมแทนที่ยอดเงินทันที)
  const handleQuickCash = (amount: number) => {
    onTenderedChange(amount % 1 === 0 ? String(amount) : amount.toFixed(2));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 bg-slate-900 text-slate-100">
      {/* ฝั่งซ้าย: แสดงยอดเงินรับและคำนวณเงินทอน (6 คอลัมน์) */}
      <div className="md:col-span-6 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          {/* ช่องแสดงยอดรวมสุทธิและช่องเงินสดที่รับ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ยอดรวมสุทธิที่ต้องชำระ */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5">
              <span className="text-xs sm:text-sm text-slate-400 font-medium">ยอดที่ต้องชำระ</span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                ฿{formatSatangToBaht(grandTotalSatang)}
              </div>
            </div>

            {/* จำนวนเงินสดที่รับจากลูกค้า */}
            <div className="bg-slate-800 border-2 border-cyan-500/60 rounded-2xl p-3.5 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs sm:text-sm text-cyan-300 font-semibold">เงินสดที่รับ</span>
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
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 min-h-[36px] flex items-center">
                {tenderedString
                  ? `฿${parseFloat(tenderedString).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                  : '฿0.00'}
              </div>
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

          {/* ชุดปุ่มเงินสดด่วน (Quick Cash Buttons): พอดี + 10 ถึง 1000 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm text-slate-300 font-semibold">ปุ่มเงินด่วน:</span>
              <span className="text-[11px] text-slate-400">แตะเพื่อระบุยอดเงินทันที</span>
            </div>

            {/* ปุ่มจ่ายพอดี (เด่นชัด ขนาดเต็มความกว้าง) */}
            <button
              type="button"
              onClick={() => handleQuickCash(grandTotalBaht)}
              className={`w-full h-12 min-h-[48px] rounded-xl font-black text-base flex items-center justify-center gap-2 border-2 transition-all active:scale-[0.98] mb-2.5 shadow-sm ${
                parseFloat(tenderedString) === grandTotalBaht
                  ? 'bg-cyan-600 text-white border-cyan-300 ring-2 ring-cyan-400/50 shadow-cyan-600/40'
                  : 'bg-gradient-to-r from-cyan-900/60 to-emerald-900/60 hover:from-cyan-800/80 hover:to-emerald-800/80 border-cyan-500/50 text-cyan-200 hover:text-white'
              }`}
            >
              <Icons.Check className="w-5 h-5 text-cyan-400" />
              <span>จ่ายพอดี (฿{formatSatangToBaht(grandTotalSatang)})</span>
            </button>

            {/* ตารางปุ่มเงินด่วน 12 จำนวน: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 500, 1000 */}
            <div className="grid grid-cols-4 gap-2">
              {QUICK_CASH_DENOMINATIONS.map((amount) => {
                const isSelected = parseFloat(tenderedString) === amount;
                return (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickCash(amount)}
                    className={`h-12 min-h-[48px] px-1 rounded-xl font-bold text-sm sm:text-base border transition-all active:scale-95 flex items-center justify-center ${
                      isSelected
                        ? 'bg-cyan-600 text-white border-cyan-300 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 active:bg-cyan-700 border-slate-700 text-slate-100 hover:text-white'
                    }`}
                  >
                    ฿{amount >= 1000 ? amount.toLocaleString('th-TH') : amount}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ปุ่มยืนยันการชำระเงินสด */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isEnough || isSubmitting}
          className="w-full h-14 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-white font-bold text-lg sm:text-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-emerald-400/40 mt-3 cursor-pointer disabled:cursor-not-allowed"
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

      {/* ฝั่งขวา: แป้นตัวเลขสัมผัส (Virtual Numeric Keypad) 6 คอลัมน์ */}
      <div className="md:col-span-6 flex flex-col justify-center bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800/80">
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
