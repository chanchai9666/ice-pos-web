'use client';

import React from 'react';
import { Icons } from '@/components/ui/Icons';

export type InventoryTabType = 'stocks' | 'orders' | 'receipts' | 'suppliers' | 'transfers';

export interface InventoryTabsProps {
  activeTab: InventoryTabType;
  onTabChange: (tab: InventoryTabType) => void;
  ordersBadge?: number;
  receiptsBadge?: number;
}

export function InventoryTabs({
  activeTab,
  onTabChange,
  ordersBadge,
  receiptsBadge,
}: InventoryTabsProps) {
  const tabs = [
    {
      id: 'stocks' as InventoryTabType,
      label: 'สต็อกคงเหลือ',
      description: 'ภาพรวมสต็อกและตรวจนับ',
      icon: Icons.Boxes,
      badge: undefined,
    },
    {
      id: 'orders' as InventoryTabType,
      label: 'ใบสั่งซื้อสินค้า (PO)',
      description: 'ออกคำสั่งซื้อและติดตาม',
      icon: Icons.Package,
      badge: ordersBadge,
    },
    {
      id: 'receipts' as InventoryTabType,
      label: 'ตรวจรับสินค้าเข้าคลัง (GR)',
      description: 'ตรวจรับสินค้าจริงและนำเข้าสต็อก',
      icon: Icons.Barcode,
      badge: receiptsBadge,
    },
    {
      id: 'transfers' as InventoryTabType,
      label: 'โอนย้ายสินค้า (Transfers)',
      description: 'ส่งและรับสินค้าระหว่างสาขา',
      icon: Icons.RotateCw,
      badge: undefined,
    },
    {
      id: 'suppliers' as InventoryTabType,
      label: 'ผู้จัดจำหน่าย (Suppliers)',
      description: 'จัดการข้อมูลคู่ค้าและเครดิตเทอม',
      icon: Icons.Building2,
      badge: undefined,
    },
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-1.5 shadow-lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`min-h-[52px] px-4 py-2.5 rounded-xl flex items-center justify-between sm:justify-start gap-3 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`p-2 rounded-lg ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <div className="text-left">
                  <div className="text-sm sm:text-base leading-tight font-semibold tracking-wide">
                    {tab.label}
                  </div>
                  <div
                    className={`text-xs hidden md:block mt-0.5 ${
                      isActive ? 'text-cyan-100' : 'text-slate-500'
                    }`}
                  >
                    {tab.description}
                  </div>
                </div>
              </div>

              {/* Badge จำนวนค้างหรือสถานะ */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`ml-auto px-2 py-0.5 text-xs font-black rounded-full ${
                    isActive
                      ? 'bg-white text-cyan-700'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
