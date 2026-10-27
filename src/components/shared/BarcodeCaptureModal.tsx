'use client';

/**
 * Modal จับบาร์โค้ดด้วยกล้องแบบอ่านครั้งเดียว (Single Capture)
 * ใช้เติมช่องฟอร์ม — ไม่ค้นหาสินค้า ไม่เพิ่มตะกร้า ไม่สแกนต่อเนื่อง
 * Hybrid Engine: Native BarcodeDetector + @zxing/browser fallback
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Icons } from '@/components/ui/Icons';
import { cleanBarcode } from '@/utils/barcode';
import { playSuccessBeep } from '@/utils/audioFeedback';

export interface BarcodeCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (barcode: string) => void;
  title?: string;
}

export function BarcodeCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = 'สแกนบาร์โค้ด',
}: BarcodeCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningRef = useRef(false);
  const hasCapturedRef = useRef(false);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [activeEngine, setActiveEngine] = useState('กำลังเตรียมระบบ...');

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

  const handleCapture = useCallback(
    (rawCode: string) => {
      if (hasCapturedRef.current || !isScanningRef.current) return;

      const cleaned = cleanBarcode(rawCode);
      if (!cleaned) return;

      hasCapturedRef.current = true;
      isScanningRef.current = false;
      stopCamera();

      try {
        playSuccessBeep();
      } catch {
        // เสียงเป็นทางเลือก ไม่บล็อกการใส่ค่า
      }

      onCapture(cleaned);
    },
    [onCapture, stopCamera]
  );

  const startCamera = useCallback(async () => {
    setHasPermissionError(false);
    setErrorMessage('');
    setIsSupported(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      setErrorMessage('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง กรุณาพิมพ์บาร์โค้ดในช่องด้วยตนเอง');
      return;
    }

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
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setHasPermissionError(true);
      const errObj = err as { name?: string };
      if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
        setErrorMessage('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง กรุณาอนุญาตสิทธิ์กล้อง หรือพิมพ์บาร์โค้ดด้วยตนเอง');
      } else if (errObj.name === 'NotFoundError' || errObj.name === 'DevicesNotFoundError') {
        setErrorMessage('ไม่พบอุปกรณ์กล้องบนเครื่องนี้ กรุณาพิมพ์บาร์โค้ดด้วยตนเอง');
      } else {
        setErrorMessage('ไม่สามารถเปิดใช้งานกล้องได้ กรุณาพิมพ์บาร์โค้ดด้วยตนเอง');
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      hasCapturedRef.current = false;
      return;
    }

    hasCapturedRef.current = false;
    let isSubscribed = true;

    const setupScanner = async () => {
      await startCamera();
      if (!isSubscribed || hasCapturedRef.current) return;

      isScanningRef.current = true;

      const BarcodeDetectorClass =
        typeof window !== 'undefined' && 'BarcodeDetector' in window
          ? (
              window as unknown as {
                BarcodeDetector: new (opts?: {
                  formats: string[];
                }) => { detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> };
              }
            ).BarcodeDetector
          : null;

      let nativeDetector: {
        detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
      } | null = null;

      if (BarcodeDetectorClass) {
        try {
          nativeDetector = new BarcodeDetectorClass({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
          });
        } catch {
          try {
            nativeDetector = new BarcodeDetectorClass();
          } catch {
            nativeDetector = null;
          }
        }
      }

      if (nativeDetector) {
        setActiveEngine('Native BarcodeDetector');
        const detectLoop = async () => {
          if (!isScanningRef.current || hasCapturedRef.current) return;

          const video = videoRef.current;
          if (video && video.readyState >= video.HAVE_CURRENT_DATA && nativeDetector) {
            try {
              const barcodes = await nativeDetector.detect(video);
              if (barcodes && barcodes.length > 0) {
                handleCapture(barcodes[0].rawValue);
                return;
              }
            } catch {
              // ละเว้นเฟรมที่ยังไม่พร้อม
            }
          }

          if (isScanningRef.current && !hasCapturedRef.current) {
            animationFrameRef.current = requestAnimationFrame(detectLoop);
          }
        };

        animationFrameRef.current = requestAnimationFrame(detectLoop);
      } else {
        setActiveEngine('ZXing Engine (Cross-Browser)');
        try {
          const zxingReader = new BrowserMultiFormatReader();
          const videoElement = videoRef.current;
          if (videoElement) {
            const controls = await zxingReader.decodeFromVideoElement(videoElement, (result) => {
              if (!isScanningRef.current || hasCapturedRef.current) return;
              if (result) {
                handleCapture(result.getText());
              }
            });
            if (isSubscribed && !hasCapturedRef.current) {
              zxingControlsRef.current = controls;
            } else {
              controls.stop();
            }
          }
        } catch (err) {
          console.warn('Failed to start ZXing reader:', err);
          setHasPermissionError(true);
          setErrorMessage('ไม่สามารถเริ่มระบบถอดรหัสบาร์โค้ดได้ กรุณาพิมพ์บาร์โค้ดด้วยตนเอง');
        }
      }
    };

    setupScanner();

    return () => {
      isSubscribed = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera, handleCapture]);

  if (!isOpen) return null;

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Icons.Barcode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">{title}</h3>
              <p className="text-xs text-slate-400">ส่องบาร์โค้ดในกรอบเล็ง — อ่านครั้งเดียวแล้วใส่ลงช่อง</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleFacingMode}
              title="สลับกล้องหน้า/หลัง"
              className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            >
              <Icons.Refresh className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดการสแกน"
              className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center shrink">
          {hasPermissionError || !isSupported ? (
            <div className="p-6 text-center space-y-4 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <Icons.AlertTriangle className="w-7 h-7" />
              </div>
              <p className="text-base font-semibold text-slate-100 leading-relaxed">{errorMessage}</p>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="min-h-[48px] flex-1 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 cursor-pointer transition-colors"
                >
                  ลองใหม่อีกครั้ง
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[48px] flex-1 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-colors"
                >
                  ปิดแล้วพิมพ์เอง
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[72%] max-w-[280px] aspect-[3/1] border-2 border-cyan-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]" />
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end gap-2 pointer-events-none">
                <span className="text-[10px] sm:text-xs text-slate-300 bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-700/80">
                  {activeEngine}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] w-full rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 cursor-pointer transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
