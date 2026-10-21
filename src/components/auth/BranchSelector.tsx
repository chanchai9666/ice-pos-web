'use client';

import React from 'react';
import { Branch } from '@/types/auth';

interface BranchSelectorProps {
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branch: Branch) => void;
  isLoading?: boolean;
  onRetry?: () => void;
  disabled?: boolean;
  error?: string | null;
}

export function BranchSelector({
  branches,
  selectedBranchId,
  onSelectBranch,
  isLoading = false,
  onRetry,
  disabled = false,
  error,
}: BranchSelectorProps) {
  if (isLoading) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
          สาขาที่ปฏิบัติงาน
        </label>
        <div className="h-11 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-sm flex items-center justify-between">
        <span>ไม่สามารถโหลดรายชื่อสาขาได้</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 rounded-lg hover:bg-amber-200 font-medium"
          >
            ลองใหม่
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <label
        htmlFor="branch-select"
        className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
      >
        สาขาที่ปฏิบัติงาน (Branch)
      </label>
      <div className="relative">
        <select
          id="branch-select"
          disabled={disabled || branches.length === 0}
          value={selectedBranchId}
          onChange={(e) => {
            const found = branches.find((b) => b.id === e.target.value);
            if (found) {
              onSelectBranch(found);
            }
          }}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-600 transition-all appearance-none pr-10"
        >
          {branches.length === 0 ? (
            <option value="">ไม่มีข้อมูลสาขา</option>
          ) : (
            branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.code ? `(${b.code})` : ''}
              </option>
            ))
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
