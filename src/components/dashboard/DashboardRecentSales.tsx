'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';
import { DashboardRecentSale } from '@/types/dashboard';
import { formatSatangToBaht } from '@/utils/currencyHelper';

interface DashboardRecentSalesProps {
  sales?: DashboardRecentSale[];
  isLoading?: boolean;
}

export function DashboardRecentSales({ sales = [], isLoading }: DashboardRecentSalesProps) {
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

  const formatThaiTime = (rfcString: string) => {
    try {
      const d = new Date(rfcString);
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    } catch {
      return rfcString;
    }
  };

  const hasData = sales && sales.length > 0;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Icons.Activity className="w-4 h-4" />
            </span>
            รายการขายล่าสุด
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ความเคลื่อนไหวการชำระเงินหน้าร้านแบบ Real-time
          </p>
        </div>

        <Link
          href="/pos"
          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <span>ไปที่ POS</span>
          <Icons.ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      {!hasData ? (
        <div className="h-44 flex flex-col items-center justify-center text-slate-500 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800/80">
          <Icons.Receipt className="w-8 h-8 mb-2 stroke-1 text-slate-400 dark:text-slate-600" />
          <span className="text-sm">ยังไม่มีรายการขายล่าสุด</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sales.slice(0, 5).map((sale) => {
            const isCompleted = sale.status === 'COMPLETED';

            return (
              <div
                key={sale.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800/80 transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                    <Icons.Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-200 font-mono">
                        {sale.saleNo}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                        }`}
                      >
                        {isCompleted ? 'สำเร็จ' : sale.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {sale.customerName || 'ลูกค้าทั่วไป'} · ชำระด้วย {sale.paymentMethod || 'เงินสด'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    ฿{formatSatangToBaht(sale.grandTotal)}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    {formatThaiTime(sale.occurredAt)}
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

