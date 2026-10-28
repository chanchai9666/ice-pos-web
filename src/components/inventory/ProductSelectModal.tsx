'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '@/components/ui/Icons';
import { Product, Category } from '@/types/catalog';
import { catalogService } from '@/services/catalog.service';
import { inventoryService } from '@/services/inventory.service';
import { toBaht, formatBaht } from '@/utils/currencyHelper';

export interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  title?: string;
  alreadySelectedProductIds?: string[];
  onSelectProducts: (selectedProducts: Product[]) => void;
}

export function ProductSelectModal({
  isOpen,
  onClose,
  branchId,
  title = 'เลือกสินค้าเข้าเอกสาร',
  alreadySelectedProductIds = [],
  onSelectProducts,
}: ProductSelectModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  // Selected Product IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // โหลดข้อมูลสินค้าและสต็อกเมื่อเปิด Modal
  useEffect(() => {
    if (!isOpen) return;

    // รีเซ็ตการเลือกและการค้นหาเมื่อเปิด
    setSearchQuery('');
    setSelectedCategoryId('ALL');
    setSelectedIds(new Set());
    setErrorMessage(null);
    setIsLoading(true);

    const loadData = async () => {
      try {
        const [productsRes, categoriesRes, stockRes] = await Promise.all([
          catalogService.getProducts({ page: 1, pageSize: 100, isActive: true }, { silent: true }),
          catalogService.getCategories({ page: 1, pageSize: 100 }, { silent: true }).catch(() => null),
          branchId
            ? inventoryService.getStockLevels({ branchId, page: 1, pageSize: 100 }).catch(() => null)
            : Promise.resolve(null),
        ]);

        let loadedProducts = productsRes?.data || [];
        const productTotalPages =
          (productsRes?.meta as { pagination?: { totalPages?: number } } | undefined)?.pagination?.totalPages ||
          productsRes?.meta?.totalPages ||
          1;

        if (productTotalPages > 1) {
          const productPagePromises = [];
          for (let p = 2; p <= productTotalPages; p++) {
            productPagePromises.push(
              catalogService.getProducts({ page: p, pageSize: 100, isActive: true }, { silent: true })
            );
          }
          const nextProductPages = await Promise.all(productPagePromises);
          nextProductPages.forEach((pageRes) => {
            if (pageRes?.data && Array.isArray(pageRes.data)) {
              loadedProducts = loadedProducts.concat(pageRes.data);
            }
          });
        }

        if (loadedProducts.length > 0) {
          // ไม่แสดงสินค้าแบบชั่งขาย (Exclude BY_WEIGHT)
          const filtered = loadedProducts.filter((p) => p.productType !== 'BY_WEIGHT');
          setProducts(filtered);
        } else {
          setProducts([]);
        }

        if (categoriesRes && categoriesRes.data) {
          setCategories(categoriesRes.data);
        }

        if (stockRes && stockRes.data) {
          const map: Record<string, number> = {};
          stockRes.data.forEach((s) => {
            map[s.productId] = s.quantity;
          });

          const stockTotalPages =
            (stockRes.meta as { pagination?: { totalPages?: number } } | undefined)?.pagination?.totalPages ||
            stockRes.meta?.totalPages ||
            1;

          if (stockTotalPages > 1 && branchId) {
            const stockPagePromises = [];
            for (let p = 2; p <= stockTotalPages; p++) {
              stockPagePromises.push(
                inventoryService.getStockLevels({ branchId, page: p, pageSize: 100 }).catch(() => null)
              );
            }
            const nextStockPages = await Promise.all(stockPagePromises);
            nextStockPages.forEach((pageRes) => {
              if (pageRes?.data && Array.isArray(pageRes.data)) {
                pageRes.data.forEach((s) => {
                  map[s.productId] = s.quantity;
                });
              }
            });
          }

          setStockMap(map);
        }
      } catch (err: unknown) {
        console.error('Failed to load products or stock for modal:', err);
        setErrorMessage('ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, branchId]);

  // สินค้าที่ผ่านการกรอง (Search & Category)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      // ตรวจสอบหมวดหมู่
      if (selectedCategoryId !== 'ALL' && p.categoryId !== selectedCategoryId) {
        return false;
      }

      // ตรวจสอบคำค้นหา
      if (!q) return true;

      const matchName = p.name?.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);

      return matchName || matchSku || matchBarcode;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // จัดการการเลือก / ยกเลิกการเลือก
  const toggleSelectProduct = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // เลือกทั้งหมดในรายการที่กรองอยู่
  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.add(p.id));
      return next;
    });
  };

  // ยกเลิกการเลือกทั้งหมด
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // ยืนยันการเลือก
  const handleConfirm = () => {
    const selectedList = products.filter((p) => selectedIds.has(p.id));
    onSelectProducts(selectedList);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.Boxes className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
              <p className="text-xs text-slate-400">
                เลือกสินค้าเพื่อเพิ่มลงในรายการ (แสดงเฉพาะสินค้าแบบระบุชิ้น/แพ็ค และสต็อกคงเหลือ)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          >
            <Icons.Close className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* กล่องค้นหา */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Icons.Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาด้วยชื่อสินค้า, รหัส SKU, หรือบาร์โค้ด..."
                className="w-full pl-11 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[48px]"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  <Icons.Close className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* หมวดหมู่สินค้า */}
            {categories.length > 0 && (
              <div className="sm:w-64">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full h-[48px] min-h-[48px] px-3.5 py-0 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="ALL">-- ทุกหมวดหมู่สินค้า --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* แถบตัวเลือกด่วน */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-xs text-slate-400 font-medium">
              พบสินค้า <span className="font-bold text-cyan-400">{filteredProducts.length}</span> รายการ
              {selectedIds.size > 0 && (
                <span className="ml-2 text-emerald-400 font-bold">
                  (เลือกแล้ว {selectedIds.size} รายการ)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                disabled={filteredProducts.length === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                เลือกทั้งหมดในหน้านี้
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  ล้างที่เลือก ({selectedIds.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product List Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[50vh] space-y-2">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
              <Icons.AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="inline-block animate-spin text-cyan-400">
                <Icons.RotateCw className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">กำลังโหลดข้อมูลสินค้าและสต็อกคงเหลือ...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <Icons.Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold text-sm">ไม่พบรายการสินค้าที่ตรงกับคำค้นหา</p>
              <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredProducts.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const isAlreadyInDoc = alreadySelectedProductIds.includes(product.id);
                const stockQty = stockMap[product.id] ?? 0;
                const isOutOfStock = stockQty <= 0;
                const costBaht = product.costPerBaseUnit ? toBaht(product.costPerBaseUnit) : 0;
                const sellPriceBaht = product.price ? toBaht(product.price) : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => toggleSelectProduct(product.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/80 ring-1 ring-cyan-500/50 shadow-md shadow-cyan-950/20'
                        : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800'
                    }`}
                  >
                    {/* Checkbox & Details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Checkbox Box */}
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                            : 'border-slate-600 bg-slate-900 text-transparent'
                        }`}
                      >
                        <Icons.Check className="w-4 h-4 stroke-[3]" />
                      </div>

                      {/* ข้อมูลสินค้า */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {product.name}
                          </h4>
                          {isAlreadyInDoc && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                              อยู่ในรายการแล้ว
                            </span>
                          )}
                          {product.category && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px]">
                              {product.category.name}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                          {product.sku && (
                            <span>
                              SKU: <span className="text-slate-300 font-mono">{product.sku}</span>
                            </span>
                          )}
                          {product.barcode && (
                            <span>
                              บาร์โค้ด: <span className="text-slate-300 font-mono">{product.barcode}</span>
                            </span>
                          )}
                          <span>
                            หน่วยนับ: <span className="text-slate-300">{product.baseUom?.name || 'ชิ้น'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* สต็อก & ราคา */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-6 shrink-0">
                      {/* จำนวนคงเหลือ */}
                      <div className="text-right">
                        <span className="block text-[11px] text-slate-400 font-medium">สต็อกคงเหลือ</span>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                            isOutOfStock
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {stockQty.toLocaleString()} {product.baseUom?.name || 'ชิ้น'}
                        </span>
                      </div>

                      {/* ต้นทุนต่อหน่วย */}
                      <div className="text-right hidden sm:block">
                        <span className="block text-[11px] text-slate-400 font-medium">ต้นทุนมาตรฐาน</span>
                        <span className="text-sm font-bold text-white font-mono">
                          {formatBaht(costBaht)}
                        </span>
                      </div>

                      {/* ราคาขาย */}
                      <div className="text-right hidden md:block">
                        <span className="block text-[11px] text-slate-400 font-medium">ราคาขาย</span>
                        <span className="text-sm font-bold text-cyan-400 font-mono">
                          {formatBaht(sellPriceBaht)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-300">
            {selectedIds.size > 0 ? (
              <span>
                พร้อมเพิ่ม <strong className="text-cyan-400 font-black">{selectedIds.size}</strong> รายการลงในเอกสาร
              </span>
            ) : (
              <span className="text-slate-500">ติ๊กเลือกสินค้าที่ต้องการเพื่อเพิ่มในรายการ</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm min-h-[44px] cursor-pointer transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Icons.Plus className="w-4 h-4" />
              <span>เพิ่มสินค้าที่เลือก ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
