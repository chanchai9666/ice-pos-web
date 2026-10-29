'use client';

/**
 * ฟอร์มเพิ่ม/แก้ไขข้อมูลลูกค้า (CustomerFormModal)
 * โครงการ ice-pos-web
 */

import React, { useState, useEffect } from 'react';
import { CustomerSummary, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/customer';
import { customerService } from '@/services/customer.service';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';
import { bahtToSatang, formatSatangToBaht } from '@/utils/currency';

interface CustomerFormModalProps {
  isOpen: boolean;
  customer: CustomerSummary | null; // null คือสร้างใหม่, มีค่าคือแก้ไข
  branchId?: string;
  onClose: () => void;
  onSuccess: (saved: CustomerSummary) => void;
}

export function CustomerFormModal({
  isOpen,
  customer,
  branchId,
  onClose,
  onSuccess,
}: CustomerFormModalProps) {
  const isEdit = !!customer;
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [creditLimitBaht, setCreditLimitBaht] = useState<string>('0');
  const [isMember, setIsMember] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setCreditLimitBaht(formatSatangToBaht(customer.creditLimit));
      setIsMember(customer.isMember !== false);
      setIsActive(customer.isActive !== false);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCreditLimitBaht('0');
      setIsMember(true);
      setIsActive(true);
    }
    setErrorMessage('');
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อลูกค้าหรือชื่อร้านค้า');
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && customer) {
        const updateData: UpdateCustomerRequest = {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          isMember,
          isActive,
        };
        const res = await customerService.updateCustomer(customer.id, updateData);
        if (res.data) {
          playSuccessBeep();
          onSuccess(res.data);
          onClose();
        }
      } else {
        const creditSatang = bahtToSatang(creditLimitBaht);
        const createData: CreateCustomerRequest = {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          branchId,
          isMember,
          creditLimit: creditSatang,
          initialCreditLimit: creditSatang,
        };
        const res = await customerService.createCustomer(createData);
        if (res.data) {
          playSuccessBeep();
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setErrorMessage(msg);
      playErrorBuzzer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Icons.User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {isEdit ? 'แก้ไขข้อมูลลูกค้า' : 'ลงทะเบียนลูกค้าใหม่'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit ? 'ปรับปรุงข้อมูลการติดต่อและสถานะ' : 'สร้างโปรไฟล์ลูกค้าและกำหนดวงเงินเครดิต'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">
              ชื่อลูกค้า / ชื่อร้านค้า <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ร้านอาหารริมน้ำ (คุณสมชาย)"
              className="w-full h-12 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
                className="w-full h-12 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full h-12 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                วงเงินเครดิตเริ่มต้น (บาท)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={creditLimitBaht}
                  onChange={(e) => setCreditLimitBaht(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm font-bold text-cyan-400 focus:outline-none"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">
                  ฿
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">วงเงินสำหรับให้ลูกค้าติดค้างชำระได้ (0 = ไม่ให้ติดเงินเชื่อ)</p>
            </div>
          )}

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={isMember}
                onChange={(e) => setIsMember(e.target.checked)}
                className="w-5 h-5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span>สมาชิกร้านค้า (Member)</span>
            </label>

            {isEdit && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span>สถานะเปิดใช้งาน (Active)</span>
              </label>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
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

