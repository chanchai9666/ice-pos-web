'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';
import { DashboardBestSellerItem } from '@/types/dashboard';
import { formatSatangToBaht } from '@/utils/currencyHelper';

interface DashboardBestSellersProps {
  items?: DashboardBestSellerItem[];
  isLoading?: boolean;
}

export function DashboardBestSellers({ items = [], isLoading }: DashboardBestSellersProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = items && items.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <Icons.Sparkles className="w-4 h-4" />
            </span>
            สินค้าขายดี 5 อันดับแรก
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            เรียงตามยอดขายและจำนวนหน่วยที่จำหน่ายได้
          </p>
        </div>

        <Link
          href="/reports"
          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <span>ดูทั้งหมด</span>
          <Icons.ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      {!hasData ? (
        <div className="h-44 flex flex-col items-center justify-center text-slate-500 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800/80">
          <Icons.Package className="w-8 h-8 mb-2 stroke-1 text-slate-400 dark:text-slate-600" />
          <span className="text-sm">ยังไม่มีรายการขายสินค้าในช่วงเวลานี้</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.slice(0, 5).map((item, idx) => {
            const rank = idx + 1;
            const rankBadgeColor =
              rank === 1
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-400/20 dark:text-amber-300 dark:border-amber-400/40'
                : rank === 2
                ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-300/20 dark:text-slate-200 dark:border-slate-300/40'
                : rank === 3
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-700/20 dark:text-amber-500 dark:border-amber-700/40'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';

            return (
              <div
                key={item.productId || idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black border shrink-0 ${rankBadgeColor}`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.productName}
                    </h4>
                    {item.productCode && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {item.productCode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="text-sm font-bold text-cyan-700 dark:text-cyan-400">
                    ฿{formatSatangToBaht(item.totalRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    ขายแล้ว <span className="font-semibold text-slate-900 dark:text-white">{item.totalQtySold}</span> ชิ้น
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

