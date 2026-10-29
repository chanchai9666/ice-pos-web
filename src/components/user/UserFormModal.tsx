'use client';

/**
 * ฟอร์มเพิ่ม/แก้ไขพนักงาน (UserFormModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: POST /users, PUT /users/{id}
 */

import React, { useState, useEffect } from 'react';
import { UserResponse, CreateUserRequest, UpdateUserRequest, UserRole } from '@/types/user';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { Branch } from '@/types/auth';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';

interface UserFormModalProps {
  isOpen: boolean;
  user: UserResponse | null; // null คือสร้างใหม่, มีค่าคือแก้ไข
  onClose: () => void;
  onSuccess: () => void;
}

export function UserFormModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const isEdit = !!user;
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [branchId, setBranchId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      authService.getBranches().then(setBranches).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setPassword('');
      setPin('');
      setRole((user.role as UserRole) || 'CASHIER');
      setBranchId(user.branchId || '');
      setIsActive(user.isActive !== false);
    } else {
      setName('');
      setUsername('');
      setPassword('');
      setPin('');
      setRole('CASHIER');
      setBranchId('');
      setIsActive(true);
    }
    setErrorMessage('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุลพนักงาน');
      playErrorBuzzer();
      return;
    }

    if (!isEdit) {
      if (!username.trim() || username.length < 3) {
        setErrorMessage('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
        playErrorBuzzer();
        return;
      }
      if (!password || password.length < 8) {
        setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
        playErrorBuzzer();
        return;
      }
      if (pin && (pin.length < 4 || pin.length > 6)) {
        setErrorMessage('PIN สำหรับล็อกอินด่วนต้องเป็นตัวเลข 4-6 หลัก');
        playErrorBuzzer();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isEdit && user) {
        const updateData: UpdateUserRequest = {
          name: name.trim(),
          role,
          branchId: branchId || undefined,
          isActive,
        };
        await userService.updateUser(user.id, updateData);
      } else {
        const createData: CreateUserRequest = {
          name: name.trim(),
          username: username.trim(),
          password,
          role,
          branchId: branchId || undefined,
          pin: pin.trim() || undefined,
        };
        await userService.createUser(createData);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Icons.UserCog className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'สร้างบัญชีพนักงานใหม่'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit ? `พนักงาน: ${user?.username}` : 'กำหนดสิทธิ์การใช้งาน สาขา และรหัสผ่าน'}
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
              ชื่อ-นามสกุล <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น สมชาย ใจดี"
              className="w-full h-11 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>

          {!isEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                  ชื่อผู้ใช้ (Username) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น cashier_somchai"
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                  รหัสผ่านเริ่มต้น <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ขั้นต่ำ 8 ตัวอักษร"
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                บทบาทสิทธิ์การใช้งาน <span className="text-rose-400">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value="CASHIER">แคชเชียร์ (CASHIER)</option>
                <option value="MANAGER">ผู้จัดการร้าน (MANAGER)</option>
                <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                สาขาประจำ
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value="">ทุกสาขา / สำนักงานใหญ่</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">
                PIN ล็อกอินด่วนแคชเชียร์ (4-6 หลัก ถ้ามี)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="เช่น 1234"
                className="w-full h-11 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none font-mono tracking-widest"
              />
            </div>
          )}

          {isEdit && (
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span>สถานะเปิดใช้งานบัญชี (Active)</span>
              </label>
            </div>
          )}

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

