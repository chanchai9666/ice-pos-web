'use client';

import React from 'react';
import { Category } from '@/types/catalog';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';

export interface CategoryListProps {
  categories: Category[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryList({
  categories,
  isLoading,
  onAddNew,
  onEdit,
  onDelete,
}: CategoryListProps) {
  // สร้าง lookup map เพื่อค้นหาชื่อ Parent Category
  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // เรียงลำดับตาม sortOrder แล้วตามชื่อ
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      const orderA = a.sortOrder ?? 0;
      const orderB = b.sortOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, 'th');
    });
  }, [categories]);

  return (
    <div className="space-y-4">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border-2 border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md backdrop-blur-xs">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Icons.Boxes className="w-6 h-6 text-cyan-400" />
            <span>โครงสร้างหมวดหมู่สินค้า (Categories)</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            จัดการจัดกลุ่มสินค้าและลำดับการแสดงผลในเมนูหน้าขายหน้าร้าน (POS)
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white text-base font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer min-h-[48px]"
        >
          <Icons.Plus className="w-5 h-5 stroke-[2.5]" />
          <span>เพิ่มหมวดหมู่ใหม่</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300 space-y-4">
            <Icons.RotateCw className="w-9 h-9 text-cyan-400 animate-spin" />
            <p className="text-base font-semibold">กำลังโหลดข้อมูลหมวดหมู่สินค้า...</p>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4 border-2 border-slate-700">
              <Icons.Boxes className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">ยังไม่มีหมวดหมู่สินค้าในระบบ</h3>
            <p className="text-base text-slate-400 mt-1 max-w-sm">
              เริ่มต้นสร้างหมวดหมู่สินค้าเพื่อช่วยจัดระเบียบและค้นหาสินค้าในระบบขายหน้าร้านได้สะดวกรวดเร็วยิ่งขึ้น
            </p>
            <button
              type="button"
              onClick={onAddNew}
              className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-400 text-base font-bold border-2 border-slate-700 transition-all cursor-pointer min-h-[48px]"
            >
              <Icons.Plus className="w-5 h-5 stroke-[2.5]" />
              <span>สร้างหมวดหมู่แรก</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-base">
              <colgroup>
                <col className="w-[8%] min-w-[70px]" />
                <col className="w-[30%] min-w-[200px]" />
                <col className="w-[22%] min-w-[160px]" />
                <col className="w-[22%] min-w-[150px]" />
                <col className="w-[9%] min-w-[100px]" />
                <col className="w-[9%] min-w-[110px]" />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-slate-800 bg-slate-850 text-slate-300 font-bold uppercase tracking-wider text-sm">
                  <th className="py-4 px-4 text-center">ลำดับ</th>
                  <th className="py-4 px-4">ชื่อหมวดหมู่</th>
                  <th className="py-4 px-4">หมวดหมู่หลัก (Parent)</th>
                  <th className="py-4 px-4">คำอธิบาย</th>
                  <th className="py-4 px-4 text-center">สถานะ</th>
                  <th className="py-4 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-800/80 text-slate-200">
                {sortedCategories.map((cat) => {
                  const parentName = cat.parentId ? categoryMap.get(cat.parentId) : null;
                  const isChild = !!cat.parentId;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* ลำดับจัดเรียง */}
                      <td className="py-4 px-4 text-center font-mono text-slate-300">
                        <span className="inline-block px-3 py-1 rounded-lg bg-slate-800 text-sm font-bold text-slate-200 border-2 border-slate-700">
                          {cat.sortOrder ?? 0}
                        </span>
                      </td>

                      {/* ชื่อหมวดหมู่ */}
                      <td className="py-4 px-4 font-bold text-base text-slate-100">
                        <div className="flex items-center gap-2.5">
                          {isChild && (
                            <span className="text-slate-500 pl-2">↳</span>
                          )}
                          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border-2 border-cyan-800 flex items-center justify-center text-cyan-300 shrink-0">
                            <Icons.Boxes className="w-4 h-4" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </td>

                      {/* หมวดหมู่หลัก */}
                      <td className="py-4 px-4 text-slate-300">
                        {parentName ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium">
                            <Icons.Package className="w-4 h-4 text-cyan-400" />
                            {parentName}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm font-medium">หมวดหมู่หลัก</span>
                        )}
                      </td>

                      {/* คำอธิบาย */}
                      <td className="py-4 px-4 text-slate-300 max-w-xs truncate text-sm">
                        {cat.description || <span className="text-slate-500">-</span>}
                      </td>

                      {/* สถานะ */}
                      <td className="py-4 px-4 text-center">
                        <Badge variant={cat.isActive !== false ? 'success' : 'neutral'}>
                          {cat.isActive !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Badge>
                      </td>

                      {/* จัดการ */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(cat)}
                            title="แก้ไขหมวดหมู่"
                            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-cyan-950 border-2 border-slate-700 hover:border-cyan-500 text-slate-200 hover:text-cyan-300 active:scale-95 transition-all cursor-pointer shadow-sm"
                            aria-label={`แก้ไข ${cat.name}`}
                          >
                            <Icons.Edit className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(cat)}
                            title="ลบหมวดหมู่"
                            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-950 border-2 border-slate-700 hover:border-rose-500 text-slate-200 hover:text-rose-400 active:scale-95 transition-all cursor-pointer shadow-sm"
                            aria-label={`ลบ ${cat.name}`}
                          >
                            <Icons.Trash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
