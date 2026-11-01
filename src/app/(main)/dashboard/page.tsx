'use client';

/**
 * หน้าแดชบอร์ดภาพรวม (Overview Dashboard)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา API: GET /api/v1/dashboard/overview
 * เอกสาร: DASHBOARD_API_INTEGRATION_GUIDE.md
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/dashboard.service';
import { authService } from '@/services/auth.service';
import { Branch } from '@/types/auth';
import {
  DashboardOverviewResponse,
  DashboardPeriodType,
} from '@/types/dashboard';
import { Icons } from '@/components/ui/Icons';
import { DashboardKpiCards } from '@/components/dashboard/DashboardKpiCards';
import { DashboardSalesTrend } from '@/components/dashboard/DashboardSalesTrend';
import { DashboardPaymentMix } from '@/components/dashboard/DashboardPaymentMix';
import { DashboardActiveShift } from '@/components/dashboard/DashboardActiveShift';
import { DashboardBestSellers } from '@/components/dashboard/DashboardBestSellers';
import { DashboardInventoryAlerts } from '@/components/dashboard/DashboardInventoryAlerts';
import { DashboardRecentSales } from '@/components/dashboard/DashboardRecentSales';
import { DashboardQuickLinks } from '@/components/dashboard/DashboardQuickLinks';

const PERIOD_OPTIONS: Array<{ id: DashboardPeriodType; label: string }> = [
  { id: 'today', label: 'วันนี้' },
  { id: 'yesterday', label: 'เมื่อวาน' },
  { id: 'last_7_days', label: '7 วันล่าสุด' },
  { id: 'this_month', label: 'เดือนนี้' },
  { id: 'custom', label: 'กำหนดเอง' },
];

export default function DashboardPage() {
  const { user, branch } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // ตัวกรองสาขา
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    branch?.id || user?.branchId || ''
  );
  const [branches, setBranches] = useState<Branch[]>([]);

  // ตัวกรองช่วงเวลา
  const [period, setPeriod] = useState<DashboardPeriodType>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // ข้อมูลแดชบอร์ด
  const [data, setData] = useState<DashboardOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ระบบ Auto-refresh ทุก 30 วินาที
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ดึงรายการสาขาทั้งหมด (สำหรับผู้ดูแลระบบ)
  useEffect(() => {
    if (isAdmin) {
      authService
        .getBranches()
        .then((bList) => setBranches(bList || []))
        .catch(() => {
          // หากดึงสาขาไม่ได้ ใช้สาขาปัจจุบันเป็นค่าเริ่มต้น
        });
    }
  }, [isAdmin]);

  // ฟังก์ชันแปลงวันเวลาเริ่มต้นและสิ้นสุดเป็น RFC3339 สำหรับ period=custom
  const getCustomIsoDates = useCallback(() => {
    if (period !== 'custom') return { startIso: undefined, endIso: undefined };

    let startIso: string | undefined;
    let endIso: string | undefined;

    if (customStartDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      startIso = start.toISOString();
    }

    if (customEndDate) {
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      endIso = end.toISOString();
    }

    return { startIso, endIso };
  }, [period, customStartDate, customEndDate]);

  // ฟังก์ชันโหลดข้อมูลแดชบอร์ด
  const fetchDashboardData = useCallback(
    async (isBackground: boolean = false) => {
      if (isBackground) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      const { startIso, endIso } = getCustomIsoDates();

      try {
        const res = await dashboardService.getOverview(
          {
            branchId: selectedBranchId || undefined,
            period,
            startDate: startIso,
            endDate: endIso,
            comparePrevious: true,
          },
          { silent: isBackground }
        );

        if (res.data) {
          setData(res.data);
          setLastUpdated(new Date());
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'ไม่สามารถดึงข้อมูลแดชบอร์ดภาพรวมได้ กรุณาลองใหม่อีกครั้ง';
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedBranchId, period, getCustomIsoDates]
  );

  // เรียกข้อมูลครั้งแรกเมื่อเปลี่ยนตัวกรอง
  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // จัดการ Auto-refresh
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchDashboardData(true);
      }, 30000); // ทุก 30 วินาที
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRefresh, fetchDashboardData]);

  const formatLastUpdatedTime = (d: Date | null) => {
    if (!d) return '-';
    return d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
                <Icons.LayoutDashboard className="w-7 h-7" />
              </span>
              แดชบอร์ดภาพรวม
            </h1>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 animate-pulse">
                <Icons.Refresh className="w-3 h-3 animate-spin" />
                อัปเดตข้อมูล...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            สรุปผลประกอบการ ยอดขาย กำไรขั้นต้น สถานะกะ และการแจ้งเตือนสต็อกแบบ Real-time
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* ตัวเลือกสาขา (เฉพาะ Admin) */}
          {isAdmin && branches.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-xs">
              <Icons.Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  ทุกสาขา (All Branches)
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* สวิตช์เปิด/ปิด Auto-refresh */}
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer shadow-xs ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="อัปเดตข้อมูลเบื้องหลังอัตโนมัติทุก 30 วินาที"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
              }`}
            />
            <span>{autoRefresh ? 'Live Auto 30s' : 'Auto Pause'}</span>
          </button>

          {/* ปุ่มรีเฟรชข้อมูลด้วยตนเอง */}
          <button
            type="button"
            onClick={() => fetchDashboardData(false)}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Icons.Refresh
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* 2. Period Filter Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-2 sm:p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                period === opt.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {lastUpdated && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 px-2 flex items-center gap-1 shrink-0">
            <span>อัปเดตล่าสุด:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              {formatLastUpdatedTime(lastUpdated)}
            </span>
          </div>
        )}
      </div>

      {/* Custom Date Pickers เมื่อเลือก period=custom */}
      {period === 'custom' && (
        <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">จากวันที่:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">ถึงวันที่:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-9 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData(false)}
            className="h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            ค้นหาข้อมูล
          </button>
        </div>
      )}

      {/* ข้อความแจ้งเตือนข้อผิดพลาด (ถ้ามี) */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icons.AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardData(false)}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* 3. Hero KPI Summary Cards (4 Cards) */}
      <DashboardKpiCards kpis={data?.salesKpis} isLoading={isLoading} />

      {/* 4. Row 2: Sales Trend Chart (2/3) + Payment Methods Mix (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardSalesTrend trend={data?.salesTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <DashboardPaymentMix
            payments={data?.paymentBreakdown}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 5. Row 3: Active Shift Status (1/2) + Critical Stock Alerts (1/2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardActiveShift shift={data?.activeShift} isLoading={isLoading} />
        <DashboardInventoryAlerts
          alerts={data?.inventoryAlerts}
          isLoading={isLoading}
        />
      </div>

      {/* 6. Row 4: Top 5 Best Sellers (1/2) + Recent Sales Feed (1/2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardBestSellers items={data?.bestSellers} isLoading={isLoading} />
        <DashboardRecentSales sales={data?.recentSales} isLoading={isLoading} />
      </div>

      {/* 7. Quick Action Launchpad */}
      <div className="pt-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
          ทางลัดการทำงานหลัก (Quick Launchpad)
        </h2>
        <DashboardQuickLinks />
      </div>
    </div>
  );
}
