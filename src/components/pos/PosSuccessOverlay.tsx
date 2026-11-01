'use client';

/**
 * หน้าต่างแสดงความสำเร็จหลังบันทึกการขาย (POS Success Overlay)
 * มาตรฐาน Elderly-Friendly & High Contrast WCAG 2.1 AA
 * โครงการ ice-pos-web
 */

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { SaleResponse } from '@/types/sale';
import { formatSatangToBaht } from '@/utils/currency';

interface PosSuccessOverlayProps {
  sale: SaleResponse;
  cashierName?: string;
  onNewSale: () => void;
  onPrintReceipt?: (saleNo: string) => void;
}

export function PosSuccessOverlay({
  sale,
  cashierName,
  onNewSale,
  onPrintReceipt,
}: PosSuccessOverlayProps) {
  const primaryPayment = sale.payments?.[0];
  const isCash = primaryPayment?.method === 'CASH';

  return (
    <div className="flex flex-col items-center justify-between p-6 sm:p-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-[480px] h-full animate-fadeIn">
      {/* ส่วนหัวแสดงผลสำเร็จ */}
      <div className="flex flex-col items-center text-center space-y-3 w-full">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-lg shadow-emerald-500/10">
          <Icons.Check className="w-12 h-12 stroke-[3]" />
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          ชำระเงินสำเร็จ
        </h3>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          บันทึกรายการขายเข้าระบบเรียบร้อยแล้ว
        </p>
      </div>

      {/* บัตรสรุปข้อมูลใบเสร็จ (Receipt Card) */}
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 my-6 space-y-3 shadow-inner">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700/60">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">เลขที่บิลขาย</span>
          <span className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400 tracking-wider">
            {sale.saleNo || sale.id.substring(0, 8).toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">ยอดสุทธิทั้งบิล</span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatSatangToBaht(sale.grandTotal)}
          </span>
        </div>

        {isCash && primaryPayment && (
          <>
            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-300">
              <span>เงินสดที่รับมา</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatSatangToBaht(primaryPayment.tenderedAmount ?? sale.grandTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <span className="text-base font-bold text-amber-600 dark:text-amber-300">เงินทอน</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400">
                {formatSatangToBaht(primaryPayment.changeAmount ?? 0)}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between items-center pt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>วิธีชำระ: <strong className="text-slate-700 dark:text-slate-300">{primaryPayment?.method || 'CASH'}</strong></span>
          <span>แคชเชียร์: <strong className="text-slate-700 dark:text-slate-300">{cashierName || '-'}</strong></span>
        </div>
      </div>

      {/* ส่วนปุ่มดำเนินการ: เริ่มบิลใหม่ และพิมพ์ใบเสร็จ (Elderly-Friendly Button >= 48px) */}
      <div className="w-full max-w-md space-y-3">
        {onPrintReceipt && (
          <button
            type="button"
            onClick={() => onPrintReceipt(sale.saleNo || sale.id)}
            className="w-full h-12 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-300 font-bold text-base border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Icons.Receipt className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span>ดูและสั่งพิมพ์ใบเสร็จรับเงิน</span>
          </button>
        )}

        <button
          type="button"
          onClick={onNewSale}
          className="w-full h-14 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-lg sm:text-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-emerald-400/40 cursor-pointer"
        >
          <Icons.Check className="w-6 h-6 stroke-[2.5]" />
          <span>เริ่มบิลใหม่ (รับลูกค้ารายถัดไป)</span>
        </button>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          การกดปุ่มเริ่มบิลใหม่จะล้างตะกร้าสินค้าและปิดหน้าต่างนี้อัตโนมัติ
        </p>
      </div>
    </div>
  );
}
