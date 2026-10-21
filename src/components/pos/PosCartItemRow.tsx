'use client';

/**
 * แถวแสดงรายการสินค้าในตะกร้าขาย (PosCartItemRow)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (ปุ่ม +/- ขนาดใหญ่ >=48px, ล็อกราคาต่อหน่วย, แตะจำนวนเพื่อเปิด Numpad)
 */

import React from 'react';
import { CartItem } from '@/types/pos';
import { formatSatangToBaht } from '@/utils/currency';
import { Icons } from '@/components/ui/Icons';

interface PosCartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onOpenQuantityModal: (item: CartItem) => void;
}

export function PosCartItemRow({
  item,
  onUpdateQuantity,
  onRemoveItem,
  onOpenQuantityModal,
}: PosCartItemRowProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col gap-2.5 transition-colors">
      {/* แถวบน: ข้อมูลชื่อสินค้า และปุ่มลบ */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-white leading-snug line-clamp-1">
            {item.name}
          </h4>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            ฿{formatSatangToBaht(item.price)} / {item.uomName}
          </p>
        </div>

        {/* ปุ่มลบรายการ */}
        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          aria-label={`ลบ ${item.name} ออกจากตะกร้า`}
          className="w-10 h-10 -mr-1 -mt-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Icons.Trash className="w-5 h-5" />
        </button>
      </div>

      {/* แถวล่าง: ปุ่มปรับจำนวน (+/-) และยอดรวมแต่ละบรรทัด */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        {/* ตัวปรับจำนวนสินค้า */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {/* ปุ่มลดจำนวน (-) */}
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            aria-label="ลดจำนวน"
            className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
          >
            <Icons.Minus className="w-5 h-5" />
          </button>

          {/* ปุ่มตัวเลขจำนวน (กดเพื่อเปิด Virtual Touch Numpad) */}
          <button
            type="button"
            onClick={() => onOpenQuantityModal(item)}
            title="แตะเพื่อพิมพ์ระบุจำนวนด้วยแป้นตัวเลข"
            className="min-w-[48px] h-11 px-2.5 rounded-lg bg-slate-900 hover:bg-cyan-950/40 border border-slate-700/80 hover:border-cyan-500/60 text-white font-extrabold text-base flex items-center justify-center transition-all cursor-pointer"
          >
            <span>{item.quantity}</span>
          </button>

          {/* ปุ่มเพิ่มจำนวน (+) */}
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            aria-label="เพิ่มจำนวน"
            className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
          >
            <Icons.Plus className="w-5 h-5" />
          </button>
        </div>

        {/* ยอดรวมของบรรทัดนี้ */}
        <div className="text-right">
          <div className="text-lg font-extrabold text-cyan-400">
            ฿{formatSatangToBaht(item.lineTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}
