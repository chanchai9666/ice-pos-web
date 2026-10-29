'use client';

/**
 * หน้าจัดการลูกค้าและบัญชีเงินเชื่อ (Customer & Credit Management)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: /customers
 * ออกแบบตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, High Contrast WCAG 2.1 AA)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CustomerSummary, getAvailableCredit } from '@/types/customer';
import { customerService } from '@/services/customer.service';
import { CustomerFormModal } from '@/components/customer/CustomerFormModal';
import { CreditLimitModal } from '@/components/customer/CreditLimitModal';
import { PayCreditModal } from '@/components/customer/PayCreditModal';
import { ARAgingReportModal } from '@/components/customer/ARAgingReportModal';
import { Icons } from '@/components/ui/Icons';
import { formatSatangToBaht } from '@/utils/currency';

export default function CustomersPage() {
  const { user, branch } = useAuth();
  const effectiveBranchId = branch?.id ?? user?.branchId ?? undefined;

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerSummary | null>(null);

  const [isCreditModalOpen, setIsCreditModalOpen] = useState<boolean>(false);
  const [creditCustomer, setCreditCustomer] = useState<CustomerSummary | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [payCustomer, setPayCustomer] = useState<CustomerSummary | null>(null);

  const [isARAgingModalOpen, setIsARAgingModalOpen] = useState<boolean>(false);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await customerService.searchCustomers(search, effectiveBranchId, {
        pageSize: 100,
      });
      setCustomers(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลลูกค้าได้';
      setError(msg);
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, effectiveBranchId]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleDelete = async (customer: CustomerSummary) => {
    if (customer.outstandingBalance > 0) {
      alert(`ไม่สามารถลบลูกค้าได้เนื่องจากยังมียอดหนี้คงค้าง ฿${formatSatangToBaht(customer.outstandingBalance)}`);
      return;
    }
    const confirmed = window.confirm(`คุณต้องการลบข้อมูลลูกค้า "${customer.name}" ใช่หรือไม่?`);
    if (!confirmed) return;

    try {
      await customerService.deleteCustomer(customer.id);
      loadCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบข้อมูล';
      alert(msg);
    }
  };

  // คำนวณยอดสรุปภาพรวม
  const totalCustomers = customers.length;
  const totalDebt = customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  const totalCreditLimit = customers.reduce((acc, c) => acc + (c.creditLimit || 0), 0);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.Users className="w-7 h-7" />
            </span>
            ลูกค้าและบัญชีเงินเชื่อ
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            บริหารจัดการข้อมูลลูกค้า กำหนดวงเงินเครดิต และบันทึกการชำระหนี้คงค้าง
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsARAgingModalOpen(true)}
            className="flex-1 sm:flex-none min-h-[48px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Icons.BarChart3 className="w-5 h-5" />
            <span>รายงานลูกหนี้ (AR Aging)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setIsFormModalOpen(true);
            }}
            className="flex-1 sm:flex-none min-h-[48px] px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <Icons.Plus className="w-5 h-5 stroke-[2.5]" />
            <span>ลงทะเบียนลูกค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Icons.Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">ลูกค้าทั้งหมดในระบบ</span>
            <div className="text-2xl font-black text-white mt-0.5">{totalCustomers} ราย</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Icons.AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">ยอดหนี้ค้างชำระรวม (Outstanding)</span>
            <div className="text-2xl font-black text-rose-400 mt-0.5">฿{formatSatangToBaht(totalDebt)}</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Icons.CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">วงเงินเครดิตรวมที่อนุมัติ</span>
            <div className="text-2xl font-black text-amber-300 mt-0.5">฿{formatSatangToBaht(totalCreditLimit)}</div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อลูกค้า หรือเบอร์โทรศัพท์..."
            className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={loadCustomers}
            disabled={isLoading}
            className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icons.Refresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Icons.Loader className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm">กำลังโหลดข้อมูลลูกค้า...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-sm">{error}</div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
            <Icons.Users className="w-12 h-12 stroke-[1.5]" />
            <p className="text-base font-semibold">ไม่พบข้อมูลลูกค้า</p>
            <p className="text-xs">คลิกที่ปุ่ม &quot;ลงทะเบียนลูกค้าใหม่&quot; เพื่อเริ่มต้นสร้างโปรไฟล์ลูกค้า</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">ชื่อลูกค้า / ร้านค้า</th>
                  <th className="py-3.5 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3.5 px-4 text-right">วงเงินเครดิต</th>
                  <th className="py-3.5 px-4 text-right">ยอดหนี้ค้างชำระ</th>
                  <th className="py-3.5 px-4 text-right">วงเงินคงเหลือ</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {customers.map((c) => {
                  const availableCredit = getAvailableCredit(c);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>{c.name}</div>
                        {c.email && <div className="text-xs text-slate-500">{c.email}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {c.phone || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-white">
                        ฿{formatSatangToBaht(c.creditLimit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-400">
                        ฿{formatSatangToBaht(c.outstandingBalance)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-cyan-400">
                        ฿{formatSatangToBaht(availableCredit)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            c.isActive !== false
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-700/50 text-slate-400 border-slate-600'
                          }`}
                        >
                          {c.isActive !== false ? 'เปิดใช้งาน' : 'ระงับ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* ปุ่มรับชำระหนี้ */}
                          {c.outstandingBalance > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayCustomer(c);
                                setIsPayModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="บันทึกรับชำระเงินตัดหนี้"
                            >
                              <Icons.Receipt className="w-3.5 h-3.5" />
                              <span>รับชำระ</span>
                            </button>
                          )}

                          {/* ปุ่มปรับวงเงิน */}
                          <button
                            type="button"
                            onClick={() => {
                              setCreditCustomer(c);
                              setIsCreditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
                            title="ปรับเปลี่ยนวงเงินเครดิต"
                          >
                            <Icons.CreditCard className="w-4 h-4" />
                          </button>

                          {/* ปุ่มแก้ไข */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(c);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลลูกค้า"
                          >
                            <Icons.Edit className="w-4 h-4" />
                          </button>

                          {/* ปุ่มลบ */}
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                            title="ลบข้อมูลลูกค้า"
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        customer={editingCustomer}
        branchId={effectiveBranchId}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => loadCustomers()}
      />

      <CreditLimitModal
        isOpen={isCreditModalOpen}
        customer={creditCustomer}
        onClose={() => setIsCreditModalOpen(false)}
        onSuccess={() => loadCustomers()}
      />

      <PayCreditModal
        isOpen={isPayModalOpen}
        customer={payCustomer}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={() => loadCustomers()}
      />

      <ARAgingReportModal
        isOpen={isARAgingModalOpen}
        branchId={effectiveBranchId}
        onClose={() => setIsARAgingModalOpen(false)}
      />
    </div>
  );
}

