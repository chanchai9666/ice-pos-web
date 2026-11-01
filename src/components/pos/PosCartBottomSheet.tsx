'use client';

/**
 * ลิ้นชักแสดงรายการตะกร้าสินค้าสำหรับอุปกรณ์พกพา (Mobile & Tablet POS Bottom Sheet)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, เลื่อนเปิด-ปิดสะดวก)
 */

import React, { useState } from 'react';
import { usePosCart } from '@/context/PosCartContext';
import { CartItem } from '@/types/pos';
import { PosCartItemRow } from '@/components/pos/PosCartItemRow';
import { PosQuantityModal } from '@/components/pos/PosQuantityModal';
import { formatSatangToBaht } from '@/utils/currency';
import { Icons } from '@/components/ui/Icons';

interface PosCartBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  isShiftActive: boolean;
}

export function PosCartBottomSheet({
  isOpen,
  onClose,
  onCheckout,
  isShiftActive,
}: PosCartBottomSheetProps) {
  const { items, summary, updateQuantity, removeItem, clearCart } = usePosCart();
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  if (!isOpen) {
    return null;
  }

  const handleClearConfirmed = () => {
    clearCart();
    setShowClearConfirm(false);
    onClose();
  };

  const handleCheckoutClick = () => {
    onClose();
    onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
      {/* ม่านพื้นหลังโปร่งแสง (Backdrop) แตะเพื่อปิด */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* แผงเนื้อหา Bottom Sheet */}
      <div className="relative z-10 w-full max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700/80 rounded-t-3xl shadow-2xl shadow-black/80 overflow-hidden animate-slideUp">
        {/* แถบจับด้านบน (Drag Handle Indicator) */}
        <div className="w-full pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600/80" />
        </div>

        {/* ส่วนหัวของลิ้นชักตะกร้า */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Icons.ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                ตะกร้าสินค้า
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-extrabold border border-cyan-500/30">
                  {summary.totalQuantity} ชิ้น
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.Trash className="w-4 h-4" />
                <span>ล้างบิล</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="ปิดตะกร้าสินค้า"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* รายการสินค้าในตะกร้า (Scrollable Body) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-400">
                <Icons.ShoppingCart className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">ยังไม่มีสินค้าในตะกร้า</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                แตะเลือกสินค้าจากหน้าจอ เพื่อเพิ่มสินค้าลงในบิลขาย
              </p>
            </div>
          ) : (
            items.map((item) => (
              <PosCartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onOpenQuantityModal={(it) => setEditingItem(it)}
              />
            ))
          )}
        </div>

        {/* ส่วนท้าย (Footer): สรุปยอดเงินและปุ่มชำระเงินขนาดใหญ่ */}
        {items.length > 0 && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">ยอดรวมสุทธิ</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">
                ฿{formatSatangToBaht(summary.grandTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckoutClick}
              disabled={!isShiftActive}
              className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl font-extrabold text-lg text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Icons.Check className="w-6 h-6 text-slate-950 stroke-[3]" />
              <span>ชำระเงิน (฿{formatSatangToBaht(summary.grandTotal)})</span>
            </button>
          </div>
        )}
      </div>

      {/* กล่องแก้ไขจำนวนสินค้า (Numpad Modal) */}
      {editingItem && (
        <PosQuantityModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onConfirm={(id, qty) => {
            updateQuantity(id, qty);
            setEditingItem(null);
          }}
        />
      )}

      {/* กล่องข้อความยืนยันการล้างบิล (Clear Confirmation Dialog) */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Icons.Trash className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">ยืนยันการล้างบิลขาย?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                รายการสินค้าทั้งหมดในตะกร้าปัจจุบันจะถูกยกเลิก คุณแน่ใจหรือไม่?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="min-h-[48px] py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-all text-sm cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleClearConfirmed}
                className="min-h-[48px] py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all text-sm shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                ล้างบิล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
