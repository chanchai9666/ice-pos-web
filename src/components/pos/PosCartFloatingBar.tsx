'use client';

/**
 * แถบสรุปยอดและปุ่มดูตะกร้า/คิดเงินด่วนสำหรับหน้าจอขนาดพกพา (Mobile & Tablet)
 * โครงการ ice-pos-web
 */

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { formatSatangToBaht } from '@/utils/currency';

interface PosCartFloatingBarProps {
  itemCount: number;
  totalAmount: number;
  onOpenCart: () => void;
  onCheckout: () => void;
  isShiftActive: boolean;
}

export function PosCartFloatingBar({
  itemCount,
  totalAmount,
  onOpenCart,
  onCheckout,
  isShiftActive,
}: PosCartFloatingBarProps) {
  if (itemCount <= 0) {
    return null;
  }

  return (
    <div className="fixed bottom-16 lg:hidden inset-x-0 z-30 px-3 pb-2 pt-1 pointer-events-none animate-slideUp">
      <div className="max-w-xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-cyan-950/50 p-2.5 flex items-center justify-between gap-3 pointer-events-auto">
        {/* ส่วนแสดงจำนวนสินค้าและยอดรวม (แตะเพื่อเปิดลิ้นชักตะกร้า) */}
        <button
          type="button"
          onClick={onOpenCart}
          className="flex-1 flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200 dark:active:bg-slate-800 transition-colors text-left min-h-[48px] cursor-pointer"
          aria-label={`ดูตะกร้าสินค้า ${itemCount} ชิ้น ยอดรวม ฿${formatSatangToBaht(totalAmount)}`}
        >
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex-shrink-0">
            <Icons.ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-cyan-500 text-slate-950 text-xs font-black flex items-center justify-center shadow-md">
              {itemCount}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <span>{itemCount} รายการ</span>
              <span className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold underline underline-offset-2">
                (แตะดูตะกร้า)
              </span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              ฿{formatSatangToBaht(totalAmount)}
            </div>
          </div>
        </button>

        {/* ปุ่มชำระเงินด่วน (Direct Checkout) */}
        <button
          type="button"
          onClick={onCheckout}
          disabled={!isShiftActive}
          className="min-h-[48px] px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 flex-shrink-0 text-base cursor-pointer"
        >
          <Icons.Check className="w-5 h-5 text-slate-950 stroke-[3]" />
          <span>ชำระเงิน</span>
        </button>
      </div>
    </div>
  );
}
