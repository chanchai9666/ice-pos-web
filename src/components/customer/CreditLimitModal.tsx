'use client';

/**
 * หน้าต่างปรับวงเงินเครดิตลูกค้า (CreditLimitModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: PUT /customers/{id}/credit-limit
 */

import React, { useState, useEffect } from 'react';
import { CustomerSummary } from '@/types/customer';
import { customerService } from '@/services/customer.service';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';
import { bahtToSatang, formatSatangToBaht } from '@/utils/currency';

interface CreditLimitModalProps {
  isOpen: boolean;
  customer: CustomerSummary | null;
  onClose: () => void;
  onSuccess: (newLimitSatang: number) => void;
}

export function CreditLimitModal({
  isOpen,
  customer,
  onClose,
  onSuccess,
}: CreditLimitModalProps) {
  const [limitBaht, setLimitBaht] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (customer) {
      setLimitBaht(formatSatangToBaht(customer.creditLimit));
    }
    setErrorMessage('');
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedNum = parseFloat(limitBaht.replace(/,/g, ''));
    if (isNaN(parsedNum) || parsedNum < 0) {
      setErrorMessage('กรุณาระบุวงเงินเครดิตที่ถูกต้อง (ตัวเลขมากกว่าหรือเท่ากับ 0)');
      playErrorBuzzer();
      return;
    }

    const newLimitSatang = bahtToSatang(limitBaht);

    // แจ้งเตือนหากปรับวงเงินต่ำกว่ายอดหนี้ที่ค้างอยู่ปัจจุบัน
    if (newLimitSatang < customer.outstandingBalance) {
      const confirmLow = window.confirm(
        `คำเตือน: วงเงินใหม่ (฿${formatSatangToBaht(newLimitSatang)}) น้อยกว่ายอดหนี้คงค้างปัจจุบัน (฿${formatSatangToBaht(customer.outstandingBalance)}) ลูกค้าจะไม่สามารถซื้อสินค้าเงินเชื่อเพิ่มได้จนกว่าจะชำระหนี้ คุณต้องการดำเนินการต่อหรือไม่?`
      );
      if (!confirmLow) return;
    }

    setIsSubmitting(true);
    try {
      await customerService.setCreditLimit(customer.id, newLimitSatang);
      playSuccessBeep();
      onSuccess(newLimitSatang);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถปรับวงเงินเครดิตได้';
      setErrorMessage(msg);
      playErrorBuzzer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Icons.CreditCard className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">ปรับวงเงินเครดิต</h3>
              <p className="text-xs text-slate-400">{customer.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/60 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">วงเงินเครดิตปัจจุบัน:</span>
              <span className="font-semibold text-white">฿{formatSatangToBaht(customer.creditLimit)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-700/50 pt-1.5">
              <span className="text-slate-400">ยอดหนี้ค้างชำระ:</span>
              <span className="font-bold text-rose-400">฿{formatSatangToBaht(customer.outstandingBalance)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              วงเงินเครดิตใหม่ (บาท) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                required
                value={limitBaht}
                onChange={(e) => setLimitBaht(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-slate-950 border-2 border-slate-700 focus:border-amber-500 rounded-2xl text-2xl font-bold text-amber-400 focus:outline-none"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">
                ฿
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin text-slate-950" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-4 h-4 stroke-[2.5]" />
                  <span>บันทึกวงเงิน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
