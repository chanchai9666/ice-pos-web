'use client';

/**
 * คอมโพเนนต์ตารางจัดการใบโอนย้ายสินค้าระหว่างสาขา (StockTransferTable)
 * สอดคล้องกับ API: POST /api/v1/inventory/transfers, POST /api/v1/inventory/transfers/{id}/receive
 * มาตรฐานกระทรวงสาธารณสุข & รพ.สต.: Elderly-Friendly, Satang Standard, Thai 100%
 */

import React, { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { StockTransferResponse } from '@/types/inventory';
import { inventoryService } from '@/services/inventory.service';
import { CreateStockTransferModal } from './CreateStockTransferModal';

interface StockTransferTableProps {
  currentBranchId?: string;
}

export function StockTransferTable({ currentBranchId }: StockTransferTableProps) {
  const [transfers, setTransfers] = useState<StockTransferResponse[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [receiveInputId, setReceiveInputId] = useState<string>('');
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateSuccess = (newTransfer: StockTransferResponse) => {
    setTransfers((prev) => [newTransfer, ...prev]);
    setSuccessMsg(`สร้างใบโอนย้ายสินค้าเลขที่ ${newTransfer.transferNo || newTransfer.id} สำเร็จ`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleReceive = async (transferId: string) => {
    if (!transferId.trim()) return;

    setErrorMsg(null);
    setReceivingId(transferId);
    try {
      const res = await inventoryService.receiveStockTransfer(transferId.trim());
      if (res.data !== undefined || res.code === 0) {
        setTransfers((prev) =>
          prev.map((t) =>
            t.id === transferId ? { ...t, status: 'RECEIVED', receivedAt: new Date().toISOString() } : t
          )
        );
        setSuccessMsg(`บันทึกการรับสินค้าโอนเข้าสาขาสำเร็จเรียบร้อย`);
        setReceiveInputId('');
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.message || 'ไม่สามารถรับสินค้าโอนได้');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรับสินค้าโอน';
      setErrorMsg(msg);
    } finally {
      setReceivingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-sm flex items-center gap-2.5">
          <Icons.Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-sm flex items-center gap-2.5">
          <Icons.AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* ค้นหา/รับสินค้าด้วย Transfer ID */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Icons.RotateCw className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={receiveInputId}
              onChange={(e) => setReceiveInputId(e.target.value)}
              placeholder="ระบุรหัสใบโอนเพื่อรับเข้าคลัง (UUID)..."
              className="w-full h-11 pl-9 pr-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs sm:text-sm text-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => handleReceive(receiveInputId)}
            disabled={!receiveInputId.trim() || receivingId === receiveInputId}
            className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {receivingId === receiveInputId ? (
              <Icons.Refresh className="w-4 h-4 animate-spin" />
            ) : (
              <Icons.Check className="w-4 h-4" />
            )}
            <span>รับสินค้า</span>
          </button>
        </div>

        {/* ปุ่มสร้างใบโอนใหม่ */}
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="min-h-[48px] px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Icons.Plus className="w-5 h-5 stroke-[2.5]" />
          <span>สร้างใบโอนสินค้า</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">เลขที่ใบโอน</th>
                <th className="py-3.5 px-4">สาขาต้นทาง</th>
                <th className="py-3.5 px-4">สาขาปลายทาง</th>
                <th className="py-3.5 px-4">รายการสินค้า</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Icons.Boxes className="w-10 h-10 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
                    <p className="text-base font-medium">ยังไม่มีรายการโอนย้ายสินค้าในเซสชันนี้</p>
                    <p className="text-xs text-slate-500 mt-1">
                      กดปุ่ม &quot;สร้างใบโอนสินค้า&quot; เพื่อส่งสินค้าไปยังสาขาอื่น หรือระบุรหัสใบโอนด้านบนเพื่อตรวจรับ
                    </p>
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-white">
                      {t.transferNo || t.id.substring(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {t.fromBranchId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {t.toBranchId}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {t.lines?.length || 0} รายการ
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          t.status === 'RECEIVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {t.status === 'RECEIVED'
                          ? 'รับเข้าคลังแล้ว'
                          : t.status === 'CANCELLED'
                          ? 'ยกเลิก'
                          : 'รอดำเนินการรับ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {t.status !== 'RECEIVED' && t.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => handleReceive(t.id)}
                          disabled={receivingId === t.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          {receivingId === t.id ? 'กำลังรับ...' : 'รับเข้าคลัง'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal สร้างใบโอน */}
      <CreateStockTransferModal
        isOpen={isCreateOpen}
        currentBranchId={currentBranchId}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
