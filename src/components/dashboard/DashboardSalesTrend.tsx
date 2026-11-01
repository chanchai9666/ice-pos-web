'use client';

import React, { useState } from 'react';
import { Icons } from '@/components/ui/Icons';
import { DashboardSalesTrendItem } from '@/types/dashboard';
import { formatSatangToBaht } from '@/utils/currencyHelper';

interface DashboardSalesTrendProps {
  trend?: DashboardSalesTrendItem[];
  isLoading?: boolean;
}

type MetricMode = 'SALES' | 'BILLS';

export function DashboardSalesTrend({ trend = [], isLoading }: DashboardSalesTrendProps) {
  const [mode, setMode] = useState<MetricMode>('SALES');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-6" />
        <div className="h-56 bg-slate-100 dark:bg-slate-800/40 rounded-xl w-full" />
      </div>
    );
  }

  const hasData = trend && trend.length > 0;

  // หาค่าสูงสุดสำหรับคำนวณความสูงแท่งกราฟ
  const maxSales = hasData ? Math.max(...trend.map((t) => t.sales), 1) : 1;
  const maxBills = hasData ? Math.max(...trend.map((t) => t.bills), 1) : 1;
  const maxValue = mode === 'SALES' ? maxSales : maxBills;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <Icons.BarChart3 className="w-4 h-4" />
            </span>
            แนวโน้มยอดขายตามช่วงเวลา
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            สถิติยอดขายและจำนวนบิลแยกตามช่วงเวลา
          </p>
        </div>

        {/* Toggle Mode: ยอดขาย / จำนวนบิล */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMode('SALES')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'SALES'
                ? 'bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ยอดขาย (บาท)
          </button>
          <button
            type="button"
            onClick={() => setMode('BILLS')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'BILLS'
                ? 'bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            จำนวนบิล
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      {!hasData ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800/80">
          <Icons.Clock className="w-8 h-8 mb-2 stroke-1 text-slate-400 dark:text-slate-600" />
          <span className="text-sm">ยังไม่มีข้อมูลแนวโน้มยอดขายในช่วงเวลานี้</span>
        </div>
      ) : (
        <div className="relative">
          {/* Tooltip Bar Slot (จองพื้นที่ความสูงคงที่เพื่อป้องกัน Cumulative Layout Shift ไม่ให้กราฟเด้งหรือกระตุก) */}
          <div className="h-10 mb-3 flex items-center">
            {hoveredIndex !== null && trend[hoveredIndex] ? (
              <div className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  ช่วงเวลา {trend[hoveredIndex].label}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                    ยอดขาย: ฿{formatSatangToBaht(trend[hoveredIndex].sales)}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {trend[hoveredIndex].bills} บิล
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full px-3.5 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span>แตะหรือชี้เมาส์ที่แท่งกราฟเพื่อดูรายละเอียดสถิติ</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {mode === 'SALES' ? 'เกณฑ์: ยอดขาย' : 'เกณฑ์: จำนวนบิล'}
                </span>
              </div>
            )}
          </div>

          {/* Bar Chart Container */}
          <div className="h-56 flex items-end gap-2 sm:gap-3 pt-4 pb-2 px-2 overflow-x-auto">
            {trend.map((item, idx) => {
              const val = mode === 'SALES' ? item.sales : item.bills;
              const heightPercent = maxValue > 0 ? Math.max((val / maxValue) * 100, 4) : 4;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={item.bucket || idx}
                  className="flex-1 min-w-[32px] sm:min-w-[40px] flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Bar */}
                  <div className="w-full flex justify-center items-end h-[180px]">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[28px] rounded-t-lg transition-colors duration-150 relative ${
                        isHovered
                          ? 'bg-cyan-400 shadow-md shadow-cyan-500/30'
                          : mode === 'SALES'
                          ? 'bg-gradient-to-t from-cyan-600 to-cyan-400/80 hover:from-cyan-500 hover:to-cyan-300'
                          : 'bg-gradient-to-t from-blue-600 to-blue-400/80 hover:from-blue-500 hover:to-blue-300'
                      }`}
                    />
                  </div>

                  {/* X Axis Label */}
                  <span
                    className={`mt-2 text-[10px] sm:text-xs truncate max-w-full font-semibold transition-colors duration-150 ${
                      isHovered ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

