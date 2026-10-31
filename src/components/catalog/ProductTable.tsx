'use client';

import React from 'react';
import { Product } from '@/types/catalog';
import { formatSatangToBaht } from '@/utils/currency';
import { Icons } from '@/components/ui/Icons';
import { ResponsiveDataView } from '@/components/ui/ResponsiveDataView';

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
  // Empty State UI
  const emptyState = (
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

  // Desktop Table Header
  const tableHeader = (
    <thead className="bg-slate-850 text-slate-300 uppercase text-sm font-bold border-b-2 border-slate-800">
      <tr>
        <th scope="col" className="py-4 px-4">สินค้า</th>
        <th scope="col" className="py-4 px-4">SKU / บาร์โค้ด</th>
        <th scope="col" className="py-4 px-4">หมวดหมู่</th>
        <th scope="col" className="py-3.5 px-4 text-right whitespace-nowrap">
          <span className="block leading-tight">ราคาขาย</span>
          <span className="text-xs text-slate-400 font-normal lowercase tracking-normal">(บาท)</span>
        </th>
        <th scope="col" className="py-3.5 px-4 text-right whitespace-nowrap">
          <span className="block leading-tight">ต้นทุน</span>
          <span className="text-xs text-slate-400 font-normal lowercase tracking-normal">(บาท)</span>
        </th>
        <th scope="col" className="py-4 px-4 text-center">หน่วยนับ</th>
        <th scope="col" className="py-4 px-4 text-center">สถานะ</th>
        <th scope="col" className="py-4 px-4 text-center">จัดการ</th>
      </tr>
    </thead>
  );

  // Desktop Row Renderer
  const renderRow = (product: Product) => (
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
            <div className="font-bold text-base text-slate-100 group-hover:text-cyan-300 transition-colors truncate max-w-[280px]">
              {product.name}
            </div>
            {product.description && (
              <div className="text-sm text-slate-400 truncate max-w-[280px]">
                {product.description}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* SKU & Barcode */}
      <td className="py-3.5 px-4">
        <div className="font-mono text-sm font-bold text-slate-200 tracking-wide">
          {product.sku}
        </div>
        {product.barcode && (
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono mt-1">
            <Icons.Barcode className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{product.barcode}</span>
            {product.isInternalBarcode && (
              <span className="text-[11px] px-1.5 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 rounded font-semibold whitespace-nowrap">
                ร้าน
              </span>
            )}
          </div>
        )}
      </td>

      {/* หมวดหมู่ */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        {product.category?.name ? (
          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-sm whitespace-nowrap shadow-xs">
            {product.category.name}
          </span>
        ) : (
          <span className="text-slate-500 font-medium">-</span>
        )}
      </td>

      {/* ราคาขาย */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <span className="font-extrabold text-cyan-400 text-lg sm:text-xl tracking-tight font-mono">
          {formatSatangToBaht(product.price)}
        </span>
      </td>

      {/* ต้นทุน */}
      <td className="py-3.5 px-4 text-right text-slate-300 font-semibold text-base font-mono whitespace-nowrap">
        {product.costPerBaseUnit
          ? formatSatangToBaht(product.costPerBaseUnit)
          : '-'}
      </td>

      {/* หน่วยนับ */}
      <td className="py-3.5 px-4 text-center whitespace-nowrap">
        <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-800/80 text-slate-200 font-semibold text-sm border border-slate-700/60">
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

  // Mobile Card Renderer (Elderly-Friendly Touch Target >= 48px)
  const renderCard = (product: Product) => (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
      {/* แถวบน: รูปภาพ, ชื่อสินค้า, หมวดหมู่ และสถานะ */}
      <div className="flex items-start gap-3">
        <ProductImageThumbnail
          src={product.imageUrl}
          alt={product.name}
          timestamp={product.imageTimestamp}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-base text-slate-100 truncate">
              {product.name}
            </h4>
            {product.category?.name && (
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                {product.category.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
            <span>SKU: {product.sku}</span>
            {product.barcode && (
              <>
                <span>•</span>
                <span>{product.barcode}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* แถวกลาง: ราคาขายและหน่วยนับ */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <div>
          <span className="text-xs text-slate-400 block">ราคาขาย</span>
          <div className="text-xl font-extrabold text-cyan-400 font-mono">
            ฿{formatSatangToBaht(product.price)}{' '}
            <span className="text-xs font-normal text-slate-400">
              / {product.baseUom?.name || 'หน่วย'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block">ต้นทุน</span>
          <div className="text-sm font-semibold text-slate-300 font-mono">
            {product.costPerBaseUnit ? `฿${formatSatangToBaht(product.costPerBaseUnit)}` : '-'}
          </div>
        </div>
      </div>

      {/* แถวล่าง: ปุ่มสถานะ และปุ่มแอ็กชันขนาดใหญ่ >= 48px */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={product.isActive}
          onClick={() => onToggleStatus(product)}
          className="min-h-[48px] px-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center gap-2 text-xs font-bold active:scale-95 transition-all cursor-pointer"
        >
          <div
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 border ${
              product.isActive
                ? 'bg-emerald-500 border-emerald-400'
                : 'bg-slate-700 border-slate-600'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full bg-white shadow transform transition-transform ${
                product.isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
          <span className={product.isActive ? 'text-emerald-400' : 'text-slate-400'}>
            {product.isActive ? 'เปิดขาย' : 'ปิดชั่วคราว'}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditProduct(product)}
            className="min-h-[48px] px-3.5 rounded-xl bg-slate-800 hover:bg-cyan-950 border border-slate-700 text-cyan-400 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            aria-label={`แก้ไข ${product.name}`}
          >
            <Icons.Edit className="w-4 h-4" />
            <span>แก้ไข</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteProduct(product)}
            className="min-h-[48px] px-3.5 rounded-xl bg-slate-800 hover:bg-rose-950 border border-slate-700 text-rose-400 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            aria-label={`ลบ ${product.name}`}
          >
            <Icons.Trash2 className="w-4 h-4" />
            <span>ลบ</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveDataView<Product>
      data={products}
      keyExtractor={(p) => p.id}
      renderCard={renderCard}
      tableHeader={tableHeader}
      renderRow={renderRow}
      isLoading={isLoading}
      loadingMessage="กำลังโหลดรายการสินค้า..."
      emptyState={emptyState}
      tableBreakpoint="lg"
    />
  );
}
