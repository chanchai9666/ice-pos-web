'use client';

/**
 * หน้ารายงานสรุปยอดขายและการวิเคราะห์ (Reports & Analytics)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: GET /reports/sales-summary, GET /reports/best-sellers
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { reportService } from '@/services/report.service';
import { SalesSummaryResponse, BestSellerResponse } from '@/types/report';
import { Icons } from '@/components/ui/Icons';
import { formatSatangToBaht } from '@/utils/currency';

type PeriodType = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export default function ReportsPage() {
  const { user, branch } = useAuth();
  const effectiveBranchId = branch?.id ?? user?.branchId ?? undefined;

  const [period, setPeriod] = useState<PeriodType>('TODAY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [summary, setSummary] = useState<SalesSummaryResponse | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSellerResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // ฟังก์ชันคำนวณช่วงวันที่ตาม Shortcut
  const calculateDateRange = useCallback((p: PeriodType) => {
    const now = new Date();
    let start = new Date();
    const end = new Date();

    if (p === 'TODAY') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (p === 'WEEK') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (p === 'MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
    }

    return {
      startStr: start.toISOString(),
      endStr: end.toISOString(),
    };
  }, []);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError('');

    let startIso: string | undefined;
    let endIso: string | undefined;

    if (period === 'CUSTOM') {
      if (startDate) startIso = new Date(startDate).toISOString();
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        endIso = e.toISOString();
      }
    } else {
      const { startStr, endStr } = calculateDateRange(period);
      startIso = startStr;
      endIso = endStr;
    }

    try {
      const [sumRes, bestRes] = await Promise.all([
        reportService.getSalesSummary({
          branchId: effectiveBranchId,
          startDate: startIso,
          endDate: endIso,
        }),
        reportService.getBestSellers({
          branchId: effectiveBranchId,
          startDate: startIso,
          endDate: endIso,
          limit: 10,
        }),
      ]);

      setSummary(sumRes.data || null);
      setBestSellers(bestRes.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลรายงานได้';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [period, startDate, endDate, effectiveBranchId, calculateDateRange]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // คำนวณ Margin %
  const profitMarginPercent =
    summary && summary.totalSales > 0
      ? ((summary.grossProfit / summary.totalSales) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.BarChart3 className="w-7 h-7" />
            </span>
            รายงานสรุปยอดขายและการวิเคราะห์
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            สรุปภาพรวมรายได้ กำไรขั้นต้น ต้นทุนขาย (COGS) และจัดอันดับสินค้าขายดี
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
          {(
            [
              { id: 'TODAY', label: 'วันนี้' },
              { id: 'WEEK', label: '7 วันล่าสุด' },
              { id: 'MONTH', label: 'เดือนนี้' },
              { id: 'CUSTOM', label: 'กำหนดเอง' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPeriod(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                period === t.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Filters */}
      {period === 'CUSTOM' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">จากวันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 px-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">ถึงวันที่:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={loadReports}
            className="h-10 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            ค้นหา
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">ยอดขายรวม (Total Sales)</span>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
                ฿{formatSatangToBaht(summary?.totalSales ?? 0)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Icons.ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>จำนวนบิลขายทั้งหมด:</span>
            <span className="font-bold text-slate-300">{summary?.totalBills ?? 0} บิล</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">กำไรขั้นต้น (Gross Profit)</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                ฿{formatSatangToBaht(summary?.grossProfit ?? 0)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Icons.Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>อัตรากำไร (Margin):</span>
            <span className="font-bold text-emerald-400">{profitMarginPercent}%</span>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">ต้นทุนขายรวม (COGS)</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                ฿{formatSatangToBaht(summary?.totalCost ?? 0)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Icons.Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>ยอดขายเฉลี่ยต่อบิล:</span>
            <span className="font-bold text-slate-300">฿{formatSatangToBaht(summary?.averageBillSize ?? 0)}</span>
          </div>
        </div>

        {/* VAT & Discounts */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
              <span className="font-bold text-white text-sm">฿{formatSatangToBaht(summary?.totalVat ?? 0)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
              <span>ส่วนลดรวมทั้งหมด:</span>
              <span className="font-bold text-rose-400 text-sm">฿{formatSatangToBaht(summary?.totalDiscount ?? 0)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={loadReports}
            disabled={isLoading}
            className="mt-3 w-full h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Icons.Refresh className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>อัปเดตข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Top Best Selling Products */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Icons.BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">อันดับสินค้าขายดี (Top 10 Best Sellers)</h3>
              <p className="text-xs text-slate-400">จัดอันดับตามจำนวนชิ้นและยอดขายตามช่วงเวลาที่เลือก</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
            <Icons.Loader className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm">กำลังโหลดอันดับสินค้า...</span>
          </div>
        ) : bestSellers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            ไม่มีข้อมูลการขายสินค้าในช่วงเวลานี้
          </div>
        ) : (
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">อันดับ</th>
                  <th className="py-3 px-4">ชื่อสินค้า</th>
                  <th className="py-3 px-4 text-right">จำนวนที่ขายได้</th>
                  <th className="py-3 px-4 text-right">ยอดขายรวม</th>
                  <th className="py-3 px-4 text-right">กำไรสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {bestSellers.map((item, idx) => (
                  <tr key={item.productId || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <div>{item.productName}</div>
                      {item.productCode && (
                        <div className="text-xs text-slate-500 font-mono">{item.productCode}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {item.totalQtySold.toLocaleString()} ชิ้น
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-400">
                      ฿{formatSatangToBaht(item.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      ฿{formatSatangToBaht(item.totalProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
