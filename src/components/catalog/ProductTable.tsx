'use client';

import React from 'react';
import { Product } from '@/types/catalog';
import { formatSatangToBaht } from '@/utils/currency';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';

export interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onResetSearch?: () => void;
}

function ProductImageThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = React.useState(false);

  if (!src || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/60 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 shadow-inner">
        <Icons.Package className="w-5 h-5 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function ProductTable({
  products,
  isLoading,
  onEditProduct,
  onDeleteProduct,
  onToggleStatus,
  onResetSearch,
}: ProductTableProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
        <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">กำลังโหลดรายการสินค้า...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Icons.Package className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-200">ไม่พบรายการสินค้า</h3>
          <p className="text-xs text-slate-500 mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือสร้างสินค้าใหม่เข้าสู่ระบบ
          </p>
        </div>
        {onResetSearch && (
          <div>
            <button
              type="button"
              onClick={onResetSearch}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
            >
              ล้างการค้นหา
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-850/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
            <tr>
              <th scope="col" className="py-3 px-4">สินค้า</th>
              <th scope="col" className="py-3 px-4">SKU / บาร์โค้ด</th>
              <th scope="col" className="py-3 px-4">หมวดหมู่</th>
              <th scope="col" className="py-3 px-4 text-right">ราคาขาย (บาท)</th>
              <th scope="col" className="py-3 px-4 text-right">ต้นทุน (บาท)</th>
              <th scope="col" className="py-3 px-4 text-center">หน่วยนับ</th>
              <th scope="col" className="py-3 px-4 text-center">สถานะ</th>
              <th scope="col" className="py-3 px-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {products.map((product) => {
              return (
                <tr
                  key={product.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* รูปภาพ + ชื่อสินค้า */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <ProductImageThumbnail src={product.imageUrl} alt={product.name} />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate max-w-[220px]">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SKU & Barcode */}
                  <td className="py-3 px-4">
                    <div className="font-mono text-xs text-slate-200">
                      {product.sku}
                    </div>
                    {product.barcode && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <Icons.Barcode className="w-3.5 h-3.5 text-slate-500" />
                        <span>{product.barcode}</span>
                        {product.isInternalBarcode && (
                          <span className="text-[10px] px-1 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                            ร้าน
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* หมวดหมู่ */}
                  <td className="py-3 px-4">
                    {product.category?.name ? (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* ราคาขาย */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-cyan-400 text-sm">
                      {formatSatangToBaht(product.price)}
                    </span>
                  </td>

                  {/* ต้นทุน */}
                  <td className="py-3 px-4 text-right text-slate-400">
                    {product.costPerBaseUnit
                      ? formatSatangToBaht(product.costPerBaseUnit)
                      : '-'}
                  </td>

                  {/* หน่วยนับ */}
                  <td className="py-3 px-4 text-center">
                    <span className="text-slate-300">
                      {product.baseUom?.name || product.baseUom?.code || '-'}
                    </span>
                  </td>

                  {/* สถานะ Active Switch */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(product)}
                      title={product.isActive ? 'คลิกเพื่อปิดจำหน่าย' : 'คลิกเพื่อเปิดจำหน่าย'}
                      className="cursor-pointer inline-flex items-center"
                    >
                      <Badge
                        variant={product.isActive ? 'success' : 'neutral'}
                        size="sm"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.isActive ? 'bg-emerald-400' : 'bg-slate-400'
                          }`}
                        />
                        {product.isActive ? 'เปิดขาย' : 'ปิดชั่วคราว'}
                      </Badge>
                    </button>
                  </td>

                  {/* ปุ่มจัดการ */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        title="แก้ไขข้อมูลสินค้า"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Icons.Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                        title="ลบสินค้า"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Icons.Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
