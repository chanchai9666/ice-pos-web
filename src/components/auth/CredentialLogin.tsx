'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthResponse } from '@/types/auth';

interface CredentialLoginProps {
  onSuccess: (auth: AuthResponse) => void;
  onError: (errorMessage: string) => void;
  isLockedOut?: boolean;
}

export function CredentialLogin({
  onSuccess,
  onError,
  isLockedOut = false,
}: CredentialLoginProps) {
  const { loginWithCredentials } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = 'กรุณาระบุชื่อผู้ใช้งาน';
    }
    if (!password) {
      errors.password = 'กรุณาระบุรหัสผ่าน';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut || isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const auth = await loginWithCredentials({
        username: username.trim(),
        password,
      });
      onSuccess(auth);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ';
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-2">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ช่องกรอกชื่อผู้ใช้งาน */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            ชื่อผู้ใช้งาน (Username)
          </label>
          <div className="relative">
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              disabled={isSubmitting || isLockedOut}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) {
                  setFieldErrors((prev) => ({ ...prev, username: undefined }));
                }
              }}
              placeholder="ระบุชื่อผู้ใช้งาน"
              className={`w-full px-4 py-3.5 min-h-[48px] text-base rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.username
                  ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900/50'
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-100 dark:focus:ring-blue-900/40'
              }`}
            />
          </div>
          {fieldErrors.username && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.username}</p>
          )}
        </div>

        {/* ช่องกรอกรหัสผ่าน */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5"
          >
            รหัสผ่าน (Password)
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isSubmitting || isLockedOut}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="ระบุรหัสผ่าน"
              className={`w-full px-4 py-3.5 pr-12 min-h-[48px] text-base rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.password
                  ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900/50'
                  : 'border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-100 dark:focus:ring-blue-900/40'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              disabled={isSubmitting || isLockedOut}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none min-w-[48px] justify-center"
              aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showPassword ? (
                // ไอคอนปิดตา (Eye Off)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                // ไอคอนเปิดตา (Eye)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{fieldErrors.password}</p>
          )}
        </div>

        {/* ปุ่มเข้าสู่ระบบ */}
        <button
          type="submit"
          disabled={isSubmitting || isLockedOut}
          className="w-full mt-4 py-3.5 px-4 min-h-[48px] rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 text-base"
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
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            <span>เข้าสู่ระบบ</span>
          )}
        </button>
      </form>
    </div>
  );
}
