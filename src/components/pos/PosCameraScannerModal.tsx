'use client';

/**
 * หน้าต่าง Modal สแกนบาร์โค้ดด้วยกล้องของอุปกรณ์ (PosCameraScannerModal)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (กรอบเล็งชัดเจน, โหมดสแกนต่อเนื่อง, ปุ่มสลับกล้อง และปุ่มเสร็จสิ้นขนาดใหญ่)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icons } from '@/components/ui/Icons';
import { cleanBarcode } from '@/utils/barcode';

interface PosCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function PosCameraScannerModal({
  isOpen,
  onClose,
  onScan,
}: PosCameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<Record<string, number>>({});

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastDetectedCode, setLastDetectedCode] = useState<string>('');
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');

  // เริ่มต้นเปิดกล้องวิดีโอ
  const startCamera = useCallback(async () => {
    setHasPermissionError(false);
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setErrorMessage('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง');
      return;
    }

    // ปิด Stream เดิมก่อน
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setHasPermissionError(true);
      const errObj = err as { name?: string; message?: string };
      if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
        setErrorMessage('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง กรุณาให้สิทธิ์กล้องในเบราว์เซอร์');
      } else if (errObj.name === 'NotFoundError' || errObj.name === 'DevicesNotFoundError') {
        setErrorMessage('ไม่พบอุปกรณ์กล้องบนเครื่องนี้');
      } else {
        setErrorMessage('ไม่สามารถเปิดใช้งานกล้องได้ กรุณาตรวจสอบการเชื่อมต่อ');
      }
    }
  }, [facingMode]);

  // หยุดการทำงานของกล้อง
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // วงรอบตรวจจับบาร์โค้ดแบบเรียลไทม์
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();
    isScanningRef.current = true;

    // ตรวจสอบ BarcodeDetector Web API
    const BarcodeDetectorClass =
      typeof window !== 'undefined' && 'BarcodeDetector' in window
        ? (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
        : null;

    let detector: { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } | null = null;
    if (BarcodeDetectorClass) {
      try {
        detector = new BarcodeDetectorClass({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
        });
      } catch (e) {
        console.warn('Failed to initialize BarcodeDetector with custom formats:', e);
        try {
          detector = new BarcodeDetectorClass();
        } catch {}
      }
    }

    let animationFrameId: number;

    const detectLoop = async () => {
      if (!isScanningRef.current) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA && detector) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const rawCode = barcodes[0].rawValue;
            const cleaned = cleanBarcode(rawCode);

            if (cleaned) {
              const now = Date.now();
              const lastTime = lastScannedTimeRef.current[cleaned] || 0;

              // หน่วงเวลาไม่ให้สแกนรหัสเดิมซ้ำซ้อนภายใน 1.5 วินาที
              if (now - lastTime > 1500) {
                lastScannedTimeRef.current[cleaned] = now;
                setLastDetectedCode(cleaned);
                setScannedCount((c) => c + 1);
                onScan(cleaned);
              }
            }
          }
        } catch (e) {
          // ละเว้นข้อผิดพลาดขณะเฟรมวิดีโอยังไม่พร้อม
        }
      }

      animationFrameId = requestAnimationFrame(detectLoop);
    };

    if (detector) {
      animationFrameId = requestAnimationFrame(detectLoop);
    }

    return () => {
      isScanningRef.current = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, onScan]);

  if (!isOpen) return null;

  // สลับกล้องหน้า/หลัง
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // ส่งรหัสบาร์โค้ดแบบกรอกเอง (Fallback กรณีกล้องอ่านไม่ได้)
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setLastDetectedCode(manualCode.trim());
      setScannedCount((c) => c + 1);
      setManualCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* ส่วนหัวของ Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Icons.Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                สแกนบาร์โค้ดด้วยกล้อง
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30">
                  สแกนต่อเนื่อง
                </span>
              </h3>
              <p className="text-xs text-slate-400">นำบาร์โค้ดสินค้ามาส่องในกรอบเล็ง</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ปุ่มสลับกล้อง */}
            <button
              type="button"
              onClick={toggleFacingMode}
              title="สลับกล้องหน้า/หลัง"
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            >
              <Icons.Refresh className="w-4 h-4" />
            </button>

            {/* ปุ่มปิด */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* พื้นที่แสดงภาพสดจากกล้องและกรอบเล็ง */}
        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {hasPermissionError || !isSupported ? (
            <div className="p-6 text-center space-y-3 max-w-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Icons.AlertTriangle className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-rose-300">{errorMessage}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* กรอบเล็งสแกน (Aiming Viewfinder) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-64 h-40 sm:w-72 sm:h-44 rounded-2xl border-2 border-cyan-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                  {/* มุมทั้งสี่ของกรอบ */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                  {/* เส้นเลเซอร์สแกนจำลอง */}
                  <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] animate-pulse" />
                </div>
              </div>

              {/* สถานะสแกนล่าสุด */}
              {lastDetectedCode && (
                <div className="absolute bottom-3 inset-x-4 bg-slate-950/80 backdrop-blur-sm rounded-xl p-2.5 border border-cyan-500/40 text-center animate-fade-in">
                  <p className="text-xs text-slate-400">ตรวจพบล่าสุด:</p>
                  <p className="text-sm font-mono font-bold text-cyan-300 truncate">
                    {lastDetectedCode}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ส่วนด้านล่าง: ป้อนรหัสสำรอง & สรุปจำนวนสแกน & ปุ่มเสร็จสิ้น */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          {/* ฟอร์มป้อนรหัสบาร์โค้ดสำรอง */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="หรือพิมพ์รหัสบาร์โค้ดด้วยตนเอง..."
              className="flex-1 min-h-[48px] px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="min-h-[48px] px-5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              เพิ่ม
            </button>
          </form>

          {/* แถบสรุป & ปุ่มเสร็จสิ้น */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-400">
              สแกนสำเร็จในรอบนี้:{' '}
              <span className="text-cyan-400 font-bold text-sm">{scannedCount} ชิ้น</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              เสร็จสิ้น / ปิดกล้อง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
