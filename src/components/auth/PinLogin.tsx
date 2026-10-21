'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthResponse, Branch } from '@/types/auth';
import { BranchSelector } from './BranchSelector';
import { VirtualNumpad } from './VirtualNumpad';

interface PinLoginProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branch: Branch) => void;
  isLoadingBranches?: boolean;
  onRetryBranches?: () => void;
  onSuccess: (auth: AuthResponse) => void;
  onError: (errorMessage: string) => void;
  isLockedOut?: boolean;
}

export function PinLogin({
  branches,
  selectedBranchId,
  onSelectBranch,
  isLoadingBranches = false,
  onRetryBranches,
  onSuccess,
  onError,
  isLockedOut = false,
}: PinLoginProps) {
  const { loginWithPin } = useAuth();
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const MAX_PIN_LENGTH = 8;
  const MIN_PIN_LENGTH = 4;

  const submitPin = useCallback(
    async (pinToSubmit: string) => {
      if (isLockedOut || isSubmitting) return;

      if (!selectedBranchId) {
        setValidationError('กรุณาเลือกสาขาที่ปฏิบัติงานก่อนเข้าสู่ระบบ');
        return;
      }

      if (pinToSubmit.length < MIN_PIN_LENGTH) {
        setValidationError(`กรุณาระบุรหัส PIN อย่างน้อย ${MIN_PIN_LENGTH} หลัก`);
        return;
      }

      setIsSubmitting(true);
      setValidationError(null);

      const activeBranch =
        branches.find((b) => b.id === selectedBranchId) || null;

      try {
        const auth = await loginWithPin(
          {
            branchId: selectedBranchId,
            pin: pinToSubmit,
          },
          activeBranch
        );
        onSuccess(auth);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'รหัส PIN ไม่ถูกต้อง';
        onError(message);
        setPin(''); // ล้าง PIN เมื่อใส่ผิดเพื่อให้ป้อนใหม่ได้ทันที
      } finally {
        setIsSubmitting(false);
      }
    },
    [isLockedOut, isSubmitting, selectedBranchId, branches, loginWithPin, onSuccess, onError]
  );

  const handleDigit = (digit: string) => {
    if (isLockedOut || isSubmitting) return;
    if (pin.length < MAX_PIN_LENGTH) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setValidationError(null);

      // เมื่อป้อนครบ 6 หลัก ให้ส่งข้อมูลอัตโนมัติจาก Event Handler โดยตรง
      if (nextPin.length === 6 && selectedBranchId) {
        submitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isLockedOut || isSubmitting) return;
    setPin((prev) => prev.slice(0, -1));
    setValidationError(null);
  };

  const handleClear = () => {
    if (isLockedOut || isSubmitting) return;
    setPin('');
    setValidationError(null);
  };

  const handleManualSubmit = () => {
    submitPin(pin);
  };

  return (
    <div className="space-y-5">
      {/* ส่วนเลือกสาขา */}
      <BranchSelector
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={(branch) => {
          onSelectBranch(branch);
          setValidationError(null);
        }}
        isLoading={isLoadingBranches}
        onRetry={onRetryBranches}
        disabled={isSubmitting || isLockedOut}
      />

      {/* ส่วนแสดงรหัส PIN (Masked Dots) */}
      <div className="py-2 flex flex-col items-center">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
          ป้อนรหัส PIN แคชเชียร์ (4-8 หลัก)
        </label>
        <div className="flex items-center justify-center space-x-3 h-12">
          {Array.from({ length: 6 }).map((_, index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-blue-600 scale-110 shadow-sm shadow-blue-500/50'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            );
          })}
        </div>
        {pin.length > 6 && (
          <p className="text-xs text-slate-400 mt-1">
            ระบุแล้ว {pin.length} หลัก
          </p>
        )}
        {validationError && (
          <p className="mt-2 text-xs text-red-500 text-center font-medium">
            {validationError}
          </p>
        )}
      </div>

      {/* แผงแป้นตัวเลขเสมือน (Virtual Numpad) */}
      <VirtualNumpad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        onClear={handleClear}
        onSubmit={handleManualSubmit}
        disabled={isSubmitting || isLockedOut}
      />

      {/* ปุ่มยืนยันเข้าสู่ระบบ */}
      <button
        type="button"
        onClick={handleManualSubmit}
        disabled={isSubmitting || isLockedOut || pin.length < MIN_PIN_LENGTH}
        className="w-full py-3 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>กำลังยืนยัน PIN...</span>
          </>
        ) : (
          <span>เข้าสู่ระบบแคชเชียร์</span>
        )}
      </button>
    </div>
  );
}
