'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { PurchaseOrder, PurchaseOrderStatus } from '@/types/procurement';
import { formatSatangToBaht } from '@/utils/currencyHelper';

export interface PurchaseOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onConfirmPO?: (po: PurchaseOrder) => void;
  onCancelPO?: (po: PurchaseOrder) => void;
  onForceClosePO?: (po: PurchaseOrder) => void;
  onReceiveGoods?: (po: PurchaseOrder) => void;
}

export function PurchaseOrderDetailModal({
  isOpen,
  onClose,
  purchaseOrder,
  onConfirmPO,
  onCancelPO,
  onForceClosePO,
  onReceiveGoods,
}: PurchaseOrderDetailModalProps) {
  if (!isOpen || !purchaseOrder) return null;

  const po = purchaseOrder;
  const isDraft = po.status === 'DRAFT';
  const isOrdered = po.status === 'ORDERED';
  const isPartial = po.status === 'PARTIALLY_RECEIVED';
  const canReceive = isOrdered || isPartial;

  // ป้ายสถานะ
  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            ฉบับร่าง (DRAFT)
          </span>
        );
      case 'ORDERED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
            สั่งซื้อแล้ว (ORDERED)
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            รับแล้วบางส่วน
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            เสร็จสมบูรณ์ (COMPLETED)
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
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.Package className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white font-mono">
                  {po.poNo || 'ใบสั่งซื้อฉบับร่าง'}
                </h2>
                {renderStatusBadge(po.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                สร้างเมื่อ:{' '}
                {po.createdAt
                  ? new Date(po.createdAt).toLocaleString('th-TH')
                  : '-'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-sm">
            <div>
              <span className="text-slate-400 text-xs block mb-0.5">
                ผู้จัดจำหน่าย (Supplier)
              </span>
              <div className="font-bold text-white text-base">
                {po.supplier ? po.supplier.name : '- ไม่ระบุ -'}
              </div>
              {po.supplier && (
                <div className="text-xs text-slate-400 mt-1">
                  รหัส: {po.supplier.code}{' '}
                  {po.supplier.phone && `| โทร: ${po.supplier.phone}`}
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-400 text-xs block mb-0.5">
                กำหนดเวลา
              </span>
              <div className="text-slate-200">
                วันที่สั่งซื้อ:{' '}
                <span className="font-semibold text-white">
                  {po.orderDate
                    ? new Date(po.orderDate).toLocaleDateString('th-TH')
                    : '-'}
                </span>
              </div>
              {po.expectedDeliveryDate && (
                <div className="text-cyan-300 mt-0.5">
                  กำหนดส่งมอบ:{' '}
                  <span className="font-semibold">
                    {new Date(po.expectedDeliveryDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
              )}
            </div>

            {po.note && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 text-xs block mb-0.5">
                  หมายเหตุ
                </span>
                <p className="text-slate-300">{po.note}</p>
              </div>
            )}
          </div>

          {/* ตารางรายการสินค้า */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-2">
              รายการสินค้า ({po.lines?.length || 0} รายการ)
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase border-b border-slate-800">
                    <th className="py-3 px-3">สินค้า</th>
                    <th className="py-3 px-3 text-center">จำนวนสั่ง</th>
                    <th className="py-3 px-3 text-center">รับแล้ว</th>
                    <th className="py-3 px-3 text-right">ต้นทุน/หน่วย</th>
                    <th className="py-3 px-3 text-right">รวมเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                  {po.lines?.map((line) => {
                    const lineTotalSatang = line.quantity * line.unitCost;
                    const isFullyReceived =
                      line.receivedQuantity >= line.quantity;

                    return (
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
                        <td className="py-3 px-3 text-center font-bold text-white font-mono">
                          {line.quantity} {line.uom?.name || ''}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                              isFullyReceived
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : line.receivedQuantity > 0
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {line.receivedQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          {formatSatangToBaht(line.unitCost, { showUnit: true })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatSatangToBaht(lineTotalSatang, { showUnit: true })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* สรุปยอดเงิน */}
          <div className="flex justify-end p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>ยอดรวมสินค้า:</span>
                <span className="font-mono text-slate-200">
                  {formatSatangToBaht(po.subtotal ?? 0)} บาท
                </span>
              </div>
              {po.taxAmount > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>ภาษี:</span>
                  <span className="font-mono text-slate-200">
                    {formatSatangToBaht(po.taxAmount)} บาท
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-800 text-base font-bold">
                <span className="text-white">ยอดสุทธิ:</span>
                <span className="font-mono text-emerald-400 text-lg">
                  {formatSatangToBaht(po.grandTotal ?? 0, {
                    showUnit: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            {(isDraft || isOrdered) && onCancelPO && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCancelPO(po);
                }}
                className="px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold text-sm min-h-[48px] cursor-pointer"
              >
                ยกเลิกใบสั่งซื้อ
              </button>
            )}
            {isPartial && onForceClosePO && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onForceClosePO(po);
                }}
                className="px-4 py-2.5 rounded-xl text-amber-400 hover:bg-amber-500/10 font-bold text-sm min-h-[48px] cursor-pointer"
              >
                บังคับปิดใบสั่งซื้อ (Force Close)
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

            {isDraft && onConfirmPO && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConfirmPO(po);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 min-h-[48px] cursor-pointer flex items-center gap-1.5"
              >
                <Icons.Check className="w-4 h-4" />
                <span>ยืนยันการสั่งซื้อ</span>
              </button>
            )}

            {canReceive && onReceiveGoods && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReceiveGoods(po);
                }}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 min-h-[48px] cursor-pointer flex items-center gap-1.5"
              >
                <Icons.Barcode className="w-4 h-4" />
                <span>ตรวจรับสินค้าเข้าคลัง</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
