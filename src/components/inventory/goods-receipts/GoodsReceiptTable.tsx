'use client';

import React from 'react';
import { GoodsReceipt, GoodsReceiptStatus } from '@/types/procurement';
import { Icons } from '@/components/ui/Icons';

export interface GoodsReceiptTableProps {
  items: GoodsReceipt[];
  isLoading: boolean;
  onViewDetails: (gr: GoodsReceipt) => void;
  onCompleteGR?: (gr: GoodsReceipt) => void;
  onCancelGR?: (gr: GoodsReceipt) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function GoodsReceiptTable({
  items,
  isLoading,
  onViewDetails,
  onCompleteGR,
  onCancelGR,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: GoodsReceiptTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const renderStatusBadge = (status: GoodsReceiptStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            เข้าคลังแล้ว (COMPLETED)
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ฉบับร่าง (DRAFT)
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
        return <span>{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-center py-16 gap-3 text-cyan-400">
          <Icons.RotateCw className="w-6 h-6 animate-spin" />
          <span className="text-base font-semibold">กำลังโหลดข้อมูลประวัติการตรวจรับสินค้า...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-400">
          <Icons.Barcode className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">ไม่พบรายการใบตรวจรับสินค้า</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          ยังไม่มีการตรวจรับสินค้าเข้าคลัง สามารถเริ่มตรวจรับได้จากแท็บ &quot;ใบสั่งซื้อสินค้า&quot; หรือกดปุ่ม &quot;ตรวจรับตรง&quot;
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
              <th className="py-4 px-4 font-bold">เลขที่ใบตรวจรับ</th>
              <th className="py-4 px-4 font-bold">เอกสารอ้างอิง / Invoice</th>
              <th className="py-4 px-4 font-bold">ผู้จัดจำหน่าย</th>
              <th className="py-4 px-4 font-bold">วันที่ตรวจรับ</th>
              <th className="py-4 px-4 font-bold text-center">ยอดรับจริง / คัดทิ้ง</th>
              <th className="py-4 px-4 font-bold text-center">สถานะ</th>
              <th className="py-4 px-4 font-bold text-right">การกระทำ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-sm">
            {items.map((gr) => {
              const isDraft = gr.status === 'DRAFT';

              // คำนวณยอดรวมรับจริงและคัดทิ้ง
              const totalReceived =
                gr.lines?.reduce((sum, l) => sum + (l.receivedQuantity || 0), 0) || 0;
              const totalRejected =
                gr.lines?.reduce((sum, l) => sum + (l.rejectedQuantity || 0), 0) || 0;

              return (
                <tr
                  key={gr.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* เลขที่ใบตรวจรับ */}
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <span className="text-cyan-400 font-mono font-bold text-base">
                      {gr.receiptNumber || 'GR-DRAFT'}
                    </span>
                    {gr.note && (
                      <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                        {gr.note}
                      </p>
                    )}
                  </td>

                  {/* เอกสารอ้างอิง */}
                  <td className="py-3.5 px-4 text-slate-300 text-xs">
                    {gr.supplierInvoiceNo ? (
                      <div>
                        <span className="text-slate-400">Invoice: </span>
                        <span className="font-mono font-semibold text-white">
                          {gr.supplierInvoiceNo}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">- ไม่มี Invoice -</span>
                    )}
                    {gr.purchaseOrderId && (
                      <div className="text-cyan-300/80 font-mono text-[11px] mt-0.5">
                        PO Ref
                      </div>
                    )}
                  </td>

                  {/* ผู้จัดจำหน่าย */}
                  <td className="py-3.5 px-4 text-slate-200 font-medium">
                    {gr.supplier ? (
                      <div>
                        <div className="font-semibold text-slate-100">{gr.supplier.name}</div>
                        {gr.supplier.phone && (
                          <div className="text-xs text-slate-400">{gr.supplier.phone}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">- ไม่ระบุ -</span>
                    )}
                  </td>

                  {/* วันที่ตรวจรับ */}
                  <td className="py-3.5 px-4 text-slate-300 text-xs">
                    {gr.receivedDate
                      ? new Date(gr.receivedDate).toLocaleDateString('th-TH')
                      : gr.createdAt
                      ? new Date(gr.createdAt).toLocaleDateString('th-TH')
                      : '-'}
                  </td>

                  {/* ยอดรับจริง / คัดทิ้ง */}
                  <td className="py-3.5 px-4 text-center font-mono">
                    <span className="font-bold text-emerald-400">
                      +{totalReceived}
                    </span>
                    {totalRejected > 0 && (
                      <span className="ml-1.5 font-bold text-rose-400 text-xs">
                        (ทิ้ง -{totalRejected})
                      </span>
                    )}
                    <div className="text-[11px] text-slate-500">
                      {gr.lines?.length || 0} รายการ
                    </div>
                  </td>

                  {/* สถานะ */}
                  <td className="py-3.5 px-4 text-center">
                    {renderStatusBadge(gr.status)}
                  </td>

                  {/* การกระทำ */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* ยืนยันตรวจรับสำหรับ DRAFT */}
                      {isDraft && onCompleteGR && (
                        <button
                          type="button"
                          onClick={() => onCompleteGR(gr)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs min-h-[44px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Icons.Check className="w-4 h-4" />
                          <span>ยืนยันเข้าคลัง</span>
                        </button>
                      )}

                      {/* ดูรายละเอียด */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(gr)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs min-h-[44px] flex items-center gap-1 cursor-pointer"
                        title="ดูรายละเอียดใบตรวจรับ"
                      >
                        <Icons.Search className="w-3.5 h-3.5" />
                        <span>รายละเอียด</span>
                      </button>

                      {/* ยกเลิกใบตรวจรับ DRAFT */}
                      {isDraft && onCancelGR && (
                        <button
                          type="button"
                          onClick={() => onCancelGR(gr)}
                          className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                          title="ยกเลิกใบตรวจรับ"
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
