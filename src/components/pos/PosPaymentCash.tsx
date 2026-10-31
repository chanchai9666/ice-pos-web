'use client';

/**
 * แผงรับชำระเงินสด (Cash Payment Screen with Smart Quick Cash & Touch Numpad)
 * มาตรฐาน Elderly-Friendly & Touchscreen Design (Touch Targets >= 48px, High Contrast)
 * รองรับ:
 *  - 3 แถวสรุปยอดเงินสดแยกคนละแถว: [ยอดที่ต้องชำระ], [เงินสดที่รับ (พร้อมปุ่มล้างค่า)], [เงินทอน / ยังขาด]
 *  - ยอดเงินแนะนำอัจฉริยะ (Smart Cash Suggestions) เช่น พอดี, ปัดเศษ 20, 50, 100, 500, 1000
 *  - ปุ่มบวกธนบัตรสะสม (+20, +50, +100, +500)
 *  - แป้นตัวเลขสัมผัส (VirtualNumericKeypad Dark Theme) พร้อมส่งบิลทันทีเมื่อกดตกลง
 *  - Sticky Confirm Bar ด้านล่างสำหรับหน้าจอมือถือและแท็บเล็ต/iPad
 * โครงการ ice-pos-web
 */

import React, { useMemo, useEffect, useCallback } from 'react';
import { Icons } from '@/components/ui/Icons';
import { VirtualNumericKeypad } from '@/components/ui/VirtualNumericKeypad';
import { toSatang, toBaht, formatSatangToBaht } from '@/utils/currencyHelper';
import { getSmartCashSuggestions, THAI_ADDITIVE_BANKNOTES } from '@/utils/cashSuggestions';

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
    return toSatang(num);
  }, [tenderedString]);

  // คำนวณเงินทอน
  const changeSatang = tenderedSatang - grandTotalSatang;
  const isEnough = tenderedSatang >= grandTotalSatang;
  const grandTotalBaht = toBaht(grandTotalSatang);

  // คำนวณยอดเงินแนะนำอัจฉริยะตามยอดรวมสุทธิ
  const smartSuggestions = useMemo(() => {
    return getSmartCashSuggestions(grandTotalSatang);
  }, [grandTotalSatang]);

  // ฟังก์ชันกำหนดยอดเงินสดด่วน (Set/Replace พฤติกรรมแทนที่ยอดเงินทันที)
  const handleQuickCash = useCallback((amount: number) => {
    onTenderedChange(amount % 1 === 0 ? String(amount) : amount.toFixed(2));
  }, [onTenderedChange]);

  // ฟังก์ชันบวกเงินสดสะสมตามธนบัตร (+20, +50, +100, +500)
  const handleAddCash = useCallback((addAmount: number) => {
    const current = parseFloat(tenderedString) || 0;
    const next = current + addAmount;
    onTenderedChange(next % 1 === 0 ? String(next) : next.toFixed(2));
  }, [tenderedString, onTenderedChange]);

  // กดตกลงจากแป้นพิมพ์ตัวเลขสัมผัส
  const handleKeypadConfirm = useCallback(() => {
    if (isEnough && !isSubmitting) {
      onSubmit();
    }
  }, [isEnough, isSubmitting, onSubmit]);

  // รองรับการพิมพ์ผ่านแป้นพิมพ์จริง (Physical Keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ไม่ดักฟังถ้ากำลังพิมพ์ใน input/textarea อื่น
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      if (e.key === 'Enter') {
        if (isEnough && !isSubmitting) {
          e.preventDefault();
          onSubmit();
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onTenderedChange(
          tenderedString.length > 1 ? tenderedString.slice(0, -1) : ''
        );
      } else if (e.key === 'Escape') {
        // ให้ Modal จัดการปิด
      } else if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        let next = tenderedString;
        if (next === '0') next = e.key;
        else next = next + e.key;
        onTenderedChange(next);
      } else if (e.key === '.') {
        e.preventDefault();
        if (!tenderedString.includes('.')) {
          onTenderedChange((tenderedString || '0') + '.');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnough, isSubmitting, onSubmit, tenderedString, onTenderedChange]);

  return (
    <div className="flex flex-col bg-slate-900 text-slate-100">
      {/* พื้นที่เนื้อหาหลัก (2 คอลัมน์บนจอใหญ่, 1 คอลัมน์บนจอมือถือ/iPad แนวตั้ง) */}
      <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* ฝั่งซ้าย (md:col-span-6): 3 แถวสรุปยอดเงิน, ปุ่มเงินด่วนอัจฉริยะ, และปุ่มบวกธนบัตร */}
        <div className="md:col-span-6 space-y-3 sm:space-y-4">
          {/* แถวที่ 1: ยอดรวมสุทธิที่ต้องชำระ */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 sm:p-4">
            <span className="text-xs sm:text-sm text-slate-400 font-medium block">
              ยอดที่ต้องชำระ
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {formatSatangToBaht(grandTotalSatang)}
            </div>
          </div>

          {/* แถวที่ 2: จำนวนเงินสดที่รับจากลูกค้า พร้อมปุ่มล้างค่า */}
          <div className="bg-slate-800 border-2 border-cyan-500/70 rounded-2xl p-3.5 sm:p-4 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs sm:text-sm text-cyan-300 font-semibold">
                เงินสดที่รับ
              </span>
              {tenderedString && (
                <button
                  type="button"
                  onClick={() => onTenderedChange('')}
                  className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-700/80 active:scale-95 transition-all cursor-pointer font-medium"
                >
                  ล้างค่า
                </button>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 min-h-[36px] flex items-center">
              {tenderedString
                ? `${parseFloat(tenderedString).toLocaleString('th-TH', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}`
                : '0.00'}
            </div>
          </div>

          {/* แถวที่ 3: ช่องแสดงเงินทอน หรือแจ้งเตือนเงินไม่พอ */}
          <div
            className={`rounded-2xl p-3.5 sm:p-4 border transition-colors ${
              isEnough
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            <span className="text-xs sm:text-sm font-semibold block">
              {isEnough ? 'เงินทอนที่ต้องคืน' : 'สถานะยอดเงินรับ'}
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              {isEnough ? (
                <span className="text-emerald-400">
                  {formatSatangToBaht(changeSatang)}
                </span>
              ) : (
                <span className="text-rose-400 text-lg sm:text-xl">
                  ยังขาดอีก {formatSatangToBaht(grandTotalSatang - tenderedSatang)}
                </span>
              )}
            </div>
          </div>

          {/* ปุ่มจ่ายพอดี (เด่นชัด ขนาดเต็มความกว้าง) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleQuickCash(grandTotalBaht)}
              className={`w-full min-h-[48px] sm:min-h-[52px] rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 border-2 transition-all active:scale-[0.98] shadow-sm cursor-pointer ${
                parseFloat(tenderedString) === grandTotalBaht
                  ? 'bg-cyan-600 text-white border-cyan-300 ring-2 ring-cyan-400/50 shadow-cyan-600/40'
                  : 'bg-gradient-to-r from-cyan-900/60 to-emerald-900/60 hover:from-cyan-800/80 hover:to-emerald-800/80 border-cyan-500/50 text-cyan-200 hover:text-white'
              }`}
            >
              <Icons.Check className="w-5 h-5 text-cyan-400" />
              <span>จ่ายพอดี ({formatSatangToBaht(grandTotalSatang)})</span>
            </button>
          </div>

          {/* ยอดเงินแนะนำอัจฉริยะ (Smart Cash Suggestions) */}
          {smartSuggestions.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Icons.Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ยอดแนะนำที่พบบ่อย (แตะระบุทันที):
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-3 gap-2">
                {smartSuggestions.map((amount) => {
                  const isSelected = parseFloat(tenderedString) === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => handleQuickCash(amount)}
                      className={`min-h-[48px] rounded-xl font-black text-base border transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-600 text-white border-cyan-300 ring-2 ring-cyan-400/50 shadow-md shadow-cyan-600/30'
                          : 'bg-slate-800 hover:bg-slate-700 active:bg-cyan-700 border-slate-700 text-slate-100 hover:text-white'
                      }`}
                    >
                      <span>฿{amount >= 1000 ? amount.toLocaleString('th-TH') : amount}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ปุ่มบวกเงินสดสะสมตามธนบัตร (+Banknotes) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                <Icons.Plus className="w-3.5 h-3.5 text-emerald-400" />
                บวกธนบัตรสะสม (รับแบงค์หลายใบ):
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {THAI_ADDITIVE_BANKNOTES.map((banknote) => (
                <button
                  key={banknote}
                  type="button"
                  onClick={() => handleAddCash(banknote)}
                  className="min-h-[46px] rounded-xl font-bold text-sm sm:text-base border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/50 active:bg-emerald-600 active:text-white text-emerald-300 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  title={`บวกเงินสดเพิ่มอีก ฿${banknote}`}
                >
                  +{banknote}
                </button>
              ))}
            </div>
          </div>

          {/* ปุ่มยืนยันการชำระเงินสำหรับจอ Desktop (แสดงเฉพาะจอ md: ขึ้นไป) */}
          <div className="hidden md:block pt-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!isEnough || isSubmitting}
              className="w-full min-h-[54px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 text-white font-bold text-lg shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] border border-emerald-400/40 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-5 h-5 animate-spin text-white" />
                  <span>กำลังบันทึกการขาย...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-6 h-6 stroke-[3]" />
                  <span>
                    {isEnough
                      ? `ยืนยันการขาย (รับ ฿${parseFloat(tenderedString || '0').toLocaleString('th-TH')})`
                      : `ยังขาดยอดเงินอีก ${formatSatangToBaht(grandTotalSatang - tenderedSatang)}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ฝั่งขวา (md:col-span-6): แป้นตัวเลขสัมผัส (Virtual Numeric Keypad Dark Theme) */}
        <div className="md:col-span-6 flex flex-col justify-center">
          <VirtualNumericKeypad
            value={tenderedString}
            onChange={onTenderedChange}
            onConfirm={handleKeypadConfirm}
            theme="dark"
            hideDisplay={true}
            hideHeader={true}
            allowDecimal={true}
            maxValue={999999}
          />
        </div>
      </div>

      {/* แถบยืนยันการขายแบบ Sticky Bottom Action Bar สำหรับ Mobile & iPad Portrait */}
      <div className="md:hidden sticky bottom-0 z-20 bg-slate-900/95 backdrop-blur-md p-3 border-t border-slate-800 shadow-2xl">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isEnough || isSubmitting}
          className="w-full min-h-[52px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-800 text-white font-bold text-base sm:text-lg shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-emerald-400/40 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Icons.Loader className="w-5 h-5 animate-spin text-white" />
              <span>กำลังบันทึกการขาย...</span>
            </>
          ) : (
            <>
              <Icons.Check className="w-5 h-5 stroke-[3]" />
              <span>
                {isEnough
                  ? `ยืนยันการขาย (รับ ฿${parseFloat(tenderedString || '0').toLocaleString('th-TH')})`
                  : `ยังขาดอีก ${formatSatangToBaht(grandTotalSatang - tenderedSatang)}`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
