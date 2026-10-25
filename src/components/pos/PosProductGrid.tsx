'use client';

/**
 * แผงแสดงรายการสินค้าสำหรับการเลือกขาย (PosProductGrid)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (การ์ดขนาดใหญ่ >=160px, ตัวหนังสือชื่อสินค้า 16px+, ราคาเด่นชัด)
 */

import React from 'react';
import { Product } from '@/types/catalog';
import { StockLevelMap } from '@/types/inventory';
import { formatSatangToBaht } from '@/utils/currency';
import { resolveProductStockPresentation } from '@/utils/posStockHelper';
import { Icons } from '@/components/ui/Icons';

interface PosProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isLoading?: boolean;
  stockMap?: StockLevelMap;
}

export function PosProductGrid({
  products,
  onSelectProduct,
  isLoading = false,
  stockMap = {},
}: PosProductGridProps) {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pointer-events-none select-none min-h-[300px]"
      >
        {/* แถบ Overlay สถานะกำลังโหลดข้อมูลสินค้า */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-[2px] rounded-2xl">
          <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 shadow-2xl">
            <div className="w-6 h-6 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg font-bold text-white tracking-wide">
              กำลังโหลดรายการสินค้า...
            </span>
          </div>
        </div>

        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between min-h-[170px] animate-pulse"
          >
            <div className="w-full h-24 bg-slate-800 rounded-xl mb-3" />
            <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
            <div className="h-5 bg-slate-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center my-6 space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Icons.Package className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">ไม่พบรายการสินค้าที่ค้นหา</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          ลองเปลี่ยนคำค้นหา หรือเลือกดูหมวดหมู่อื่นเพื่อค้นหาสินค้าที่ต้องการ
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
      {products.map((product) => {
        const stockInfo = resolveProductStockPresentation(product, stockMap);

        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelectProduct(product)}
            className={`group relative bg-slate-900 hover:bg-slate-850 active:bg-cyan-950/40 ${stockInfo.cardBorderClass} rounded-2xl p-3 sm:p-4 flex flex-col justify-between text-left transition-all duration-150 ${stockInfo.cardShadowClass} cursor-pointer overflow-hidden min-h-[170px]`}
          >
            {/* ส่วนรูปภาพสินค้า */}
            <div className="relative w-full h-24 sm:h-28 rounded-xl bg-slate-800 flex items-center justify-center mb-3 overflow-hidden border border-slate-700/60 group-hover:border-slate-600">
              {/* ไอคอน Fallback ด้านหลังเสมอ */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                <Icons.Package className="w-8 h-8 text-slate-600" />
              </div>

              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    // หากรูปภาพโหลดไม่ติด ให้ซ่อนและแสดงไอคอน Fallback ด้านหลัง
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}

              {/* ป้ายแสดงประเภทสินค้า ชั่งขาย หรือ สต็อกคงเหลือ (มุมซ้ายบน) */}
              {stockInfo.isWeightBased ? (
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-xs font-black shadow-md tracking-wide flex items-center gap-1 z-10">
                  <Icons.Scale className="w-3.5 h-3.5" />
                  {stockInfo.badgeText}
                </span>
              ) : (
                <span
                  className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-xs z-10 ${stockInfo.badgeClass}`}
                >
                  {stockInfo.badgeText}
                </span>
              )}

              {/* ป้ายแสดงหน่วยนับ (มุมขวาล่าง) */}
              {product.baseUom?.name && (
                <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[11px] font-medium text-slate-300 border border-slate-700/60 z-10">
                  {product.baseUom.name}
                </span>
              )}
            </div>

            {/* ส่วนข้อมูลชื่อและรหัสสินค้า */}
            <div className="flex-1 flex flex-col justify-between space-y-1">
              <div>
                <h4 className="text-base sm:text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                  {product.name}
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                  {product.barcode || product.sku}
                </p>
              </div>

              {/* ส่วนราคาขาย */}
              <div className="pt-2 flex items-baseline justify-between border-t border-slate-800/80">
                <span className="text-lg sm:text-xl font-extrabold text-cyan-400">
                  {formatSatangToBaht(product.price ?? 0)}
                </span>
                <span className="text-xs text-slate-400 font-medium group-hover:text-cyan-400 transition-colors">
                  + เพิ่ม
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
