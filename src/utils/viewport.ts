/**
 * ฟังก์ชันและตัวช่วยจัดการขนาดหน้าจอและ Safe Area สำหรับอุปกรณ์พกพา
 * โครงการ ice-pos-web
 */

import { useState, useEffect } from 'react';

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * ค่า Breakpoint สำหรับแยกหน้าจอ Desktop ออกจากหน้าจอขนาดสัมผัส/พกพา (Mobile & Tablet)
 * สอดคล้องกับ Tailwind `lg` (1024px)
 */
export const DESKTOP_BREAKPOINT = BREAKPOINTS.LG;

/**
 * ตรวจสอบว่าหน้าจอปัจจุบันเป็นขนาดมือถือหรือแท็บเล็ตหรือไม่ (< 1024px)
 */
export function isMobileOrTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < DESKTOP_BREAKPOINT;
}

/**
 * Custom hook สำหรับตรวจจับว่าหน้าจอปัจจุบันเป็นอุปกรณ์พกพา (< 1024px) แบบ Real-time
 */
export function useIsMobile(breakpoint: number = DESKTOP_BREAKPOINT): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // ตรวจสอบทันทีหลัง mount
    checkIsMobile();

    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  return isMobile;
}
