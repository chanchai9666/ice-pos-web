'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { Branch } from '@/types/auth';
import { Supplier, GoodsReceiptStatus } from '@/types/procurement';

export interface GoodsReceiptToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: GoodsReceiptStatus | '';
  onStatusFilterChange: (status: GoodsReceiptStatus | '') => void;
  supplierFilter: string;
  onSupplierFilterChange: (supplierId: string) => void;
  suppliers: Supplier[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  branches: Branch[];
  canSwitchBranch: boolean;
  onRefresh: () => void;
  onCreateDirectReceipt: () => void;
  isLoading?: boolean;
}

export function GoodsReceiptToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  supplierFilter,
  onSupplierFilterChange,
  suppliers,
  selectedBranchId,
  onBranchChange,
  branches,
  canSwitchBranch,
  onRefresh,
  onCreateDirectReceipt,
  isLoading = false,
}: GoodsReceiptToolbarProps) {
  const statusOptions: { value: GoodsReceiptStatus | ''; label: string }[] = [
    { value: '', label: 'ทุกสถานะ' },
    { value: 'COMPLETED', label: 'รับเข้าคลังแล้ว (COMPLETED)' },
    { value: 'DRAFT', label: 'ฉบับร่าง (DRAFT)' },
    { value: 'CANCELLED', label: 'ยกเลิกแล้ว' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* ช่องค้นหา */}
        <div className="relative flex-1 min-w-[260px]">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icons.Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ค้นหาเลขที่ GR, เลขที่ Invoice ผู้ขาย..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all min-h-[48px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <Icons.Close className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ปุ่มตรวจรับตรง (ไม่มี PO) */}
        <button
          type="button"
          onClick={onCreateDirectReceipt}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-cyan-700 dark:text-cyan-300 font-bold text-base hover:text-cyan-800 dark:hover:text-white transition-all min-h-[48px] cursor-pointer whitespace-nowrap"
        >
          <Icons.Plus className="w-5 h-5" />
          <span>ตรวจรับตรง (ไม่มี PO)</span>
        </button>
      </div>

      {/* แถบตัวกรองแถวล่าง */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-slate-200 dark:border-slate-800/80">
        {/* ตัวกรองสถานะ */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap hidden sm:inline">
            สถานะ:
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as GoodsReceiptStatus | '')
            }
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ตัวกรองผู้จัดจำหน่าย */}
        {suppliers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap hidden sm:inline">
              ผู้ขาย:
            </label>
            <select
              value={supplierFilter}
              onChange={(e) => onSupplierFilterChange(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px] max-w-[200px] truncate"
            >
              <option value="">ผู้จัดจำหน่ายทั้งหมด</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* สลับสาขา */}
        {canSwitchBranch && branches.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap hidden sm:inline">
              สาขา:
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => onBranchChange(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ปุ่มรีเฟรช */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="รีเฟรชข้อมูล"
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ml-auto sm:ml-0"
        >
          <Icons.RotateCw
            className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
