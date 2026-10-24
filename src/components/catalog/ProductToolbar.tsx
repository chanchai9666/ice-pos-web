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
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-2xl border-2 border-slate-800 shadow-md">
      {/* ค้นหาและตัวกรอง */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1">
        {/* ช่องค้นหา */}
        <div className="relative flex-1 min-w-[240px]">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
            <Icons.Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า, SKU, บาร์โค้ด..."
            className="w-full h-[50px] pl-11 pr-11 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all font-medium"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute inset-y-0 right-2 my-auto min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:scale-90 transition cursor-pointer"
              aria-label="ล้างคำค้นหา"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* ตัวกรองหมวดหมู่ */}
        <div className="relative w-full sm:w-56 shrink-0">
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full h-[50px] pl-4 pr-10 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 cursor-pointer font-medium appearance-none transition-all shadow-inner"
          >
            <option value="">ทุกหมวดหมู่สินค้า</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
            <Icons.ChevronDown className="w-5 h-5" />
          </span>
        </div>

        {/* ตัวกรองสถานะ */}
        <div className="relative w-full sm:w-48 shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full h-[50px] pl-4 pr-10 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 cursor-pointer font-medium appearance-none transition-all shadow-inner"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">เปิดจำหน่าย</option>
            <option value="inactive">ปิดชั่วคราว</option>
          </select>
          <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
            <Icons.ChevronDown className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* ปุ่มรีเฟรช และ ปุ่มเพิ่มสินค้า */}
      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="รีเฟรชรายการ"
          className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border-2 border-slate-700 text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
          aria-label="รีเฟรชข้อมูลสินค้า"
        >
          <span className={`inline-block text-xl ${isLoading ? 'animate-spin' : ''}`}>
            ↻
          </span>
        </button>

        <button
          type="button"
          onClick={onAddNewProduct}
          className="h-[50px] min-h-[50px] flex items-center gap-2 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-bold text-base shadow-lg shadow-cyan-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Icons.Plus className="w-5 h-5 stroke-[2.5]" />
          <span>เพิ่มสินค้าใหม่</span>
        </button>
      </div>
    </div>
  );
}
