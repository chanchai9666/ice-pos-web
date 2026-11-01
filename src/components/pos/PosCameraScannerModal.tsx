'use client';

/**
 * หน้าต่าง Modal สแกนบาร์โค้ดด้วยกล้องของอุปกรณ์ (PosCameraScannerModal)
 * โครงการ ice-pos-web
 *
 * รองรับการทำงานข้ามแพลตฟอร์มอย่างสมบูรณ์ (iOS Safari, macOS Safari, Android Chrome, Desktop)
 * ด้วย Hybrid Barcode Decoder Engine (Native BarcodeDetector + @zxing/browser Fallback)
 * ออกแบบตามมาตรฐาน Elderly-Friendly:
 * - ตัวนับการ์ด 2 ช่องคู่กัน: สแกนสำเร็จ (เขียว) vs ไม่พบสินค้า (แดง)
 * - สัญญาณเสียง Beep (ความถี่สูง) vs Buzzer (ความถี่ต่ำ) ผ่าน Web Audio API
 * - แถบแสดงสถานะรหัส/ชื่อสินค้าที่สแกนล่าสุดขนาดใหญ่ คอนทราสต์สูง
 * - สแกนต่อเนื่อง (Continuous Scan) เมื่อไม่พบสินค้าโดยไม่ต้องปิดกล่องเตือน
 * - เป้าหมายสัมผัสขนาดใหญ่ (Touch Targets >= 48px)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
  ChecksumException,
  FormatException,
  ReaderException,
} from '@zxing/library';
import { Icons } from '@/components/ui/Icons';
import { cleanBarcode } from '@/utils/barcode';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audioFeedback';
import { BarcodeScanResult, ScanFeedbackResult } from '@/types/scanner';
import { formatSatangToBaht } from '@/utils/currency';

// ป้องกัน ZXing พ่น non-ReaderException warning ใน console ทุกเฟรมอันเนื่องจาก prototype inheritance ของคลัง
if (typeof window !== 'undefined') {
  try {
    Object.setPrototypeOf(NotFoundException.prototype, ReaderException.prototype);
    Object.setPrototypeOf(ChecksumException.prototype, ReaderException.prototype);
    Object.setPrototypeOf(FormatException.prototype, ReaderException.prototype);
  } catch {
    // ละเว้นในสภาพแวดล้อมที่ไม่รองรับ prototype manipulation
  }
}

interface PosCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => Promise<BarcodeScanResult> | void;
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
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // เก็บฟังก์ชัน onScan ล่าสุดไว้ใน Ref เพื่อป้องกันการ Re-run ของ Camera Lifecycle เมื่อ State หน้าหลักเปลี่ยนแปลง
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const isProcessingRef = useRef<boolean>(false);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');

  // ตัวนับรอบการสแกนและผลตอบรับล่าสุด
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [lastScanFeedback, setLastScanFeedback] = useState<ScanFeedbackResult | null>(null);
  const [activeEngine, setActiveEngine] = useState<string>('กำลังเตรียมระบบ...');

  // สถานะ visual feedback: แสงแฟลชรอบกรอบเล็งเมื่อตรวจพบบาร์โค้ด และจุดแตะเพื่อโฟกัส (Tap to focus)
  const [scanFlash, setScanFlash] = useState<'SUCCESS' | 'NOT_FOUND' | null>(null);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  // จัดการแตะที่หน้าจอเพื่อโฟกัส (Tap to focus)
  const handleVideoClick = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });

    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      try {
        const caps = (track.getCapabilities?.() || {}) as { focusMode?: string[] };
        if (caps.focusMode && caps.focusMode.includes('continuous')) {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' }],
          } as unknown as MediaTrackConstraints);
        }
      } catch {
        // อุปกรณ์บางรุ่นอาจไม่อนุญาตให้ตั้งค่า constraints เพิ่มเติม
      }
    }

    setTimeout(() => {
      setFocusPoint(null);
    }, 1200);
  }, []);

  // หยุดการทำงานของกล้องและตัวถอดรหัส
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;

    if (zxingControlsRef.current) {
      try {
        zxingControlsRef.current.stop();
      } catch (err) {
        console.warn('Error stopping ZXing controls:', err);
      }
      zxingControlsRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // ฟังก์ชันประมวลผลบาร์โค้ดที่ตรวจพบ (ทั้งจากกล้องและการป้อนรหัสด้วยมือ)
  const processBarcode = useCallback(
    async (rawCode: string) => {
      const cleaned = cleanBarcode(rawCode);
      if (!cleaned) return;

      const now = Date.now();
      const lastTime = lastScannedTimeRef.current[cleaned] || 0;

      // หน่วงเวลาไม่ให้สแกนรหัสเดิมซ้ำซ้อนภายใน 1.5 วินาที
      if (now - lastTime <= 1500) return;
      if (isProcessingRef.current) return;

      isProcessingRef.current = true;
      lastScannedTimeRef.current[cleaned] = now;

      try {
        const scanFn = onScanRef.current;
        const result = scanFn ? await scanFn(cleaned) : undefined;
        if (result && result.success) {
          // กรณีพบสินค้าในระบบ: เพิ่มตัวนับสำเร็จ ส่งเสียง Beep แฟลชกรอบสีเขียว และแสดงแถบสีเขียว
          setSuccessCount((prev) => prev + 1);
          setScanFlash('SUCCESS');
          setTimeout(() => setScanFlash(null), 600);
          setLastScanFeedback({
            status: 'SUCCESS',
            barcode: cleaned,
            productName: result.productName,
            price: result.price,
            timestamp: Date.now(),
          });
          playSuccessBeep();
        } else {
          // กรณีไม่พบสินค้าในระบบ: เพิ่มตัวนับไม่สำเร็จ ส่งเสียง Buzzer แฟลชกรอบสีแดง และแสดงแถบสีแดง (สแกนต่อทันที)
          setFailedCount((prev) => prev + 1);
          setScanFlash('NOT_FOUND');
          setTimeout(() => setScanFlash(null), 600);
          setLastScanFeedback({
            status: 'NOT_FOUND',
            barcode: cleaned,
            timestamp: Date.now(),
          });
          playErrorBuzzer();
        }
      } catch (err) {
        console.warn('onScan processing error:', err);
        setFailedCount((prev) => prev + 1);
        setScanFlash('NOT_FOUND');
        setTimeout(() => setScanFlash(null), 600);
        setLastScanFeedback({
          status: 'NOT_FOUND',
          barcode: cleaned,
          timestamp: Date.now(),
        });
        playErrorBuzzer();
      } finally {
        isProcessingRef.current = false;
      }
    },
    []
  );

  // เริ่มต้นเปิดกล้องวิดีโอ
  const startCamera = useCallback(async () => {
    setHasPermissionError(false);
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setErrorMessage('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง');
      return;
    }

    // ปิด Stream และ Loop เดิมก่อนเปิดใหม่
    stopCamera();

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

      // บังคับเปิด Continuous Autofocus หากเซนเซอร์กล้องของอุปกรณ์รองรับ
      const track = stream.getVideoTracks()[0];
      if (track) {
        try {
          const caps = (track.getCapabilities?.() || {}) as { focusMode?: string[] };
          if (caps.focusMode && caps.focusMode.includes('continuous')) {
            await track.applyConstraints({
              advanced: [{ focusMode: 'continuous' }],
            } as unknown as MediaTrackConstraints);
          }
        } catch {
          // ละเว้นหากอุปกรณ์ไม่เปิดให้ตั้งค่า constraint
        }
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
  }, [facingMode, stopCamera]);

  // จัดการรอบการเปิด/ปิด Modal: รีเซ็ตตัวนับและข้อมูลผลตอบรับเฉพาะเมื่อเปิด Modal รอบใหม่
  useEffect(() => {
    if (isOpen) {
      setSuccessCount(0);
      setFailedCount(0);
      setLastScanFeedback(null);
      lastScannedTimeRef.current = {};
      isProcessingRef.current = false;
    } else {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // วงรอบเริ่มการสแกนและจัดการ Hybrid Decoder Engine (ทำงานเฉพาะเมื่อเปิด Modal หรือสลับกล้องหน้า/หลัง)
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isSubscribed = true;

    const setupScanner = async () => {
      await startCamera();
      if (!isSubscribed) return;

      isScanningRef.current = true;

      // ตรวจสอบ Native BarcodeDetector API ก่อน
      const BarcodeDetectorClass =
        typeof window !== 'undefined' && 'BarcodeDetector' in window
          ? (window as unknown as { BarcodeDetector: new (opts?: { formats: string[] }) => { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
          : null;

      let nativeDetector: { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } | null = null;
      if (BarcodeDetectorClass) {
        try {
          nativeDetector = new BarcodeDetectorClass({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
          });
        } catch {
          try {
            nativeDetector = new BarcodeDetectorClass();
          } catch {}
        }
      }

      // 1. ถ้ามี Native BarcodeDetector ให้ใช้ Native Loop เพื่อประสิทธิภาพสูงสุด (Android / Chromium)
      if (nativeDetector) {
        setActiveEngine('Native BarcodeDetector');
        const detectLoop = async () => {
          if (!isScanningRef.current) return;

          const video = videoRef.current;
          if (video && video.readyState >= video.HAVE_CURRENT_DATA && nativeDetector) {
            try {
              const barcodes = await nativeDetector.detect(video);
              if (barcodes && barcodes.length > 0) {
                const rawCode = barcodes[0].rawValue;
                await processBarcode(rawCode);
              }
            } catch {
              // ละเว้นเฟรมที่ภาพยังไม่พร้อม
            }
          }

          if (isScanningRef.current) {
            animationFrameRef.current = requestAnimationFrame(detectLoop);
          }
        };

        animationFrameRef.current = requestAnimationFrame(detectLoop);
      } else {
        // 2. ถ้าไม่มี Native BarcodeDetector (เช่น Safari บน iOS/macOS, Firefox) ให้สลับไปใช้ ZXing Browser Decoder
        setActiveEngine('ZXing Engine (Cross-Browser)');
        try {
          const hints = new Map<DecodeHintType, unknown>();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.QR_CODE,
          ]);
          hints.set(DecodeHintType.TRY_HARDER, true);
          const zxingReader = new BrowserMultiFormatReader(hints, {
            delayBetweenScanAttempts: 100,
            delayBetweenScanSuccess: 200,
          });
          const videoElement = videoRef.current;
          if (videoElement) {
            const controls = await zxingReader.decodeFromVideoElement(
              videoElement,
              (result) => {
                if (!isScanningRef.current) return;
                if (result) {
                  const text = result.getText();
                  processBarcode(text);
                }
              }
            );
            if (isSubscribed) {
              zxingControlsRef.current = controls;
            } else {
              controls.stop();
            }
          }
        } catch (err) {
          console.warn('Failed to start ZXing reader:', err);
        }
      }
    };

    setupScanner();

    return () => {
      isSubscribed = false;
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera, processBarcode]);

  if (!isOpen) return null;

  // สลับกล้องหน้า/หลัง
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // ส่งรหัสบาร์โค้ดแบบกรอกเอง (Manual Input)
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    setManualCode('');
    await processBarcode(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* ส่วนหัวของ Modal */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Icons.Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                สแกนบาร์โค้ดด้วยกล้อง
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold border border-cyan-500/30">
                  สแกนต่อเนื่อง
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ส่องบาร์โค้ดในกรอบเล็ง หรือพิมพ์รหัสด้านล่าง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ปุ่มสลับกล้อง (ความสูงอย่างน้อย 48px สำหรับสัมผัสง่าย) */}
            <button
              type="button"
              onClick={toggleFacingMode}
              title="สลับกล้องหน้า/หลัง"
              className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Icons.Refresh className="w-5 h-5" />
            </button>

            {/* ปุ่มปิด (ความสูงอย่างน้อย 48px) */}
            <button
              type="button"
              onClick={onClose}
              className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ส่วนการ์ดสรุปตัวนับ 2 ช่องคู่กัน (สแกนสำเร็จ vs ไม่พบสินค้า) */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* กล่องสีเขียว: สแกนสำเร็จ */}
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Icons.Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">สแกนสำเร็จ</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                    {successCount}
                  </span>
                  <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">ชิ้น</span>
                </div>
              </div>
            </div>

            {/* กล่องสีแดง: ไม่พบสินค้า */}
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Icons.AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">ไม่พบสินค้า</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-rose-800 dark:text-rose-300 font-mono">
                    {failedCount}
                  </span>
                  <span className="text-xs text-rose-600/80 dark:text-rose-400/80">ครั้ง</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* พื้นที่แสดงภาพสดจากกล้องและกรอบเล็ง (รองรับการแตะหน้าจอเพื่อโฟกัส Tap-to-Focus) */}
        <div
          onClick={handleVideoClick}
          className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center shrink cursor-crosshair select-none"
        >
          {hasPermissionError || !isSupported ? (
            <div className="p-6 text-center space-y-3 max-w-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Icons.AlertTriangle className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-rose-300">{errorMessage}</p>
              <button
                type="button"
                onClick={startCamera}
                className="min-h-[48px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <>
              <style>{`
                @keyframes scanLaserSweep {
                  0% { top: 8%; opacity: 0.45; }
                  50% { top: 90%; opacity: 1; }
                  100% { top: 8%; opacity: 0.45; }
                }
                .animate-laser-sweep {
                  animation: scanLaserSweep 2s ease-in-out infinite;
                }
                @keyframes tapFocusPulse {
                  0% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.9; }
                  50% { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.4; }
                }
                .animate-tap-focus {
                  animation: tapFocusPulse 0.4s ease-out forwards;
                }
              `}</style>

              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* วงแหวนแตะเพื่อโฟกัส (Tap to focus ring) */}
              {focusPoint && (
                <div
                  className="absolute pointer-events-none z-30 animate-tap-focus"
                  style={{ left: `${focusPoint.x}px`, top: `${focusPoint.y}px` }}
                >
                  <div className="w-12 h-12 border-2 border-amber-300 rounded-lg shadow-[0_0_12px_rgba(251,191,36,0.7)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-300" />
                  </div>
                </div>
              )}

              {/* กรอบเล็งสแกน (Aiming Viewfinder) พร้อมแสงแฟลชเมื่อตรวจพบบาร์โค้ด */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div
                  className={`relative w-64 h-36 sm:w-72 sm:h-40 rounded-2xl border-2 transition-all duration-200 ${
                    scanFlash === 'SUCCESS'
                      ? 'border-emerald-400 ring-4 ring-emerald-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'
                      : scanFlash === 'NOT_FOUND'
                      ? 'border-rose-400 ring-4 ring-rose-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'
                      : 'border-cyan-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'
                  }`}
                >
                  {/* มุมทั้งสี่ของกรอบ */}
                  <div
                    className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                      scanFlash === 'SUCCESS'
                        ? 'border-emerald-400'
                        : scanFlash === 'NOT_FOUND'
                        ? 'border-rose-400'
                        : 'border-cyan-400'
                    }`}
                  />
                  <div
                    className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                      scanFlash === 'SUCCESS'
                        ? 'border-emerald-400'
                        : scanFlash === 'NOT_FOUND'
                        ? 'border-rose-400'
                        : 'border-cyan-400'
                    }`}
                  />
                  <div
                    className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                      scanFlash === 'SUCCESS'
                        ? 'border-emerald-400'
                        : scanFlash === 'NOT_FOUND'
                        ? 'border-rose-400'
                        : 'border-cyan-400'
                    }`}
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                      scanFlash === 'SUCCESS'
                        ? 'border-emerald-400'
                        : scanFlash === 'NOT_FOUND'
                        ? 'border-rose-400'
                        : 'border-cyan-400'
                    }`}
                  />

                  {/* เส้นเลเซอร์สแกนกวาดขึ้น-ลง (Active Scanning Laser Sweep) */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] animate-laser-sweep" />
                </div>
              </div>

              {/* ป้ายกำกับ Engine ปัจจุบันที่มุมบนซ้าย */}
              <div className="absolute top-2.5 left-3 pointer-events-none">
                <span className="px-2 py-0.5 rounded-md bg-slate-950/70 backdrop-blur-sm text-[10px] font-mono text-slate-300 border border-slate-700/50">
                  {activeEngine}
                </span>
              </div>

              {/* ป้ายสถานะกำลังตรวจจับที่มุมบนขวา */}
              <div className="absolute top-2.5 right-3 pointer-events-none flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm border border-emerald-500/40 text-emerald-300 text-[11px] font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span>กำลังตรวจจับ...</span>
              </div>

              {/* ข้อความแนะนำจุดเล็งด้านล่างกรอบ */}
              <div className="absolute bottom-2.5 inset-x-4 pointer-events-none text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-sm text-[11px] sm:text-xs font-semibold text-slate-200 border border-slate-700/60 shadow-lg">
                  จัดบาร์โค้ดแนวนอนให้อยู่ในกรอบเล็ง • แตะจอเพื่อโฟกัส
                </span>
              </div>
            </>
          )}
        </div>

        {/* แถบแจ้งเตือนผลลัพธ์การสแกนล่าสุด (Recent Scan Banner) */}
        {lastScanFeedback && (
          <div
            className={`px-4 py-2.5 border-t border-b flex items-center gap-2.5 animate-fade-in shrink-0 ${
              lastScanFeedback.status === 'SUCCESS'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                lastScanFeedback.status === 'SUCCESS'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {lastScanFeedback.status === 'SUCCESS' ? (
                <Icons.Check className="w-4 h-4 stroke-[3]" />
              ) : (
                <Icons.AlertTriangle className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-xs sm:text-sm">
              {lastScanFeedback.status === 'SUCCESS' ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-bold text-emerald-300">สแกนสำเร็จ: </span>
                    <span className="font-medium text-emerald-100">
                      {lastScanFeedback.productName || lastScanFeedback.barcode}
                    </span>
                    <span className="text-emerald-400/80 font-mono text-xs ml-1.5 inline-block">
                      ({lastScanFeedback.barcode})
                    </span>
                  </div>
                  <div className="shrink-0 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold font-mono text-xs sm:text-sm shadow-sm whitespace-nowrap">
                    ฿{formatSatangToBaht(lastScanFeedback.price)}
                  </div>
                </div>
              ) : (
                <p className="truncate font-medium">
                  <span className="font-bold text-rose-300">ไม่พบสินค้าในระบบ: </span>
                  <span className="font-mono text-rose-200">{lastScanFeedback.barcode}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ส่วนด้านล่าง: ป้อนรหัสสำรอง & ปุ่มเสร็จสิ้น */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          {/* ฟอร์มป้อนรหัสบาร์โค้ดสำรอง (ความสูงอย่างน้อย 48px) */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="หรือพิมพ์รหัสบาร์โค้ดด้วยตนเอง..."
              className="flex-1 min-h-[48px] px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-base placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-mono"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="min-h-[48px] px-5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-white font-bold text-sm sm:text-base rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
            >
              เพิ่ม
            </button>
          </form>

          {/* ปุ่มเสร็จสิ้น / ปิดกล้อง (ความสูงอย่างน้อย 48px) */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Icons.Check className="w-5 h-5 stroke-[2.5]" />
              เสร็จสิ้น / ปิดกล้อง
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
