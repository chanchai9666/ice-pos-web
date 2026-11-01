'use client';

/**
 * หน้าต่างตั้งค่าระบบแบบรวมศูนย์ (SettingsModal)
 * โครงการ ice-pos-web
 *
 * รวมศูนย์การทำงาน:
 * 1. การปรับแต่งธีมการแสดงผล (Light / Dark / System)
 * 2. การซิงค์ข้อมูลการทำงานออฟไลน์ (Data Sync & Offline Operations)
 * 3. ข้อมูลสาขา เวอร์ชันระบบ และสถานะเครือข่าย
 */

import React, { useState, useEffect } from 'react';
import { useTheme, Theme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePwa } from '@/hooks/usePwa';
import { Icons } from '@/components/ui/Icons';
import { syncService, getDeviceId } from '@/services/sync.service';
import { SyncChangesResponse, SyncBatchResponse } from '@/types/sync';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { branch, user } = useAuth();
  const { isOnline, isUpdateAvailable, updateApp } = usePwa();

  const [activeTab, setActiveTab] = useState<'theme' | 'sync' | 'system'>('theme');

  // ข้อมูลการซิงค์
  const [deviceId, setDeviceId] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pullResult, setPullResult] = useState<SyncChangesResponse | null>(null);
  const [pushResult, setPushResult] = useState<SyncBatchResponse | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // ปิดด้วยปุ่ม Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // โหลดข้อมูลซิงค์เมื่อเปิดโมดอล
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      setDeviceId(getDeviceId());
      const stored = localStorage.getItem('ice_pos_last_sync_timestamp');
      setLastSyncTime(stored ? new Date(stored).toLocaleString('th-TH') : 'ยังไม่เคยซิงค์');
      setSyncError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ฟังก์ชันดึงความเปลี่ยนแปลงล่าสุดจากเซิร์ฟเวอร์
  const handlePullChanges = async () => {
    setIsPulling(true);
    setSyncError(null);
    try {
      const res = await syncService.getSyncChanges();
      if (res.data) {
        setPullResult(res.data);
        if (res.data.nextCursor) {
          const formatted = new Date(res.data.nextCursor).toLocaleString('th-TH');
          setLastSyncTime(formatted);
          localStorage.setItem('ice_pos_last_sync_timestamp', res.data.nextCursor);
        }
      } else {
        setSyncError(res.message || 'ไม่สามารถดึงข้อมูลความเปลี่ยนแปลงได้');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล';
      setSyncError(msg);
    } finally {
      setIsPulling(false);
    }
  };

  // ฟังก์ชันส่งข้อมูลค้างส่งไปยังเซิร์ฟเวอร์
  const handlePushBatch = async () => {
    setIsPushing(true);
    setSyncError(null);
    try {
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
        setSyncError(res.message || 'ไม่สามารถอัปโหลดข้อมูลออฟไลน์ได้');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลดข้อมูล';
      setSyncError(msg);
    } finally {
      setIsPushing(false);
    }
  };

  const themeOptions: Array<{
    value: Theme;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }> = [
    {
      value: 'light',
      label: 'โหมดสว่าง (Light)',
      sublabel: 'สบายตา คอนทราสต์สูง เหมาะสำหรับสภาพแวดล้อมสว่าง',
      icon: <Icons.Sun className="w-6 h-6 text-amber-500" />,
    },
    {
      value: 'dark',
      label: 'โหมดมืด (Dark)',
      sublabel: 'ลดแสงสะท้อน สบายตา เหมาะสำหรับสภาพแสงน้อย',
      icon: <Icons.Moon className="w-6 h-6 text-cyan-400" />,
    },
    {
      value: 'system',
      label: 'ตามการตั้งค่าระบบ (System)',
      sublabel: `ปรับเปลี่ยนตามระบบปฏิบัติการอัตโนมัติ (ปัจจุบัน: ${resolvedTheme === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'})`,
      icon: <Icons.Monitor className="w-6 h-6 text-slate-500 dark:text-slate-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* ส่วนหัวหน้าต่าง */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Icons.Settings className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                ตั้งค่าระบบ (System Settings)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ปรับแต่งธีมการแสดงผล ซิงค์ข้อมูลออฟไลน์ และข้อมูลอุปกรณ์
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="ปิดหน้าต่างตั้งค่า"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* แถบสลับแท็บการตั้งค่า */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-white dark:bg-slate-900 shrink-0 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap min-h-[48px] ${
              activeTab === 'theme'
                ? 'border-cyan-600 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icons.Sun className="w-4 h-4" />
            <span>การแสดงผล & ธีม</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap min-h-[48px] ${
              activeTab === 'sync'
                ? 'border-cyan-600 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icons.Refresh className="w-4 h-4" />
            <span>ซิงค์ข้อมูล & ออฟไลน์</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 py-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap min-h-[48px] ${
              activeTab === 'system'
                ? 'border-cyan-600 dark:border-cyan-400 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icons.Building2 className="w-4 h-4" />
            <span>สาขา & ข้อมูลระบบ</span>
          </button>
        </div>

        {/* เนื้อหาแต่ละแท็บ */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: การแสดงผลและธีม */}
          {activeTab === 'theme' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  เลือกรูปแบบธีมหน้าจอ (Theme Appearance)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ระบบจะบันทึกการตั้งค่านี้ไว้ในเครื่อง และซิงค์กับสถานะของหน้าจอโดยอัตโนมัติ
                </p>
              </div>

              <div className="space-y-2.5">
                {themeOptions.map((opt) => {
                  const isSelected = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTheme(opt.value)}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer text-left min-h-[64px] ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-white dark:bg-slate-900 border-cyan-400/50 shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {opt.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {opt.label}
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-600 text-white">
                                ใช้งานอยู่
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {opt.sublabel}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${
                          isSelected
                            ? 'border-cyan-600 bg-cyan-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Icons.Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ซิงค์ข้อมูลและออฟไลน์ */}
          {activeTab === 'sync' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  การซิงค์ข้อมูลและระบบแคชออฟไลน์ (Offline & Sync)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ระบบจะบันทึกการขายและสต็อกลงในเครื่อง และส่งข้อมูลไปยังเซิร์ฟเวอร์ทันทีเมื่อมีสัญญาณอินเทอร์เน็ต
                </p>
              </div>

              {/* การ์ดสรุปสถานะเครือข่าย */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">สถานะการเชื่อมต่อ:</span>
                    <span
                      className={`text-sm font-bold flex items-center gap-1.5 mt-0.5 ${
                        isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      {isOnline ? 'ออนไลน์ (เชื่อมต่อเซิร์ฟเวอร์)' : 'ออฟไลน์ (โหมดขาดการเชื่อมต่อ)'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">เวลาซิงค์ล่าสุด:</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {lastSyncTime || 'ยังไม่เคยซิงค์'}
                  </span>
                </div>
              </div>

              {/* รหัสเครื่องประจำจุดขาย */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="text-slate-500 dark:text-slate-400">รหัสอุปกรณ์ประจำจุดขาย (Device ID):</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 break-all">
                  {deviceId || 'กำลังตรวจสอบ...'}
                </p>
              </div>

              {/* ข้อความแจ้งเตือนข้อผิดพลาด (ถ้ามี) */}
              {syncError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <Icons.AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{syncError}</span>
                </div>
              )}

              {/* ปุ่มดำเนินการซิงค์ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handlePullChanges}
                  disabled={isPulling || !isOnline}
                  className="p-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px] shadow-sm"
                >
                  <Icons.Refresh className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                  <span>{isPulling ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุด (Pull)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushBatch}
                  disabled={isPushing || !isOnline}
                  className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 min-h-[48px]"
                >
                  <Icons.Upload className={`w-4 h-4 ${isPushing ? 'animate-spin' : ''}`} />
                  <span>{isPushing ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูลขายค้าง (Push)'}</span>
                </button>
              </div>

              {/* ผลลัพธ์การดึง/ส่ง */}
              {pullResult && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <span className="font-bold">ผลการดึงข้อมูลล่าสุด:</span>
                  <p>
                    อัปเดตสินค้า: {pullResult.products?.length || 0} รายการ • หมวดหมู่:{' '}
                    {pullResult.categories?.length || 0} รายการ
                  </p>
                </div>
              )}

              {pushResult && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <span className="font-bold">ผลการส่งข้อมูลออฟไลน์:</span>
                  <p>
                    สำเร็จ: {pushResult.appliedCount || 0} รายการ • ปฏิเสธ: {pushResult.rejectedCount || 0} รายการ
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: สาขาและข้อมูลระบบ */}
          {activeTab === 'system' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  ข้อมูลสาขาและรายละเอียดแอปพลิเคชัน
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ตรวจสอบสาขาที่ปฏิบัติงาน เวอร์ชันโปรแกรม และการอัปเดตระบบ
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">สาขาที่ปฏิบัติงาน:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {branch?.name || '- ไม่ระบุ -'} {branch?.code ? `(${branch.code})` : ''}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800/80 pt-2.5">
                  <span className="text-slate-500 dark:text-slate-400">ผู้ใช้งานปัจจุบัน:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {user?.name || user?.username} ({user?.role || 'พนักงาน'})
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800/80 pt-2.5">
                  <span className="text-slate-500 dark:text-slate-400">เวอร์ชันระบบ:</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    ICE POS v1.2.0 (Production)
                  </span>
                </div>
              </div>

              {/* การอัปเดตเวอร์ชัน PWA */}
              {isUpdateAvailable ? (
                <div className="p-4 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border-2 border-cyan-500 text-slate-900 dark:text-white flex items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-sm">มีเวอร์ชันใหม่พร้อมใช้งาน!</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      กดปุ่มเพื่อโหลดไฟล์อัปเดตเวอร์ชันล่าสุดทันที
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={updateApp}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md"
                  >
                    อัปเดตทันที
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
                  <Icons.Check className="w-4 h-4 text-emerald-500" />
                  <span>ระบบของคุณเป็นเวอร์ชันล่าสุดแล้ว</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ส่วนท้ายหน้าต่าง */}
        <div className="p-4 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm min-h-[44px] cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
