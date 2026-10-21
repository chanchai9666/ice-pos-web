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
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0">
            <Icons.Trash className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white">
              ยืนยันการลบสินค้า
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {product.name} (รหัส SKU: {product.sku})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Content */}
        <div className="py-4 space-y-3.5">
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs text-amber-300">
              <Icons.AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>ข้อควรระวังเกี่ยวกับประวัติข้อมูล</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              หากสินค้านี้เคยมีประวัติการขาย ใบเสร็จ หรือรายการตรวจนับสต็อกในระบบ
              การลบข้อมูลถาวรอาจส่งผลต่อความสมบูรณ์ของรายงานประวัติย้อนหลัง
            </p>
          </div>

          <p className="text-xs text-slate-300">
            หากต้องการระงับการขายชั่วคราว แนะนำให้เลือก{' '}
            <strong className="text-cyan-400">ปิดการจำหน่าย (Deactivate)</strong>{' '}
            แทนการลบถาวร สินค้าจะไม่ปรากฏในหน้าขายหน้าร้าน แต่ยังคงเก็บข้อมูลประวัติไว้ครบถ้วน
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
          {onDeactivateInstead && product.isActive && (
            <button
              type="button"
              disabled={isDeactivating || isDeleting}
              onClick={handleDeactivate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition-all cursor-pointer min-h-[44px] disabled:opacity-50"
            >
              <Icons.Check className="w-4 h-4" />
              <span>{isDeactivating ? 'กำลังดำเนินการ...' : 'ปิดการจำหน่ายแทน (แนะนำ)'}</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isDeleting || isDeactivating}
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer min-h-[44px]"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              disabled={isDeleting || isDeactivating}
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 hover:text-white text-xs font-semibold transition-all cursor-pointer min-h-[44px] disabled:opacity-50"
            >
              <Icons.Trash className="w-4 h-4" />
              <span>{isDeleting ? 'กำลังลบ...' : 'ยืนยันลบถาวร'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
