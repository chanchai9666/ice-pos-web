'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Icons } from '@/components/ui/Icons';
import { Badge } from '@/components/ui/Badge';

export default function PosPage() {
  const { user, branch } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Icons.ShoppingCart className="w-6 h-6 text-cyan-400" />
            หน้าจอขายหน้าร้าน (POS Terminal)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            สาขา: <span className="text-slate-200 font-medium">{branch?.name || '-'}</span> • แคชเชียร์: <span className="text-slate-200 font-medium">{user?.fullName || user?.username}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="warning">
            ยังไม่ได้เปิดกะขาย
          </Badge>
          {user?.role !== 'CASHIER' && (
            <Link
              href="/catalog"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Icons.Package className="w-4 h-4 text-cyan-400" />
              จัดการสินค้า
            </Link>
          )}
        </div>
      </div>

      {/* POS Ready Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
          <Icons.ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">
          พร้อมสำหรับการขายหน้าร้าน
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          หน้าจอขายหน้าร้านกำลังเชื่อมต่อกับระบบจัดการสินค้าและแคตตาล็อก คุณสามารถเข้าสู่ระบบจัดการสินค้าเพื่อตรวจสอบรายการสินค้า ราคา และสต็อกได้ทันที
        </p>

        {user?.role !== 'CASHIER' ? (
          <div className="pt-4">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Icons.Package className="w-4 h-4" />
              เข้าสู่ระบบจัดการสินค้าและหมวดหมู่
            </Link>
          </div>
        ) : (
          <div className="pt-2 text-xs text-slate-500">
            * สิทธิ์แคชเชียร์สามารถใช้งานหน้าขายและเปิดกะการทำงานได้
          </div>
        )}
      </div>
    </div>
  );
}
