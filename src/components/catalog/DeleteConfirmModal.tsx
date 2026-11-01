'use client';

import React, { useState } from 'react';
import { Product } from '@/types/catalog';
import { Icons } from '@/components/ui/Icons';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirmDelete: (product: Product) => Promise<void>;
  onDeactivateInstead?: (product: Product) => Promise<void>;
}

export function DeleteConfirmModal({
  isOpen,
  product,
  onClose,
  onConfirmDelete,
  onDeactivateInstead,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(product);
      onClose();
    } catch {
      // Error handling is handled in parent or re-thrown
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!onDeactivateInstead) return;
    try {
      setIsDeactivating(true);
      await onDeactivateInstead(product);
      onClose();
    } catch {
      // Error handling is handled in parent
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 text-slate-800 dark:text-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4 pb-4 border-b-2 border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border-2 border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-inner">
            <Icons.Trash className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              ยืนยันการลบสินค้า
            </h3>
            <p className="text-base text-slate-700 dark:text-slate-300 mt-1 font-semibold truncate">
              {product.name} (รหัส SKU: {product.sku})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            aria-label="ปิดหน้าต่างยืนยัน"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="py-5 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-amber-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-base text-amber-800 dark:text-amber-300">
              <Icons.AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>ข้อควรระวังเกี่ยวกับประวัติข้อมูล</span>
            </div>
            <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-200">
              หากสินค้านี้เคยมีประวัติการขาย ใบเสร็จ หรือรายการตรวจนับสต็อกในระบบ
              การลบข้อมูลถาวรอาจส่งผลต่อความสมบูรณ์ของรายงานประวัติย้อนหลัง
            </p>
          </div>

          <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            หากต้องการระงับการขายชั่วคราว แนะนำให้เลือก{' '}
            <strong className="text-cyan-600 dark:text-cyan-400 font-bold">ปิดการจำหน่าย (Deactivate)</strong>{' '}
            แทนการลบถาวร สินค้าจะไม่ปรากฏในหน้าขายหน้าร้าน แต่ยังคงเก็บข้อมูลประวัติไว้ครบถ้วน
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          {onDeactivateInstead && product.isActive && (
            <button
              type="button"
              disabled={isDeactivating || isDeleting}
              onClick={handleDeactivate}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-base font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer min-h-[50px] disabled:opacity-50"
            >
              <Icons.Check className="w-5 h-5 stroke-[2.5]" />
              <span>{isDeactivating ? 'กำลังดำเนินการ...' : 'ปิดการจำหน่ายแทน (แนะนำ)'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isDeleting || isDeactivating}
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-base font-bold border-2 border-slate-200 dark:border-slate-700 transition-all cursor-pointer min-h-[50px]"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              disabled={isDeleting || isDeactivating}
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 border-2 border-rose-500 text-white text-base font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer min-h-[50px] disabled:opacity-50"
            >
              <Icons.Trash className="w-5 h-5" />
              <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันลบถาวร'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
