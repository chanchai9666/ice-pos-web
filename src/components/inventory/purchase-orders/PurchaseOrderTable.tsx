'use client';

import React from 'react';
import { PurchaseOrder, PurchaseOrderStatus } from '@/types/procurement';
import { formatSatangToBaht } from '@/utils/currencyHelper';
import { Icons } from '@/components/ui/Icons';

export interface PurchaseOrderTableProps {
  items: PurchaseOrder[];
  isLoading: boolean;
  onViewDetails: (po: PurchaseOrder) => void;
  onReceiveGoods: (po: PurchaseOrder) => void;
  onConfirmPO?: (po: PurchaseOrder) => void;
  onCancelPO?: (po: PurchaseOrder) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function PurchaseOrderTable({
  items,
  isLoading,
  onViewDetails,
  onReceiveGoods,
  onConfirmPO,
  onCancelPO,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: PurchaseOrderTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // ฟังก์ชันแสดงป้ายสถานะภาษาไทยและสี
  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ฉบับร่าง (DRAFT)
          </span>
        );
      case 'ORDERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            สั่งซื้อแล้ว (รอส่งมอบ)
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            รับแล้วบางส่วน
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            เสร็จสมบูรณ์
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            ยกเลิกแล้ว
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-center py-16 gap-3 text-cyan-400">
          <Icons.RotateCw className="w-6 h-6 animate-spin" />
          <span className="text-base font-semibold">กำลังโหลดข้อมูลใบสั่งซื้อสินค้า...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
          <Icons.Package className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">ไม่พบรายการใบสั่งซื้อสินค้า</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          ยังไม่มีการสั่งซื้อสินค้าตรงตามเงื่อนไข หรือสามารถเริ่มต้นสั่งซื้อด้วยการกดปุ่ม &quot;สร้างใบสั่งซื้อใหม่&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-bold">เลขที่ใบสั่งซื้อ</th>
              <th className="py-4 px-4 font-bold">ผู้จัดจำหน่าย</th>
              <th className="py-4 px-4 font-bold">วันที่สั่งซื้อ / กำหนดส่ง</th>
              <th className="py-4 px-4 font-bold text-center">จำนวนรายการ</th>
              <th className="py-4 px-4 font-bold text-right">ยอดรวมสุทธิ</th>
              <th className="py-4 px-4 font-bold text-center">สถานะ</th>
              <th className="py-4 px-4 font-bold text-right">การกระทำ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-sm">
            {items.map((po) => {
              const canReceive =
                po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED';
              const isDraft = po.status === 'DRAFT';

              return (
                <tr
                  key={po.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* เลขที่ใบสั่งซื้อ */}
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-mono font-bold text-base">
                        {po.poNumber || 'PO-DRAFT'}
                      </span>
                    </div>
                    {po.note && (
                      <p className="text-xs text-slate-400 truncate max-w-[220px] mt-0.5">
                        {po.note}
                      </p>
                    )}
                  </td>

                  {/* ผู้จัดจำหน่าย */}
                  <td className="py-3.5 px-4 text-slate-200 font-medium">
                    {po.supplier ? (
                      <div>
                        <div className="font-semibold text-slate-100">{po.supplier.name}</div>
                        {po.supplier.phone && (
                          <div className="text-xs text-slate-400">{po.supplier.phone}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">- ไม่ระบุ -</span>
                    )}
                  </td>

                  {/* วันที่สั่งซื้อ / กำหนดส่ง */}
                  <td className="py-3.5 px-4 text-slate-300 text-xs">
                    <div>
                      <span className="text-slate-400">สั่ง: </span>
                      {po.orderDate ? new Date(po.orderDate).toLocaleDateString('th-TH') : '-'}
                    </div>
                    {po.expectedDeliveryDate && (
                      <div className="text-cyan-300 mt-0.5">
                        <span className="text-slate-400">ส่ง: </span>
                        {new Date(po.expectedDeliveryDate).toLocaleDateString('th-TH')}
                      </div>
                    )}
                  </td>

                  {/* จำนวนรายการ */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                    <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200">
                      {po.lines?.length || 0} รายการ
                    </span>
                  </td>

                  {/* ยอดรวมสุทธิ */}
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-base font-mono">
                    {formatSatangToBaht(po.totalAmount, { showUnit: true })}
                  </td>

                  {/* สถานะ */}
                  <td className="py-3.5 px-4 text-center">
                    {renderStatusBadge(po.status)}
                  </td>

                  {/* การกระทำ */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* ปุ่มตรวจรับสินค้า */}
                      {canReceive && (
                        <button
                          type="button"
                          onClick={() => onReceiveGoods(po)}
                          className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/40 min-h-[44px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Icons.Barcode className="w-4 h-4" />
                          <span>ตรวจรับสินค้า</span>
                        </button>
                      )}

                      {/* ปุ่มยืนยันสั่งซื้อ (สำหรับ Draft) */}
                      {isDraft && onConfirmPO && (
                        <button
                          type="button"
                          onClick={() => onConfirmPO(po)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs min-h-[44px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Icons.Check className="w-4 h-4" />
                          <span>ยืนยันสั่ง</span>
                        </button>
                      )}

                      {/* ปุ่มดูรายละเอียด */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(po)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs min-h-[44px] flex items-center gap-1 cursor-pointer"
                        title="ดูรายละเอียดใบสั่งซื้อ"
                      >
                        <Icons.Search className="w-3.5 h-3.5" />
                        <span>รายละเอียด</span>
                      </button>

                      {/* ปุ่มยกเลิก */}
                      {(isDraft || po.status === 'ORDERED') && onCancelPO && (
                        <button
                          type="button"
                          onClick={() => onCancelPO(po)}
                          className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                          title="ยกเลิกใบสั่งซื้อ"
                        >
                          <Icons.Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-t border-slate-800 text-sm">
          <div className="text-slate-400 text-xs">
            หน้า <span className="font-bold text-white">{currentPage}</span> จาก{' '}
            <span className="font-bold text-white">{totalPages}</span> (ทั้งหมด {totalItems} รายการ)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
