'use client';

/**
 * คอมโพเนนต์หน้าต่างซิงค์ข้อมูลออฟไลน์ (SyncModal)
 * สอดคล้องกับ API: GET /api/v1/sync/changes, POST /api/v1/sync/batch
 * มาตรฐานกระทรวงสาธารณสุข & รพ.สต.: Elderly-Friendly, Satang Standard, Thai 100%
 */

import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/ui/Icons';
import { syncService, getDeviceId } from '@/services/sync.service';
import { SyncChangesResponse, SyncBatchResponse } from '@/types/sync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncModal({ isOpen, onClose }: SyncModalProps) {
  const [deviceId, setDeviceId] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pullResult, setPullResult] = useState<SyncChangesResponse | null>(null);
  const [pushResult, setPushResult] = useState<SyncBatchResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      setDeviceId(getDeviceId());
      const stored = localStorage.getItem('ice_pos_last_sync_timestamp');
      setLastSyncTime(stored ? new Date(stored).toLocaleString('th-TH') : 'ยังไม่เคยซิงค์');
      setErrorMsg(null);
      setPullResult(null);
      setPushResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePullChanges = async () => {
    setIsPulling(true);
    setErrorMsg(null);
    try {
      const res = await syncService.getSyncChanges();
      if (res.data) {
        setPullResult(res.data);
        if (res.data.nextCursor) {
          setLastSyncTime(new Date(res.data.nextCursor).toLocaleString('th-TH'));
        }
      } else {
        setErrorMsg(res.message || 'ไม่สามารถดึงข้อมูลความเปลี่ยนแปลงได้');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
      setErrorMsg(msg);
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushBatch = async () => {
    setIsPushing(true);
    setErrorMsg(null);
    try {
      // ตัวอย่างการส่ง batch ข้อมูลออฟไลน์ (หากมีค้างในคิว)
      const res = await syncService.syncBatch({
        deviceId,
        sales: [],
        returns: [],
        customers: [],
        stockMovements: [],
      });

      if (res.data) {
        setPushResult(res.data);
      } else {
        setErrorMsg(res.message || 'ไม่สามารถอัปโหลดข้อมูลออฟไลน์ได้');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลดข้อมูล';
      setErrorMsg(msg);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-200 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Icons.Refresh className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">ซิงค์ข้อมูลการทำงานออฟไลน์</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ตรวจสอบและอัปเดตข้อมูลระหว่างเครื่อง POS กับเซิร์ฟเวอร์</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 rounded-xl text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
              <Icons.AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Device Info */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">รหัสเครื่อง POS (Device ID):</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">{deviceId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">ซิงค์ล่าสุดเมื่อ:</span>
              <span className="text-slate-800 dark:text-slate-200">{lastSyncTime}</span>
            </div>
          </div>

          {/* Action 1: Pull Changes */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">ดึงข้อมูลอัปเดตล่าสุด (Delta Sync)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">อัปเดตรายการสินค้า หมวดหมู่ และภาษีลงเครื่อง</p>
              </div>
              <button
                type="button"
                onClick={handlePullChanges}
                disabled={isPulling}
                className="h-10 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Icons.Refresh className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'กำลังดึง...' : 'ดึงข้อมูล'}</span>
              </button>
            </div>

            {pullResult && (
              <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/40 rounded-xl text-xs text-cyan-800 dark:text-cyan-200 space-y-1 animate-in fade-in">
                <div>สินค้าอัปเดต: {pullResult.products?.length || 0} รายการ</div>
                <div>หมวดหมู่อัปเดต: {pullResult.categories?.length || 0} รายการ</div>
                <div>อัตราภาษี: {pullResult.taxes?.length || 0} รายการ</div>
              </div>
            )}
          </div>

          {/* Action 2: Push Batch */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">อัปโหลดรายการขายออฟไลน์ (Push Batch)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">ส่งบิลขายที่บันทึกขณะไม่มีเน็ตขึ้นเซิร์ฟเวอร์</p>
              </div>
              <button
                type="button"
                onClick={handlePushBatch}
                disabled={isPushing}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Icons.Upload className={`w-4 h-4 ${isPushing ? 'animate-spin' : ''}`} />
                <span>{isPushing ? 'กำลังส่ง...' : 'อัปโหลด'}</span>
              </button>
            </div>

            {pushResult && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 space-y-1 animate-in fade-in">
                <div>บันทึกสำเร็จ (Applied): {pushResult.appliedCount ?? 0} รายการ</div>
                <div>รายการปฏิเสธ (Rejected): {pushResult.rejectedCount ?? 0} รายการ</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-6 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

