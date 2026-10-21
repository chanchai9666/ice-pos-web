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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl backdrop-blur-xs">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Icons.Boxes className="w-5 h-5 text-cyan-400" />
            โครงสร้างหมวดหมู่สินค้า (Categories)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            จัดการจัดกลุ่มสินค้าและลำดับการแสดงผลในเมนูหน้าขายหน้าร้าน (POS)
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all cursor-pointer min-h-[44px]"
        >
          <Icons.Plus className="w-4 h-4" />
          <span>เพิ่มหมวดหมู่ใหม่</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
            <Icons.RotateCw className="w-7 h-7 text-cyan-400 animate-spin" />
            <p className="text-xs">กำลังโหลดข้อมูลหมวดหมู่สินค้า...</p>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3 border border-slate-700/60">
              <Icons.Boxes className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">ยังไม่มีหมวดหมู่สินค้าในระบบ</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              เริ่มต้นสร้างหมวดหมู่สินค้าเพื่อช่วยจัดระเบียบและค้นหาสินค้าในระบบขายหน้าร้านได้สะดวกรวดเร็วยิ่งขึ้น
            </p>
            <button
              type="button"
              onClick={onAddNew}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-medium border border-slate-700 transition-colors cursor-pointer min-h-[44px]"
            >
              <Icons.Plus className="w-4 h-4" />
              สร้างหมวดหมู่แรก
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-16 text-center">ลำดับ</th>
                  <th className="py-3 px-4">ชื่อหมวดหมู่</th>
                  <th className="py-3 px-4">หมวดหมู่หลัก (Parent)</th>
                  <th className="py-3 px-4">คำอธิบาย</th>
                  <th className="py-3 px-4 w-28 text-center">สถานะ</th>
                  <th className="py-3 px-4 w-32 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sortedCategories.map((cat) => {
                  const parentName = cat.parentId ? categoryMap.get(cat.parentId) : null;
                  const isChild = !!cat.parentId;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ลำดับจัดเรียง */}
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700">
                          {cat.sortOrder ?? 0}
                        </span>
                      </td>

                      {/* ชื่อหมวดหมู่ */}
                      <td className="py-3 px-4 font-medium text-slate-100">
                        <div className="flex items-center gap-2">
                          {isChild && (
                            <span className="text-slate-600 pl-2">↳</span>
                          )}
                          <div className="w-6 h-6 rounded-md bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
                            <Icons.Boxes className="w-3.5 h-3.5" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </td>

                      {/* หมวดหมู่หลัก */}
                      <td className="py-3 px-4 text-slate-400">
                        {parentName ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/70 border border-slate-700/60 text-slate-300 text-[11px]">
                            <Icons.Package className="w-3 h-3 text-cyan-400" />
                            {parentName}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">หมวดหมู่หลัก</span>
                        )}
                      </td>

                      {/* คำอธิบาย */}
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {cat.description || <span className="text-slate-600">-</span>}
                      </td>

                      {/* สถานะ */}
                      <td className="py-3 px-4 text-center">
                        <Badge variant={cat.isActive !== false ? 'success' : 'neutral'}>
                          {cat.isActive !== false ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </Badge>
                      </td>

                      {/* จัดการ */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(cat)}
                            title="แก้ไขหมวดหมู่"
                            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Icons.Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(cat)}
                            title="ลบหมวดหมู่"
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Icons.Trash className="w-4 h-4" />
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
