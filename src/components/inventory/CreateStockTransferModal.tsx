'use client';

/**
 * คอมโพเนนต์หน้าต่างสร้างใบโอนย้ายสินค้าระหว่างสาขา (CreateStockTransferModal)
 * สอดคล้องกับ API: POST /api/v1/inventory/transfers
 * มาตรฐานกระทรวงสาธารณสุข & รพ.สต.: Elderly-Friendly, Satang Standard, Thai 100%
 */

import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Branch } from '@/types/auth';
import { Product } from '@/types/catalog';
import { StockTransferLineRequest, StockTransferResponse } from '@/types/inventory';
import { authService } from '@/services/auth.service';
import { catalogService } from '@/services/catalog.service';
import { inventoryService } from '@/services/inventory.service';

interface CreateStockTransferModalProps {
  isOpen: boolean;
  currentBranchId?: string;
  onClose: () => void;
  onSuccess: (transfer: StockTransferResponse) => void;
}

interface TransferItemDraft {
  productId: string;
  quantity: number;
}

export function CreateStockTransferModal({
  isOpen,
  currentBranchId,
  onClose,
  onSuccess,
}: CreateStockTransferModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fromBranchId, setFromBranchId] = useState<string>('');
  const [toBranchId, setToBranchId] = useState<string>('');
  const [lines, setLines] = useState<TransferItemDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      // โหลดรายชื่อสาขาและสินค้า
      authService.getBranches().then((branchList: Branch[]) => {
        if (branchList && branchList.length > 0) {
          setBranches(branchList);
          if (currentBranchId) {
            setFromBranchId(currentBranchId);
            const other = branchList.find((b: Branch) => b.id !== currentBranchId);
            if (other) setToBranchId(other.id);
          } else if (branchList.length >= 2) {
            setFromBranchId(branchList[0].id);
            setToBranchId(branchList[1].id);
          }
        }
      });

      catalogService.getProducts({ page: 1, pageSize: 100 }).then((res) => {
        if (res.data) {
          setProducts(res.data);
          if (res.data.length > 0) {
            setLines([{ productId: res.data[0].id, quantity: 1 }]);
          }
        }
      });
    }
  }, [isOpen, currentBranchId]);

  if (!isOpen) return null;

  const handleAddLine = () => {
    if (products.length > 0) {
      setLines((prev) => [...prev, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof TransferItemDraft, value: string | number) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fromBranchId || !toBranchId) {
      setErrorMsg('กรุณาเลือกสาขาต้นทางและสาขาปลายทาง');
      return;
    }

    if (fromBranchId === toBranchId) {
      setErrorMsg('สาขาต้นทางและสาขาปลายทางต้องไม่เป็นสาขาเดียวกัน');
      return;
    }

    if (lines.length === 0) {
      setErrorMsg('กรุณาเพิ่มรายการสินค้าที่ต้องการโอนย้ายอย่างน้อย 1 รายการ');
      return;
    }

    const invalidLine = lines.find((l) => !l.productId || l.quantity <= 0);
    if (invalidLine) {
      setErrorMsg('กรุณาระบุจำนวนสินค้าให้ถูกต้อง (มากกว่า 0)');
      return;
    }

    const payloadLines: StockTransferLineRequest[] = lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      qty: l.quantity,
    }));

    setIsSubmitting(true);
    try {
      const res = await inventoryService.createStockTransfer({
        fromBranchId,
        toBranchId,
        lines: payloadLines,
      });

      if (res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.message || 'ไม่สามารถสร้างใบโอนย้ายสินค้าได้');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างใบโอนย้ายสินค้า';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Icons.RotateCw className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">สร้างใบโอนย้ายสินค้าระหว่างสาขา</h3>
              <p className="text-xs text-slate-400">ระบุสาขาต้นทาง ปลายทาง และรายการสินค้าที่ต้องการโอน</p>
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs sm:text-sm text-rose-300 flex items-center gap-2.5">
                <Icons.AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* สาขาต้นทางและปลายทาง */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-1.5">
                  สาขาต้นทาง (ผู้ส่ง) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={fromBranchId}
                  onChange={(e) => setFromBranchId(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- เลือกสาขาต้นทาง --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-300 block mb-1.5">
                  สาขาปลายทาง (ผู้รับ) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={toBranchId}
                  onChange={(e) => setToBranchId(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- เลือกสาขาปลายทาง --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* รายการสินค้าที่ต้องการโอน */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-200">
                  รายการสินค้าที่โอน ({lines.length} รายการ)
                </label>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Icons.Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มสินค้า</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <select
                        value={line.productId}
                        onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                        className="w-full h-10 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:border-cyan-500 focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku || 'ไม่มี SKU'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24 shrink-0">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                        className="w-full h-10 px-2 text-center bg-slate-900 border border-slate-700 rounded-lg text-sm font-bold text-cyan-400 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[48px] px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || lines.length === 0}
              className="min-h-[48px] px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Icons.Refresh className="w-4 h-4 animate-spin" />
                  <span>กำลังสร้างใบโอน...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-4 h-4 stroke-[2.5]" />
                  <span>สร้างใบโอนสินค้า</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
