'use client';

/**
 * แถบเลือกหมวดหมู่สินค้าสำหรับหน้า POS (PosCategoryTabs)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, เลื่อนแนวนอนลื่นไหล, ไฮไลต์ชัดเจน)
 */

import React from 'react';
import { Category } from '@/types/catalog';

interface PosCategoryTabsProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  isLoading?: boolean;
}

export function PosCategoryTabs({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading = false,
}: PosCategoryTabsProps) {
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 select-none">
      <div className="flex items-center gap-2 min-w-max">
        {/* แท็บ "สินค้าทั้งหมด" */}
        <button
          type="button"
          onClick={() => onSelectCategory('ALL')}
          className={`min-h-[48px] px-5 py-2.5 rounded-xl text-base font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
            selectedCategoryId === 'ALL'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400/50 shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
          }`}
        >
          <span>สินค้าทั้งหมด</span>
        </button>

        {/* รายการหมวดหมู่จากระบบ */}
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={`min-h-[48px] px-5 py-2.5 rounded-xl text-base font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 border shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400/50 shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
              }`}
            >
              <span>{category.name}</span>
            </button>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm pl-2">
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            กำลังโหลดหมวดหมู่...
          </div>
        )}
      </div>
    </div>
  );
}
