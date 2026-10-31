'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';
import { DashboardPaymentItem } from '@/types/dashboard';
import { formatSatangToBaht } from '@/utils/currencyHelper';

interface DashboardPaymentMixProps {
  payments?: DashboardPaymentItem[];
  isLoading?: boolean;
}

// สีและไอคอนสำหรับแต่ละช่องทางชำระเงิน
const METHOD_CONFIG: Record<
  string,
  { label: string; color: string; barColor: string; icon: React.ReactNode }
> = {
  CASH: {
    label: 'เงินสด',
    color: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    icon: <Icons.Banknote className="w-4 h-4" />,
  },
  QR_PROMPTPAY: {
    label: 'พร้อมเพย์ QR',
    color: 'text-cyan-400',
    barColor: 'bg-cyan-500',
    icon: <Icons.QrCode className="w-4 h-4" />,
  },
  CREDIT: {
    label: 'เงินเชื่อ (ค้างชำระ)',
    color: 'text-amber-400',
    barColor: 'bg-amber-500',
    icon: <Icons.CreditCard className="w-4 h-4" />,
  },
  TRANSFER: {
    label: 'เงินโอนธนาคาร',
    color: 'text-blue-400',
    barColor: 'bg-blue-500',
    icon: <Icons.RotateCw className="w-4 h-4" />,
  },
  CARD: {
    label: 'บัตรเครดิต/เดบิต',
    color: 'text-indigo-400',
    barColor: 'bg-indigo-500',
    icon: <Icons.CreditCard className="w-4 h-4" />,
  },
};

export function DashboardPaymentMix({ payments = [], isLoading }: DashboardPaymentMixProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/2 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-800/40 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = payments && payments.length > 0;
  const totalAmount = hasData
    ? payments.reduce((acc, curr) => acc + curr.amount, 0)
    : 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Icons.Wallet className="w-4 h-4" />
            </span>
            สัดส่วนการชำระเงิน
          </h2>
          <span className="text-xs font-bold text-slate-400">
            รวม ฿{formatSatangToBaht(totalAmount, { showUnit: false })}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          แยกตามวิธีชำระเงินของบิลที่สำเร็จ
        </p>
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="h-44 flex flex-col items-center justify-center text-slate-500 rounded-xl bg-slate-950/40 border border-dashed border-slate-800/80">
          <Icons.Receipt className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
          <span className="text-sm">ไม่มีข้อมูลการชำระเงิน</span>
        </div>
      ) : (
        <div className="space-y-4 my-auto">
          {payments.map((item) => {
            const config = METHOD_CONFIG[item.method] || {
              label: item.methodLabel || item.method,
              color: 'text-slate-300',
              barColor: 'bg-slate-500',
              icon: <Icons.Receipt className="w-4 h-4" />,
            };

            return (
              <div key={item.method} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`${config.color} p-1 rounded-md bg-slate-800/80`}>
                      {config.icon}
                    </span>
                    <span className="font-semibold text-slate-200">
                      {item.methodLabel || config.label}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({item.billCount} บิล)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      ฿{formatSatangToBaht(item.amount)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 w-10 text-right">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                  <div
                    style={{ width: `${Math.min(Math.max(item.percentage, 0), 100)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

