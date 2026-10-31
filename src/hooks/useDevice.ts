'use client';

/**
 * useDevice - Deep Module สำหรับตรวจจับประเภทอุปกรณ์และคุณลักษณะของ Viewport
 * โครงการ ice-pos-web
 *
 * ซ่อนความซับซ้อนของการตรวจจับ Breakpoint, Pointer Capability, Orientation,
 * และการป้องกัน Hydration Mismatch ไว้หลัง Interface เรียบง่ายเพียงตัวเดียว
 */

import { useSyncExternalStore } from 'react';
import { BREAKPOINTS } from '@/utils/viewport';

export type DeviceProfile =
  | 'phone'            // หน้าจอมือถือ (< 768px)
  | 'tablet-portrait'  // แท็บเล็ตแนวตั้ง (768px - 1023px)
  | 'tablet-landscape' // แท็บเล็ตแนวนอน (1024px - 1279px)
  | 'desktop';         // เดสก์ท็อปและ All-in-one POS (>= 1280px)

export type Orientation = 'portrait' | 'landscape';

export interface DeviceInfo {
  profile: DeviceProfile;
  /** หน้าจอมือถือขนาดเล็ก (< 768px) */
  isPhone: boolean;
  /** แท็บเล็ตทั้งแนวตั้งและแนวนอน (768px - 1279px) */
  isTablet: boolean;
  /** แท็บเล็ตแนวตั้ง (768px - 1023px) */
  isTabletPortrait: boolean;
  /** แท็บเล็ตแนวนอน (1024px - 1279px) */
  isTabletLandscape: boolean;
  /** จอเดสก์ท็อปหรือ POS จอใหญ่ (>= 1280px) */
  isDesktop: boolean;
  /** อุปกรณ์หน้าจอขนาดพกพา (< 1024px) สำหรับพฤติกรรม Bottom Nav หรือ Drawer */
  isMobile: boolean;
  /** ตรวจจับว่าเป็นจอสัมผัส (Touchscreen / Coarse pointer) หรือไม่ */
  isTouch: boolean;
  /** ทิศทางหน้าจอ */
  orientation: Orientation;
  /** ขนาดหน้าจอปัจจุบัน */
  width: number;
  height: number;
  /** ยืนยันสถานะการ Mount ฝั่ง Client (ป้องกัน Hydration Mismatch) */
  isHydrated: boolean;
}

const DEFAULT_SERVER_DEVICE: DeviceInfo = {
  profile: 'desktop',
  isPhone: false,
  isTablet: false,
  isTabletPortrait: false,
  isTabletLandscape: false,
  isDesktop: true,
  isMobile: false,
  isTouch: false,
  orientation: 'landscape',
  width: 1280,
  height: 800,
  isHydrated: false,
};

let cachedSnapshot: DeviceInfo = DEFAULT_SERVER_DEVICE;

function getSnapshot(): DeviceInfo {
  if (typeof window === 'undefined') {
    return DEFAULT_SERVER_DEVICE;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const isLandscape = width >= height;
  const orientation: Orientation = isLandscape ? 'landscape' : 'portrait';

  let profile: DeviceProfile = 'desktop';
  if (width < BREAKPOINTS.MD) {
    profile = 'phone';
  } else if (width < BREAKPOINTS.LG) {
    profile = 'tablet-portrait';
  } else if (width < BREAKPOINTS.XL) {
    profile = 'tablet-landscape';
  } else {
    profile = 'desktop';
  }

  const isPhone = profile === 'phone';
  const isTabletPortrait = profile === 'tablet-portrait';
  const isTabletLandscape = profile === 'tablet-landscape';
  const isTablet = isTabletPortrait || isTabletLandscape;
  const isDesktop = profile === 'desktop';
  // isMobile นิยามสำหรับอุปกรณ์ที่กว้างน้อยกว่า 1024px (มือถือ + แท็บเล็ตแนวตั้ง)
  const isMobile = width < BREAKPOINTS.LG;

  // คืนค่าแคชเดิมเสมอ หากไม่มีค่าใดเปลี่ยนแปลง เพื่อป้องกัน Infinite Loop ใน useSyncExternalStore
  if (
    cachedSnapshot.width === width &&
    cachedSnapshot.height === height &&
    cachedSnapshot.isTouch === isTouch &&
    cachedSnapshot.profile === profile &&
    cachedSnapshot.orientation === orientation &&
    cachedSnapshot.isHydrated === true
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = {
    profile,
    isPhone,
    isTablet,
    isTabletPortrait,
    isTabletLandscape,
    isDesktop,
    isMobile,
    isTouch,
    orientation,
    width,
    height,
    isHydrated: true,
  };

  return cachedSnapshot;
}

function getServerSnapshot(): DeviceInfo {
  return DEFAULT_SERVER_DEVICE;
}

// Subscribe to window resize & orientation changes
function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let rafId: number | null = null;
  const handleResize = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      callback();
    });
  };

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}

/**
 * Hook สำหรับเข้าถึงข้อมูลอุปกรณ์และหน้าจอปัจจุบัน
 */
export function useDevice(): DeviceInfo {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}
