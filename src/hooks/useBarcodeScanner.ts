'use client';

/**
 * Custom Hook สำหรับดักจับสัญญาณจากเครื่องสแกนเนอร์บาร์โค้ดฮาร์ดแวร์ (Hardware Barcode Scanner)
 * โครงการ ice-pos-web
 *
 * ดักจับระดับ window keydown ทั่วทั้งหน้าจอ พร้อมระบบถอดรหัสแป้นพิมพ์ไทยอัตโนมัติ
 */

import { useEffect, useRef } from 'react';
import { cleanBarcode, isValidBarcodeString } from '@/utils/barcode';

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minBarcodeLength?: number;
  maxKeystrokeIntervalMs?: number; // ระยะห่างสูงสุดระหว่างตัวอักษรของเครื่องสแกน (ปกติ <50ms)
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minBarcodeLength = 3,
  maxKeystrokeIntervalMs = 100,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ไม่ดักจับปุ่มฟังก์ชันพิเศษ เช่น Ctrl, Alt, Meta, Tab, Escape
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // ตรวจจับปุ่ม Enter ซึ่งเป็นปุ่มปิดท้ายของเครื่องสแกนเนอร์บาร์โค้ด
      if (e.key === 'Enter') {
        const rawBuffer = bufferRef.current;
        bufferRef.current = '';

        if (rawBuffer.length >= minBarcodeLength) {
          const decoded = cleanBarcode(rawBuffer);
          if (isValidBarcodeString(decoded)) {
            // ป้องกันการ Submit Form โดยไม่ตั้งใจ
            e.preventDefault();
            e.stopPropagation();
            onScan(decoded);
          }
        }
        return;
      }

      // หากคีย์บอร์ดพิมพ์ช้าเกินไป (มนุษย์พิมพ์เองทั่วไป > 120-150ms) ให้เคลียร์ Buffer เก่าทิ้ง
      if (timeDiff > maxKeystrokeIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // สะสมตัวอักษรลง Buffer (เฉพาะตัวอักษรความยาว 1)
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minBarcodeLength, maxKeystrokeIntervalMs, onScan]);
}
