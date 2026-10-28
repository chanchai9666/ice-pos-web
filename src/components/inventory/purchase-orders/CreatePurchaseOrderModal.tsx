'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Product } from '@/types/catalog';
import { Supplier, CreatePurchaseOrderRequest } from '@/types/procurement';
import { toSatang, toBaht, formatBaht } from '@/utils/currencyHelper';
import { formatToRFC3339 } from '@/utils/dateHelper';
import { ProductSelectModal } from '@/components/inventory/ProductSelectModal';

export interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  suppliers: Supplier[];
  onSubmit: (data: CreatePurchaseOrderRequest) => Promise<void>;
}

interface OrderLineItemState {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  quantity: number;
  unitCostBaht: string; // ผู้ใช้กรอกเป็นเงินบาท
  uomId?: string;
  uomName?: string;
  note?: string;
}

export function CreatePurchaseOrderModal({
  isOpen,
  onClose,
  branchId,
  suppliers,
  onSubmit,
}: CreatePurchaseOrderModalProps) {
  // ฟอร์มหลัก
  const [supplierId, setSupplierId] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // รายการสินค้า
  const [lines, setLines] = useState<OrderLineItemState[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ตั้งค่าเริ่มต้นผู้จัดจำหน่ายเมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      if (suppliers.length > 0 && !supplierId) {
        setSupplierId(suppliers[0].id);
      }
    }
  }, [isOpen, suppliers, supplierId]);

  // รีเซ็ตฟอร์มเมื่อเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setOrderDate(new Date().toISOString().split('T')[0]);
      setExpectedDeliveryDate('');
      setNote('');
      setLines([]);
      setErrorMessage(null);
    }
  }, [isOpen]);


  // เพิ่มสินค้าหลายรายการจาก ProductSelectModal
  const handleSelectMultipleProducts = (selectedProducts: Product[]) => {
    setLines((prevLines) => {
      const updated = [...prevLines];
      selectedProducts.forEach((product) => {
        const existingIndex = updated.findIndex((l) => l.productId === product.id);
        if (existingIndex >= 0) {
          updated[existingIndex].quantity += 1;
        } else {
          const initialCostBaht = product.costPerBaseUnit
            ? toBaht(product.costPerBaseUnit).toFixed(2)
            : '0.00';

          updated.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode,
            quantity: 1,
            unitCostBaht: initialCostBaht,
            uomId: product.purchaseUomId || product.baseUomId || undefined,
            uomName: product.purchaseUom?.name || product.baseUom?.name,
            note: '',
          });
        }
      });
      return updated;
    });
  };

  // ลบรายการสินค้า
  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, idx) => idx !== index));
  };

  // อัปเดตข้อมูลรายการสินค้า
  const handleUpdateLine = (
    index: number,
    field: keyof OrderLineItemState,
    value: unknown
  ) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  // คำนวณยอดเงินรวม
  const calculatedTotals = useMemo(() => {
    let subtotalBaht = 0;
    lines.forEach((l) => {
      const cost = parseFloat(l.unitCostBaht) || 0;
      subtotalBaht += l.quantity * cost;
    });

    return {
      subtotalBaht,
      totalAmountSatang: toSatang(subtotalBaht),
    };
  }, [lines]);

  // ส่งฟอร์มบันทึก
  const handleSubmit = async (targetStatus: 'DRAFT' | 'ORDERED') => {
    if (!branchId) {
      setErrorMessage('กรุณาเลือกสาขาที่ต้องการสั่งซื้อ');
      return;
    }

    if (lines.length === 0) {
      setErrorMessage('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].quantity <= 0) {
        setErrorMessage(`สินค้า "${lines[i].productName}" ต้องระบุจำนวนมากกว่า 0`);
        return;
      }
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: CreatePurchaseOrderRequest = {
        branchId,
        supplierId: supplierId || undefined,
        orderDate: formatToRFC3339(orderDate),
        expectedDeliveryDate: formatToRFC3339(expectedDeliveryDate),
        note: note || undefined,
        status: targetStatus,
        lines: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          uomId: l.uomId,
          unitCost: toSatang(l.unitCostBaht),
          note: l.note || undefined,
        })),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      console.error('Error creating PO:', err);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการบันทึกใบสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.Package className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                สร้างใบสั่งซื้อสินค้าใหม่ (New Purchase Order)
              </h2>
              <p className="text-xs text-slate-400">
                ออกเอกสารสั่งซื้อสินค้าไปยังผู้จัดจำหน่ายเพื่อเติมสต็อกเข้าคลัง
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5">
              <Icons.AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ข้อมูลทั่วไปของเอกสาร */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* ผู้จัดจำหน่าย */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                ผู้จัดจำหน่าย (Supplier) *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full h-[48px] min-h-[48px] px-3.5 py-0 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- เลือกผู้จัดจำหน่าย --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* วันที่สั่งซื้อ */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                วันที่สั่งซื้อ (Order Date)
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full h-[48px] min-h-[48px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* กำหนดส่งมอบ */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                กำหนดส่งมอบ (Expected Date)
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full h-[48px] min-h-[48px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* หมายเหตุ */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              หมายเหตุประกอบการสั่งซื้อ (Note)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ระบุเงื่อนไขการส่งมอบ เช่น ส่งก่อนเที่ยง, นัดชำระเงินเมื่อส่งครบ..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* ส่วนเลือกสินค้าเพิ่มเข้าใบสั่งซื้อ */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  รายการสินค้าที่สั่งซื้อ ({lines.length} รายการ)
                </h3>
                <p className="text-xs text-slate-400">
                  เลือกสินค้าและระบุจำนวน/ราคาต้นทุนต่อหน่วย
                </p>
              </div>

              {/* ปุ่มเปิด Modal เลือกสินค้า */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md shadow-cyan-950/40 flex items-center gap-2 min-h-[44px] cursor-pointer transition-colors"
                >
                  <Icons.Plus className="w-4 h-4" />
                  <span>+ เลือกสินค้าจากคลัง...</span>
                </button>
              </div>
            </div>

            {/* ตารางรายการสินค้า */}
            {lines.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                <p className="text-sm text-slate-400 font-medium">
                  ยังไม่มีรายการสินค้าในใบสั่งซื้อ กรุณากด &quot;+ เลือกสินค้าจากคลัง&quot; ด้านบน
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase border-b border-slate-800">
                      <th className="py-3 px-3">สินค้า</th>
                      <th className="py-3 px-3 text-center w-28">จำนวนที่สั่ง</th>
                      <th className="py-3 px-3 text-right w-36">ต้นทุน/หน่วย (บาท)</th>
                      <th className="py-3 px-3 text-right w-36">ยอดรวม (บาท)</th>
                      <th className="py-3 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {lines.map((line, idx) => {
                      const cost = parseFloat(line.unitCostBaht) || 0;
                      const lineTotalBaht = line.quantity * cost;

                      return (
                        <tr key={line.productId} className="hover:bg-slate-800/30">
                          {/* สินค้า */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-white leading-tight">
                              {line.productName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              SKU: {line.sku || '-'} | บาร์โค้ด: {line.barcode || '-'}
                            </div>
                          </td>

                          {/* จำนวน */}
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={line.quantity}
                              onChange={(e) =>
                                handleUpdateLine(
                                  idx,
                                  'quantity',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                            />
                            {line.uomName && (
                              <div className="text-[11px] text-center text-slate-400 mt-1">
                                {line.uomName}
                              </div>
                            )}
                          </td>

                          {/* ต้นทุนต่อหน่วย (บาท) */}
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitCostBaht}
                              onChange={(e) =>
                                handleUpdateLine(idx, 'unitCostBaht', e.target.value)
                              }
                              className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-right focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                            />
                          </td>

                          {/* รวมเงิน (บาท) */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-white text-base">
                            {formatBaht(lineTotalBaht, { showUnit: true })}
                          </td>

                          {/* ลบ */}
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title="ลบรายการ"
                            >
                              <Icons.Close className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer สรุปยอดและปุ่มส่ง */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">ยอดรวมทั้งสิ้น:</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {formatBaht(calculatedTotals.subtotalBaht, { showUnit: true })}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm min-h-[48px] cursor-pointer"
            >
              ยกเลิก
            </button>

            {/* ปุ่มบันทึกเป็น DRAFT */}
            <button
              type="button"
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-sm min-h-[48px] cursor-pointer"
            >
              บันทึกฉบับร่าง (DRAFT)
            </button>

            {/* ปุ่มสั่งซื้อทันที ORDERED */}
            <button
              type="button"
              onClick={() => handleSubmit('ORDERED')}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 min-h-[48px] cursor-pointer"
            >
              สั่งซื้อทันที (ORDERED)
            </button>
          </div>
        </div>
      </div>

      {/* Modal เลือกสินค้าแบบ Multi-Select */}
      <ProductSelectModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        branchId={branchId}
        title="เลือกสินค้าเข้าใบสั่งซื้อ (Purchase Order)"
        alreadySelectedProductIds={lines.map((l) => l.productId)}
        onSelectProducts={handleSelectMultipleProducts}
      />
    </div>
  );
}
