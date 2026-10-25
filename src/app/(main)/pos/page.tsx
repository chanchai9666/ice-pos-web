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
import { inventoryService } from '@/services/inventory.service';
import { Category, Product } from '@/types/catalog';
import { StockLevelMap } from '@/types/inventory';
import { CartItem } from '@/types/pos';
import { PosSearchBar } from '@/components/pos/PosSearchBar';
import { PosCategoryTabs } from '@/components/pos/PosCategoryTabs';
import { PosProductGrid } from '@/components/pos/PosProductGrid';
import { PosCartPanel } from '@/components/pos/PosCartPanel';
import { PosScanToast } from '@/components/pos/PosScanToast';
import { PosCameraScannerModal } from '@/components/pos/PosCameraScannerModal';
import { PosShiftBanner } from '@/components/pos/PosShiftBanner';
import { PosOpenShiftModal } from '@/components/pos/PosOpenShiftModal';
import { PosCheckoutModal } from '@/components/pos/PosCheckoutModal';
import { playErrorBuzzer } from '@/utils/audio';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Icons } from '@/components/ui/Icons';

function PosTerminalInner() {
  const { user, branch } = useAuth();
  const { items, addItem, addToast, activeShift, setActiveShift, isLoadingShift } = usePosCart();

  // ใช้ branchId จากสาขาที่เลือก หรือ fallback ไปยังสาขาประจำตัวผู้ใช้ (กรณี login ด้วย Username/Password)
  const effectiveBranchId = branch?.id ?? user?.branchId ?? undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMap, setStockMap] = useState<StockLevelMap>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState<boolean>(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);

  // คำนวณสต็อกคงเหลือสุทธิแบบ Real-time โดยหักจำนวนสินค้าที่อยู่ในตะกร้าออก (ยกเว้นสินค้าประเภทชั่งขาย)
  const effectiveStockMap = useMemo(() => {
    const map: StockLevelMap = { ...stockMap };
    for (const item of items) {
      if (item.pricingType !== 'WEIGHT') {
        const baseStock = typeof map[item.productId] === 'number' ? map[item.productId] : 0;
        map[item.productId] = baseStock - item.quantity;
      }
    }
    return map;
  }, [stockMap, items]);

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

    setIsCheckoutModalOpen(true);
  };

  // การแตะเลือกสินค้าเพื่อเพิ่มลงตะกร้า
  const handleSelectProduct = (product: Product) => {
    // หากเป็นสินค้าที่ไม่ใช่ชั่งขายและสต็อกคงเหลือสุทธิหมดแล้ว ให้แจ้งเตือนผู้ใช้งาน (Toast Notification)
    if (product.productType !== 'BY_WEIGHT') {
      const currentStock =
        typeof effectiveStockMap[product.id] === 'number' ? effectiveStockMap[product.id] : 0;
      if (currentStock <= 0) {
        addToast({
          type: 'INFO',
          title: 'สินค้าหมดสต็อก',
          message: `สินค้า "${product.name}" มีสต็อกในระบบเป็น 0 (อนุญาตให้ขายต่อได้)`,
        });
      }
    }

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
          const currentStock =
            typeof effectiveStockMap[localFound.id] === 'number'
              ? effectiveStockMap[localFound.id]
              : 0;
          if (localFound.productType !== 'BY_WEIGHT' && currentStock <= 0) {
            addToast({
              type: 'INFO',
              title: 'สินค้าหมดสต็อก',
              message: `สินค้า "${localFound.name}" มีสต็อกในระบบเป็น 0 (อนุญาตให้ขายต่อได้)`,
            });
          } else {
            addToast({
              type: 'SUCCESS',
              title: 'เพิ่มสินค้าลงบิลแล้ว',
              message: localFound.name,
              code: barcode,
            });
          }
          addItem(localFound, 1);
          return;
        }

        // 2. ค้นหาจาก API ด้วย Barcode / SKU Lookup
        const res = await catalogService.lookupProduct(barcode);
        if (res.data) {
          const currentStock =
            typeof effectiveStockMap[res.data.id] === 'number'
              ? effectiveStockMap[res.data.id]
              : 0;
          if (res.data.productType !== 'BY_WEIGHT' && currentStock <= 0) {
            addToast({
              type: 'INFO',
              title: 'สินค้าหมดสต็อก',
              message: `สินค้า "${res.data.name}" มีสต็อกในระบบเป็น 0 (อนุญาตให้ขายต่อได้)`,
            });
          } else {
            addToast({
              type: 'SUCCESS',
              title: 'เพิ่มสินค้าลงบิลแล้ว',
              message: res.data.name,
              code: barcode,
            });
          }
          addItem(res.data, 1);
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
    [products, effectiveStockMap, addItem, addToast]
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

  // ดึงข้อมูลยอดสต็อกสินค้าตามสาขาปัจจุบัน
  const loadStockLevels = useCallback(async () => {
    if (!effectiveBranchId) return;
    try {
      const res = await inventoryService.getStockLevels({
        branchId: effectiveBranchId,
        pageSize: 100,
      });
      if (res.data && Array.isArray(res.data)) {
        const map: StockLevelMap = {};
        res.data.forEach((item) => {
          if (item.productId) {
            map[item.productId] = item.quantity;
          }
        });

        // หากมีหน้าข้อมูลมากกว่า 1 หน้า ให้ดึงสต็อกหน้าที่เหลือมาประกอบให้ครบถ้วน
        if (res.meta?.totalPages && res.meta.totalPages > 1) {
          const pagePromises = [];
          for (let p = 2; p <= res.meta.totalPages; p++) {
            pagePromises.push(
              inventoryService.getStockLevels({
                branchId: effectiveBranchId,
                page: p,
                pageSize: 100,
              })
            );
          }
          const nextPages = await Promise.all(pagePromises);
          nextPages.forEach((pageRes) => {
            if (pageRes.data && Array.isArray(pageRes.data)) {
              pageRes.data.forEach((item) => {
                if (item.productId) {
                  map[item.productId] = item.quantity;
                }
              });
            }
          });
        }

        setStockMap(map);
      }
    } catch (err) {
      console.warn('Failed to load branch stock levels:', err);
    }
  }, [effectiveBranchId]);

  useEffect(() => {
    loadStockLevels();
  }, [loadStockLevels]);

  // จัดการเมื่อการขายสำเร็จและเริ่มบิลใหม่: ปรับลดยอดสต็อกทันที (Optimistic) และดึงข้อมูลจริงจาก API (Revalidate)
  const handleSaleSuccess = useCallback(
    (soldItems: CartItem[]) => {
      // 1. Optimistic update: ปรับลดยอดสต็อกในแมปทันที ป้องกันหน้าจอกระพริบ
      setStockMap((prev) => {
        const next = { ...prev };
        soldItems.forEach((it) => {
          if (it.pricingType !== 'WEIGHT' && typeof next[it.productId] === 'number') {
            next[it.productId] = next[it.productId] - it.quantity;
          }
        });
        return next;
      });

      // 2. ดึงข้อมูลยอดสต็อกคงเหลือล่าสุดจากเซิร์ฟเวอร์
      loadStockLevels();
    },
    [loadStockLevels]
  );

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
            isLoading={isLoadingCatalog}
          />

          {/* ตารางการ์ดสินค้า */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            <PosProductGrid
              products={filteredProducts}
              onSelectProduct={handleSelectProduct}
              isLoading={isLoadingCatalog}
              stockMap={effectiveStockMap}
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
        branchId={effectiveBranchId}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onSuccess={(newShift) => {
          setActiveShift(newShift);
          addToast({
            type: 'SUCCESS',
            title: 'เปิดกะการขายสำเร็จ',
            message: `เปิดกะขายเรียบร้อย เงินทอนเริ่มต้น ฿${(newShift.openingCash / 100).toLocaleString()}`,
          });
        }}
      />

      {/* หน้าต่างชำระเงินหน้าร้าน */}
      <PosCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        branchId={effectiveBranchId}
        cashierName={user?.fullName || user?.username}
        onSaleSuccess={handleSaleSuccess}
      />
    </div>
  );
}

export default function PosPage() {
  const { branch, user } = useAuth();

  return (
    <PosCartProvider branchId={branch?.id ?? user?.branchId ?? undefined}>
      <PosTerminalInner />
    </PosCartProvider>
  );
}
