'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Category } from '@/types/catalog';
import { catalogService } from '@/services/catalog.service';
import { Icons } from '@/components/ui/Icons';

export interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  parentOptions: Category[];
  onSuccess: (savedCategory: Category, isNew: boolean) => void;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  parentOptions,
  onSuccess,
}: CategoryFormModalProps) {
  const isEditing = !!category;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const lastSubmitTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setParentId(category.parentId || '');
      setSortOrder(String(category.sortOrder ?? 0));
      setIsActive(category.isActive !== undefined ? category.isActive : true);
    } else {
      setName('');
      setDescription('');
      setParentId('');
      setSortOrder('0');
      setIsActive(true);
    }
    setFormErrors({});
  }, [isOpen, category]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'กรุณาระบุชื่อหมวดหมู่';
    if (name.trim().length < 2) errors.name = 'ชื่อหมวดหมู่ต้องมีความยาวอย่างน้อย 2 ตัวอักษร';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    // ป้องกัน Rapid touch / Double-tap
    if (isSubmitting || now - lastSubmitTimeRef.current < 800) {
      return;
    }
    lastSubmitTimeRef.current = now;

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        parentId: parentId || null,
        sortOrder: parseInt(sortOrder, 10) || 0,
        isActive,
      };

      let savedCategory: Category;

      if (isEditing && category?.id) {
        const res = await catalogService.updateCategory(category.id, payload);
        savedCategory = res.data;
        onSuccess(savedCategory, false);
      } else {
        const res = await catalogService.createCategory(payload);
        savedCategory = res.data;
        onSuccess(savedCategory, true);
      }

      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'เกิดข้อผิดพลาดในการบันทึกหมวดหมู่');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // กรองไม่ให้เลือกตัวเองเป็น parent ตอนแก้ไข
  const eligibleParents = parentOptions.filter((c) => !category || c.id !== category.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100 z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
            <Icons.Boxes className="w-7 h-7 text-cyan-400" />
            {isEditing ? 'แก้ไขหมวดหมู่สินค้า' : 'สร้างหมวดหมู่สินค้าใหม่'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-5">
          {/* ชื่อหมวดหมู่ */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-slate-200">
              ชื่อหมวดหมู่ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น น้ำแข็งหลอด, น้ำดื่ม, เครื่องดื่ม"
              className="w-full h-[50px] px-4 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all"
            />
            {formErrors.name && (
              <span className="text-sm font-semibold text-rose-400">{formErrors.name}</span>
            )}
          </div>

          {/* หมวดหมู่หลัก (Hierarchy) */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-slate-200">
              หมวดหมู่หลัก (ถ้าเป็นหมวดหมู่ย่อย)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-[50px] px-4 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 outline-none cursor-pointer"
            >
              <option value="">-- เป็นหมวดหมู่หลัก (ไม่มีหมวดหมู่แม่) --</option>
              {eligibleParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* ลำดับจัดเรียง */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-slate-200">
              ลำดับการแสดงผล (Sort Order)
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full h-[50px] px-4 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 outline-none"
            />
            <p className="text-sm text-slate-400 font-medium">
              ค่าน้อยจะแสดงก่อนในเมนูและหน้าจอขายหน้าร้าน (เช่น 1, 2, 3...)
            </p>
          </div>

          {/* คำอธิบาย */}
          <div className="space-y-2">
            <label className="block text-base font-bold text-slate-200">
              คำอธิบายหมวดหมู่
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุคำอธิบายสั้นๆ..."
              className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-base text-slate-100 focus:border-cyan-400 outline-none resize-none"
            />
          </div>

          {/* สถานะเปิดใช้งาน */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none min-h-[48px]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-6 h-6 rounded-md bg-slate-950 border-2 border-slate-600 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
              <span className="text-base font-bold text-slate-100">เปิดใช้งานหมวดหมู่นี้ทันที</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-5 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-base font-bold border-2 border-slate-700 transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[48px] flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-bold text-base shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-5 h-5 stroke-[2.5]" />
                  <span>{isEditing ? 'บันทึกการแก้ไข' : 'สร้างหมวดหมู่'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

