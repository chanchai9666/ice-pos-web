'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { AuthResponse, Branch, LoginMode } from '@/types/auth';
import {
  clearLockoutExpiry,
  getLastBranchId,
  getLastLoginMode,
  getLockoutExpiry,
  setLastBranchId,
  setLastLoginMode,
  setLockoutExpiry,
} from '@/utils/storage';
import { ModeSwitcher } from './ModeSwitcher';
import { PinLogin } from './PinLogin';
import { CredentialLogin } from './CredentialLogin';
import { CooldownTimer } from './CooldownTimer';

interface LoginFormProps {
  onSuccess: (auth: AuthResponse) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  // เริ่มต้นด้วยค่าเริ่มต้นที่สอดคล้องกับ SSR แล้วซิงค์จาก localStorage หลัง mount
  const [mode, setMode] = useState<LoginMode>('pin');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // ฟังก์ชันดึงรายชื่อสาขา
  const fetchBranches = useCallback(async () => {
    setIsLoadingBranches(true);
    setBranchesError(null);
    try {
      const list = await authService.getBranches();
      setBranches(list);

      const savedBranchId = getLastBranchId();
      if (savedBranchId && list.some((b) => b.id === savedBranchId)) {
        setSelectedBranchId(savedBranchId);
      } else if (list.length === 1) {
        setSelectedBranchId(list[0].id);
        setLastBranchId(list[0].id);
      } else if (list.length > 0) {
        setSelectedBranchId(list[0].id);
      }
    } catch {
      setBranchesError('ไม่สามารถดึงข้อมูลสาขาได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    // ซิงค์การตั้งค่าโหมดล็อกอินและคูลดาวน์จาก Client Storage หลัง Mount
    try {
      const savedMode = getLastLoginMode();
      if (savedMode && active) {
        setMode(savedMode);
      }

      const lockoutUntil = getLockoutExpiry();
      if (lockoutUntil && active) {
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        if (remaining > 0) {
          setCooldownRemaining(remaining);
        }
      }
    } catch {
      // ละเว้นข้อผิดพลาดจาก Storage
    }

    async function loadData() {
      try {
        const list = await authService.getBranches();
        if (!active) return;
        setBranches(list);

        const savedBranchId = getLastBranchId();
        if (savedBranchId && list.some((b) => b.id === savedBranchId)) {
          setSelectedBranchId(savedBranchId);
        } else if (list.length === 1) {
          setSelectedBranchId(list[0].id);
          setLastBranchId(list[0].id);
        } else if (list.length > 0) {
          setSelectedBranchId(list[0].id);
        }
      } catch {
        if (!active) return;
        setBranchesError('ไม่สามารถดึงข้อมูลสาขาได้ กรุณาตรวจสอบการเชื่อมต่อ');
      } finally {
        if (active) {
          setIsLoadingBranches(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // ระบบนับเวลาถอยหลัง Cooldown (Lockout Timer)
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearLockoutExpiry();
          setFailedAttempts(0);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleModeChange = (newMode: LoginMode) => {
    setMode(newMode);
    setLastLoginMode(newMode);
    setErrorMessage(null);
  };

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranchId(branch.id);
    setLastBranchId(branch.id);
  };

  const handleLoginError = (msg: string) => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    // หากป้อนผิดครบ 5 ครั้ง ให้เริ่ม Cooldown 60 วินาที
    if (newAttempts >= 5) {
      setLockoutExpiry(60);
      setCooldownRemaining(60);
      setErrorMessage(
        'ป้อนข้อมูลไม่ถูกต้องติดต่อกันครบ 5 ครั้ง ระบบระงับการลองชั่วคราว กรุณารอเวลาที่กำหนด'
      );
    } else {
      setErrorMessage(`${msg} (ลองผิดไปแล้ว ${newAttempts}/5 ครั้ง)`);
    }
  };

  const handleLoginSuccess = (auth: AuthResponse) => {
    // ล้างค่าสถานะข้อผิดพลาดเมื่อเข้าสู่ระบบสำเร็จ
    setFailedAttempts(0);
    clearLockoutExpiry();
    onSuccess(auth);
  };

  const isLockedOut = cooldownRemaining > 0;

  return (
    <div>
      {/* แถบสลับโหมด */}
      <ModeSwitcher
        activeMode={mode}
        onChangeMode={handleModeChange}
        disabled={isLockedOut}
      />

      {/* แจ้งเตือนสถานะ Cooldown */}
      <CooldownTimer secondsRemaining={cooldownRemaining} />

      {/* แจ้งเตือนข้อผิดพลาดทั่วไป */}
      {errorMessage && !isLockedOut && (
        <div className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-sm flex items-start space-x-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 flex-shrink-0 mt-0.5"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ฟอร์มตามโหมดที่เลือก */}
      {mode === 'pin' ? (
        <PinLogin
          branches={branches}
          selectedBranchId={selectedBranchId}
          onSelectBranch={handleSelectBranch}
          isLoadingBranches={isLoadingBranches}
          onRetryBranches={fetchBranches}
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          isLockedOut={isLockedOut}
        />
      ) : (
        <CredentialLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
          isLockedOut={isLockedOut}
        />
      )}

      {branchesError && !errorMessage && (
        <p className="text-xs text-amber-500 text-center mt-3">
          {branchesError}
        </p>
      )}
    </div>
  );
}
