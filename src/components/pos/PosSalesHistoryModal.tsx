'use client';

/**
 * หน้าต่างประวัติรายการขายและการยกเลิกบิล (PosSalesHistoryModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: GET /sales, POST /sales/{id}/void
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SaleResponse } from '@/types/sale';
import { salesService } from '@/services/sales.service';
import { PosVoidConfirmModal } from '@/components/pos/PosVoidConfirmModal';
import { PosReturnModal } from '@/components/pos/PosReturnModal';
import { Icons } from '@/components/ui/Icons';
import { formatSatangToBaht } from '@/utils/currency';

interface PosSalesHistoryModalProps {
  isOpen: boolean;
  branchId?: string;
  onClose: () => void;
  onReprintReceipt?: (saleNo: string) => void;
  onVoidSuccess?: () => void;
}

export function PosSalesHistoryModal({
  isOpen,
  branchId,
  onClose,
  onReprintReceipt,
  onVoidSuccess,
}: PosSalesHistoryModalProps) {
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchSaleNo, setSearchSaleNo] = useState<string>('');
  const [selectedSale, setSelectedSale] = useState<SaleResponse | null>(null);
  const [voidingSale, setVoidingSale] = useState<SaleResponse | null>(null);
  const [returningSale, setReturningSale] = useState<SaleResponse | null>(null);
  const [error, setError] = useState<string>('');

  const loadSales = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await salesService.getSalesHistory({
        branchId,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page: 1,
        pageSize: 50,
      });

      if (res.data) {
        setSales(res.data);
      } else {
        setSales([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดประวัติการขายได้';
      setError(msg);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [branchId, statusFilter]);

  useEffect(() => {
    if (isOpen) {
      loadSales();
    }
  }, [isOpen, loadSales]);

  if (!isOpen) return null;

  // กรองตามเลขที่บิลขาย
  const filteredSales = sales.filter((s) => {
    if (!searchSaleNo.trim()) return true;
    return s.saleNo.toLowerCase().includes(searchSaleNo.trim().toLowerCase());
  });

  const handleVoidSuccess = (voidedId: string) => {
    setSales((prev) =>
      prev.map((s) => (s.id === voidedId ? { ...s, status: 'VOIDED' } : s))
    );
    if (selectedSale?.id === voidedId) {
      setSelectedSale((prev) => (prev ? { ...prev, status: 'VOIDED' } : null));
    }
    if (onVoidSuccess) {
      onVoidSuccess();
    }
  };

  const renderStatusBadge = (status: string) => {
    const isVoid = status === 'VOID' || status === 'VOIDED';
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
          isVoid
            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        }`}
      >
        {isVoid ? 'ยกเลิกแล้ว (VOID)' : 'สำเร็จ (COMPLETED)'}
      </span>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-hidden">
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Icons.Receipt className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">ประวัติการขายหน้าร้าน</h3>
                <p className="text-xs text-slate-400">ค้นหาบิลย้อนหลัง สั่งพิมพ์ใบเสร็จซ้ำ หรือยกเลิกบิล</p>
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

          {/* Filter Toolbar */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px]">
              <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchSaleNo}
                onChange={(e) => setSearchSaleNo(e.target.value)}
                placeholder="ค้นหาตามเลขที่บิล (เช่น BR-0001)..."
                className="w-full h-10 pl-9 pr-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['ALL', 'COMPLETED', 'VOIDED'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-cyan-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'ทั้งหมด' : st === 'COMPLETED' ? 'บิลสำเร็จ' : 'บิลที่ยกเลิก'}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadSales}
              disabled={isLoading}
              className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icons.Refresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>

          {/* Content Area: Split 2 columns (Table list left, Detail right) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
            {/* Left Column: Sales List */}
            <div className="lg:col-span-7 border-r border-slate-800 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                    <Icons.Loader className="w-8 h-8 animate-spin text-cyan-400" />
                    <span className="text-sm">กำลังโหลดข้อมูลประวัติการขาย...</span>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-rose-400 text-sm">{error}</div>
                ) : filteredSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
                    <Icons.Receipt className="w-10 h-10 stroke-[1.5] text-slate-600" />
                    <p className="text-sm">ไม่พบรายการขายที่ตรงตามเงื่อนไข</p>
                  </div>
                ) : (
                  filteredSales.map((sale) => {
                    const isSelected = selectedSale?.id === sale.id;
                    return (
                      <div
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/40 shadow-xs'
                            : 'bg-slate-800/30 hover:bg-slate-800/70 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-bold text-base text-white">{sale.saleNo}</span>
                          {renderStatusBadge(sale.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{sale.createdAt ? new Date(sale.createdAt).toLocaleString('th-TH') : '-'}</span>
                          <span className="text-sm font-bold text-cyan-400">
                            ฿{formatSatangToBaht(sale.grandTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Selected Sale Detail & Actions */}
            <div className="lg:col-span-5 flex flex-col h-full bg-slate-900/60 overflow-hidden">
              {selectedSale ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
                    <div>
                      <h4 className="font-bold text-white text-base font-mono">{selectedSale.saleNo}</h4>
                      <p className="text-xs text-slate-400">
                        {selectedSale.createdAt ? new Date(selectedSale.createdAt).toLocaleString('th-TH') : '-'}
                      </p>
                    </div>
                    {renderStatusBadge(selectedSale.status)}
                  </div>

                  {/* Items breakdown list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      รายการสินค้า ({selectedSale.lines?.length || 0})
                    </div>
                    <div className="space-y-2">
                      {selectedSale.lines?.map((line, idx) => (
                        <div
                          key={line.id || idx}
                          className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-700/40 flex items-center justify-between text-xs sm:text-sm"
                        >
                          <div>
                            <div className="font-medium text-white">
                              {line.product?.name || `สินค้า #${line.productId.substring(0, 8)}`}
                            </div>
                            <div className="text-xs text-slate-400">
                              {line.qty} x ฿{formatSatangToBaht(line.unitPrice)}
                            </div>
                          </div>
                          <div className="font-bold text-slate-200">
                            ฿{formatSatangToBaht(line.netTotal ?? line.grossTotal ?? line.qty * line.unitPrice)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Totals */}
                    <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">ยอดรวมก่อนภาษี:</span>
                        <span>฿{formatSatangToBaht(selectedSale.subTotal)}</span>
                      </div>
                      {typeof selectedSale.vatAmount === 'number' && selectedSale.vatAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                          <span>฿{formatSatangToBaht(selectedSale.vatAmount)}</span>
                        </div>
                      )}
                      {selectedSale.billDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>ส่วนลด:</span>
                          <span>-฿{formatSatangToBaht(selectedSale.billDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base text-white border-t border-slate-800 pt-2 mt-1">
                        <span>ยอดสุทธิทั้งบิล:</span>
                        <span className="text-cyan-400">฿{formatSatangToBaht(selectedSale.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2.5 shrink-0">
                    {onReprintReceipt && (
                      <button
                        type="button"
                        onClick={() => onReprintReceipt(selectedSale.saleNo)}
                        className="flex-1 min-h-[48px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <Icons.Receipt className="w-4 h-4" />
                        <span>พิมพ์ใบเสร็จซ้ำ</span>
                      </button>
                    )}

                    {selectedSale.status !== 'VOID' && selectedSale.status !== 'VOIDED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setReturningSale(selectedSale)}
                          className="flex-1 min-h-[48px] rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <Icons.RotateCcw className="w-4 h-4 stroke-[2.5]" />
                          <span>รับคืนสินค้า</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVoidingSale(selectedSale)}
                          className="flex-1 min-h-[48px] rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <Icons.Trash className="w-4 h-4 stroke-[2.5]" />
                          <span>ยกเลิกบิล (Void)</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <Icons.Receipt className="w-12 h-12 stroke-[1.5] mb-2 text-slate-600" />
                  <p className="text-sm font-medium">เลือกบิลขายจากรายการด้านซ้าย</p>
                  <p className="text-xs text-slate-500 mt-1">เพื่อดูรายละเอียดสินค้า สั่งพิมพ์ซ้ำ หรือยกเลิกบิล</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal ยืนยันยกเลิกบิล (Void Confirm) */}
      <PosVoidConfirmModal
        isOpen={!!voidingSale}
        sale={voidingSale}
        onClose={() => setVoidingSale(null)}
        onSuccess={handleVoidSuccess}
      />

      {/* Modal รับคืนสินค้าและคืนเงิน (Return & Refund) */}
      <PosReturnModal
        isOpen={!!returningSale}
        sale={returningSale}
        branchId={branchId}
        onClose={() => setReturningSale(null)}
        onSuccess={() => {
          setReturningSale(null);
          loadSales();
        }}
      />
    </>
  );
}
