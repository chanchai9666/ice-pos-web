'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { formatCurrency } from '@/utils/currency';

export interface InventorySummaryCardsProps {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValuationBaht: number;
  isLoading?: boolean;
}

export function InventorySummaryCards({
  totalSkus,
  lowStockCount,
  outOfStockCount,
  totalValuationBaht,
  isLoading = false,
}: InventorySummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. รายการสินค้าทั้งหมด */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-semibold text-slate-400">สินค้าทั้งหมด</span>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Icons.Boxes className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {isLoading ? (
            <div className="h-8 w-20 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{totalSkus.toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-medium">รายการ</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. สต็อกต่ำกว่าเกณฑ์ */}
      <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-amber-400">สต็อกใกล้หมด</span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Icons.AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">{lowStockCount.toLocaleString()}</span>
              <span className="text-xs text-amber-400/80 font-medium">รายการ</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. สินค้าหมดสต็อก */}
      <div className="bg-slate-900 border-2 border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-rose-400">สินค้าหมด</span>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Icons.X className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {isLoading ? (
            <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">{outOfStockCount.toLocaleString()}</span>
              <span className="text-xs text-rose-400/80 font-medium">รายการ</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. มูลค่าสินค้าคงคลังรวม */}
      <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-emerald-400">มูลค่าสต็อกรวม</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Icons.BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          {isLoading ? (
            <div className="h-8 w-28 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                {formatCurrency(totalValuationBaht)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
