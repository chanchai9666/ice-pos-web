'use client';

/**
 * usePwa - Deep Module สำหรับจัดการวงจรชีวิตของ PWA (Progressive Web App)
 * - ลงทะเบียน Service Worker (/sw.js)
 * - ตรวจจับสถานะออนไลน์/ออฟไลน์ (Online/Offline Status)
 * - ตรวจจับเวอร์ชันใหม่และจัดการอัปเดต (New Version Detection & Prompt)
 * - ตรวจจับโหมด Standalone (เปิดแบบแอปบนจอ)
 * โครงการ ice-pos-web
 */

import { useState, useEffect, useCallback } from 'react';

export interface PwaState {
  isOnline: boolean;
  isStandalone: boolean;
  isUpdateAvailable: boolean;
  updateApp: () => void;
}

export function usePwa(): PwaState {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // ตรวจสอบสถานะออนไลน์และโหมด Standalone
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // ตรวจสอบสถานะเครือข่ายปัจจุบัน
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ตรวจสอบว่าเปิดผ่านโหมด Standalone (PWA Installed) หรือไม่
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
    setIsStandalone(Boolean(isStandaloneMode));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ลงทะเบียน Service Worker และดักฟังการอัปเดต
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // ในโหมด Development: ห้ามลงทะเบียน Service Worker เด็ดขาดเพื่อป้องกันลูปรีเฟรชและปัญหากระทบ Next.js HMR
    // พร้อมยกเลิก Service Worker และแคชเดิมที่อาจค้างอยู่ใน Localhost ทันที
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // กรณีมี worker กำลังรออยู่แล้ว
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setIsUpdateAvailable(true);
        }

        // ดักฟัง worker ตัวใหม่ที่กำลังติดตั้ง
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setIsUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });

    // ดักฟังเมื่อ controller เปลี่ยน (หลังสั่ง skipWaiting จากการกดยืนยันอัปเดต)
    // สำคัญมาก: รีเฟรชเฉพาะเมื่อผู้ใช้เป็นผู้กดอัปเดตเท่านั้น ห้ามรีเฟรชตอน initial install เด็ดขาด
    const handleControllerChange = () => {
      try {
        const isUserUpdating = sessionStorage.getItem('ice_pos_pwa_updating') === '1';
        if (isUserUpdating) {
          sessionStorage.removeItem('ice_pos_pwa_updating');
          window.location.reload();
        }
      } catch {
        // จัดการกรณีไม่สามารถเข้าถึง sessionStorage ได้
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // ฟังก์ชันสั่งอัปเดตทันทีเมื่อแคชเชียร์กดยืนยัน
  const updateApp = useCallback(() => {
    try {
      sessionStorage.setItem('ice_pos_pwa_updating', '1');
    } catch {
      // ignore
    }

    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  return {
    isOnline,
    isStandalone,
    isUpdateAvailable,
    updateApp,
  };
}
