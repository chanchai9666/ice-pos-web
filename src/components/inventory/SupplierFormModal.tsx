'use client';

/**
 * ฟอร์มเพิ่ม/แก้ไขข้อมูลผู้จัดจำหน่ายและคู่ค้า (SupplierFormModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: POST /suppliers, PUT /suppliers/{id}
 */

import React, { useState, useEffect } from 'react';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from '@/types/procurement';
import { procurementService } from '@/services/procurement.service';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';

interface SupplierFormModalProps {
  isOpen: boolean;
  supplier: Supplier | null; // null คือสร้างใหม่, มีค่าคือแก้ไข
  onClose: () => void;
  onSuccess: () => void;
}

export function SupplierFormModal({
  isOpen,
  supplier,
  onClose,
  onSuccess,
}: SupplierFormModalProps) {
  const isEdit = !!supplier;
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [taxId, setTaxId] = useState<string>('');
  const [creditDays, setCreditDays] = useState<string>('30');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setCode(supplier.code || '');
      setContactName(supplier.contactName || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
      setTaxId(supplier.taxId || '');
      setCreditDays(supplier.creditDays !== undefined && supplier.creditDays !== null ? String(supplier.creditDays) : '30');
      setIsActive(supplier.isActive !== false);
    } else {
      setName('');
      setCode('');
      setContactName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTaxId('');
      setCreditDays('30');
      setIsActive(true);
    }
    setErrorMessage('');
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อบริษัทหรือผู้จัดจำหน่าย');
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedDays = parseInt(creditDays, 10);
      const days = isNaN(parsedDays) || parsedDays < 0 ? 0 : parsedDays;

      if (isEdit && supplier) {
        const updateData: UpdateSupplierRequest = {
          name: name.trim(),
          contactName: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          taxId: taxId.trim() || undefined,
          creditDays: days,
          isActive,
        };
        await procurementService.updateSupplier(supplier.id, updateData);
      } else {
        const createData: CreateSupplierRequest = {
          name: name.trim(),
          code: code.trim() || undefined,
          contactName: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          taxId: taxId.trim() || undefined,
          creditDays: days,
          isActive,
        };
        await procurementService.createSupplier(createData);
      }

      playSuccessBeep();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setErrorMessage(msg);
      playErrorBuzzer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/90 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Icons.Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {isEdit ? 'แก้ไขข้อมูลผู้จัดจำหน่าย' : 'เพิ่มผู้จัดจำหน่ายใหม่'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEdit ? `คู่ค้า: ${supplier?.name}` : 'บันทึกข้อมูลคู่ค้า ที่อยู่ และเครดิตเทอม'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อผู้จัดจำหน่าย / บริษัท <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น บริษัท น้ำแข็งไทย จำกัด"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                รหัสคู่ค้า
              </label>
              <input
                type="text"
                disabled={isEdit}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SUP-001"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none font-mono disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อผู้ติดต่อ
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="เช่น คุณสมชาย"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@supplier.com"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เลขประจำตัวผู้เสียภาษี
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="0105551234567"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                เครดิตเทอม (วัน)
              </label>
              <input
                type="number"
                min="0"
                max="365"
                value={creditDays}
                onChange={(e) => setCreditDays(e.target.value)}
                placeholder="30"
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-cyan-600 dark:text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span>เปิดใช้งาน (Active)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ที่อยู่
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ที่อยู่บริษัท / สถานที่ส่งสินค้า"
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none resize-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 dark:border-rose-500/40 rounded-xl text-xs text-rose-600 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-4 h-4 stroke-[2.5]" />
                  <span>บันทึกข้อมูล</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

