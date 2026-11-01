'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';
import { DashboardInventoryAlerts as InventoryAlertsType } from '@/types/dashboard';
import { formatSatangToBaht } from '@/utils/currencyHelper';

interface DashboardInventoryAlertsProps {
  alerts?: InventoryAlertsType | null;
  isLoading?: boolean;
}

export function DashboardInventoryAlerts({ alerts, isLoading }: DashboardInventoryAlertsProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  const criticalItems = alerts?.criticalItems || [];
  const lowStockCount = alerts?.lowStockCount || 0;
  const outOfStockCount = alerts?.outOfStockCount || 0;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
              <Icons.Boxes className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">แจ้งเตือนสต็อกสินค้า</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            สินค้าที่สต็อกต่ำกว่าเกณฑ์ขั้นต่ำ (Min Stock)
          </p>
        </div>

        <Link
          href="/inventory"
          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <span>จัดการคลัง</span>
          <Icons.ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stock Summary Mini Badges */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">สต็อกใกล้หมด:</span>
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
            {lowStockCount} รายการ
          </span>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">สินค้าหมด (0):</span>
          <span
            className={`text-sm font-extrabold ${
              outOfStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {outOfStockCount} รายการ
          </span>
        </div>
      </div>

      {/* Critical Items List */}
      {criticalItems.length === 0 ? (
        <div className="h-32 flex flex-col items-center justify-center text-center p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
          <Icons.Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-1" />
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            สต็อกสินค้าทุกรายการอยู่ในเกณฑ์ปกติ
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            มูลค่าสต็อกรวมตามทุน ฿{formatSatangToBaht(alerts?.totalValuationCost || 0)}
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {criticalItems.slice(0, 4).map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800/80 transition-colors text-xs"
            >
              <div className="min-w-0 pr-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {item.productName}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {item.sku || '-'}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-2 py-0.5 rounded-md font-bold text-xs bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                  เหลือ {item.currentStock} {item.uomName}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  เกณฑ์ขั้นต่ำ: {item.minStock} {item.uomName}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

