'use client';

/**
 * หน้าต่างยืนยันการขายก่อนบันทึกรายการ (PosSaleConfirmModal)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly & Touchscreen Design:
 * - เป้าหมายสัมผัส >= 48px (ปุ่มดำเนินการสูง 56px)
 * - คอนทราสต์สูง (High Contrast) รองรับทั้ง Dark และ Light Mode
 * - แสดงยอดเงินทอน (Change) เป็นกล่องสีเขียวขนาดใหญ่พิเศษสำหรับเงินสด
 * - แสดงข้อมูลลูกค้าและวงเงินคงเหลือหลังหักบิลอย่างชัดเจนสำหรับเงินเชื่อ
 * - รองรับแป้นพิมพ์ Enter (ยืนยัน) และ Escape (ย้อนกลับไปแก้ไข)
 */

import React, { useEffect, useRef } from 'react';
import { Icons } from '@/components/ui/Icons';
import { PaymentMethodType } from '@/types/sale';
import { CartItem } from '@/types/pos';
import { CustomerSummary } from '@/types/customer';
import { formatSatangToBaht } from '@/utils/currencyHelper';

export interface SaleConfirmDetails {
  paymentMethod: PaymentMethodType;
  grandTotalSatang: number;
  itemCount: number;
  totalQty: number;
  items: CartItem[];
  // สำหรับเงินสด (CASH)
  tenderedSatang?: number;
  changeSatang?: number;
  // สำหรับเงินเชื่อ (CREDIT)
  customer?: CustomerSummary | null;
  remainingCreditSatang?: number;
}

interface PosSaleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  details: SaleConfirmDetails | null;
}

export function PosSaleConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  details,
}: PosSaleConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  // ตั้ง Auto-focus ที่ปุ่มยืนยันเพื่อให้แคชเชียร์เคาะ Enter ต่อได้ทันที
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ดักฟังคีย์บอร์ด Enter (ยืนยัน) และ Escape (ยกเลิก)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose, onConfirm]);

  if (!isOpen || !details) return null;

  const isCash = details.paymentMethod === 'CASH';
  const isCredit = details.paymentMethod === 'CREDIT';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto transition-all">
        {/* ส่วนหัวของ Modal */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isCash
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                isCash
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-purple-100 dark:bg-purple-500/20 border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300'
              }`}
            >
              {isCash ? (
                <Icons.Banknote className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Icons.User className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  ยืนยันการขาย
                </h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                    isCash
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30'
                  }`}
                >
                  {isCash ? 'เงินสด (CASH)' : 'เงินเชื่อ (CREDIT)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                ตรวจสอบความถูกต้องก่อนบันทึกเข้าระบบ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer min-h-[44px]"
            title="ย้อนกลับไปแก้ไข (Esc)"
          >
            <Icons.Close className="w-6 h-6" />
          </button>
        </div>

        {/* เนื้อหาการยืนยัน */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* การ์ดสรุปยอดที่ต้องชำระ */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                ยอดรวมสุทธิทั้งสิ้น
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {details.itemCount} รายการ ({details.totalQty} ชิ้น)
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              ฿{formatSatangToBaht(details.grandTotalSatang)}
            </div>
          </div>

          {/* รายละเอียดเฉพาะวิธีชำระเงินสด (CASH) */}
          {isCash && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* ยอดเงินรับ */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3 sm:p-4">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    เงินสดที่รับจากลูกค้า
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                    ฿{formatSatangToBaht(details.tenderedSatang ?? 0)}
                  </div>
                </div>

                {/* กล่องเงินทอนเด่นชัด (High Contrast Elderly-Friendly) */}
                <div className="bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-500/60 rounded-2xl p-3 sm:p-4 text-emerald-900 dark:text-emerald-100 shadow-sm">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                    เงินทอนที่ต้องคืนลูกค้า
                  </span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    ฿{formatSatangToBaht(details.changeSatang ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* รายละเอียดเฉพาะวิธีชำระเงินเชื่อ (CREDIT) */}
          {isCredit && details.customer && (
            <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-purple-200 dark:border-purple-800/40">
                <div className="flex items-center gap-2">
                  <Icons.User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-purple-900 dark:text-purple-200">
                    {details.customer.name}
                  </span>
                </div>
                {details.customer.code && (
                  <span className="text-xs font-mono text-purple-700 dark:text-purple-300">
                    ({details.customer.code})
                  </span>
                )}
              </div>

              <div className="flex justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <span>ยอดหักบัญชีเงินเชื่อบิลนี้:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  -฿{formatSatangToBaht(details.grandTotalSatang)}
                </span>
              </div>

              <div className="flex justify-between text-xs sm:text-sm pt-1 border-t border-purple-100 dark:border-purple-800/30">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  วงเงินคงเหลือหลังทำรายการ:
                </span>
                <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                  ฿{formatSatangToBaht(details.remainingCreditSatang ?? 0)}
                </span>
              </div>
            </div>
          )}

          {/* รายการสินค้าในบิลแบบย่อ (Mini Cart Preview) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>รายการสินค้าในบิล ({details.items.length} รายการ):</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 p-2.5 border border-slate-200 dark:border-slate-800 text-xs">
              {details.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-mono text-slate-400 dark:text-slate-500 shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      x{item.quantity}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white min-w-[60px]">
                      ฿{formatSatangToBaht(item.lineTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ปุ่มดำเนินการ (Action Buttons - ความสูง 56px ตาม Elderly-Friendly) */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[56px] rounded-2xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-base transition-all active:scale-[0.98] cursor-pointer border border-slate-300 dark:border-slate-700 disabled:opacity-50"
          >
            ย้อนกลับไปแก้ไข (Esc)
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`min-h-[56px] rounded-2xl text-white font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer shadow-lg disabled:opacity-50 ${
              isCash
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Icons.Loader className="w-5 h-5 animate-spin" />
                <span>กำลังบันทึกการขาย...</span>
              </>
            ) : (
              <>
                <Icons.Check className="w-6 h-6 stroke-[3]" />
                <span>ยืนยันทำรายการ (Enter)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

