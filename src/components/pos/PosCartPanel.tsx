'use client';

/**
 * แผงแสดงรายการตะกร้าขาย สรุปยอดเงิน และปุ่มชำระเงิน (PosCartPanel)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (ตัวเลขยอดเงินขนาดใหญ่พิเศษ, ปุ่มคิดเงินสูง 56px, กล่องยืนยันล้างบิล)
 */

import React, { useState } from 'react';
import { usePosCart } from '@/context/PosCartContext';
import { CartItem } from '@/types/pos';
import { PosCartItemRow } from '@/components/pos/PosCartItemRow';
import { PosQuantityModal } from '@/components/pos/PosQuantityModal';
import { formatSatangToBaht } from '@/utils/currency';
import { Icons } from '@/components/ui/Icons';

interface PosCartPanelProps {
  onCheckout?: () => void;
  isShiftActive?: boolean;
}

export function PosCartPanel({ onCheckout, isShiftActive = true }: PosCartPanelProps) {
  const { items, summary, updateQuantity, removeItem, clearCart } = usePosCart();

  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const handleClearConfirmed = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* ส่วนหัวของตะกร้า */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Icons.ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              รายการขาย (บิลปัจจุบัน)
              {items.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-extrabold border border-cyan-500/30">
                  {summary.totalQuantity} ชิ้น
                </span>
              )}
            </h3>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Icons.Trash className="w-3.5 h-3.5" />
            ล้างบิล
          </button>
        )}
      </div>

      {/* รายการสินค้าในตะกร้า */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-3 p-6 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
              <Icons.ShoppingCart className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-300">ยังไม่มีสินค้าในตะกร้า</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              แตะเลือกสินค้าจากฝั่งซ้าย หรือยิงบาร์โค้ดสินค้าเพื่อเริ่มคิดเงิน
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

      {/* ส่วนสรุปยอดเงินและปุ่มชำระเงิน */}
      <div className="p-4 bg-slate-950 border-t-2 border-slate-800 flex flex-col gap-3 shadow-2xl">
        <div className="space-y-1.5 text-sm">
          {/* ยอดรวมสินค้าก่อนภาษี */}
          <div className="flex justify-between text-slate-400">
            <span>ยอดรวมสินค้า ({summary.itemCount} รายการ)</span>
            <span className="font-mono text-slate-200">
              ฿{formatSatangToBaht(summary.subtotal - summary.taxAmount)}
            </span>
          </div>

          {/* ภาษีมูลค่าเพิ่ม (VAT 7%) */}
          <div className="flex justify-between text-slate-400">
            <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
            <span className="font-mono text-slate-200">
              ฿{formatSatangToBaht(summary.taxAmount)}
            </span>
          </div>

          {/* เส้นคั่น */}
          <div className="border-t border-slate-800 my-1" />

          {/* ยอดสุทธิทั้งบิล (ตัวเลขขนาดใหญ่พิเศษ) */}
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-base font-bold text-white">ยอดสุทธิ (Total)</span>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                ฿{formatSatangToBaht(summary.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* ปุ่มดำเนินการชำระเงิน (ความสูง 56px, Elderly-Friendly) */}
        <button
          type="button"
          disabled={items.length === 0}
          onClick={onCheckout}
          className={`w-full min-h-[56px] rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
            items.length === 0
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
              : !isShiftActive
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20 active:scale-[0.99]'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.99]'
          }`}
        >
          {!isShiftActive && items.length > 0 ? (
            <>
              <Icons.AlertTriangle className="w-6 h-6 text-slate-950" />
              <span>เปิดกะขายเพื่อคิดเงิน</span>
            </>
          ) : (
            <>
              <Icons.Check className="w-6 h-6 stroke-[3]" />
              <span>ชำระเงิน (Checkout)</span>
            </>
          )}
        </button>
      </div>

      {/* Modal ปรับจำนวนสินค้าด้วยแป้นสัมผัส */}
      <PosQuantityModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onConfirm={(id, qty) => updateQuantity(id, qty)}
      />

      {/* Modal ยืนยันการล้างตะกร้าสินค้า */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Icons.Trash className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">ต้องการล้างตะกร้าหรือไม่?</h3>
            <p className="text-sm text-slate-400">
              สินค้าทั้งหมดในบิลปัจจุบัน ({summary.totalQuantity} ชิ้น) จะถูกล้างออกทั้งหมด
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleClearConfirmed}
                className="min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-base transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
              >
                ยืนยันล้างบิล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
