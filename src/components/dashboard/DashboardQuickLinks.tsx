'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';

export function DashboardQuickLinks() {
  const links = [
    {
      title: 'ขายหน้าร้าน (POS)',
      desc: 'เปิดหน้าจอแคชเชียร์ คิดเงิน และพิมพ์ใบเสร็จ',
      href: '/pos',
      icon: <Icons.ShoppingCart className="w-5 h-5" />,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-400',
    },
    {
      title: 'คลังและสต็อกสินค้า',
      desc: 'ตรวจนับสินค้า ปรับสต็อก และจัดการใบสั่งซื้อ',
      href: '/inventory',
      icon: <Icons.Boxes className="w-5 h-5" />,
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400 hover:border-blue-400',
    },
    {
      title: 'ลูกค้าและเงินเชื่อ',
      desc: 'ดูรายการลูกหนี้ วงเงินเครดิต และรับชำระหนี้',
      href: '/customers',
      icon: <Icons.Users className="w-5 h-5" />,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-400',
    },
    {
      title: 'รายงานสรุปยอดขาย',
      desc: 'วิเคราะห์รายได้ กำไรขั้นต้น และภาษีมูลค่าเพิ่ม',
      href: '/reports',
      icon: <Icons.BarChart3 className="w-5 h-5" />,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`p-4 rounded-2xl bg-gradient-to-br ${link.color} border transition-all duration-200 group flex items-start gap-3.5 shadow-xs hover:shadow-md hover:-translate-y-0.5`}
        >
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            {link.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                {link.title}
              </h3>
              <Icons.ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
              {link.desc}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

