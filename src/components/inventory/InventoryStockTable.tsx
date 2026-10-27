'use client';

import React from 'react';
import { StockLevel } from '@/types/inventory';
import { Icons } from '@/components/ui/Icons';
import { Pagination } from '@/components/ui/Pagination';

export interface InventoryStockTableProps {
  items: StockLevel[];
  isLoading: boolean;
  onAdjustStock: (stock: StockLevel) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function InventoryStockTable({
  items,
  isLoading,
  onAdjustStock,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: InventoryStockTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // ฟังก์ชันคำนวณสถานะสต็อกและ Badge สี
  const getStockBadge = (quantity: number, minStock?: number) => {
    const threshold = minStock ?? 5;
    if (quantity <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          สินค้าหมด
        </span>
      );
    }
    if (quantity <= threshold) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          สต็อกใกล้หมด ({threshold})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        ปกติ
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-slate-850 border border-slate-800 rounded-xl animate-pulse flex items-center px-4 justify-between"
            >
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-750 rounded" />
                <div className="h-3 w-28 bg-slate-800 rounded" />
              </div>
              <div className="h-8 w-24 bg-slate-750 rounded-lg" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-500">
            <Icons.Boxes className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">ไม่พบรายการสต็อกสินค้า</h3>
          <p className="text-sm text-slate-400 max-w-md">
            ไม่พบข้อมูลสินค้าตรงตามเงื่อนไขค้นหา หรือยังไม่มีการบันทึกสต็อกในสาขานี้
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 bg-slate-950/60 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">สินค้า / SKU / บาร์โค้ด</th>
                  <th className="py-4 px-4">หมวดหมู่</th>
                  <th className="py-4 px-4 text-center">หน่วยนับ</th>
                  <th className="py-4 px-4 text-right">จำนวนคงเหลือ</th>
                  <th className="py-4 px-4 text-center">เกณฑ์เตือน</th>
                  <th className="py-4 px-4 text-center">สถานะ</th>
                  <th className="py-4 px-4 sm:px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {items.map((stock) => {
                  const product = stock.product;
                  const unitName = product?.baseUom?.name || 'ชิ้น';
                  const minStock = product?.minStock ?? 5;
                  const isOutOfStock = stock.quantity <= 0;
                  const isLowStock = !isOutOfStock && stock.quantity <= minStock;

                  return (
                    <tr
                      key={stock.id || `${stock.branchId}-${stock.productId}`}
                      className="hover:bg-slate-850/60 transition-colors"
                    >
                      {/* ข้อมูลสินค้า */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-100 text-base">
                            {product?.name || `รหัสสินค้า: ${stock.productId}`}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                            {product?.sku && <span>SKU: {product.sku}</span>}
                            {product?.barcode && (
                              <>
                                <span>•</span>
                                <span>บาร์โค้ด: {product.barcode}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* หมวดหมู่ */}
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-slate-300">
                          {product?.category?.name || '-'}
                        </span>
                      </td>

                      {/* หน่วยนับ */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm text-slate-300 font-medium">
                          {unitName}
                        </span>
                      </td>

                      {/* จำนวนคงเหลือ */}
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`text-lg font-black font-mono ${
                            isOutOfStock
                              ? 'text-rose-400'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {stock.quantity.toLocaleString()}
                        </span>
                      </td>

                      {/* เกณฑ์เตือน */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-mono text-slate-400">
                          {minStock}
                        </span>
                      </td>

                      {/* สถานะ Badge */}
                      <td className="py-4 px-4 text-center">
                        {getStockBadge(stock.quantity, product?.minStock)}
                      </td>

                      {/* ปุ่มปรับยอด */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={() => onAdjustStock(stock)}
                          className="min-h-[48px] px-4 py-2 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-xl border-2 border-slate-700 hover:border-cyan-500 font-bold text-sm transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2 shadow-sm"
                          aria-label={`ปรับยอดสต็อก ${product?.name || ''}`}
                        >
                          <Icons.Boxes className="w-4 h-4 text-cyan-400 group-hover:text-white" />
                          <span>ปรับสต็อก</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Rows (Visible on small screens) */}
          <div className="md:hidden divide-y divide-slate-800">
            {items.map((stock) => {
              const product = stock.product;
              const unitName = product?.baseUom?.name || 'ชิ้น';
              const minStock = product?.minStock ?? 5;
              const isOutOfStock = stock.quantity <= 0;
              const isLowStock = !isOutOfStock && stock.quantity <= minStock;

              return (
                <div
                  key={stock.id || `${stock.branchId}-${stock.productId}`}
                  className="p-4 flex flex-col gap-3 hover:bg-slate-850/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-base leading-tight">
                        {product?.name || `รหัส: ${stock.productId}`}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        {product?.barcode
                          ? `บาร์โค้ด: ${product.barcode}`
                          : product?.sku
                          ? `SKU: ${product.sku}`
                          : ''}
                      </p>
                    </div>
                    <div>{getStockBadge(stock.quantity, product?.minStock)}</div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">
                      <span>หมวด: {product?.category?.name || '-'}</span>
                      <span className="mx-1.5">•</span>
                      <span>เตือนที่: {minStock} {unitName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">คงเหลือ</span>
                      <span
                        className={`text-xl font-black font-mono ${
                          isOutOfStock
                            ? 'text-rose-400'
                            : isLowStock
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {stock.quantity.toLocaleString()} {unitName}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAdjustStock(stock)}
                    className="w-full min-h-[48px] py-2.5 px-4 bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white rounded-xl border-2 border-slate-700 hover:border-cyan-500 font-bold text-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Icons.Boxes className="w-4 h-4 text-cyan-400" />
                    <span>ปรับยอดสต็อก</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
