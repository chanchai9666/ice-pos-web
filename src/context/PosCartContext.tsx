'use client';

/**
 * React Context สำหรับจัดการสถานะตะกร้าสินค้า ระบบขาย และเสียงตอบรับของ POS
 * โครงการ ice-pos-web
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Product } from '@/types/catalog';
import { CartItem, CartSummary, ScanToast } from '@/types/pos';
import { ShiftInfo } from '@/types/shift';
import { shiftService } from '@/services/shift.service';
import { playSuccessBeep, playErrorBuzzer } from '@/utils/audio';

const STORAGE_KEY = 'ice_pos_cart_items';

interface PosCartContextType {
  items: CartItem[];
  summary: CartSummary;
  activeShift: ShiftInfo | null;
  isLoadingShift: boolean;
  toasts: ScanToast[];
  lastActiveItemId: string | null;
  addItem: (product: Product, quantity?: number, playSound?: boolean) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  addToast: (toast: Omit<ScanToast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  refreshActiveShift: (branchId: string) => Promise<void>;
  setActiveShift: (shift: ShiftInfo | null) => void;
}

const PosCartContext = createContext<PosCartContextType | null>(null);

export function PosCartProvider({
  children,
  branchId,
}: {
  children: React.ReactNode;
  branchId?: string;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastActiveItemId, setLastActiveItemId] = useState<string | null>(null);
  const [activeShift, setActiveShift] = useState<ShiftInfo | null>(null);
  const [isLoadingShift, setIsLoadingShift] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ScanToast[]>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // โหลดรายการสินค้าจาก LocalStorage เมื่อเริ่มต้น
  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load cart from storage:', e);
    }
  }, []);

  // บันทึกรายการสินค้าลง LocalStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to storage:', e);
    }
  }, [items, isMounted]);

  // ฟังก์ชันแสดง Toast Notification พร้อมลบอัตโนมัติใน 4 วินาที
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ScanToast, 'id' | 'timestamp'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ScanToast = {
        ...toast,
        id,
        timestamp: Date.now(),
      };

      if (toast.type === 'ERROR') {
        playErrorBuzzer();
      }

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  // ดึงข้อมูลกะการขายปัจจุบัน
  const refreshActiveShift = useCallback(
    async (targetBranchId: string) => {
      if (!targetBranchId) return;
      setIsLoadingShift(true);
      try {
        const res = await shiftService.getActiveShift(targetBranchId);
        // ตรวจสอบสถานะว่าต้องเป็น 'OPEN' จริง จึงจะนับเป็นกะที่กำลังเปิดใช้งาน
        if (res.data && res.data.status === 'OPEN') {
          setActiveShift(res.data);
        } else {
          setActiveShift(null);
        }
      } catch (err) {
        console.warn('Could not fetch active shift:', err);
      } finally {
        setIsLoadingShift(false);
      }
    },
    []
  );

  useEffect(() => {
    if (branchId) {
      refreshActiveShift(branchId);
    }
  }, [branchId, refreshActiveShift]);

  // ฟังก์ชันเพิ่มสินค้าลงในตะกร้า
  const addItem = useCallback(
    (product: Product, quantityToAdd: number = 1, playSound: boolean = true) => {
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.productId === product.id);

        if (existingIndex > -1) {
          // มีสินค้าในตะกร้าแล้ว ให้เพิ่มจำนวน
          const updated = [...prevItems];
          const current = updated[existingIndex];
          const newQty = current.quantity + quantityToAdd;
          updated[existingIndex] = {
            ...current,
            quantity: newQty,
            lineTotal: current.price * newQty,
          };
          setLastActiveItemId(current.id);
          return updated;
        }

        // เพิ่มรายการใหม่
        const unitPrice = product.price || 0;
        const resolvedUomId = product.sellUomId || product.baseUomId || product.baseUom?.id || '';
        const resolvedUomName = product.sellUom?.name || product.baseUom?.name || 'ชิ้น';

        const newItem: CartItem = {
          id: product.id,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode || undefined,
          price: unitPrice,
          quantity: quantityToAdd,
          uomId: resolvedUomId,
          uomName: resolvedUomName,
          imageUrl: product.imageUrl || undefined,
          categoryName: product.category?.name || undefined,
          taxRatePercent: product.tax ? (product.tax.rate <= 1 ? product.tax.rate * 100 : product.tax.rate) : 7,
          pricingType: product.productType === 'BY_WEIGHT' ? 'WEIGHT' : 'PIECE',
          lineTotal: unitPrice * quantityToAdd,
        };

        setLastActiveItemId(newItem.id);
        return [...prevItems, newItem];
      });

      if (playSound) {
        playSuccessBeep();
      }
    },
    []
  );

  // ฟังก์ชันปรับจำนวนสินค้า
  const updateQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      setLastActiveItemId(itemId);
      if (newQuantity <= 0) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: newQuantity,
              lineTotal: item.price * newQuantity,
            };
          }
          return item;
        })
      );
    },
    []
  );

  // ฟังก์ชันลบสินค้าออกจากตะกร้า
  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // ฟังก์ชันล้างตะกร้าทั้งหมด
  const clearCart = useCallback(() => {
    setItems([]);
    setLastActiveItemId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  // คำนวณสรุปยอดเงินรวม
  const summary: CartSummary = useMemo(() => {
    let totalQty = 0;
    let subtotalSatang = 0;
    let taxSatang = 0;

    items.forEach((item) => {
      totalQty += item.quantity;
      const lineSatang = item.lineTotal;
      subtotalSatang += lineSatang;

      // คำนวณ VAT ตามอัตราของสินค้า (สมมติราคารวมภาษีแล้ว หรือคำนวณแยกตามมาตรฐาน POS)
      // หากราคารวม VAT 7% แล้ว: VAT = Price * 7 / 107
      const vatRate = item.taxRatePercent || 7;
      const itemVat = (lineSatang * vatRate) / (100 + vatRate);
      taxSatang += itemVat;
    });

    const discountSatang = 0;
    const grandTotalSatang = subtotalSatang - discountSatang;

    return {
      itemCount: items.length,
      totalQuantity: totalQty,
      subtotal: Math.round(subtotalSatang),
      taxAmount: Math.round(taxSatang),
      discountAmount: discountSatang,
      grandTotal: Math.round(grandTotalSatang),
    };
  }, [items]);

  return (
    <PosCartContext.Provider
      value={{
        items,
        summary,
        activeShift,
        isLoadingShift,
        toasts,
        lastActiveItemId,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        addToast,
        removeToast,
        refreshActiveShift,
        setActiveShift,
      }}
    >
      {children}
    </PosCartContext.Provider>
  );
}

export function usePosCart() {
  const context = useContext(PosCartContext);
  if (!context) {
    throw new Error('usePosCart must be used within a PosCartProvider');
  }
  return context;
}
