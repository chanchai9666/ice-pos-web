'use client';

import React, { useState, useEffect } from 'react';
import { StockLevel, StockAdjustmentType } from '@/types/inventory';
import { inventoryService } from '@/services/inventory.service';
import { Icons } from '@/components/ui/Icons';

export interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockLevel | null;
  branchId: string;
  onSuccess: () => void;
}

const ADJUSTMENT_TYPES: Array<{
  type: StockAdjustmentType;
  label: string;
  description: string;
  icon: keyof typeof Icons;
  badgeClass: string;
}> = [
  {
    type: 'AUDIT',
    label: 'ตรวจนับสต็อก (Audit)',
    description: 'ระบุยอดที่นับได้จริง ระบบจะคำนวณส่วนต่างให้อัตโนมัติ',
    icon: 'Boxes',
    badgeClass: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  },
  {
    type: 'IN',
    label: 'รับสินค้าเข้า (Stock In)',
    description: 'เพิ่มจำนวนสินค้าเข้าคลัง (+) เช่น สินค้าเข้าเพิ่ม',
    icon: 'Package',
    badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  {
    type: 'OUT',
    label: 'ตัดสินค้าออก (Stock Out)',
    description: 'ลดจำนวนสินค้าออกจากคลัง (-) เช่น ใช้งานภายใน',
    icon: 'Minus',
    badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  {
    type: 'DAMAGE',
    label: 'สินค้าเสียหาย (Damage)',
    description: 'ตัดสินค้าที่ชำรุด แตกหัก หรือเสียหาย (-)',
    icon: 'AlertTriangle',
    badgeClass: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  },
  {
    type: 'EXPIRED',
    label: 'สินค้าหมดอายุ (Expired)',
    description: 'ตัดสินค้าที่หมดอายุหรือไม่สามารถจำหน่ายได้ (-)',
    icon: 'Clock',
    badgeClass: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  },
];

export function StockAdjustmentModal({
  isOpen,
  onClose,
  stock,
  branchId,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [type, setType] = useState<StockAdjustmentType>('AUDIT');
  const [inputValue, setInputValue] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // รีเซ็ตค่าเมื่อเปิด Modal หรือเปลี่ยนสินค้า
  useEffect(() => {
    if (isOpen && stock) {
      setType('AUDIT');
      setInputValue(stock.quantity.toString());
      setReason('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, stock]);

  if (!isOpen || !stock) return null;

  const product = stock.product;
  const currentQuantity = stock.quantity;
  const unitName = product?.baseUom?.name || 'ชิ้น';
  const numericInput = Number(inputValue) || 0;

  // คำนวณ quantityDelta และยอดสต็อกใหม่ตามประเภท
  let quantityDelta = 0;
  let newEstimatedStock = currentQuantity;
  let validationError: string | null = null;

  if (type === 'AUDIT') {
    quantityDelta = numericInput - currentQuantity;
    newEstimatedStock = numericInput;
    if (numericInput < 0) {
      validationError = 'ยอดตรวจนับจริงต้องไม่ติดลบ';
    }
  } else if (type === 'IN') {
    quantityDelta = numericInput;
    newEstimatedStock = currentQuantity + numericInput;
    if (numericInput <= 0) {
      validationError = 'จำนวนที่รับเข้าต้องมากกว่า 0';
    }
  } else {
    // OUT, DAMAGE, EXPIRED
    quantityDelta = -numericInput;
    newEstimatedStock = currentQuantity - numericInput;
    if (numericInput <= 0) {
      validationError = 'จำนวนที่ตัดออกต้องมากกว่า 0';
    } else if (numericInput > currentQuantity) {
      validationError = `ไม่สามารถตัดสต็อกเกินยอดคงเหลือ (${currentQuantity} ${unitName})`;
    }
  }

  // ตรวจสอบความถูกต้องของเหตุผล
  const trimmedReason = reason.trim();
  const isReasonValid = trimmedReason.length >= 3;
  const canSubmit = !validationError && isReasonValid && !isSubmitting && (type === 'AUDIT' || numericInput > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `adj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const effectiveBranchId = branchId || stock.branchId;

      await inventoryService.adjustStock(effectiveBranchId, {
        branchId: effectiveBranchId,
        productId: stock.productId,
        type,
        quantityDelta,
        reason: trimmedReason,
        idempotencyKey,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { message?: string; details?: Array<{ issue: string }> };
      const msg =
        errorObj.details?.[0]?.issue ||
        errorObj.message ||
        'เกิดข้อผิดพลาดในการปรับยอดสต็อก กรุณาลองใหม่อีกครั้ง';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border-2 border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-adjustment-title"
      >
        {/* ส่วนหัว Modal */}
        <div className="p-5 sm:p-6 border-b-2 border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Icons.Boxes className="w-5 h-5" />
              </span>
              <h2 id="stock-adjustment-title" className="text-xl font-black text-white">
                ปรับปรุงยอดสต็อกสินค้า
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-slate-400 font-medium">
              {product?.name || `รหัส: ${stock.productId}`}
              {product?.sku && <span className="ml-2 font-mono">({product.sku})</span>}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-90 cursor-pointer disabled:opacity-30"
            aria-label="ปิดหน้าต่าง"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* เนื้อหาฟอร์ม */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* ข้อมูลสต็อกปัจจุบัน */}
          <div className="bg-slate-950 p-4 rounded-2xl border-2 border-slate-800 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-slate-400 block font-medium">ยอดคงเหลือปัจจุบัน</span>
              <span className="text-xs text-slate-400">เกณฑ์เตือน: {product?.minStock ?? 5} {unitName}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {currentQuantity.toLocaleString()}
              </span>
              <span className="ml-1.5 text-sm font-bold text-slate-300">{unitName}</span>
            </div>
          </div>

          {/* เลือกประเภทการปรับปรุง */}
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              ประเภทการปรับปรุงสต็อก <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ADJUSTMENT_TYPES.map((item) => {
                const isSelected = type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setType(item.type);
                      if (item.type === 'AUDIT') {
                        setInputValue(currentQuantity.toString());
                      } else {
                        setInputValue('');
                      }
                      setErrorMessage(null);
                    }}
                    className={`min-h-[50px] p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? `${item.badgeClass} ring-2 ring-cyan-400/30 font-bold shadow-md`
                        : 'bg-slate-850 border-slate-750 text-slate-300 hover:border-slate-650'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-sm font-bold leading-tight">{item.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ช่องกรอกจำนวน */}
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              {type === 'AUDIT'
                ? 'ยอดตรวจนับได้จริง (Physical Count)'
                : type === 'IN'
                ? 'จำนวนสินค้าที่รับเข้า (+)'
                : 'จำนวนสินค้าที่ตัดออก (-)'}{' '}
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={type === 'AUDIT' ? 'กรอกยอดนับจริง...' : 'ระบุจำนวน...'}
                className="w-full h-[52px] px-4 bg-slate-950 border-2 border-slate-700 rounded-xl text-lg font-bold text-white font-mono placeholder-slate-450 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                autoFocus
              />
              <span className="absolute inset-y-0 right-4 flex items-center text-sm font-bold text-slate-400 pointer-events-none">
                {unitName}
              </span>
            </div>

            {/* แสดงการคำนวณผลลัพธ์ Delta & New Stock */}
            <div className="mt-3 p-3.5 bg-slate-850/80 rounded-xl border border-slate-750 text-sm flex items-center justify-between">
              <span className="text-slate-300">
                ผลต่าง (Delta):{' '}
                <strong
                  className={`font-mono font-bold text-base ${
                    quantityDelta > 0
                      ? 'text-emerald-400'
                      : quantityDelta < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {quantityDelta > 0 ? `+${quantityDelta}` : quantityDelta} {unitName}
                </strong>
              </span>

              <span className="text-slate-300">
                สต็อกหลังปรับ:{' '}
                <strong
                  className={`font-mono font-bold text-base ${
                    newEstimatedStock <= 0 ? 'text-rose-400' : 'text-cyan-300'
                  }`}
                >
                  {newEstimatedStock.toLocaleString()} {unitName}
                </strong>
              </span>
            </div>

            {validationError && (
              <p className="mt-2 text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* ช่องระบุเหตุผล (บังคับ) */}
          <div>
            <label className="block text-sm font-bold text-slate-200 mb-2">
              เหตุผลการปรับปรุงสต็อก <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น นับรอบประจำสัปดาห์, สินค้าชำรุดจากการขนส่ง, ได้รับของแถม..."
              className="w-full h-[50px] px-4 bg-slate-950 border-2 border-slate-700 rounded-xl text-sm font-medium text-white placeholder-slate-450 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
            {trimmedReason.length > 0 && trimmedReason.length < 3 && (
              <p className="mt-1 text-xs text-amber-400 font-medium">
                กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร
              </p>
            )}
          </div>

          {/* ข้อความแจ้งเตือนความผิดพลาดจาก Server */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border-2 border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-start gap-2.5">
              <Icons.AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ปุ่มบันทึกและยกเลิก */}
          <div className="pt-3 border-t-2 border-slate-850 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[50px] px-5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl font-bold text-sm border-2 border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="min-h-[50px] px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white rounded-xl font-bold text-base shadow-lg shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-5 h-5" />
                  <span>ยืนยันปรับยอดสต็อก</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
