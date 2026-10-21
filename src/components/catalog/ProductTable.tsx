'use client';

import React from 'react';
import { Product } from '@/types/catalog';
import { formatSatangToBaht } from '@/utils/currency';
import { Icons } from '@/components/ui/Icons';

export interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onResetSearch?: () => void;
}

function ProductImageThumbnail({
  src,
  alt,
  timestamp,
}: {
  src?: string;
  alt: string;
  timestamp?: number;
}) {
  const [hasError, setHasError] = React.useState(false);

  // รีเซ็ตสถานะข้อผิดพลาดเมื่อ src หรือ timestamp เปลี่ยนแปลง
  React.useEffect(() => {
    setHasError(false);
  }, [src, timestamp]);

  if (!src || hasError) {
    return (
      <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 shadow-inner">
        <Icons.Package className="w-6 h-6 text-slate-400" />
      </div>
    );
  }

  // เติม Query Parameter timestamp เพื่อป้องกันเบราว์เซอร์แคชภาพเดิมไว้
  const imageSrc = timestamp ? `${src}${src.includes('?') ? '&' : '?'}t=${timestamp}` : src;

  return (
    <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-slate-700 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
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
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-12 text-center text-slate-300 space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-base font-semibold">กำลังโหลดรายการสินค้า...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-12 text-center text-slate-300 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 border-2 border-slate-700">
          <Icons.Package className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-100">ไม่พบรายการสินค้า</h3>
          <p className="text-base text-slate-400 mt-1">
            ลองปรับเปลี่ยนคำค้นหา หรือสร้างสินค้าใหม่เข้าสู่ระบบ
          </p>
        </div>
        {onResetSearch && (
          <div>
            <button
              type="button"
              onClick={onResetSearch}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-400 border-2 border-slate-700 text-base font-bold cursor-pointer transition-all shadow-sm"
            >
              ล้างการค้นหา
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base text-slate-200">
          <thead className="bg-slate-850 text-slate-300 uppercase text-sm font-bold border-b-2 border-slate-800">
            <tr>
              <th scope="col" className="py-4 px-4">สินค้า</th>
              <th scope="col" className="py-4 px-4">SKU / บาร์โค้ด</th>
              <th scope="col" className="py-4 px-4">หมวดหมู่</th>
              <th scope="col" className="py-4 px-4 text-right">ราคาขาย (บาท)</th>
              <th scope="col" className="py-4 px-4 text-right">ต้นทุน (บาท)</th>
              <th scope="col" className="py-4 px-4 text-center">หน่วยนับ</th>
              <th scope="col" className="py-4 px-4 text-center">สถานะ</th>
              <th scope="col" className="py-4 px-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-slate-800/80">
            {products.map((product) => {
              return (
                <tr
                  key={product.id}
                  className="hover:bg-slate-800/50 transition-colors group"
                >
                  {/* รูปภาพ + ชื่อสินค้า */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <ProductImageThumbnail
                        src={product.imageUrl}
                        alt={product.name}
                        timestamp={product.imageTimestamp}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors truncate max-w-[240px]">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-slate-400 truncate max-w-[240px]">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SKU & Barcode */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-sm font-bold text-slate-200">
                      {product.sku}
                    </div>
                    {product.barcode && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono mt-0.5">
                        <Icons.Barcode className="w-4 h-4 text-slate-400" />
                        <span>{product.barcode}</span>
                        {product.isInternalBarcode && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-bold">
                            ร้าน
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* หมวดหมู่ */}
                  <td className="py-3.5 px-4">
                    {product.category?.name ? (
                      <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium text-sm">
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">-</span>
                    )}
                  </td>

                  {/* ราคาขาย */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-extrabold text-cyan-300 text-xl tracking-tight">
                      {formatSatangToBaht(product.price)}
                    </span>
                  </td>

                  {/* ต้นทุน */}
                  <td className="py-3.5 px-4 text-right text-slate-300 font-semibold text-base">
                    {product.costPerBaseUnit
                      ? formatSatangToBaht(product.costPerBaseUnit)
                      : '-'}
                  </td>

                  {/* หน่วยนับ */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-slate-200 font-medium text-base">
                      {product.baseUom?.name || product.baseUom?.code || '-'}
                    </span>
                  </td>

                  {/* สถานะ Active Switch */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.isActive}
                      onClick={() => onToggleStatus(product)}
                      title={product.isActive ? 'คลิกเพื่อปิดจำหน่ายชั่วคราว' : 'คลิกเพื่อเปิดจำหน่าย'}
                      className="cursor-pointer inline-flex items-center gap-2.5 group/toggle py-1.5 px-2.5 rounded-xl hover:bg-slate-800 active:scale-95 transition-all min-h-[48px]"
                    >
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 border-2 ${
                          product.isActive
                            ? 'bg-emerald-500 border-emerald-400'
                            : 'bg-slate-700 border-slate-600'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                            product.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                      <span className={`text-sm font-bold ${product.isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {product.isActive ? 'เปิดขาย' : 'ปิดชั่วคราว'}
                      </span>
                    </button>
                  </td>

                  {/* ปุ่มจัดการ */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        title="แก้ไขข้อมูลสินค้า"
                        className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-cyan-950 border-2 border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 active:scale-95 transition-all cursor-pointer shadow-sm"
                        aria-label={`แก้ไข ${product.name}`}
                      >
                        <Icons.Edit className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product)}
                        title="ลบสินค้า"
                        className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-950 border-2 border-slate-700 hover:border-rose-500 text-slate-200 hover:text-rose-400 active:scale-95 transition-all cursor-pointer shadow-sm"
                        aria-label={`ลบ ${product.name}`}
                      >
                        <Icons.Trash2 className="w-5 h-5" />
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
