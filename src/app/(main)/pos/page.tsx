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
import { Icons } from '@/components/ui/Icons';

function PosTerminalInner() {
  const { user, branch } = useAuth();
  const { addItem } = usePosCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);

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

  // การแตะเลือกสินค้าเพื่อเพิ่มลงตะกร้า
  const handleSelectProduct = (product: Product) => {
    addItem(product, 1);
  };

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

      {/* โครงสร้างเลย์เอาต์หลัก 2 คอลัมน์ (ซ้าย 60-65% แคตตาล็อก, ขวา 35-40% ตะกร้าและคิดเงิน) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* คอลัมน์ซ้าย: แคตตาล็อกสินค้า (สัดส่วน 7 จาก 12 คอลัมน์ ≈ 60%) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full overflow-hidden bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 space-y-4">
          {/* ช่องค้นหาด่วน */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <PosSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />
            </div>
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
          <PosCartPanel />
        </div>
      </div>
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
