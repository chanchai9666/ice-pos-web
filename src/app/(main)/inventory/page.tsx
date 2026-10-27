'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import { inventoryService } from '@/services/inventory.service';
import { StockLevel, InventoryValuationResponse } from '@/types/inventory';
import { Branch } from '@/types/auth';
import { InventorySummaryCards } from '@/components/inventory/InventorySummaryCards';
import { InventoryToolbar } from '@/components/inventory/InventoryToolbar';
import { InventoryStockTable } from '@/components/inventory/InventoryStockTable';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';
import { BarcodeCaptureModal } from '@/components/shared/BarcodeCaptureModal';
import { Icons } from '@/components/ui/Icons';

export default function InventoryPage() {
  const { user, branch } = useAuth();

  // สถานะสาขาและการสิทธิ์เปลี่ยนสาขา (ADMIN สลับได้)
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // สถานะข้อมูลสต็อก
  const [stocks, setStocks] = useState<StockLevel[]>([]);
  const [valuationData, setValuationData] = useState<InventoryValuationResponse | null>(null);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [isLoadingValuation, setIsLoadingValuation] = useState(true);

  // ตัวกรองและการค้นหา
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal สแกนบาร์โค้ดด้วยกล้อง
  const [isBarcodeScanOpen, setIsBarcodeScanOpen] = useState(false);

  // Modal ปรับยอดสต็อก
  const [adjustingStock, setAdjustingStock] = useState<StockLevel | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // แจ้งเตือน Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. กำหนดสาขาเริ่มต้นและดึงรายการสาขาสำหรับ ADMIN
  useEffect(() => {
    let initialBranchId = branch?.id || user?.branchId || '';
    if (initialBranchId) {
      setSelectedBranchId(initialBranchId);
    }

    if (isAdmin) {
      authService
        .getBranches()
        .then((branchList) => {
          if (Array.isArray(branchList) && branchList.length > 0) {
            setBranches(branchList);
            if (!initialBranchId) {
              setSelectedBranchId(branchList[0].id);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to fetch branches:', err);
        });
    }
  }, [isAdmin, branch?.id, user?.branchId]);

  // 2. ดึงข้อมูลสต็อกสินค้า
  const fetchStocks = useCallback(async () => {
    if (!selectedBranchId) return;

    try {
      setIsLoadingStocks(true);
      const res = await inventoryService.getStockLevels({
        branchId: selectedBranchId,
        lowStockOnly,
        page: 1,
        pageSize: 100, // ดึงรายการสต็อกสูงสุด 100 รายการสำหรับสาขา
      });

      if (res && res.data) {
        setStocks(res.data);
      } else {
        setStocks([]);
      }
    } catch (err: unknown) {
      console.error('Failed to load stock levels:', err);
      showToast('ไม่สามารถดึงข้อมูลสต็อกสินค้าได้ กรุณาลองใหม่อีกครั้ง', 'error');
      setStocks([]);
    } finally {
      setIsLoadingStocks(false);
    }
  }, [selectedBranchId, lowStockOnly]);

  // 3. ดึงรายงานสรุปมูลค่าสต็อกสินค้า
  const fetchValuation = useCallback(async () => {
    if (!selectedBranchId) return;

    try {
      setIsLoadingValuation(true);
      const res = await inventoryService.getInventoryValuation(selectedBranchId);
      if (res && res.data) {
        setValuationData(res.data);
      }
    } catch {
      // หาก Endpoint รายงานล้มเหลว จะใช้ fallback คำนวณจาก stocks
      setValuationData(null);
    } finally {
      setIsLoadingValuation(false);
    }
  }, [selectedBranchId]);

  // โหลดข้อมูลเมื่อสาขาหรือตัวกรอง lowStockOnly เปลี่ยนแปลง
  useEffect(() => {
    if (selectedBranchId) {
      fetchStocks();
      fetchValuation();
      setPage(1);
    }
  }, [selectedBranchId, lowStockOnly, fetchStocks, fetchValuation]);

  // กรองรายการสินค้าด้วย Search Query (ชื่อ, SKU, บาร์โค้ด, หมวดหมู่)
  const filteredStocks = useMemo(() => {
    if (!searchQuery.trim()) {
      return stocks;
    }
    const q = searchQuery.toLowerCase().trim();
    return stocks.filter((item) => {
      const p = item.product;
      const name = p?.name?.toLowerCase() || '';
      const sku = p?.sku?.toLowerCase() || '';
      const barcode = p?.barcode?.toLowerCase() || '';
      const category = p?.category?.name?.toLowerCase() || '';
      return (
        name.includes(q) ||
        sku.includes(q) ||
        barcode.includes(q) ||
        category.includes(q)
      );
    });
  }, [stocks, searchQuery]);

  // คำนวณสถิติภาพรวมสำหรับ Summary Cards
  const summaryStats = useMemo(() => {
    const totalSkus = stocks.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let computedValuationSatang = 0;

    for (const item of stocks) {
      const qty = item.quantity;
      const minStock = item.product?.minStock ?? 5;
      if (qty <= 0) {
        outOfStockCount += 1;
      } else if (qty <= minStock) {
        lowStockCount += 1;
      }

      // คำนวณมูลค่า: ใช้ costPerBaseUnit ก่อน ถ้าไม่มีใช้ price
      const unitCost = item.product?.costPerBaseUnit ?? item.product?.price ?? 0;
      computedValuationSatang += Math.max(0, qty) * unitCost;
    }

    // หาก backend คืน totalValuation (หน่วยบาท) ให้ใช้ค่าจาก API ก่อน
    const totalValuationBaht =
      typeof valuationData?.totalValuation === 'number'
        ? valuationData.totalValuation
        : computedValuationSatang;

    return {
      totalSkus: valuationData?.totalSkus ?? totalSkus,
      lowStockCount,
      outOfStockCount,
      totalValuationBaht,
    };
  }, [stocks, valuationData]);

  // การแบ่งหน้า (Pagination)
  const paginatedStocks = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, page, pageSize]);

  // จัดการเมื่อสแกนบาร์โค้ดสำเร็จ
  const handleBarcodeCapture = (barcode: string) => {
    setSearchQuery(barcode);
    setIsBarcodeScanOpen(false);
    showToast(`สแกนบาร์โค้ดสำเร็จ: ${barcode}`, 'success');
  };

  // จัดการเปิด Modal ปรับยอด
  const handleOpenAdjustment = (stock: StockLevel) => {
    setAdjustingStock(stock);
    setIsAdjustmentModalOpen(true);
  };

  // จัดการเมื่อปรับปรุงสต็อกสำเร็จ
  const handleAdjustmentSuccess = () => {
    showToast('ปรับปรุงยอดสต็อกสินค้าเรียบร้อยแล้ว', 'success');
    fetchStocks();
    fetchValuation();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`px-5 py-3 rounded-2xl shadow-2xl border-2 flex items-center gap-3 text-sm font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <Icons.Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <Icons.AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header ของหน้าจอ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.Boxes className="w-6 h-6" />
            </span>
            <span>คลังและสต็อกสินค้า</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            ตรวจสอบยอดคงเหลือ ตรวจนับ และปรับปรุงสต็อกสินค้าประจำสาขา
          </p>
        </div>
      </div>

      {/* สรุปตัวเลขสถิติภาพรวมสต็อก */}
      <InventorySummaryCards
        totalSkus={summaryStats.totalSkus}
        lowStockCount={summaryStats.lowStockCount}
        outOfStockCount={summaryStats.outOfStockCount}
        totalValuationBaht={summaryStats.totalValuationBaht}
        isLoading={isLoadingStocks || isLoadingValuation}
      />

      {/* แถบเครื่องมือค้นหาและตัวกรอง */}
      <InventoryToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenBarcodeScan={() => setIsBarcodeScanOpen(true)}
        lowStockOnly={lowStockOnly}
        onToggleLowStock={setLowStockOnly}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        branches={branches}
        canSwitchBranch={isAdmin}
        onRefresh={() => {
          fetchStocks();
          fetchValuation();
        }}
        isLoading={isLoadingStocks}
      />

      {/* ตารางแสดงรายการสต็อกสินค้า */}
      <InventoryStockTable
        items={paginatedStocks}
        isLoading={isLoadingStocks}
        onAdjustStock={handleOpenAdjustment}
        currentPage={page}
        pageSize={pageSize}
        totalItems={filteredStocks.length}
        onPageChange={setPage}
      />

      {/* Modal สแกนบาร์โค้ดด้วยกล้อง */}
      <BarcodeCaptureModal
        isOpen={isBarcodeScanOpen}
        onClose={() => setIsBarcodeScanOpen(false)}
        onCapture={handleBarcodeCapture}
        title="สแกนบาร์โค้ดค้นหาสต็อกสินค้า"
      />

      {/* Modal ปรับยอดสต็อกสินค้า */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        stock={adjustingStock}
        branchId={selectedBranchId}
        onSuccess={handleAdjustmentSuccess}
      />
    </div>
  );
}
