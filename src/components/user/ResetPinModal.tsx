'use client';

/**
 * หน้าต่างรีเซ็ต PIN แคชเชียร์ (ResetPinModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: POST /users/{id}/reset-pin
 */

import React, { useState } from 'react';
import { UserResponse } from '@/types/user';
import { userService } from '@/services/user.service';
import { Icons } from '@/components/ui/Icons';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';

interface ResetPinModalProps {
  isOpen: boolean;
  user: UserResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPinModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: ResetPinModalProps) {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (pin.length < 4 || pin.length > 6) {
      setErrorMessage('PIN ต้องเป็นตัวเลข 4 ถึง 6 หลัก');
      playErrorBuzzer();
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage('PIN ยืนยันไม่ตรงกัน');
      playErrorBuzzer();
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.resetPin(user.id, pin);
      playSuccessBeep();
      onSuccess();
      onClose();
      setPin('');
      setConfirmPin('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถรีเซ็ต PIN ได้';
      setErrorMessage(msg);
      playErrorBuzzer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Icons.Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">รีเซ็ต PIN แคชเชียร์</h3>
              <p className="text-xs text-slate-400">พนักงาน: {user.name} ({user.username})</p>
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
              PIN ใหม่ (ตัวเลข 4-6 หลัก) <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full h-12 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-center text-xl font-bold text-cyan-400 tracking-widest focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">
              ยืนยัน PIN ใหม่ <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full h-12 px-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-center text-xl font-bold text-cyan-400 tracking-widest focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
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
              disabled={isSubmitting || pin.length < 4}
              className="flex-1 min-h-[48px] rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icons.Loader className="w-4 h-4 animate-spin" />
                  <span>กำลังรีเซ็ต...</span>
                </>
              ) : (
                <>
                  <Icons.Check className="w-4 h-4 stroke-[2.5]" />
                  <span>ยืนยัน PIN ใหม่</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

