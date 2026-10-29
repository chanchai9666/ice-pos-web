'use client';

/**
 * หน้าจัดการผู้ใช้งานและพนักงาน (User & Staff Management)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: /users
 * ออกแบบตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, High Contrast WCAG 2.1 AA)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserResponse } from '@/types/user';
import { userService } from '@/services/user.service';
import { UserFormModal } from '@/components/user/UserFormModal';
import { ResetPasswordModal } from '@/components/user/ResetPasswordModal';
import { ResetPinModal } from '@/components/user/ResetPinModal';
import { Icons } from '@/components/ui/Icons';

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordUser, setPasswordUser] = useState<UserResponse | null>(null);

  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinUser, setPinUser] = useState<UserResponse | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await userService.getUsers({
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        search: search.trim() || undefined,
      });
      setUsers(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถโหลดรายชื่อพนักงานได้';
      setError(msg);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUnlock = async (user: UserResponse) => {
    const confirmUnlock = window.confirm(`คุณต้องการปลดล็อกบัญชีของ "${user.name}" ใช่หรือไม่?`);
    if (!confirmUnlock) return;

    try {
      await userService.unlockUser(user.id);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถปลดล็อกบัญชีได้';
      alert(msg);
    }
  };

  const handleDelete = async (user: UserResponse) => {
    const confirmDelete = window.confirm(
      `คุณต้องการระงับการใช้งานบัญชีของ "${user.name} (${user.username})" ใช่หรือไม่?`
    );
    if (!confirmDelete) return;

    try {
      await userService.deleteUser(user.id);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการระงับบัญชี';
      alert(msg);
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            ผู้ดูแลระบบ (ADMIN)
          </span>
        );
      case 'MANAGER':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            ผู้จัดการ (MANAGER)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            แคชเชียร์ (CASHIER)
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.UserCog className="w-7 h-7" />
            </span>
            จัดการพนักงานและสิทธิ์การใช้งาน
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            บริหารบัญชีผู้ใช้งาน แคชเชียร์ สิทธิ์การเข้าถึง และการรีเซ็ตรหัสผ่าน/PIN
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setIsFormModalOpen(true);
          }}
          className="min-h-[48px] px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Icons.Plus className="w-5 h-5 stroke-[2.5]" />
          <span>สร้างบัญชีพนักงานใหม่</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อ หรือ Username..."
            className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl text-sm text-white focus:outline-none"
          />
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {(
            [
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'ADMIN', label: 'Admin' },
              { id: 'MANAGER', label: 'Manager' },
              { id: 'CASHIER', label: 'Cashier' },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === r.id
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
          className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer self-end sm:self-auto"
        >
          <Icons.Refresh className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Icons.Loader className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm">กำลังโหลดรายชื่อพนักงาน...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
            <Icons.User className="w-12 h-12 stroke-[1.5]" />
            <p className="text-base font-semibold">ไม่พบข้อมูลพนักงาน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4 text-center">บทบาท</th>
                  <th className="py-3.5 px-4">สาขาที่สังกัด</th>
                  <th className="py-3.5 px-4 text-center">สถานะบัญชี</th>
                  <th className="py-3.5 px-4">เข้าสู่ระบบล่าสุด</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {u.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                      {u.username}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {renderRoleBadge(u.role)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">
                      {u.branch?.name || (u.branchId ? `สาขา #${u.branchId.substring(0, 8)}` : 'ทุกสาขา / สนง.ใหญ่')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.isLocked ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          ถูกล็อก (Locked)
                        </span>
                      ) : u.isActive !== false ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          ปกติ
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700/50 text-slate-400 border border-slate-600">
                          ระงับ
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('th-TH') : 'ยังไม่เคยล็อกอิน'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* ปลดล็อกบัญชี (กรณีโดนล็อก) */}
                        {u.isLocked && (
                          <button
                            type="button"
                            onClick={() => handleUnlock(u)}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer"
                            title="ปลดล็อกบัญชี"
                          >
                            ปลดล็อก
                          </button>
                        )}

                        {/* รีเซ็ตรหัสผ่าน */}
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordUser(u);
                            setIsPasswordModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
                          title="รีเซ็ตรหัสผ่านพนักงาน"
                        >
                          <Icons.RotateCw className="w-4 h-4" />
                        </button>

                        {/* รีเซ็ต PIN แคชเชียร์ */}
                        <button
                          type="button"
                          onClick={() => {
                            setPinUser(u);
                            setIsPinModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors cursor-pointer"
                          title="รีเซ็ต PIN ล็อกอินด่วน"
                        >
                          <Icons.Calculator className="w-4 h-4" />
                        </button>

                        {/* แก้ไขข้อมูล */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setIsFormModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลพนักงาน"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>

                        {/* ระงับการใช้งาน */}
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                          title="ระงับบัญชีพนักงาน"
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

      {/* Modals */}
      <UserFormModal
        isOpen={isFormModalOpen}
        user={editingUser}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => loadUsers()}
      />

      <ResetPasswordModal
        isOpen={isPasswordModalOpen}
        user={passwordUser}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => loadUsers()}
      />

      <ResetPinModal
        isOpen={isPinModalOpen}
        user={pinUser}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => loadUsers()}
      />
    </div>
  );
}

