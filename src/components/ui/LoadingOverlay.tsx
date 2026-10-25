'use client';

/**
 * Global Loading Overlay Component
 * บล็อกการปฏิสัมพันธ์ของหน้าจอขณะมี Action เรียกใช้งาน API
 * ออกแบบตามมาตรฐาน Elderly-Friendly และ High Contrast (WCAG 2.1 AA)
 * โครงการ ice-pos-web (ตามธรรมนูญ v1.5.1 ข้อ 6.6)
 */

import React from 'react';
import { useLoadingOverlay } from '@/context/LoadingOverlayContext';
import { Icons } from '@/components/ui/Icons';

export interface LoadingOverlayProps {
  /**
   * ข้อความสถานะที่ต้องการแสดงผล (หากไม่ระบุ จะดึงจาก Context)
   */
  message?: string;

  /**
   * บังคับควบคุมสถานะเปิด/ปิด (หากไม่ระบุ จะดึงจาก Context)
   */
  isOpen?: boolean;

  /**
   * คลาสตกแต่งเพิ่มเติม
   */
  className?: string;
}

export function LoadingOverlay({
  message: customMessage,
  isOpen: customIsOpen,
  className = '',
}: LoadingOverlayProps) {
  const context = useLoadingOverlay();

  const isVisible = customIsOpen !== undefined ? customIsOpen : context.isLoading;
  const displayMessage =
    customMessage || context.message || 'กำลังดำเนินการ กรุณารอสักครู่...';

  if (!isVisible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="กำลังดำเนินการ"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm pointer-events-auto select-none transition-opacity duration-200 ${className}`}
      onClick={(e) => {
        // บล็อกทุกคลิกไม่ให้ทะลุไปยังเบื้องหลัง
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        // บล็อกทุกการสัมผัสบนจอสัมผัส (Touchscreen)
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="bg-slate-900/95 border-2 border-cyan-500/50 p-8 sm:p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-5 max-w-sm sm:max-w-md w-full mx-4 text-center ring-4 ring-cyan-500/10 animate-in fade-in zoom-in-95 duration-150">
        {/* Animated Loading Spinner */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-pulse" />
          <Icons.Loader className="w-14 h-14 text-cyan-400 animate-spin" />
        </div>

        {/* Text Details (Elderly-Friendly & High Contrast) */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-50 tracking-wide">
            {displayMessage}
          </h3>
          <p className="text-sm sm:text-base text-slate-300 font-medium">
            ระบบกำลังประมวลผล กรุณาอย่าปิดหรือรีเฟรชหน้าจอ
          </p>
        </div>

        {/* Progress Bar Indicator */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-1">
          <div className="bg-cyan-400 h-full w-1/2 rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  );
}
