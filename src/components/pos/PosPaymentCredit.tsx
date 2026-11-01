'use client';

/**
 * แผงชำระเงินด้วยเงินเชื่อลูกค้า (Credit Account Payment Screen)
 * ค้นหาลูกค้า, แสดงวงเงินคงเหลือ, และตรวจสอบความเพียงพอของวงเงิน
 * มาตรฐาน Elderly-Friendly (Touch Targets >= 48px, High Contrast)
 * โครงการ ice-pos-web
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '@/components/ui/Icons';
import { customerService } from '@/services/customer.service';
import { CustomerSummary, getAvailableCredit } from '@/types/customer';
import { formatSatangToBaht } from '@/utils/currency';
import { usePwa } from '@/hooks/usePwa';

interface PosPaymentCreditProps {
  grandTotalSatang: number;
  branchId?: string;
  selectedCustomer: CustomerSummary | null;
  onSelectCustomer: (customer: CustomerSummary | null) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function PosPaymentCredit({
  grandTotalSatang,
  branchId,
  selectedCustomer,
  onSelectCustomer,
  onSubmit,
  isSubmitting,
}: PosPaymentCreditProps) {
  const { isOnline } = usePwa();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ค้นหารายชื่อลูกค้า
  const search = useCallback(
    async (q: string) => {
      setIsLoading(true);
      try {
        const res = await customerService.searchCustomers(q.trim(), branchId);
        if (res && res.data) {
          setCustomers(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.warn('Customer search error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [branchId]
  );

  // โหลดรายชื่อลูกค้าเริ่มต้นเมื่อ mount
  useEffect(() => {
    search('');
  }, [search]);

  // ค้นหาเมื่อผู้ใช้กดค้นหา หรือกด Enter
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    search(searchQuery);
  };

  // ล้างคำค้นหาและดึงรายการทั้งหมดกลับมา
  const handleClearSearch = () => {
    setSearchQuery('');
    search('');
  };

  // ตรวจสอบวงเงินคงเหลือ
  const availableCredit = getAvailableCredit(selectedCustomer ?? { creditLimit: 0, outstandingBalance: 0 } as CustomerSummary);
  const isCreditEnough = availableCredit >= grandTotalSatang;
  const remainingAfterSale = availableCredit - grandTotalSatang;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* ฝั่งซ้าย: ค้นหาและเลือกลูกค้า (7 คอลัมน์) */}
      <div className="md:col-span-7 flex flex-col space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <label htmlFor="customer-search-input" className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium block">
            ค้นหาบัญชีลูกค้าเงินเชื่อ:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="customer-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder="พิมพ์ชื่อ, รหัสลูกค้า หรือเบอร์โทรศัพท์..."
                className="w-full h-13 min-h-[50px] pl-11 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium text-base focus:border-purple-500 focus:outline-none transition-colors"
              />
              <Icons.Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-4" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-3.5 w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="ล้างคำค้นหา"
                >
                  <Icons.Close className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="h-13 min-h-[50px] px-4 sm:px-5 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-bold text-base flex items-center justify-center gap-2 border border-purple-400/40 shadow-md shadow-purple-900/30 shrink-0 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Icons.Refresh className="w-5 h-5 animate-spin" />
              ) : (
                <Icons.Search className="w-5 h-5" />
              )}
              <span>ค้นหา</span>
            </button>
          </div>
        </form>

        {/* รายการผลการค้นหาลูกค้า */}
        <div className="flex-1 overflow-y-auto max-h-[340px] pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Icons.Refresh className="w-7 h-7 animate-spin text-purple-600 dark:text-purple-400 mx-auto" />
              <p className="text-sm">กำลังค้นหาข้อมูลลูกค้า...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <Icons.Users className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-base font-semibold text-slate-800 dark:text-slate-300">ไม่พบข้อมูลลูกค้า</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">ลองพิมพ์คำค้นหาชื่อหรือรหัสลูกค้าอื่น</p>
            </div>
          ) : (
            customers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              const hasCredit = getAvailableCredit(c) >= grandTotalSatang;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectCustomer(c)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 min-h-[64px] active:scale-[0.99] cursor-pointer ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-white shadow-md shadow-purple-500/10'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c.name.substring(0, 1)}
                    </div>
                    <div>
                      <div className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.code && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300">
                            {c.code}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {c.phone ? `โทร: ${c.phone}` : 'ไม่มีเบอร์โทร'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">วงเงินคงเหลือ</span>
                    <span
                      className={`text-sm sm:text-base font-extrabold ${
                        hasCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatSatangToBaht(getAvailableCredit(c))}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ฝั่งขวา: สรุปยอดเงินและยืนยันการขายเงินเชื่อ (5 คอลัมน์) */}
      <div className="md:col-span-5 flex flex-col justify-between space-y-4 bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">ยอดบิลที่ต้องชำระ</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {formatSatangToBaht(grandTotalSatang)}
            </div>
          </div>

          {selectedCustomer ? (
            <div className="bg-white dark:bg-slate-800 border-2 border-purple-400 dark:border-purple-500/60 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs text-purple-700 dark:text-purple-300 font-bold uppercase tracking-wider">
                    ลูกค้าที่เลือก
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedCustomer.name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCustomer(null)}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 cursor-pointer"
                >
                  เปลี่ยน
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>วงเงินคงเหลือปัจจุบัน</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatSatangToBaht(availableCredit)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>ยอดหักบัญชีบิลนี้</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    -{formatSatangToBaht(grandTotalSatang)}
                  </span>
                </div>

                <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">คงเหลือหลังทำรายการ</span>
                  <span
                    className={`font-black text-base ${
                      isCreditEnough ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatSatangToBaht(remainingAfterSale)}
                  </span>
                </div>
              </div>

              {!isCreditEnough && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <Icons.AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>วงเงินเครดิตคงเหลือไม่เพียงพอสำหรับยอดบิลนี้</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center border-2 border-dashed border-slate-300 dark:border-slate-700/80 rounded-2xl text-slate-500 dark:text-slate-400">
              <Icons.User className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-500" />
              <p className="text-sm font-medium">กรุณาเลือกลูกค้าจากรายการทางซ้าย</p>
            </div>
          )}
        </div>

        {/* ปุ่มยืนยันชำระเงินเชื่อ */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!selectedCustomer || !isCreditEnough || isSubmitting || !isOnline}
          className="w-full h-14 min-h-[56px] rounded-2xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:border-slate-300 dark:disabled:border-slate-800 text-white font-bold text-lg sm:text-xl shadow-lg shadow-purple-600/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-purple-400/40 mt-4 cursor-pointer disabled:cursor-not-allowed"
        >
          {!isOnline ? (
            <>
              <Icons.WifiOff className="w-6 h-6 text-rose-400" />
              <span>ขาดการเชื่อมต่ออินเทอร์เน็ต (ออฟไลน์)</span>
            </>
          ) : isSubmitting ? (
            <>
              <Icons.Refresh className="w-6 h-6 animate-spin text-white" />
              <span>กำลังบันทึกรายการเงินเชื่อ...</span>
            </>
          ) : (
            <>
              <Icons.Check className="w-6 h-6 stroke-[3]" />
              <span>ยืนยันบันทึกเงินเชื่อ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
