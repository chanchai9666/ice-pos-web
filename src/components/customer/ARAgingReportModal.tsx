'use client';

/**
 * หน้ารายงานลูกหนี้ค้างชำระตามอายุหนี้ (ARAgingReportModal)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: GET /customers/reports/ar-aging
 */

import React, { useState, useEffect } from 'react';
import { ARAgingItemResponse } from '@/types/customer';
import { customerService } from '@/services/customer.service';
import { Icons } from '@/components/ui/Icons';
import { formatSatangToBaht } from '@/utils/currency';

interface ARAgingReportModalProps {
  isOpen: boolean;
  branchId?: string;
  onClose: () => void;
}

export function ARAgingReportModal({
  isOpen,
  branchId,
  onClose,
}: ARAgingReportModalProps) {
  const [items, setItems] = useState<ARAgingItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setError('');

    customerService
      .getARAgingReport(branchId)
      .then((res) => {
        if (!isMounted) return;
        setItems(res.data || []);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'ไม่สามารถดึงรายงานลูกหนี้ค้างชำระได้';
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, branchId]);

  if (!isOpen) return null;

  // ผลรวมทั้งหมด
  const totalBalance = items.reduce((acc, cur) => acc + (cur.outstandingBalance || 0), 0);
  const total0To30 = items.reduce((acc, cur) => acc + (cur.currentDue || 0), 0);
  const total31To60 = items.reduce((acc, cur) => acc + (cur.due30To60 || 0), 0);
  const total61To90 = items.reduce((acc, cur) => acc + (cur.due60To90 || 0), 0);
  const totalOver90 = items.reduce((acc, cur) => acc + (cur.over90 || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Icons.BarChart3 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">รายงานลูกหนี้ค้างชำระตามอายุหนี้ (AR Aging Report)</h3>
              <p className="text-xs text-slate-400">สรุปยอดหนี้คงค้างแยกตามช่วงเวลา 0-30 วัน, 31-60 วัน, 61-90 วัน และเกิน 90 วัน</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 border-b border-slate-800 bg-slate-900/50 shrink-0 text-xs sm:text-sm">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-slate-400 block text-xs">ยอดหนี้รวมทั้งหมด</span>
            <span className="text-base sm:text-lg font-bold text-white">฿{formatSatangToBaht(totalBalance)}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3">
            <span className="text-emerald-400 block text-xs">0-30 วัน (ปกติ)</span>
            <span className="text-base sm:text-lg font-bold text-emerald-300">฿{formatSatangToBaht(total0To30)}</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-3">
            <span className="text-blue-400 block text-xs">31-60 วัน</span>
            <span className="text-base sm:text-lg font-bold text-blue-300">฿{formatSatangToBaht(total31To60)}</span>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
            <span className="text-amber-400 block text-xs">61-90 วัน</span>
            <span className="text-base sm:text-lg font-bold text-amber-300">฿{formatSatangToBaht(total61To90)}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3">
            <span className="text-rose-400 block text-xs">เกิน 90 วัน (เสี่ยงสูง)</span>
            <span className="text-base sm:text-lg font-bold text-rose-300">฿{formatSatangToBaht(totalOver90)}</span>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <Icons.Loader className="w-8 h-8 animate-spin text-amber-400" />
              <span className="text-sm">กำลังโหลดรายงานลูกหนี้ค้างชำระ...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-400 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
              <Icons.Check className="w-10 h-10 text-emerald-500" />
              <p className="text-sm">ไม่มีลูกหนี้ค้างชำระในระบบ</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">ชื่อลูกค้า / ร้านค้า</th>
                    <th className="py-3 px-3 text-right">ยอดหนี้รวม</th>
                    <th className="py-3 px-3 text-right">0-30 วัน</th>
                    <th className="py-3 px-3 text-right">31-60 วัน</th>
                    <th className="py-3 px-3 text-right">61-90 วัน</th>
                    <th className="py-3 px-3 text-right">เกิน 90 วัน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {items.map((item) => (
                    <tr key={item.customerId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-white">
                        <div>{item.customerName}</div>
                        {item.phone && <div className="text-xs text-slate-400">{item.phone}</div>}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400">
                        ฿{formatSatangToBaht(item.outstandingBalance)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400">
                        ฿{formatSatangToBaht(item.currentDue)}
                      </td>
                      <td className="py-3 px-3 text-right text-blue-400">
                        ฿{formatSatangToBaht(item.due30To60)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-400">
                        ฿{formatSatangToBaht(item.due60To90)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-rose-400">
                        ฿{formatSatangToBaht(item.over90)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

