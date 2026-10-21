'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types/catalog';
import { Icons } from '@/components/ui/Icons';

export interface ProductToolbarProps {
  categories: Category[];
  search: string;
  selectedCategoryId: string;
  selectedStatus: string; // 'all' | 'active' | 'inactive'
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onStatusChange: (status: string) => void;
  onAddNewProduct: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function ProductToolbar({
  categories,
  search,
  selectedCategoryId,
  selectedStatus,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onAddNewProduct,
  onRefresh,
  isLoading = false,
}: ProductToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sync external search value
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
      {/* ค้นหาและตัวกรอง */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 flex-1">
        {/* ช่องค้นหา */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Icons.Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า, SKU, บาร์โค้ด..."
            className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Icons.X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ตัวกรองหมวดหมู่ */}
        <div className="w-full sm:w-44">
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full py-2 px-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="">ทุกหมวดหมู่สินค้า</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* ตัวกรองสถานะ */}
        <div className="w-full sm:w-36">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full py-2 px-3 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">เปิดจำหน่าย</option>
            <option value="inactive">ปิดชั่วคราว</option>
          </select>
        </div>
      </div>

      {/* ปุ่มรีเฟรช และ ปุ่มเพิ่มสินค้า */}
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="รีเฟรชรายการ"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <span className={`inline-block ${isLoading ? 'animate-spin' : ''}`}>
            ↻
          </span>
        </button>

        <button
          type="button"
          onClick={onAddNewProduct}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>เพิ่มสินค้าใหม่</span>
        </button>
      </div>
    </div>
  );
}
