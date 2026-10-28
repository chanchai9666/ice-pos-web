'use client';

/**
 * หน้าต่างพิมพ์ใบเสร็จรับเงินและพิมพ์ซ้ำ (PosReceiptModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: GET /receipts/{receiptNo}
 * รองรับเลย์เอาต์ Thermal Printer 80mm/58mm ผ่าน CSS @media print
 */

import React, { useState, useEffect } from 'react';
import { receiptService } from '@/services/receipt.service';
import { ReceiptResponse, ReceiptParsedContent } from '@/types/receipt';
import { Icons } from '@/components/ui/Icons';
import { formatSatangToBaht } from '@/utils/currency';

interface PosReceiptModalProps {
  isOpen: boolean;
  receiptNo: string | null;
  onClose: () => void;
}

export function PosReceiptModal({
  isOpen,
  receiptNo,
  onClose,
}: PosReceiptModalProps) {
  const [receipt, setReceipt] = useState<ReceiptResponse | null>(null);
  const [parsedContent, setParsedContent] = useState<ReceiptParsedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !receiptNo) {
      setReceipt(null);
      setParsedContent(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');

    receiptService
      .getReceiptByNo(receiptNo)
      .then((res) => {
        if (!isMounted) return;
        if (res.data) {
          setReceipt(res.data);
          try {
            const parsed = JSON.parse(res.data.contentJson);
            setParsedContent(parsed);
          } catch {
            setParsedContent(null);
          }
        } else {
          setError('ไม่พบข้อมูลใบเสร็จรับเงินนี้ในระบบ');
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลใบเสร็จ';
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, receiptNo]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isReprint = receipt && receipt.printCount > 1;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Container สำหรับหน้าจอปกติและสำหรับ Print */}
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none print:bg-white">
        {/* หัวหน้าต่าง (ซ่อนตอน Print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Icons.Receipt className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ใบเสร็จรับเงิน</h3>
              <p className="text-xs text-slate-400 font-mono">{receiptNo}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* เนื้อหาใบเสร็จ */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] print:max-h-none print:p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Icons.Loader className="w-8 h-8 animate-spin text-cyan-400" />
              <span className="text-sm">กำลังโหลดข้อมูลใบเสร็จ...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-400 text-sm">
              <Icons.AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
              {error}
            </div>
          ) : (
            <div
              id="thermal-receipt"
              className="bg-white text-slate-900 font-mono p-5 rounded-2xl shadow-sm text-xs leading-relaxed space-y-3 border border-slate-200 print:border-none print:p-2 print:shadow-none print:text-black print:rounded-none max-w-[340px] mx-auto"
            >
              {/* ตราประทับใบเสร็จพิมพ์ซ้ำ */}
              {isReprint && (
                <div className="text-center py-1 px-3 border border-dashed border-red-500 text-red-600 font-bold rounded-lg text-xs tracking-wider">
                  *** ใบเสร็จพิมพ์ซ้ำ (REPRINT #{receipt?.printCount}) ***
                </div>
              )}

              {/* หัวบิลร้านค้า */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <div className="text-base font-black tracking-wide">
                  {parsedContent?.storeName || 'ICE POS SYSTEM'}
                </div>
                {parsedContent?.branchName && (
                  <div className="text-xs text-slate-600 font-semibold">{parsedContent.branchName}</div>
                )}
                {parsedContent?.branchAddress && (
                  <div className="text-[11px] text-slate-500">{parsedContent.branchAddress}</div>
                )}
                {parsedContent?.taxId && (
                  <div className="text-[11px] text-slate-500">เลขประจำตัวผู้เสียภาษี: {parsedContent.taxId}</div>
                )}
              </div>

              {/* รายละเอียดเลขที่บิลและวันที่ */}
              <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2.5">
                <div className="flex justify-between">
                  <span>เลขที่ใบเสร็จ:</span>
                  <span className="font-bold">{receipt?.receiptNo}</span>
                </div>
                {parsedContent?.saleNo && (
                  <div className="flex justify-between">
                    <span>เลขที่บิลขาย:</span>
                    <span>{parsedContent.saleNo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>วันที่/เวลา:</span>
                  <span>{receipt?.createdAt ? new Date(receipt.createdAt).toLocaleString('th-TH') : '-'}</span>
                </div>
                {parsedContent?.cashierName && (
                  <div className="flex justify-between">
                    <span>พนักงานแคชเชียร์:</span>
                    <span>{parsedContent.cashierName}</span>
                  </div>
                )}
                {parsedContent?.customerName && (
                  <div className="flex justify-between">
                    <span>ลูกค้า:</span>
                    <span>{parsedContent.customerName}</span>
                  </div>
                )}
              </div>

              {/* รายการสินค้า */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between font-bold text-[11px] border-b border-slate-200 pb-1">
                  <span>รายการ</span>
                  <span>รวม (บาท)</span>
                </div>
                {parsedContent?.items && parsedContent.items.length > 0 ? (
                  parsedContent.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="flex justify-between text-[11px] text-slate-600 pl-2">
                        <span>
                          {item.qty} {item.uomName || 'ชิ้น'} x ฿{formatSatangToBaht(item.unitPrice)}
                        </span>
                        <span className="font-bold text-slate-900">฿{formatSatangToBaht(item.lineTotal)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-2">ไม่มีข้อมูลแถวสินค้า</div>
                )}
              </div>

              {/* ยอดเงินรวมและภาษี */}
              <div className="space-y-1 text-xs border-b border-dashed border-slate-300 pb-2.5">
                {typeof parsedContent?.subTotal === 'number' && (
                  <div className="flex justify-between">
                    <span>ยอดรวมสินค้า:</span>
                    <span>฿{formatSatangToBaht(parsedContent.subTotal)}</span>
                  </div>
                )}
                {typeof parsedContent?.discountAmount === 'number' && parsedContent.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>ส่วนลด:</span>
                    <span>-฿{formatSatangToBaht(parsedContent.discountAmount)}</span>
                  </div>
                )}
                {typeof parsedContent?.vatAmount === 'number' && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                    <span>฿{formatSatangToBaht(parsedContent.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                  <span>ยอดสุทธิทั้งสิ้น:</span>
                  <span>฿{formatSatangToBaht(parsedContent?.grandTotal ?? 0)}</span>
                </div>
              </div>

              {/* ข้อมูลการชำระเงิน */}
              {parsedContent?.payments && parsedContent.payments.length > 0 && (
                <div className="space-y-0.5 text-[11px] text-slate-600 border-b border-dashed border-slate-300 pb-2">
                  {parsedContent.payments.map((p, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between">
                        <span>ชำระด้วย ({p.method}):</span>
                        <span>฿{formatSatangToBaht(p.amount)}</span>
                      </div>
                      {typeof p.tenderedAmount === 'number' && p.tenderedAmount > 0 && (
                        <div className="flex justify-between">
                          <span>รับเงินสดมา:</span>
                          <span>฿{formatSatangToBaht(p.tenderedAmount)}</span>
                        </div>
                      )}
                      {typeof p.changeAmount === 'number' && (
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>เงินทอน:</span>
                          <span>฿{formatSatangToBaht(p.changeAmount)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ข้อความขอบคุณท้ายบิล */}
              <div className="text-center text-[10px] text-slate-500 pt-1 space-y-0.5">
                <div>ขอบคุณที่ใช้บริการ</div>
                <div>(เอกสารนี้ออกโดยระบบขายหน้าร้านอัตโนมัติ)</div>
              </div>
            </div>
          )}
        </div>

        {/* ปุ่มสั่งพิมพ์และปิด (ซ่อนตอนพิมพ์) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-3 print:hidden shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isLoading || !!error}
            className="flex-1 min-h-[48px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-98 transition-all cursor-pointer disabled:opacity-40"
          >
            <Icons.Receipt className="w-5 h-5 stroke-[2.5]" />
            <span>สั่งพิมพ์ใบเสร็จ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
