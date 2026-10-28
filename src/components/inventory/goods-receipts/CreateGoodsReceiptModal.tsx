'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Product } from '@/types/catalog';
import {
  Supplier,
  PurchaseOrder,
  CreateGoodsReceiptRequest,
} from '@/types/procurement';
import { procurementService } from '@/services/procurement.service';
import { catalogService } from '@/services/catalog.service';
import { BarcodeCaptureModal } from '@/components/shared/BarcodeCaptureModal';
import { OverDeliveryWarningModal } from './OverDeliveryWarningModal';
import { toSatang, toBaht } from '@/utils/currencyHelper';
import { formatToRFC3339 } from '@/utils/dateHelper';
import { ProductSelectModal } from '@/components/inventory/ProductSelectModal';

export interface CreateGoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  sourcePO: PurchaseOrder | null;
  suppliers: Supplier[];
  onSubmit: (data: CreateGoodsReceiptRequest) => Promise<void>;
}

interface ReceiptLineState {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  orderedQuantity: number;
  remainingQuantity: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  rejectReason: string;
  unitCostBaht: string;
  lotNumber: string;
  expiryDate: string;
  purchaseOrderLineId?: string;
  uomName?: string;
}

export function CreateGoodsReceiptModal({
  isOpen,
  onClose,
  branchId,
  sourcePO,
  suppliers,
  onSubmit,
}: CreateGoodsReceiptModalProps) {
  // ฟอร์มหลัก
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>('');
  const [receivedDate, setReceivedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState<string>('');

  // รายการตรวจรับ
  const [lines, setLines] = useState<ReceiptLineState[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // สินค้าสำหรับกรณีตรวจรับตรง (Direct GR)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isBarcodeScanOpen, setIsBarcodeScanOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [scanHighlightProductId, setScanHighlightProductId] = useState<string | null>(null);

  // กล่องเตือน Over-delivery
  const [isOverDeliveryModalOpen, setIsOverDeliveryModalOpen] = useState(false);
  const [pendingSubmitStatus, setPendingSubmitStatus] = useState<'DRAFT' | 'COMPLETED'>('COMPLETED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. โหลดข้อมูลเมื่อเปิด Modal (จาก PO หรือจาก Direct GR)
  useEffect(() => {
    if (!isOpen) return;

    setReceivedDate(new Date().toISOString().split('T')[0]);
    setSupplierInvoiceNo('');
    setNote('');
    setErrorMessage(null);
    setScanHighlightProductId(null);

    if (sourcePO) {
      // ตรวจรับโดยอ้างอิงจากใบสั่งซื้อ PO
      setSupplierId(sourcePO.supplierId || '');
      setIsLoadingPreview(true);

      procurementService
        .getReceiptPreview(sourcePO.id)
        .then((res) => {
          if (res && res.data) {
            const previewItems = res.data;
            const mappedLines: ReceiptLineState[] = previewItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              barcode: item.barcode,
              orderedQuantity: item.orderedQuantity,
              remainingQuantity: item.remainingQuantity,
              receivedQuantity: item.remainingQuantity > 0 ? item.remainingQuantity : 0,
              rejectedQuantity: 0,
              rejectReason: '',
              unitCostBaht: toBaht(item.unitCost).toFixed(2),
              lotNumber: '',
              expiryDate: '',
              purchaseOrderLineId: item.purchaseOrderLineId,
              uomName: item.uomName || undefined,
            }));
            setLines(mappedLines);
          }
        })
        .catch((err) => {
          console.error('Failed to load receipt preview:', err);
          // Fallback ถ้า receipt-preview ล้มเหลว ให้ใช้ lines จาก sourcePO
          if (sourcePO.lines) {
            setLines(
              sourcePO.lines.map((l) => ({
                productId: l.productId,
                productName: l.product?.name || l.productId,
                sku: l.product?.sku || '',
                barcode: l.product?.barcode,
                orderedQuantity: l.quantity,
                remainingQuantity: Math.max(0, l.quantity - l.receivedQuantity),
                receivedQuantity: Math.max(0, l.quantity - l.receivedQuantity),
                rejectedQuantity: 0,
                rejectReason: '',
                unitCostBaht: toBaht(l.unitCost).toFixed(2),
                lotNumber: '',
                expiryDate: '',
                purchaseOrderLineId: l.id,
                uomName: l.uom?.name,
              }))
            );
          }
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    } else {
      // ตรวจรับตรงแบบไม่มี PO
      setSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
      setLines([]);

      catalogService
        .getProducts({ page: 1, pageSize: 100, isActive: true })
        .then((res) => {
          if (res && res.data) {
            setCatalogProducts(res.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load catalog products:', err);
        });
    }
  }, [isOpen, sourcePO, suppliers]);

  // เพิ่มสินค้าสำหรับ Direct GR
  const handleAddDirectProduct = (product: Product) => {
    const existingIdx = lines.findIndex((l) => l.productId === product.id);
    if (existingIdx >= 0) {
      const updated = [...lines];
      updated[existingIdx].receivedQuantity += 1;
      setLines(updated);
      return;
    }

    setLines([
      ...lines,
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        orderedQuantity: 0,
        remainingQuantity: 0,
        receivedQuantity: 1,
        rejectedQuantity: 0,
        rejectReason: '',
        unitCostBaht: product.costPerBaseUnit
          ? toBaht(product.costPerBaseUnit).toFixed(2)
          : '0.00',
        lotNumber: '',
        expiryDate: '',
        uomName: product.purchaseUom?.name || product.baseUom?.name,
      },
    ]);
  };

  // เพิ่มสินค้าหลายรายการสำหรับ Direct GR จาก ProductSelectModal
  const handleSelectMultipleDirectProducts = (selectedProducts: Product[]) => {
    setLines((prevLines) => {
      const updated = [...prevLines];
      selectedProducts.forEach((product) => {
        const existingIdx = updated.findIndex((l) => l.productId === product.id);
        if (existingIdx >= 0) {
          updated[existingIdx].receivedQuantity += 1;
        } else {
          updated.push({
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            barcode: product.barcode,
            orderedQuantity: 0,
            remainingQuantity: 0,
            receivedQuantity: 1,
            rejectedQuantity: 0,
            rejectReason: '',
            unitCostBaht: product.costPerBaseUnit
              ? toBaht(product.costPerBaseUnit).toFixed(2)
              : '0.00',
            lotNumber: '',
            expiryDate: '',
            uomName: product.purchaseUom?.name || product.baseUom?.name,
          });
        }
      });
      return updated;
    });
  };

  // จัดการเมื่อสแกนบาร์โค้ดด้วยกล้อง
  const handleBarcodeCapture = (barcode: string) => {
    setIsBarcodeScanOpen(false);

    // ค้นหาสินค้าในตารางที่มีบาร์โค้ดตรงกัน
    const matchIdx = lines.findIndex(
      (l) => l.barcode === barcode || l.sku === barcode
    );

    if (matchIdx >= 0) {
      const updated = [...lines];
      updated[matchIdx].receivedQuantity += 1;
      setLines(updated);
      setScanHighlightProductId(updated[matchIdx].productId);
      setTimeout(() => setScanHighlightProductId(null), 2500);
    } else if (!sourcePO && catalogProducts.length > 0) {
      // กรณี Direct GR ถ้ายังไม่มีในตารางแต่มีใน Catalog
      const matchedCatalog = catalogProducts.find(
        (p) => p.barcode === barcode || p.sku === barcode
      );
      if (matchedCatalog) {
        handleAddDirectProduct(matchedCatalog);
        setScanHighlightProductId(matchedCatalog.id);
        setTimeout(() => setScanHighlightProductId(null), 2500);
      } else {
        setErrorMessage(`ไม่พบสินค้ารหัสบาร์โค้ด "${barcode}" ในรายการ`);
      }
    } else {
      setErrorMessage(`บาร์โค้ด "${barcode}" ไม่ตรงกับสินค้าใดในใบสั่งซื้อนี้`);
    }
  };

  // ตรวจสอบรายการที่รับเกิน (Over-delivery)
  const excessItems = useMemo(() => {
    if (!sourcePO) return [];
    return lines
      .filter((l) => l.remainingQuantity > 0 && l.receivedQuantity > l.remainingQuantity)
      .map((l) => ({
        productName: l.productName,
        orderedQuantity: l.remainingQuantity,
        receivedQuantity: l.receivedQuantity,
        excess: l.receivedQuantity - l.remainingQuantity,
      }));
  }, [lines, sourcePO]);

  // ตรวจสอบความถูกต้องและส่งฟอร์ม
  const handleAttemptSubmit = (targetStatus: 'DRAFT' | 'COMPLETED') => {
    if (lines.length === 0) {
      setErrorMessage('กรุณาเพิ่มรายการสินค้าที่ต้องการตรวจรับอย่างน้อย 1 รายการ');
      return;
    }

    // ตรวจสอบเหตุผลคัดทิ้งถ้า rejectedQuantity > 0
    for (const line of lines) {
      if (line.rejectedQuantity > 0 && !line.rejectReason.trim()) {
        setErrorMessage(
          `กรุณาระบุเหตุผลที่ปฏิเสธ/คัดทิ้ง สำหรับสินค้า "${line.productName}"`
        );
        return;
      }
    }

    // ถ้ามีสินค้าที่รับเกิน และเป็นสถานะ COMPLETED ให้ถามยืนยันก่อน
    if (excessItems.length > 0 && targetStatus === 'COMPLETED') {
      setPendingSubmitStatus(targetStatus);
      setIsOverDeliveryModalOpen(true);
      return;
    }

    executeSubmit(targetStatus);
  };

  // ดำเนินการส่งคำขอไปยัง API
  const executeSubmit = async (targetStatus: 'DRAFT' | 'COMPLETED') => {
    setIsOverDeliveryModalOpen(false);
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: CreateGoodsReceiptRequest = {
        branchId,
        purchaseOrderId: sourcePO ? sourcePO.id : undefined,
        supplierId: supplierId || undefined,
        supplierInvoiceNo: supplierInvoiceNo.trim() || undefined,
        receivedDate: formatToRFC3339(receivedDate),
        note: note.trim() || undefined,
        status: targetStatus,
        lines: lines.map((l) => ({
          productId: l.productId,
          receivedQuantity: l.receivedQuantity,
          rejectedQuantity: l.rejectedQuantity > 0 ? l.rejectedQuantity : undefined,
          rejectReason: l.rejectReason.trim() || undefined,
          unitCost: toSatang(l.unitCostBaht),
          lotNumber: l.lotNumber.trim() || undefined,
          expiryDate: formatToRFC3339(l.expiryDate),
          purchaseOrderLineId: l.purchaseOrderLineId,
        })),
      };

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      console.error('Error submitting goods receipt:', err);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('เกิดข้อผิดพลาดในการบันทึกตรวจรับสินค้า กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Icons.Barcode className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {sourcePO
                    ? `ตรวจรับสินค้าตามใบสั่งซื้อ (${sourcePO.poNumber})`
                    : 'สร้างใบตรวจรับสินค้าเข้าคลัง (Direct Goods Receipt)'}
                </h2>
                <p className="text-xs text-slate-400">
                  ตรวจนับจำนวน คัดแยกของชำรุด บันทึก Lot/Expiry และนำสต็อกเข้าคลัง
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
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5">
                <Icons.AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ข้อมูลทั่วไปเอกสาร */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* เลขที่ใบส่งของ / ใบกำกับ */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  เลขที่ใบส่งของ / Invoice ผู้ขาย
                </label>
                <input
                  type="text"
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  placeholder="เช่น INV-998821"
                  className="w-full h-[48px] min-h-[48px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* วันที่ตรวจรับ */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  วันที่รับของจริง
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full h-[48px] min-h-[48px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* ผู้จัดจำหน่าย (ถ้าไม่มี PO) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  ผู้จัดจำหน่าย (Supplier)
                </label>
                {sourcePO ? (
                  <div className="px-3.5 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 text-sm font-semibold truncate min-h-[48px] flex items-center">
                    {sourcePO.supplier?.name || '- ไม่ระบุ -'}
                  </div>
                ) : (
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full h-[48px] min-h-[48px] px-3.5 py-0 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">-- เลือกผู้จัดจำหน่าย --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* แถบเครื่องมือช่วยนับและสแกน */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-200">
                  รายการตรวจรับสินค้า ({lines.length} รายการ)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {/* ปุ่มเปิดกล้องสแกนบาร์โค้ด */}
                <button
                  type="button"
                  onClick={() => setIsBarcodeScanOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-950/40 flex items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <Icons.Camera className="w-4 h-4" />
                  <span>สแกนบาร์โค้ดนับของ (+1)</span>
                </button>

                {/* กรณี Direct GR สามารถเลือกเพิ่มสินค้าได้ */}
                {!sourcePO && (
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(true)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 min-h-[44px] cursor-pointer transition-colors"
                  >
                    <Icons.Plus className="w-4 h-4" />
                    <span>+ เลือกสินค้าจากคลัง...</span>
                  </button>
                )}
              </div>
            </div>

            {/* ตารางรายการตรวจรับ */}
            {isLoadingPreview ? (
              <div className="py-12 text-center text-cyan-400 flex items-center justify-center gap-3">
                <Icons.RotateCw className="w-6 h-6 animate-spin" />
                <span>กำลังดึงรายการสินค้าค้างรับจากใบสั่งซื้อ...</span>
              </div>
            ) : lines.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                <p className="text-sm text-slate-400">ไม่มีรายการสินค้าที่ต้องตรวจรับ</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-xs font-bold uppercase border-b border-slate-800">
                      <th className="py-3 px-3">สินค้า</th>
                      {sourcePO && (
                        <th className="py-3 px-2 text-center w-24">ค้างรับ</th>
                      )}
                      <th className="py-3 px-2 text-center w-28">รับเข้าจริง *</th>
                      <th className="py-3 px-2 text-center w-24">คัดทิ้ง</th>
                      <th className="py-3 px-3 w-40">เหตุผลคัดทิ้ง</th>
                      <th className="py-3 px-3 w-32">เลขล็อต (Lot)</th>
                      <th className="py-3 px-3 w-32">วันหมดอายุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {lines.map((line, idx) => {
                      const isHighlighted = scanHighlightProductId === line.productId;
                      const isOver =
                        sourcePO &&
                        line.remainingQuantity > 0 &&
                        line.receivedQuantity > line.remainingQuantity;

                      return (
                        <tr
                          key={line.productId}
                          className={`transition-colors ${
                            isHighlighted
                              ? 'bg-cyan-500/20 ring-2 ring-cyan-400'
                              : 'hover:bg-slate-800/30'
                          }`}
                        >
                          {/* สินค้า */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-white leading-tight">
                              {line.productName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {line.sku && `SKU: ${line.sku} `}
                              {line.barcode && `| บาร์โค้ด: ${line.barcode}`}
                            </div>
                          </td>

                          {/* ค้างรับตาม PO */}
                          {sourcePO && (
                            <td className="py-3 px-2 text-center font-bold text-slate-300 font-mono">
                              {line.remainingQuantity}
                            </td>
                          )}

                          {/* จำนวนรับเข้าจริง */}
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.receivedQuantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...lines];
                                updated[idx].receivedQuantity = val;
                                setLines(updated);
                              }}
                              className={`w-full px-2 py-2 bg-slate-950 border rounded-lg text-center font-mono font-bold text-base focus:outline-none focus:ring-2 min-h-[44px] ${
                                isOver
                                  ? 'border-amber-500 text-amber-300 ring-1 ring-amber-500'
                                  : 'border-slate-700 text-emerald-400 focus:ring-cyan-500'
                              }`}
                            />
                            {isOver && (
                              <div className="text-[10px] text-amber-400 font-bold text-center mt-1">
                                เกิน PO +{line.receivedQuantity - line.remainingQuantity}
                              </div>
                            )}
                          </td>

                          {/* จำนวนคัดทิ้ง */}
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.rejectedQuantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...lines];
                                updated[idx].rejectedQuantity = val;
                                setLines(updated);
                              }}
                              className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-rose-400 font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[44px]"
                            />
                          </td>

                          {/* เหตุผลคัดทิ้ง */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={line.rejectReason}
                              onChange={(e) => {
                                const updated = [...lines];
                                updated[idx].rejectReason = e.target.value;
                                setLines(updated);
                              }}
                              placeholder={
                                line.rejectedQuantity > 0 ? 'ระบุเหตุผลชำรุด*' : 'เหตุผล...'
                              }
                              className={`w-full px-2.5 py-2 bg-slate-950 border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none min-h-[44px] ${
                                line.rejectedQuantity > 0 && !line.rejectReason.trim()
                                  ? 'border-rose-500 ring-1 ring-rose-500'
                                  : 'border-slate-700 focus:ring-cyan-500'
                              }`}
                            />
                          </td>

                          {/* ล็อตสินค้า */}
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={line.lotNumber}
                              onChange={(e) => {
                                const updated = [...lines];
                                updated[idx].lotNumber = e.target.value;
                                setLines(updated);
                              }}
                              placeholder="LOT-..."
                              className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                            />
                          </td>

                          {/* วันหมดอายุ */}
                          <td className="py-3 px-3">
                            <input
                              type="date"
                              value={line.expiryDate}
                              onChange={(e) => {
                                const updated = [...lines];
                                updated[idx].expiryDate = e.target.value;
                                setLines(updated);
                              }}
                              className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              * การยืนยันตรวจรับเข้าคลังจะทำการปรับเพิ่มยอดสต็อกสินค้าในคลังสาขาจริงทันที
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

              <button
                type="button"
                onClick={() => handleAttemptSubmit('DRAFT')}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white font-bold text-sm min-h-[48px] cursor-pointer"
              >
                บันทึกแบบร่าง (DRAFT)
              </button>

              <button
                type="button"
                onClick={() => handleAttemptSubmit('COMPLETED')}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/50 min-h-[48px] cursor-pointer flex items-center gap-2"
              >
                <Icons.Check className="w-5 h-5 stroke-[2.5]" />
                <span>ยืนยันตรวจรับเข้าคลัง (Complete)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal สแกนบาร์โค้ดด้วยกล้อง */}
      <BarcodeCaptureModal
        isOpen={isBarcodeScanOpen}
        onClose={() => setIsBarcodeScanOpen(false)}
        onCapture={handleBarcodeCapture}
        title="สแกนบาร์โค้ดสินค้านับยอดตรวจรับ"
      />

      {/* กล่องเตือน Over-delivery Confirmation */}
      <OverDeliveryWarningModal
        isOpen={isOverDeliveryModalOpen}
        onClose={() => setIsOverDeliveryModalOpen(false)}
        onConfirm={() => executeSubmit(pendingSubmitStatus)}
        excessItems={excessItems}
      />

      {/* Modal เลือกสินค้าแบบ Multi-Select สำหรับ Direct GR */}
      <ProductSelectModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        branchId={branchId}
        title="เลือกสินค้าตรวจรับเข้าคลัง (Direct Goods Receipt)"
        alreadySelectedProductIds={lines.map((l) => l.productId)}
        onSelectProducts={handleSelectMultipleDirectProducts}
      />
    </>
  );
}
