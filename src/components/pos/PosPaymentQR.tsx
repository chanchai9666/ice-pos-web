'use client';

/**
 * ส่วนแสดงผลและตรวจสอบการชำระเงินผ่าน QR พร้อมเพย์ (QR PromptPay Payment Component)
 * รองรับการสร้าง QR, Auto-polling ทุก 3 วินาที, Timeout 5 นาที และการป้องกัน Memory Leak (SC-006)
 * มาตรฐาน Elderly-Friendly (Touch Targets >= 48px, High Contrast)
 * โครงการ ice-pos-web
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icons } from '@/components/ui/Icons';
import { paymentsService } from '@/services/payments.service';
import { QRPaymentResponse } from '@/types/payment';
import { formatSatangToBaht } from '@/utils/currency';

interface PosPaymentQRProps {
  grandTotalSatang: number;
  onSuccess: (qrRef: string) => void;
  onError: (message: string) => void;
}

const POLLING_INTERVAL_MS = 3000; // ตรวจสอบทุก 3 วินาที
const TIMEOUT_SECONDS = 300;      // หมดเวลาใน 5 นาที (300 วินาที)

export function PosPaymentQR({
  grandTotalSatang,
  onSuccess,
  onError,
}: PosPaymentQRProps) {
  const [qrData, setQrData] = useState<QRPaymentResponse | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState<boolean>(true);
  const [isCheckingManual, setIsCheckingManual] = useState<boolean>(false);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TIMEOUT_SECONDS);

  // เก็บ ref ของ timer เพื่อทำ cleanup ได้ 100% ป้องกัน Memory Leak
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDoneRef = useRef<boolean>(false);

  // หยุดการ Poll และ Countdown ทั้งหมด
  const stopTimers = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // ฟังก์ชันตรวจสอบสถานะ QR
  const checkStatus = useCallback(
    async (refCode: string, isManual = false) => {
      if (isDoneRef.current) return;

      if (isManual) {
        setIsCheckingManual(true);
      }

      try {
        const res = await paymentsService.checkPaymentStatus(refCode, { silent: !isManual });
        if (res && res.data && (res.data.status === 'SUCCESS' || res.data.status === ('PAID' as unknown))) {
          isDoneRef.current = true;
          stopTimers();
          onSuccess(refCode);
        } else if (res && res.data && (res.data.status === 'EXPIRED' || res.data.status === 'CANCELLED')) {
          stopTimers();
          setIsTimedOut(true);
          onError('QR Code นี้หมดอายุแล้ว กรุณาสร้างใหม่');
        }
      } catch (err) {
        console.warn('QR status check error:', err);
      } finally {
        if (isManual) {
          setIsCheckingManual(false);
        }
      }
    },
    [onSuccess, onError, stopTimers]
  );

  // ฟังก์ชันสร้าง QR Code
  const generateQR = useCallback(async () => {
    setIsLoadingQR(true);
    setIsTimedOut(false);
    setSecondsRemaining(TIMEOUT_SECONDS);
    isDoneRef.current = false;
    stopTimers();

    try {
      const res = await paymentsService.generatePromptPayQR(grandTotalSatang);
      if (res && res.data) {
        setQrData(res.data);
      } else {
        throw new Error(res.message || 'ไม่สามารถสร้าง QR Code ได้');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้าง QR Code';
      onError(msg);
    } finally {
      setIsLoadingQR(false);
    }
  }, [grandTotalSatang, onError, stopTimers]);

  // สร้าง QR เมื่อโหลด Component
  useEffect(() => {
    generateQR();

    return () => {
      // Memory cleanup: ป้องกัน memory leak 100% (SC-006)
      stopTimers();
      isDoneRef.current = true;
    };
  }, [generateQR, stopTimers]);

  // เริ่มต้น Polling และ Countdown เมื่อได้รับ QR Data
  useEffect(() => {
    if (!qrData || isTimedOut || isDoneRef.current) return;

    // 1. ตัวนับเวลาถอยหลัง (1 วินาที)
    countdownTimerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          stopTimers();
          setIsTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2. ตัวตรวจสถานะอัตโนมัติ (ทุก 3 วินาที)
    pollingTimerRef.current = setInterval(() => {
      if (!isDoneRef.current && qrData.qrRef) {
        checkStatus(qrData.qrRef);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      stopTimers();
    };
  }, [qrData, isTimedOut, checkStatus, stopTimers]);

  // แปลงเวลานับถอยหลังเป็น MM:SS
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (isLoadingQR) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[400px]">
        <Icons.Refresh className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-base text-slate-300 font-medium">กำลังสร้าง QR Code พร้อมเพย์...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 sm:p-8 space-y-6 max-w-lg mx-auto animate-fadeIn text-slate-100">
      {/* ส่วนหัวแสดงยอดเงินที่ต้องชำระ */}
      <div className="text-center space-y-1">
        <span className="text-sm text-slate-400 font-medium">สแกนชำระผ่านพร้อมเพย์</span>
        <div className="text-3xl sm:text-4xl font-black text-white">
          {formatSatangToBaht(grandTotalSatang)}
        </div>
      </div>

      {/* กรอบแสดงรูปภาพ QR Code พร้อมเพย์ */}
      <div className="relative p-4 sm:p-6 bg-white rounded-3xl shadow-xl flex flex-col items-center border-4 border-cyan-500/30">
        {qrData?.qrImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrData.qrImageUrl}
            alt="PromptPay QR Code"
            className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
          />
        ) : (
          <div className="w-56 h-56 sm:w-64 sm:h-64 flex flex-col items-center justify-center bg-slate-100 text-slate-700 rounded-xl">
            <Icons.QrCode className="w-20 h-20 text-slate-400 mb-2" />
            <span className="text-sm font-semibold">QR Code PromptPay</span>
            <span className="text-xs text-slate-500 mt-1">{qrData?.qrRef || 'REF-N/A'}</span>
          </div>
        )}

        <div className="mt-3 text-center">
          <span className="text-xs text-slate-500 font-mono tracking-wider">
            Ref: {qrData?.qrRef || '-'}
          </span>
        </div>
      </div>

      {/* สถานะการตรวจสอบและเวลานับถอยหลัง */}
      <div className="w-full space-y-3">
        {!isTimedOut ? (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <span className="text-slate-300 font-medium">กำลังรอการชำระเงินอัตโนมัติ...</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-cyan-400 font-bold">
              <Icons.Clock className="w-4 h-4 text-cyan-400" />
              <span>{timeString}</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-300 text-sm flex items-center gap-2.5">
            <Icons.AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>หมดเวลาตรวจสอบอัตโนมัติ 5 นาที สามารถกดตรวจสอบอีกครั้งหรือสร้าง QR ใหม่</span>
          </div>
        )}

        {/* ปุ่มควบคุม (ตรวจสอบด้วยตนเอง / สร้าง QR ใหม่) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => qrData?.qrRef && checkStatus(qrData.qrRef, true)}
            disabled={isCheckingManual}
            className="h-13 min-h-[50px] rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-cyan-700 border border-slate-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm disabled:opacity-60"
          >
            {isCheckingManual ? (
              <Icons.Refresh className="w-5 h-5 animate-spin text-cyan-400" />
            ) : (
              <Icons.Refresh className="w-5 h-5 text-cyan-400" />
            )}
            <span>ตรวจสอบอีกครั้ง</span>
          </button>

          <button
            type="button"
            onClick={generateQR}
            disabled={isLoadingQR}
            className="h-13 min-h-[50px] rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 border border-cyan-400/50 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            <Icons.RotateCcw className="w-5 h-5 text-white" />
            <span>สร้าง QR ใหม่</span>
          </button>
        </div>
      </div>
    </div>
  );
}
