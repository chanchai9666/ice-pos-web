'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { GoodsReceipt, GoodsReceiptStatus } from '@/types/procurement';
import { formatSatangToBaht } from '@/utils/currencyHelper';

export interface GoodsReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goodsReceipt: GoodsReceipt | null;
  onCompleteGR?: (gr: GoodsReceipt) => void;
  onCancelGR?: (gr: GoodsReceipt) => void;
}

export function GoodsReceiptDetailModal({
  isOpen,
  onClose,
  goodsReceipt,
  onCompleteGR,
  onCancelGR,
}: GoodsReceiptDetailModalProps) {
  if (!isOpen || !goodsReceipt) return null;

  const gr = goodsReceipt;
  const isDraft = gr.status === 'DRAFT';

  const renderStatusBadge = (status: GoodsReceiptStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            ตรวจรับเข้าคลังแล้ว (COMPLETED)
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            ฉบับร่าง (DRAFT)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            ยกเลิกแล้ว (CANCELLED)
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.Barcode className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white font-mono">
                  {gr.receiptNo || 'ใบตรวจรับฉบับร่าง'}
                </h2>
                {renderStatusBadge(gr.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                วันที่ตรวจรับ:{' '}
                {gr.receivedDate
                  ? new Date(gr.receivedDate).toLocaleDateString('th-TH')
                  : '-'}{' '}
                {gr.updatedAt &&
                  `(ยืนยันเมื่อ: ${new Date(gr.updatedAt).toLocaleString('th-TH')})`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ข้อมูลทั่วไป */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-sm">
            <div>
              <span className="text-slate-400 text-xs block mb-0.5">
                ผู้จัดจำหน่าย (Supplier)
              </span>
              <div className="font-bold text-white text-base">
                {gr.supplier ? gr.supplier.name : '- ไม่ระบุ -'}
              </div>
              {gr.supplier?.code && (
                <div className="text-xs text-slate-400 mt-0.5">
                  รหัส: {gr.supplier.code}
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-400 text-xs block mb-0.5">
                เอกสารอ้างอิง
              </span>
              <div className="text-slate-200">
                Invoice ผู้ขาย:{' '}
                <span className="font-mono font-semibold text-white">
                  {gr.supplierInvoiceNo || '-'}
                </span>
              </div>
              {gr.purchaseOrderId && (
                <div className="text-cyan-300 text-xs mt-0.5 font-mono">
                  อ้างอิงใบสั่งซื้อ PO
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-400 text-xs block mb-0.5">
                เวลาที่บันทึก
              </span>
              <div className="text-slate-200 text-xs">
                {gr.createdAt
                  ? new Date(gr.createdAt).toLocaleString('th-TH')
                  : '-'}
              </div>
            </div>

            {gr.note && (
              <div className="sm:col-span-3 pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 text-xs block mb-0.5">
                  หมายเหตุการตรวจรับ
                </span>
                <p className="text-slate-300">{gr.note}</p>
              </div>
            )}
          </div>

          {/* รายการสินค้าที่ตรวจรับ */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-2">
              รายการสินค้า ({gr.lines?.length || 0} รายการ)
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase border-b border-slate-800">
                    <th className="py-3 px-3">สินค้า</th>
                    <th className="py-3 px-3 text-center">รับเข้าจริง</th>
                    <th className="py-3 px-3 text-center">คัดทิ้ง/ชำรุด</th>
                    <th className="py-3 px-3 text-right">ต้นทุน/หน่วย</th>
                    <th className="py-3 px-3">ล็อต (Lot) / วันหมดอายุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {gr.lines?.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">
                          {line.product?.name || line.productId}
                        </div>
                        {line.product?.sku && (
                          <div className="text-xs text-slate-400 font-mono">
                            SKU: {line.product.sku}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-400 font-mono text-base">
                        +{line.receivedQuantity} {line.uom?.name || ''}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {line.rejectedQuantity > 0 ? (
                          <div>
                            <span className="font-bold text-rose-400 font-mono">
                              -{line.rejectedQuantity}
                            </span>
                            {line.rejectReason && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[150px] mx-auto">
                                ({line.rejectReason})
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatSatangToBaht(line.unitCost, { showUnit: true })}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        {line.batchCode && (
                          <div className="font-mono text-cyan-300">
                            Lot: {line.batchCode}
                          </div>
                        )}
                        {line.expiryDate && (
                          <div className="text-slate-400">
                            Exp: {new Date(line.expiryDate).toLocaleDateString('th-TH')}
                          </div>
                        )}
                        {!line.batchCode && !line.expiryDate && (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div>
            {isDraft && onCancelGR && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCancelGR(gr);
                }}
                className="px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold text-sm min-h-[48px] cursor-pointer"
              >
                ยกเลิกใบตรวจรับ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm min-h-[48px] cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            {isDraft && onCompleteGR && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCompleteGR(gr);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 min-h-[48px] cursor-pointer flex items-center gap-1.5"
              >
                <Icons.Check className="w-4 h-4" />
                <span>ยืนยันตรวจรับเข้าคลัง</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
