'use client';

/**
 * คอมโพเนนต์หน้าต่างรับคืนสินค้าและคืนเงิน (PosReturnModal)
 * สอดคล้องกับ API: POST /api/v1/returns
 * มาตรฐานกระทรวงสาธารณสุข & รพ.สต.: Elderly-Friendly, Satang Standard, Thai 100%
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '@/components/ui/Icons';
import { SaleResponse, SaleLineResponse } from '@/types/sale';
import { RefundMethod, CreateReturnLineItem } from '@/types/return';
import { returnService } from '@/services/return.service';
import { formatSatangToBaht } from '@/utils/currency';

interface PosReturnModalProps {
  isOpen: boolean;
  sale: SaleResponse | null;
  branchId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedReturnItem {
  lineId: string;
  productId: string;
  productName: string;
  maxQty: number;
  returnQty: number;
  unitAmount: number; // in Satang
  selected: boolean;
}

const PRESET_REASONS = [
  'สินค้าชำรุดเสียหายจากบรรจุภัณฑ์',
  'สินค้าหมดอายุ / เสื่อมคุณภาพ',
  'ลูกค้าเปลี่ยนใจ / ไม่ต้องการสินค้า',
  'พนักงานคิดรายการผิดพลาด',
  'สินค้าไม่ตรงตามที่ต้องการ',
];

const REFUND_METHODS: { value: RefundMethod; label: string; icon: string }[] = [
  { value: 'CASH', label: 'เงินสด', icon: 'Banknote' },
  { value: 'TRANSFER', label: 'โอนเงิน', icon: 'ArrowRightLeft' },
  { value: 'QR_PROMPTPAY', label: 'พร้อมเพย์', icon: 'QrCode' },
  { value: 'CREDIT', label: 'เครดิตลูกหนี้', icon: 'UserCheck' },
  { value: 'CARD', label: 'บัตรเครดิต/เดบิต', icon: 'CreditCard' },
];

export function PosReturnModal({
  isOpen,
  sale,
  branchId,
  onClose,
  onSuccess,
}: PosReturnModalProps) {
  const [items, setItems] = useState<SelectedReturnItem[]>([]);
  const [reason, setReason] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('CASH');
  const [returnsStock, setReturnsStock] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // เตรียมรายการสินค้าจาก Sale Lines เมื่อเปิด Modal
  useEffect(() => {
    if (sale && sale.lines) {
      setItems(
        sale.lines.map((l: SaleLineResponse, idx: number) => ({
          lineId: l.id || `line-${idx}`,
          productId: l.productId,
          productName: l.product?.name || `สินค้า #${l.productId.substring(0, 8)}`,
          maxQty: l.qty,
          returnQty: 1,
          unitAmount: l.unitPrice,
          selected: false,
        }))
      );
      setReason('');
      const primaryMethod = (sale.payments?.[0]?.method as RefundMethod) || 'CASH';
      setRefundMethod(primaryMethod);
      setReturnsStock(true);
      setErrorMsg(null);
    }
  }, [sale, isOpen]);

  // คำนวณยอดเงินคืนรวม (หน่วยสตางค์)
  const totalRefundSatang = useMemo(() => {
    return items
      .filter((it) => it.selected && it.returnQty > 0)
      .reduce((sum, it) => sum + it.returnQty * it.unitAmount, 0);
  }, [items]);

  const selectedCount = useMemo(() => {
    return items.filter((it) => it.selected).length;
  }, [items]);

  if (!isOpen || !sale) return null;

  const handleToggleSelect = (index: number) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleQtyChange = (index: number, newQty: number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const clampedQty = Math.max(1, Math.min(newQty, it.maxQty));
        return { ...it, returnQty: clampedQty };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const selectedLines = items.filter((it) => it.selected && it.returnQty > 0);
    if (selectedLines.length === 0) {
      setErrorMsg('กรุณาเลือกรายการสินค้าที่ต้องการรับคืนอย่างน้อย 1 รายการ');
      return;
    }

    if (!reason.trim() || reason.trim().length < 3) {
      setErrorMsg('กรุณาระบุเหตุผลในการรับคืนสินค้า (อย่างน้อย 3 ตัวอักษร)');
      return;
    }

    const payloadLines: CreateReturnLineItem[] = selectedLines.map((it) => ({
      saleLineId: it.lineId,
      productId: it.productId,
      qty: it.returnQty,
      unitAmount: it.unitAmount,
    }));

    setIsSubmitting(true);
    try {
      const res = await returnService.createReturn({
        saleId: sale.id,
        branchId: branchId || sale.branchId,
        reason: reason.trim(),
        refundMethod,
        returnsStock,
        lines: payloadLines,
      });

      if (res.data) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || 'ไม่สามารถทำรายการรับคืนสินค้าได้');
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      setErrorMsg(errMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Icons.RotateCcw className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">รับคืนสินค้าและคืนเงิน</h3>
              <p className="text-xs text-slate-400">
                บิลเลขที่ <span className="text-amber-400 font-mono font-bold">{sale.saleNo}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs sm:text-sm text-rose-300 flex items-center gap-2.5">
                <Icons.AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ส่วนเลือกสินค้าที่ต้องการคืน */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-200">
                  เลือกสินค้าที่ต้องการรับคืน ({selectedCount}/{items.length} รายการ)
                </label>
                <span className="text-xs text-slate-400">ติ๊กถูกเพื่อเลือกรายการ</span>
              </div>

              <div className="space-y-2 border border-slate-800 rounded-2xl p-2 bg-slate-950/60 max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={item.lineId}
                    className={`p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                      item.selected
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`item-${idx}`}
                      checked={item.selected}
                      onChange={() => handleToggleSelect(idx)}
                      className="w-5 h-5 rounded-md border-slate-700 text-amber-500 focus:ring-amber-400/20 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`item-${idx}`} className="text-sm font-medium text-white block truncate cursor-pointer">
                        {item.productName}
                      </label>
                      <div className="text-xs text-slate-400">
                        ซื้อ {item.maxQty} ชิ้น • ชิ้นละ ฿{formatSatangToBaht(item.unitAmount)}
                      </div>
                    </div>

                    {/* ตัวปรับจำนวนคืน */}
                    {item.selected && (
                      <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(idx, item.returnQty - 1)}
                          disabled={item.returnQty <= 1}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center font-bold text-base cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-base font-bold text-amber-400">
                          {item.returnQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(idx, item.returnQty + 1)}
                          disabled={item.returnQty >= item.maxQty}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center font-bold text-base cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    )}

                    <div className="text-right shrink-0 w-24">
                      <div className="text-sm font-bold text-white">
                        ฿{formatSatangToBaht(item.selected ? item.returnQty * item.unitAmount : 0)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ช่องทางคืนเงิน (Refund Method) */}
            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-2">
                ช่องทางคืนเงินให้ลูกค้า
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REFUND_METHODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setRefundMethod(m.value)}
                    className={`min-h-[48px] p-2.5 rounded-xl border font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      refundMethod === m.value
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* นำสินค้ากลับเข้าสต็อก */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">นำสินค้าคืนเข้าสต็อกคงคลัง (Restock)</div>
                <div className="text-xs text-slate-400">เพิ่มยอดสินค้าคงเหลือกลับเข้าคลังสาขานี้โดยอัตโนมัติ</div>
              </div>
              <input
                type="checkbox"
                checked={returnsStock}
                onChange={(e) => setReturnsStock(e.target.checked)}
                className="w-5 h-5 rounded-md border-slate-700 text-amber-500 focus:ring-amber-400/20 cursor-pointer"
              />
            </div>

            {/* เหตุผลในการรับคืน */}
            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-1.5">
                เหตุผลในการรับคืนสินค้า <span className="text-rose-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_REASONS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className="text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="ระบุเหตุผลในการรับคืนสินค้า (อย่างน้อย 3 ตัวอักษร)..."
                className="w-full p-3 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
              <span className="text-xs text-slate-400">ยอดเงินที่ต้องคืน:</span>
              <span className="text-2xl font-black text-amber-400">
                ฿{formatSatangToBaht(totalRefundSatang)}
              </span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none min-h-[48px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedCount === 0 || totalRefundSatang === 0}
                className="flex-1 sm:flex-none min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Icons.Refresh className="w-5 h-5 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Icons.RotateCcw className="w-5 h-5 stroke-[2.5]" />
                    <span>ยืนยันรับคืนสินค้า</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
