'use client';

/**
 * หน้าต่างหลักสำหรับการชำระเงินหน้าร้าน (POS Checkout Modal)
 * รองรับการเลือกวิธีชำระเงิน: CASH (P1), QR_PROMPTPAY (P2), CREDIT (P3)
 * มาตรฐาน Elderly-Friendly & Touchscreen Design (Touch Targets >= 48px, High Contrast)
 * โครงการ ice-pos-web
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '@/components/ui/Icons';
import { usePosCart } from '@/context/PosCartContext';
import { PaymentMethodType, CreateSaleRequest, SaleResponse } from '@/types/sale';
import { CustomerSummary } from '@/types/customer';
import { PosPaymentCash } from '@/components/pos/PosPaymentCash';
import { PosPaymentQR } from '@/components/pos/PosPaymentQR';
import { PosPaymentCredit } from '@/components/pos/PosPaymentCredit';
import { PosSuccessOverlay } from '@/components/pos/PosSuccessOverlay';
import { salesService } from '@/services/sales.service';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { playCheckoutSuccessChime, playErrorBuzzer } from '@/utils/audio';
import { bahtToSatang, formatSatangToBaht } from '@/utils/currency';

interface PosCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId?: string;
  cashierName?: string;
}

export function PosCheckoutModal({
  isOpen,
  onClose,
  branchId,
  cashierName,
}: PosCheckoutModalProps) {
  const { items, summary, clearCart, addToast } = usePosCart();

  // สถานะวิธีชำระเงินที่เลือก
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  // จำนวนเงินสดที่รับจากลูกค้า (สตริงสำหรับกรอกผ่านแป้น)
  const [tenderedString, setTenderedString] = useState<string>('');
  // ข้อมูลลูกค้าที่เลือกสำหรับการชำระด้วยเงินเชื่อ
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  // สถานะการส่ง API
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // ข้อความแจ้งเตือนข้อผิดพลาด
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // UUID สำหรับป้องกัน Duplicate Submit
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  // ข้อมูลบิลขายเมื่อบันทึกสำเร็จ (เพื่อแสดง Success Overlay)
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);

  // ยอดเงินรวมในหน่วยสตางค์ (summary.grandTotal อยู่ในหน่วยสตางค์อยู่แล้ว ไม่ต้องแปลงซ้ำ)
  const grandTotalSatang = summary.grandTotal;

  // รีเซ็ตสถานะเมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateIdempotencyKey());
      setPaymentMethod('CASH');
      setTenderedString('');
      setSelectedCustomer(null);
      setErrorMessage(null);
      setCompletedSale(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // จัดการเมื่อเริ่มบิลใหม่
  const handleNewSale = useCallback(() => {
    clearCart();
    setCompletedSale(null);
    onClose();
    addToast({
      type: 'INFO',
      title: 'เริ่มบิลใหม่',
      message: 'ล้างตะกร้าสินค้าเรียบร้อย พร้อมสำหรับลูกค้ารายถัดไป',
    });
  }, [clearCart, onClose, addToast]);

  // การส่งคำขอบันทึกการขายด้วยเงินสด (CASH)
  const handleCashSubmit = async () => {
    if (!branchId) {
      setErrorMessage('ไม่พบข้อมูลสาขาปัจจุบัน กรุณาเข้าสู่ระบบใหม่');
      playErrorBuzzer();
      return;
    }

    if (items.length === 0) {
      setErrorMessage('ไม่มีสินค้าในตะกร้า');
      playErrorBuzzer();
      return;
    }

    // ตรวจสอบความถูกต้องของ uomId ในสินค้าทุกชิ้น (FR-012)
    const invalidItem = items.find((item) => !item.uomId);
    if (invalidItem) {
      setErrorMessage(`สินค้า "${invalidItem.name}" ขาดข้อมูลหน่วยนับ (uomId) กรุณาลบและเพิ่มใหม่`);
      playErrorBuzzer();
      return;
    }

    const tenderedSatang = bahtToSatang(parseFloat(tenderedString) || 0);
    if (tenderedSatang < grandTotalSatang) {
      setErrorMessage('จำนวนเงินที่รับจากลูกค้าน้อยกว่ายอดที่ต้องชำระ');
      playErrorBuzzer();
      return;
    }

    const changeSatang = tenderedSatang - grandTotalSatang;

    setIsSubmitting(true);
    setErrorMessage(null);

    const saleRequest: CreateSaleRequest = {
      branchId,
      idempotencyKey,
      billDiscount: 0, // ปิดการใช้งานส่วนลดในเฟสนี้ตามที่ระบุใน Clarifications
      lines: items.map((item) => ({
        productId: item.productId,
        uomId: item.uomId,
        qty: item.quantity,
        unitPrice: item.price,
        lineDiscount: 0,
      })),
      payments: [
        {
          method: 'CASH',
          amount: grandTotalSatang,
          tenderedAmount: tenderedSatang,
          changeAmount: changeSatang,
        },
      ],
    };

    try {
      const response = await salesService.createSale(saleRequest, idempotencyKey);
      if (response && response.data) {
        setCompletedSale(response.data);
        playCheckoutSuccessChime();
        addToast({
          type: 'SUCCESS',
          title: 'ชำระเงินสดสำเร็จ',
          message: `ออกบิลขาย ${response.data.saleNo || ''} สำเร็จ`,
        });
      } else {
        throw new Error(response.message || 'บันทึกการขายไม่สำเร็จ');
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      setErrorMessage(errorMsg);
      playErrorBuzzer();
      console.error('Sale submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // การส่งคำขอบันทึกการขายเมื่อชำระเงินผ่าน QR พร้อมเพย์สำเร็จ
  const handleQRSuccess = async (qrRef: string) => {
    if (!branchId || items.length === 0) return;

    // ตรวจสอบความถูกต้องของ uomId ในสินค้าทุกชิ้น (FR-012)
    const invalidItem = items.find((item) => !item.uomId);
    if (invalidItem) {
      setErrorMessage(`สินค้า "${invalidItem.name}" ขาดข้อมูลหน่วยนับ (uomId) กรุณาลบและเพิ่มใหม่`);
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const saleRequest: CreateSaleRequest = {
      branchId,
      idempotencyKey,
      billDiscount: 0,
      lines: items.map((item) => ({
        productId: item.productId,
        uomId: item.uomId,
        qty: item.quantity,
        unitPrice: item.price,
        lineDiscount: 0,
      })),
      payments: [
        {
          method: 'QR_PROMPTPAY',
          amount: grandTotalSatang,
          ref: qrRef,
        },
      ],
    };

    try {
      const response = await salesService.createSale(saleRequest, idempotencyKey);
      if (response && response.data) {
        setCompletedSale(response.data);
        playCheckoutSuccessChime();
        addToast({
          type: 'SUCCESS',
          title: 'ชำระเงินผ่าน QR สำเร็จ',
          message: `ออกบิลขาย ${response.data.saleNo || ''} สำเร็จ`,
        });
      } else {
        throw new Error(response.message || 'บันทึกการขายไม่สำเร็จ');
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      setErrorMessage(errorMsg);
      playErrorBuzzer();
      console.error('QR Sale submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // การส่งคำขอบันทึกการขายด้วยเงินเชื่อลูกค้า (CREDIT)
  const handleCreditSubmit = async () => {
    if (!branchId || items.length === 0) return;

    if (!selectedCustomer) {
      setErrorMessage('กรุณาเลือกลูกค้าสำหรับบันทึกรายการเงินเชื่อ');
      playErrorBuzzer();
      return;
    }

    if ((selectedCustomer.availableCredit || 0) < grandTotalSatang) {
      setErrorMessage('วงเงินเครดิตคงเหลือของลูกค้าไม่เพียงพอสำหรับยอดบิลนี้');
      playErrorBuzzer();
      return;
    }

    // ตรวจสอบความถูกต้องของ uomId ในสินค้าทุกชิ้น (FR-012)
    const invalidItem = items.find((item) => !item.uomId);
    if (invalidItem) {
      setErrorMessage(`สินค้า "${invalidItem.name}" ขาดข้อมูลหน่วยนับ (uomId) กรุณาลบและเพิ่มใหม่`);
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const saleRequest: CreateSaleRequest = {
      branchId,
      customerId: selectedCustomer.id,
      idempotencyKey,
      billDiscount: 0,
      lines: items.map((item) => ({
        productId: item.productId,
        uomId: item.uomId,
        qty: item.quantity,
        unitPrice: item.price,
        lineDiscount: 0,
      })),
      payments: [
        {
          method: 'CREDIT',
          amount: grandTotalSatang,
        },
      ],
    };

    try {
      const response = await salesService.createSale(saleRequest, idempotencyKey);
      if (response && response.data) {
        setCompletedSale(response.data);
        playCheckoutSuccessChime();
        addToast({
          type: 'SUCCESS',
          title: 'บันทึกรายการเงินเชื่อสำเร็จ',
          message: `ออกบิลขาย ${response.data.saleNo || ''} เรียบร้อย`,
        });
      } else {
        throw new Error(response.message || 'บันทึกการขายไม่สำเร็จ');
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      setErrorMessage(errorMsg);
      playErrorBuzzer();
      console.error('Credit Sale submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* แถบด้านบน: หัวเรื่องและปุ่มปิด */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Icons.CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ชำระเงินหน้าร้าน</h2>
              <p className="text-xs text-slate-400">
                รายการสินค้า {items.length} รายการ • รวม ฿{formatSatangToBaht(grandTotalSatang)}
              </p>
            </div>
          </div>

          {!completedSale && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
              title="ปิดหน้าต่าง"
            >
              <Icons.Close className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* กรณีบันทึกการขายสำเร็จ ให้แสดง Success Overlay */}
        {completedSale ? (
          <div className="flex-1 overflow-y-auto">
            <PosSuccessOverlay
              sale={completedSale}
              cashierName={cashierName}
              onNewSale={handleNewSale}
            />
          </div>
        ) : (
          <>
            {/* ข้อความแจ้งเตือนข้อผิดพลาด (ถ้ามี) */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-950/60 border border-rose-500/60 flex items-center gap-3 text-rose-200">
                <Icons.AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                <span className="text-sm font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* แถบเลือกวิธีชำระเงิน (Tabs) */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-800">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`h-13 min-h-[50px] rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                    paymentMethod === 'CASH'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Icons.Receipt className="w-5 h-5" />
                  <span>เงินสด (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('QR_PROMPTPAY')}
                  className={`h-13 min-h-[50px] rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                    paymentMethod === 'QR_PROMPTPAY'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Icons.QrCode className="w-5 h-5" />
                  <span>QR พร้อมเพย์</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT')}
                  className={`h-13 min-h-[50px] rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border transition-all active:scale-[0.98] ${
                    paymentMethod === 'CREDIT'
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Icons.User className="w-5 h-5" />
                  <span>เงินเชื่อ (Credit)</span>
                </button>
              </div>
            </div>

            {/* ส่วนแสดงเนื้อหาตามวิธีชำระเงินที่เลือก */}
            <div className="flex-1 overflow-y-auto">
              {paymentMethod === 'CASH' && (
                <PosPaymentCash
                  grandTotalSatang={grandTotalSatang}
                  tenderedString={tenderedString}
                  onTenderedChange={setTenderedString}
                  onSubmit={handleCashSubmit}
                  isSubmitting={isSubmitting}
                />
              )}

              {paymentMethod === 'QR_PROMPTPAY' && (
                <PosPaymentQR
                  grandTotalSatang={grandTotalSatang}
                  onSuccess={handleQRSuccess}
                  onError={(msg) => {
                    setErrorMessage(msg);
                    playErrorBuzzer();
                  }}
                />
              )}

              {paymentMethod === 'CREDIT' && (
                <PosPaymentCredit
                  grandTotalSatang={grandTotalSatang}
                  branchId={branchId}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  onSubmit={handleCreditSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
