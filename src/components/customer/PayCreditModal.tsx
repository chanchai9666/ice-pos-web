'use client';

/**
 * หน้าต่างรับชำระหนี้เงินเชื่อ (PayCreditModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: POST /customers/{id}/pay-credit
 */

import React, { useState, useEffect } from 'react';
import { CustomerSummary, CreditTransactionResponse } from '@/types/customer';
import { customerService } from '@/services/customer.service';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';
import { bahtToSatang, formatSatangToBaht } from '@/utils/currency';

interface PayCreditModalProps {
  isOpen: boolean;
  customer: CustomerSummary | null;
  onClose: () => void;
  onSuccess: (tx: CreditTransactionResponse) => void;
}

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'เงินสด', icon: 'Calculator' },
  { id: 'QR_PROMPTPAY', label: 'พร้อมเพย์ QR', icon: 'QrCode' },
  { id: 'CARD', label: 'บัตรเครดิต/เดบิต', icon: 'CreditCard' },
  { id: 'WALLET', label: 'กระเป๋าเงินดิจิทัล', icon: 'Sparkles' },
] as const;

export function PayCreditModal({
  isOpen,
  customer,
  onClose,
  onSuccess,
}: PayCreditModalProps) {
  const [amountBaht, setAmountBaht] = useState<string>('');
  const [method, setMethod] = useState<string>('CASH');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (customer) {
      // ค่าเริ่มต้นเป็นยอดหนี้คงค้างทั้งหมด (ชำระเต็มจำนวน)
      setAmountBaht(formatSatangToBaht(customer.outstandingBalance));
    } else {
      setAmountBaht('');
    }
    setMethod('CASH');
    setNote('');
    setErrorMessage('');
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const handlePayAll = () => {
    setAmountBaht(formatSatangToBaht(customer.outstandingBalance));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedNum = parseFloat(amountBaht.replace(/,/g, ''));
    if (isNaN(parsedNum) || parsedNum <= 0) {
      setErrorMessage('กรุณาระบุจำนวนเงินที่ต้องการชำระให้ถูกต้อง');
      playErrorBuzzer();
      return;
    }

    const paySatang = bahtToSatang(amountBaht);
    if (paySatang > customer.outstandingBalance) {
      setErrorMessage(
        `ยอดชำระเกินยอดหนี้คงค้าง (ยอดหนี้คงค้างปัจจุบัน: ฿${formatSatangToBaht(customer.outstandingBalance)})`
      );
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await customerService.payCredit(customer.id, {
        amount: paySatang,
        paymentMethod: method,
        note: note.trim() || undefined,
      });

      if (res.data) {
        playSuccessBeep();
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMessage(res.message || 'ไม่สามารถบันทึกการชำระเงินได้');
        playErrorBuzzer();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      setErrorMessage(msg);
      playErrorBuzzer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Icons.Receipt className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">รับชำระหนี้เงินเชื่อ</h3>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">ยอดหนี้ค้างชำระปัจจุบัน</span>
              <span className="text-2xl font-black text-rose-400">
                ฿{formatSatangToBaht(customer.outstandingBalance)}
              </span>
            </div>
            <button
              type="button"
              onClick={handlePayAll}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-colors cursor-pointer"
            >
              ชำระเต็มจำนวน
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              จำนวนเงินที่รับชำระ (บาท) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={amountBaht}
                onChange={(e) => setAmountBaht(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 pl-12 pr-4 bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl text-2xl font-bold text-emerald-400 focus:outline-none"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-bold">
                ฿
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              ช่องทางการรับชำระเงิน <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setMethod(pm.id)}
                  className={`h-12 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    method === pm.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">
              หมายเหตุการชำระเงิน (ถ้ามี)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น โอนผ่านธนาคารกสิกรไทย, ชำระเงินสดหน้าร้าน"
              className="w-full h-11 px-4 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-white focus:outline-none"
            />
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
              disabled={isSubmitting || !amountBaht}
              className="flex-1 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-4 h-4 stroke-[2.5]" />
                  <span>ยืนยันรับชำระหนี้</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
