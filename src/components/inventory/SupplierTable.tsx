'use client';

/**
 * ตารางแสดงรายชื่อผู้จัดจำหน่ายและคู่ค้า (SupplierTable)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: GET /suppliers, DELETE /suppliers/{id}
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Supplier } from '@/types/procurement';
import { procurementService } from '@/services/procurement.service';
import { SupplierFormModal } from '@/components/inventory/SupplierFormModal';
import { Icons } from '@/components/ui/Icons';

export function SupplierTable() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const loadSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await procurementService.getSuppliers({
        search: search.trim() || undefined,
      });
      setSuppliers(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดรายชื่อผู้จัดจำหน่ายได้';
      setError(msg);
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleDelete = async (supplier: Supplier) => {
    const confirmDelete = window.confirm(
      `คุณต้องการลบ/ระงับการใช้งานคู่ค้า "${supplier.name}" ใช่หรือไม่?`
    );
    if (!confirmDelete) return;

    try {
      await procurementService.deleteSupplier(supplier.id);
      loadSuppliers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบข้อมูล';
      alert(msg);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อคู่ค้า, รหัส หรือเบอร์โทร..."
            className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={loadSuppliers}
            disabled={isLoading}
            className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Icons.Refresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingSupplier(null);
              setIsFormOpen(true);
            }}
            className="h-11 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Icons.Plus className="w-4 h-4 stroke-[2.5]" />
            <span>เพิ่มผู้จัดจำหน่าย</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Icons.Loader className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm">กำลังโหลดรายชื่อผู้จัดจำหน่าย...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
            <Icons.Building2 className="w-12 h-12 stroke-[1.5]" />
            <p className="text-base font-semibold">ไม่พบข้อมูลผู้จัดจำหน่าย</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">ชื่อผู้จัดจำหน่าย</th>
                  <th className="py-3.5 px-4">รหัสคู่ค้า</th>
                  <th className="py-3.5 px-4">ผู้ติดต่อ / เบอร์โทร</th>
                  <th className="py-3.5 px-4">เลขประจำตัวผู้เสียภาษี</th>
                  <th className="py-3.5 px-4 text-center">เครดิตเทอม</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{s.name}</div>
                      {s.email && <div className="text-xs text-slate-500">{s.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {s.code || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">
                      <div className="font-medium text-slate-200">{s.contactName || '-'}</div>
                      <div className="text-slate-400 font-mono">{s.phone || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {s.taxId || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-amber-400">
                      {s.creditDays !== undefined && s.creditDays !== null ? `${s.creditDays} วัน` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          s.isActive
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600'
                        }`}
                      >
                        {s.isActive ? 'เปิดใช้งาน' : 'ระงับ'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSupplier(s);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลคู่ค้า"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                          title="ลบข้อมูลคู่ค้า"
                        >
                          <Icons.Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <SupplierFormModal
        isOpen={isFormOpen}
        supplier={editingSupplier}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => loadSuppliers()}
      />
    </div>
  );
}
