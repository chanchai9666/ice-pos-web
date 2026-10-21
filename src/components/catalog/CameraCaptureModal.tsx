'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icons } from '@/components/ui/Icons';

export interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  title = 'ถ่ายภาพสินค้าด้วยกล้อง',
}: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // หยุดการทำงานของกล้องทั้งหมดและปล่อยทรัพยากร (Release Tracks)
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // ตรวจสอบว่าอุปกรณ์มีกล้องมากกว่า 1 ตัวหรือไม่ (เช่น หน้า/หลัง)
  const detectCameras = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }
    } catch {
      setHasMultipleCameras(false);
    }
  }, []);

  // เริ่มต้นรับสัญญาณภาพจากกล้อง
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setError(null);
    setIsInitializing(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับการเข้าถึงกล้องถ่ายภาพ กรุณาใช้วิธีเลือกไฟล์รูปภาพแทน');
      setIsInitializing(false);
      return;
    }

    try {
      // หยุดกล้องเดิมก่อนเปิดกล้องใหม่
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {
          // Play promise error handling
        });
      }

      await detectCameras();
    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
        setError('ไม่สามารถเข้าถึงกล้องได้เนื่องจากไม่ได้รับอนุญาต กรุณาอนุญาตสิทธิ์การใช้งานกล้องในเบราว์เซอร์');
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        setError('ไม่พบอุปกรณ์กล้องบนอุปกรณ์นี้ กรุณาเชื่อมต่อกล้องหรือใช้วิธีเลือกไฟล์รูปภาพแทน');
      } else {
        setError(`เกิดข้อผิดพลาดในการเปิดกล้อง: ${errorObj.message || 'ไม่สามารถเริ่มสัญญาณภาพได้'}`);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [stream, detectCameras]);

  // เปิด/ปิดกล้องตามสถานะ isOpen
  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      setCapturedBlob(null);
      setError(null);
      startCamera(facingMode);
    } else {
      stopCamera();
    }

    return () => {
      // Cleanup เมื่อ component unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // สลับกล้องหน้าและกล้องหลัง
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // ถ่ายภาพนิ่ง (Capture Photo from Video)
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ถ้าเป็นกล้องหน้า ให้พลิกภาพแนวนอนเหมือนกระจก
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    // สร้าง Data URL เพื่อแสดงผลพรีวิว
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedDataUrl(dataUrl);

    // สร้าง Blob สำหรับแปลงเป็น File ส่งต่อ
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
        }
      },
      'image/jpeg',
      0.9
    );

    // พักวิดีโอชั่วคราว
    stopCamera();
  };

  // ถ่ายใหม่ (Retake)
  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  // ยืนยันการใช้ภาพนี้ (Accept Photo)
  const handleAccept = () => {
    if (!capturedBlob) return;

    const file = new File([capturedBlob], 'product-photo.jpg', { type: 'image/jpeg' });

    onCapture(file);
    handleClose();
  };

  // ปิดหน้าต่างโมดอลและหยุดกล้อง
  const handleClose = () => {
    stopCamera();
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[95vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Icons.Camera className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 id="camera-modal-title" className="text-lg md:text-xl font-bold text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-400">
                {capturedDataUrl ? 'ตรวจสอบภาพถ่ายก่อนนำไปใช้งาน' : 'จัดสินค้าให้อยู่ในกรอบแล้วกดถ่ายภาพ'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            aria-label="ปิดหน้าต่างกล้อง"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[320px] max-h-[500px]">
          {/* Error Message Display */}
          {error && (
            <div className="p-6 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-950/80 border-2 border-rose-700/60 text-rose-400 flex items-center justify-center mx-auto">
                <Icons.AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-white">ไม่สามารถเปิดกล้องได้</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[48px] px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold border border-slate-700 text-sm transition-all cursor-pointer shadow-md"
              >
                ปิดหน้าต่างและเลือกไฟล์แทน
              </button>
            </div>
          )}

          {/* Loading Viewfinder State */}
          {isInitializing && !error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-slate-300 space-y-3">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-200">กำลังเชื่อมต่อกับกล้อง...</p>
            </div>
          )}

          {/* Live Video Feed */}
          {!capturedDataUrl && !error && (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-contain max-h-[480px] ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Framing Overlay Guides (เส้นช่วยจัดกึ่งกลางสินค้า) */}
              <div className="absolute inset-6 md:inset-10 border-2 border-cyan-400/40 rounded-2xl pointer-events-none flex items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-l-2 border-cyan-400 absolute top-0 left-0 -mt-0.5 -ml-0.5 rounded-tl-xl" />
                <div className="w-12 h-12 border-t-2 border-r-2 border-cyan-400 absolute top-0 right-0 -mt-0.5 -mr-0.5 rounded-tr-xl" />
                <div className="w-12 h-12 border-b-2 border-l-2 border-cyan-400 absolute bottom-0 left-0 -mb-0.5 -ml-0.5 rounded-bl-xl" />
                <div className="w-12 h-12 border-b-2 border-r-2 border-cyan-400 absolute bottom-0 right-0 -mb-0.5 -mr-0.5 rounded-br-xl" />
                <span className="text-xs font-mono text-cyan-400/70 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  วางสินค้าในกรอบนี้
                </span>
              </div>
            </div>
          )}

          {/* Captured Image Preview */}
          {capturedDataUrl && (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedDataUrl}
                alt="ภาพถ่ายสินค้า"
                className="w-full h-full object-contain max-h-[480px] rounded-xl shadow-lg"
              />
            </div>
          )}

          {/* Hidden Canvas for Frame Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Controls (Elderly-Friendly Touch Targets >= 48px, Shutter >= 64px) */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/95 flex items-center justify-between gap-3 shrink-0">
          {!capturedDataUrl ? (
            <>
              {/* Switch Camera Button (กล้องหน้า/กล้องหลัง) */}
              <div className="w-16 flex justify-start">
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="min-w-[48px] min-h-[48px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                    title="สลับกล้องหน้า/หลัง"
                    aria-label="สลับกล้อง"
                  >
                    <Icons.SwitchCamera className="w-5 h-5 text-cyan-400" />
                  </button>
                )}
              </div>

              {/* Shutter Button (ปุ่มถ่ายภาพขนาดใหญ่ >= 64px) */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={isInitializing || !!error}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white/80 shadow-lg shadow-cyan-500/30 flex items-center justify-center transition-all cursor-pointer group"
                  aria-label="กดถ่ายภาพ"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center transition-transform group-active:scale-95">
                    <Icons.Camera className="w-6 h-6 md:w-7 md:h-7 text-cyan-600 stroke-[2.5]" />
                  </div>
                </button>
              </div>

              {/* Cancel Button */}
              <div className="w-16 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="min-h-[48px] px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </>
          ) : (
            /* Post-capture Review Controls */
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border-2 border-slate-700 font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Icons.RotateCcw className="w-5 h-5 text-amber-400" />
                <span>ถ่ายใหม่</span>
              </button>

              <button
                type="button"
                onClick={handleAccept}
                className="flex-1 min-h-[48px] px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/30"
              >
                <Icons.Check className="w-5 h-5 stroke-[2.5]" />
                <span>ใช้ภาพนี้</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
