'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { DashboardSalesKPIs } from '@/types/dashboard';
import { formatSatangToBaht } from '@/utils/currencyHelper';

interface DashboardKpiCardsProps {
  kpis?: DashboardSalesKPIs | null;
  isLoading?: boolean;
}

export function DashboardKpiCards({ kpis, isLoading }: DashboardKpiCardsProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse space-y-3"
          >
            <div className="h-4 bg-slate-800 rounded w-1/2" />
            <div className="h-8 bg-slate-800 rounded w-3/4" />
            <div className="h-4 bg-slate-800/60 rounded w-full pt-2" />
          </div>
        ))}
      </div>
    );
  }

  // คำนวณ Margin %
  const marginPercent =
    kpis.totalSales > 0
      ? ((kpis.grossProfit / kpis.totalSales) * 100).toFixed(1)
      : '0.0';

  const salesGrowth = kpis.comparison?.salesGrowthPercent ?? 0;
  const billsGrowth = kpis.comparison?.billsGrowthPercent ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. ยอดขายรวม */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-5 shadow-xs">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">
              ยอดขายรวม (Total Sales)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1 tracking-tight">
              ฿{formatSatangToBaht(kpis.totalSales)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Icons.ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <span className="text-slate-400">เทียบรอบก่อนหน้า:</span>
          {kpis.comparison ? (
            <span
              className={`flex items-center gap-1 font-bold ${
                salesGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {salesGrowth >= 0 ? (
                <Icons.TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <Icons.TrendingDown className="w-3.5 h-3.5" />
              )}
              {salesGrowth >= 0 ? `+${salesGrowth.toFixed(1)}%` : `${salesGrowth.toFixed(1)}%`}
            </span>
          ) : (
            <span className="text-slate-500">-</span>
          )}
        </div>
      </div>

      {/* 2. กำไรขั้นต้น */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-5 shadow-xs">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">
              กำไรขั้นต้น (Gross Profit)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 tracking-tight">
              ฿{formatSatangToBaht(kpis.grossProfit)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Icons.Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <span className="text-slate-400">อัตรากำไร (Margin):</span>
          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {marginPercent}%
          </span>
        </div>
      </div>

      {/* 3. จำนวนบิลขาย */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-5 shadow-xs">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">
              จำนวนบิลขาย (Total Bills)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
              {kpis.totalBills.toLocaleString('th-TH')}{' '}
              <span className="text-sm font-semibold text-slate-400">บิล</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Icons.Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <span className="text-slate-400">เทียบรอบก่อนหน้า:</span>
          {kpis.comparison ? (
            <span
              className={`flex items-center gap-1 font-bold ${
                billsGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {billsGrowth >= 0 ? (
                <Icons.TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <Icons.TrendingDown className="w-3.5 h-3.5" />
              )}
              {billsGrowth >= 0 ? `+${billsGrowth.toFixed(1)}%` : `${billsGrowth.toFixed(1)}%`}
            </span>
          ) : (
            <span className="text-slate-500">-</span>
          )}
        </div>
      </div>

      {/* 4. ยอดขายเฉลี่ยต่อบิล */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-5 shadow-xs">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-slate-400 font-semibold tracking-wide">
              ยอดเฉลี่ยต่อบิล (Avg Ticket)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 tracking-tight">
              ฿{formatSatangToBaht(kpis.averageBillSize)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Icons.Scale className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <span className="text-slate-400">ภาษีและส่วนลด:</span>
          <span className="text-slate-300 font-medium truncate max-w-[150px]">
            ส่วนลด ฿{formatSatangToBaht(kpis.totalDiscount, { showUnit: false })}
          </span>
        </div>
      </div>
    </div>
  );
}

