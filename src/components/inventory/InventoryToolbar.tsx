'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';

export interface InventoryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenBarcodeScan: () => void;
  lowStockOnly: boolean;
  onToggleLowStock: (val: boolean) => void;
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  branches: Array<{ id: string; name: string }>;
  canSwitchBranch: boolean;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function InventoryToolbar({
  searchQuery,
  onSearchChange,
  onOpenBarcodeScan,
  lowStockOnly,
  onToggleLowStock,
  selectedBranchId,
  onBranchChange,
  branches,
  canSwitchBranch,
  onRefresh,
  isLoading = false,
}: InventoryToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sync external search value (e.g. from Barcode scanner)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const selectedBranchName =
    branches.find((b) => b.id === selectedBranchId)?.name || 'สาขาปัจจุบัน';

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white/90 dark:bg-slate-900/90 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* ส่วนซ้าย: ค้นหา + ปุ่มกล้องสแกนบาร์โค้ด */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-1">
        {/* ช่องค้นหา */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
            <Icons.Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า, SKU, บาร์โค้ด..."
            className="w-full h-[50px] pl-11 pr-11 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute inset-y-0 right-2 my-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg active:scale-90 transition cursor-pointer"
              title="ล้างข้อความค้นหา"
              aria-label="ล้างข้อความค้นหา"
            >
              <Icons.Close className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ปุ่มสแกนบาร์โค้ดด้วยกล้อง */}
        <button
          type="button"
          onClick={onOpenBarcodeScan}
          className="min-h-[50px] px-4 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 rounded-xl text-cyan-600 dark:text-cyan-400 font-semibold text-sm transition-all cursor-pointer shrink-0 shadow-sm"
          title="สแกนบาร์โค้ดด้วยกล้อง"
          aria-label="สแกนบาร์โค้ดด้วยกล้อง"
        >
          <Icons.Camera className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">สแกนบาร์โค้ด</span>
        </button>
      </div>

      {/* ส่วนขวา: สลับสาขา + สลับกรองสต็อกต่ำ + ปุ่มรีเฟรช */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
        {/* เลือกสาขา (สำหรับ ADMIN สลับได้, สาขาเดียวแสดงป้ายชื่อ) */}
        {canSwitchBranch && branches.length > 0 ? (
          <div className="relative min-w-[180px] flex-1 sm:flex-none">
            <select
              value={selectedBranchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-full h-[50px] px-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none pr-8"
              aria-label="เลือกสาขา"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
              <Icons.ChevronDown className="w-4 h-4" />
            </div>
          </div>
        ) : (
          <div className="h-[50px] px-4 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{selectedBranchName}</span>
          </div>
        )}

        {/* ปุ่มกรองเฉพาะสต็อกต่ำ */}
        <button
          type="button"
          onClick={() => onToggleLowStock(!lowStockOnly)}
          className={`min-h-[50px] px-4 flex items-center justify-center gap-2 rounded-xl border font-bold text-sm transition-all cursor-pointer shrink-0 active:scale-95 ${
            lowStockOnly
              ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300 shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
          title="กรองเฉพาะรายการที่สต็อกต่ำกว่าเกณฑ์"
          aria-pressed={lowStockOnly}
        >
          <Icons.AlertTriangle
            className={`w-4 h-4 ${lowStockOnly ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}
          />
          <span>สต็อกใกล้หมด</span>
        </button>

        {/* ปุ่มรีเฟรชข้อมูล */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="min-h-[50px] min-w-[50px] px-3 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title="รีเฟรชข้อมูลสต็อก"
          aria-label="รีเฟรชข้อมูลสต็อก"
        >
          <Icons.Refresh
            className={`w-5 h-5 ${isLoading ? 'animate-spin text-cyan-500' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
