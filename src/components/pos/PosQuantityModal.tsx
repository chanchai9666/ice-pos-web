'use client';

/**
 * หน้าต่าง Modal ปรับจำนวนสินค้าด้วยแป้นตัวเลขสัมผัส (PosQuantityModal)
 * โครงการ ice-pos-web
 */

import React, { useState, useEffect } from 'react';
import { CartItem } from '@/types/pos';
import { VirtualNumericKeypad } from '@/components/ui/VirtualNumericKeypad';
import { Icons } from '@/components/ui/Icons';
import { formatSatangToBaht } from '@/utils/currency';

interface PosQuantityModalProps {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (itemId: string, newQuantity: number) => void;
}

export function PosQuantityModal({
  item,
  isOpen,
  onClose,
  onConfirm,
}: PosQuantityModalProps) {
  const [val, setVal] = useState<string>('');

  useEffect(() => {
    if (item && isOpen) {
      setVal(String(item.quantity));
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    const qty = parseFloat(val);
    if (!isNaN(qty) && qty > 0) {
      onConfirm(item.id, qty);
    }
    onClose();
  };

  const isWeight = item.pricingType === 'WEIGHT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
        {/* ส่วนหัวของ Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="text-lg font-bold text-white truncate">
              {item.name}
            </h3>
            <p className="text-xs text-slate-400">
              ราคา {formatSatangToBaht(item.price)} / {item.uomName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* แป้นพิมพ์ตัวเลขสัมผัส */}
        <div className="p-4">
          <VirtualNumericKeypad
            value={val}
            onChange={setVal}
            onClose={onClose}
            onConfirm={handleConfirm}
            label={`ระบุจำนวน (${item.uomName})`}
            allowDecimal={isWeight}
            maxValue={9999}
          />
        </div>
      </div>
    </div>
  );
}
