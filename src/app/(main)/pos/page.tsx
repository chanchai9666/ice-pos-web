'use client';

/**
 * หน้าจอจุดขายสินค้าหน้าร้าน (POS Terminal)
 * โครงการ ice-pos-web
 *
 * ออกแบบตามมาตรฐาน Elderly-Friendly (เลย์เอาต์ 2 คอลัมน์, เป้าหมายสัมผัส >= 48px, คอนทราสต์สูง)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PosCartProvider, usePosCart } from '@/context/PosCartContext';
import { catalogService } from '@/services/catalog.service';
import { Category, Product } from '@/types/catalog';
import { PosSearchBar } from '@/components/pos/PosSearchBar';
import { PosCategoryTabs } from '@/components/pos/PosCategoryTabs';
import { PosProductGrid } from '@/components/pos/PosProductGrid';
import { PosCartPanel } from '@/components/pos/PosCartPanel';
import { PosScanToast } from '@/components/pos/PosScanToast';
import { PosCameraScannerModal } from '@/components/pos/PosCameraScannerModal';
import { PosShiftBanner } from '@/components/pos/PosShiftBanner';
import { PosOpenShiftModal } from '@/components/pos/PosOpenShiftModal';
import { shiftService } from '@/services/shift.service';
import { ShiftInfo } from '@/types/shift';
import { playErrorBuzzer } from '@/utils/audio';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Icons } from '@/components/ui/Icons';

function PosTerminalInner() {
  const { user, branch } = useAuth();
  const { addItem, addToast } = usePosCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

  // ข้อมูลสถานะกะการขายปัจจุบัน
  const [activeShift, setActiveShift] = useState<ShiftInfo | null>(null);
  const [isLoadingShift, setIsLoadingShift] = useState<boolean>(true);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState<boolean>(false);

  // ตรวจสอบสถานะกะการขายจาก API
  useEffect(() => {
    let isMounted = true;
    async function checkShift() {
      if (!branch?.id) return;
      setIsLoadingShift(true);
      try {
        const res = await shiftService.getActiveShift(branch.id);
        if (isMounted) {
          setActiveShift(res.data || null);
        }
      } catch (err) {
        console.error('Failed to load active shift:', err);
        if (isMounted) {
          setActiveShift(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingShift(false);
        }
      }
    }
    checkShift();
    return () => {
      isMounted = false;
    };
  }, [branch?.id]);

  // การดำเนินการเมื่อคลิกปุ่มชำระเงิน (สกัดกั้นหากยังไม่ได้เปิดกะ)
  const handleCheckout = () => {
    if (!activeShift) {
      setIsOpenShiftModalOpen(true);
      addToast({
        type: 'ERROR',
        title: 'ยังไม่ได้เปิดกะการขาย',
        message: 'กรุณาเปิดกะและบันทึกเงินสดเริ่มต้นในลิ้นชักก่อนคิดเงิน',
      });
      playErrorBuzzer();
      return;
    }

    addToast({
      type: 'SUCCESS',
      title: 'พร้อมรับชำระเงิน',
      message: 'ระบบพร้อมสำหรับการรับชำระเงินและพิมพ์ใบเสร็จ',
    });
  };

  // การแตะเลือกสินค้าเพื่อเพิ่มลงตะกร้า
  const handleSelectProduct = (product: Product) => {
    addItem(product, 1);
  };

  // การจัดการเมื่อสแกนบาร์โค้ดจากเครื่องสแกนฮาร์ดแวร์
  const handleBarcodeScanned = useCallback(
    async (barcode: string) => {
      try {
        // 1. ค้นหาในแคชรายการสินค้าที่มีอยู่แล้วก่อน
        const localFound = products.find(
          (p) => p.barcode === barcode || p.sku?.toLowerCase() === barcode.toLowerCase()
        );
        if (localFound) {
          addItem(localFound, 1);
          addToast({
            type: 'SUCCESS',
            title: 'เพิ่มสินค้าลงบิลแล้ว',
            message: localFound.name,
            code: barcode,
          });
          return;
        }

        // 2. ค้นหาจาก API ด้วย Barcode / SKU Lookup
        const res = await catalogService.lookupProduct(barcode);
        if (res.data) {
          addItem(res.data, 1);
          addToast({
            type: 'SUCCESS',
            title: 'เพิ่มสินค้าลงบิลแล้ว',
            message: res.data.name,
            code: barcode,
          });
        } else {
          addToast({
            type: 'ERROR',
            title: 'ไม่พบบาร์โค้ดในระบบ',
            message: `ไม่พบข้อมูลสินค้าสำหรับรหัส "${barcode}"`,
            code: barcode,
          });
        }
      } catch {
        addToast({
          type: 'ERROR',
          title: 'ไม่พบบาร์โค้ดในระบบ',
          message: `ไม่พบข้อมูลสินค้าสำหรับรหัส "${barcode}"`,
          code: barcode,
        });
      }
    },
    [products, addItem, addToast]
  );

  // ดักจับบาร์โค้ดฮาร์ดแวร์ทั่วทั้งหน้าจอ
  useBarcodeScanner({
    onScan: handleBarcodeScanned,
  });

  // ดึงข้อมูลหมวดหมู่สินค้า
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const res = await catalogService.getCategories({ pageSize: 100 });
        if (isMounted && res.data) {
          setCategories(res.data.filter((c) => c.isActive !== false));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // ดึงข้อมูลรายการสินค้า
  const loadProducts = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await catalogService.getProducts({
        isActive: true,
        pageSize: 100,
      });
      if (res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // กรองรายการสินค้าตามหมวดหมู่และคำค้นหา
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // กรองตามหมวดหมู่
      if (selectedCategoryId !== 'ALL' && product.categoryId !== selectedCategoryId) {
        return false;
      }
      // กรองตามคำค้นหา (ชื่อสินค้า, รหัส SKU หรือ บาร์โค้ด)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = product.name?.toLowerCase().includes(query);
        const matchSku = product.sku?.toLowerCase().includes(query);
        const matchBarcode = product.barcode?.toLowerCase().includes(query);
        if (!matchName && !matchSku && !matchBarcode) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategoryId, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-[1920px] mx-auto gap-4">
      {/* ส่วนหัวหน้าจอ POS */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Icons.ShoppingCart className="w-7 h-7 text-cyan-400" />
            จุดขายสินค้าหน้าร้าน (POS Terminal)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            สาขา: <span className="text-slate-200 font-medium">{branch?.name || '-'}</span> • แคชเชียร์: <span className="text-slate-200 font-medium">{user?.fullName || user?.username}</span>
          </p>
        </div>
      </div>

      {/* แถบสถานะกะการขาย (Shift Banner) */}
      <PosShiftBanner
        shift={activeShift}
        isLoading={isLoadingShift}
        onOpenShiftClick={() => setIsOpenShiftModalOpen(true)}
      />

      {/* โครงสร้างเลย์เอาต์หลัก 2 คอลัมน์ (ซ้าย 60-65% แคตตาล็อก, ขวา 35-40% ตะกร้าและคิดเงิน) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* คอลัมน์ซ้าย: แคตตาล็อกสินค้า (สัดส่วน 7 จาก 12 คอลัมน์ ≈ 60%) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          {/* ช่องค้นหาด่วน และปุ่มเปิดกล้องสแกนบาร์โค้ด */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <PosSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="h-12 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-2.5 font-medium transition-all active:scale-95 shadow-sm min-h-[48px] shrink-0"
              title="เปิดกล้องสแกนบาร์โค้ด"
            >
              <Icons.Camera className="w-5 h-5 text-cyan-400" />
              <span className="hidden sm:inline text-sm font-semibold">สแกนด้วยกล้อง</span>
            </button>
          </div>

          {/* แถบเลือกหมวดหมู่ */}
          <PosCategoryTabs
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />

          {/* ตารางการ์ดสินค้า */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            <PosProductGrid
              products={filteredProducts}
              onSelectProduct={handleSelectProduct}
              isLoading={isLoadingCatalog}
            />
          </div>
        </div>

        {/* คอลัมน์ขวา: ตะกร้าขายสินค้า (สัดส่วน 5 จาก 12 คอลัมน์ ≈ 40%) */}
        <div id="pos-cart-container" className="lg:col-span-5 xl:col-span-4 flex flex-col h-full overflow-hidden bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-xl">
          <PosCartPanel
            onCheckout={handleCheckout}
            isShiftActive={!!activeShift}
          />
        </div>
      </div>

      {/* แบนเนอร์แจ้งเตือนการสแกนบาร์โค้ด */}
      <PosScanToast />

      {/* หน้าต่างสแกนบาร์โค้ดด้วยกล้อง */}
      <PosCameraScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScan={handleBarcodeScanned}
      />

      {/* หน้าต่างเปิดกะการขาย */}
      <PosOpenShiftModal
        isOpen={isOpenShiftModalOpen}
        branchId={branch?.id}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onSuccess={(newShift) => {
          setActiveShift(newShift);
          addToast({
            type: 'SUCCESS',
            title: 'เปิดกะการขายสำเร็จ',
            message: `เปิดกะขายเรียบร้อย เงินทอนเริ่มต้น ฿${(newShift.startingCash / 100).toLocaleString()}`,
          });
        }}
      />
    </div>
  );
}

export default function PosPage() {
  const { branch } = useAuth();

  return (
    <PosCartProvider branchId={branch?.id}>
      <PosTerminalInner />
    </PosCartProvider>
  );
}
