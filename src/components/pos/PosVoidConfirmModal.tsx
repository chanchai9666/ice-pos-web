'use client';

/**
 * หน้าต่างยืนยันการยกเลิกบิลขาย (PosVoidConfirmModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: POST /sales/{id}/void
 * DTO: ice-pos-api_internal_delivery_http_dto.VoidSaleRequest (reason: 3-500 chars)
 */

import React, { useState } from 'react';
import { SaleResponse } from '@/types/sale';
import { salesService } from '@/services/sales.service';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';
import { formatSatangToBaht } from '@/utils/currency';

interface PosVoidConfirmModalProps {
  isOpen: boolean;
  sale: SaleResponse | null;
  onClose: () => void;
  onSuccess: (voidedSaleId: string) => void;
}

export function PosVoidConfirmModal({
  isOpen,
  sale,
  onClose,
  onSuccess,
}: PosVoidConfirmModalProps) {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen || !sale) return null;

  const handleConfirm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      setErrorMessage('กรุณาระบุเหตุผลในการยกเลิกบิลอย่างน้อย 3 ตัวอักษร');
      playErrorBuzzer();
      return;
    }

    if (trimmedReason.length > 500) {
      setErrorMessage('เหตุผลมีความยาวเกิน 500 ตัวอักษร');
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    try {
      await salesService.voidSale(sale.id, trimmedReason);
      playSuccessBeep();
      onSuccess(sale.id);
      onClose();
      setReason('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถยกเลิกบิลขายได้ กรุณาลองใหม่อีกครั้ง';
      setErrorMessage(msg);
      playErrorBuzzer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-500/50 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* หัวกล่องข้อความเตือน */}
        <div className="p-5 border-b border-rose-100 dark:border-slate-800 bg-rose-50 dark:bg-rose-500/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Icons.AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">ยืนยันยกเลิกบิลขาย (Void Sale)</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400">การยกเลิกไม่สามารถย้อนกลับได้</p>
          </div>
        </div>

        {/* ข้อมูลบิลที่จะยกเลิก */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/60 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">เลขที่บิลขาย:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{sale.saleNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">ยอดเงินรวม:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 text-base">฿{formatSatangToBaht(sale.grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/40">
              <span>วันที่ทำรายการ:</span>
              <span>{sale.createdAt ? new Date(sale.createdAt).toLocaleString('th-TH') : '-'}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Icons.AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>ระบบจะทำการคืนจำนวนสต็อกสินค้ากลับเข้าคลัง และคืนยอดวงเงินเครดิตให้ลูกค้าโดยอัตโนมัติ</span>
          </div>

          {/* ช่องกรอกเหตุผล */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              เหตุผลในการยกเลิกบิล <span className="text-rose-600 dark:text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น ลูกค้าสั่งสินค้าผิดรายการ, คิดเงินผิดพลาด"
              className="w-full p-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 focus:border-rose-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 resize-none"
            />
            <div className="text-right text-xs text-slate-400 dark:text-slate-500 mt-1">
              {reason.trim().length}/500 ตัวอักษร (ขั้นต่ำ 3)
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* ปุ่มกดยกเลิกและยืนยัน */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
            >
              ย้อนกลับ
            </button>
            <button
              type="button"
              onClick={() => handleConfirm()}
              disabled={isSubmitting || reason.trim().length < 3}
              className="flex-1 min-h-[48px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-98 transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  <span>กำลังยกเลิก...</span>
                </>
              ) : (
                <>
                  <Icons.Trash className="w-4 h-4 stroke-[2.5]" />
                  <span>ยืนยันยกเลิกบิล</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
