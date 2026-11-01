'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';

export interface OverDeliveryWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  excessItems: Array<{
    productName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    excess: number;
  }>;
}

export function OverDeliveryWarningModal({
  isOpen,
  onClose,
  onConfirm,
  excessItems,
}: OverDeliveryWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/30 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
            <Icons.AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              ตรวจพบการรับสินค้าเกินจำนวนที่สั่งซื้อ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              (Over-Delivery Warning Confirmation)
            </p>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
          มีรายการสินค้าที่คุณระบุจำนวนรับจริง{' '}
          <span className="font-bold text-amber-600 dark:text-amber-300">มากกว่า</span>{' '}
          จำนวนคงเหลือในใบสั่งซื้อ (PO) ยอดสต็อกจะถูกปรับเพิ่มตามจำนวนที่รับจริงทั้งหมด:
        </p>

        {/* รายการสินค้าที่เกิน */}
        <div className="max-h-48 overflow-y-auto space-y-2 mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
          {excessItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-transparent text-sm"
            >
              <div className="min-w-0 pr-2">
                <div className="font-bold text-slate-900 dark:text-white truncate text-xs">
                  {item.productName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  สั่งไว้: {item.orderedQuantity} | รับจริง: {item.receivedQuantity}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                เกิน +{item.excess}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm min-h-[48px] cursor-pointer transition-colors"
          >
            กลับไปแก้ไข
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-950/50 min-h-[48px] cursor-pointer"
          >
            ยืนยันรับสินค้าเกิน
          </button>
        </div>
      </div>
    </div>
  );
}
