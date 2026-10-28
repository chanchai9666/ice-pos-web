'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import { inventoryService } from '@/services/inventory.service';
import { procurementService } from '@/services/procurement.service';
import { StockLevel, InventoryValuationResponse } from '@/types/inventory';
import { Branch } from '@/types/auth';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  GoodsReceipt,
  GoodsReceiptStatus,
  Supplier,
  CreatePurchaseOrderRequest,
  CreateGoodsReceiptRequest,
} from '@/types/procurement';
import { InventorySummaryCards } from '@/components/inventory/InventorySummaryCards';
import { InventoryToolbar } from '@/components/inventory/InventoryToolbar';
import { InventoryStockTable } from '@/components/inventory/InventoryStockTable';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';
import { BarcodeCaptureModal } from '@/components/shared/BarcodeCaptureModal';
import { InventoryTabs, InventoryTabType } from '@/components/inventory/InventoryTabs';
import { PurchaseOrderToolbar } from '@/components/inventory/purchase-orders/PurchaseOrderToolbar';
import { PurchaseOrderTable } from '@/components/inventory/purchase-orders/PurchaseOrderTable';
import { CreatePurchaseOrderModal } from '@/components/inventory/purchase-orders/CreatePurchaseOrderModal';
import { PurchaseOrderDetailModal } from '@/components/inventory/purchase-orders/PurchaseOrderDetailModal';
import { GoodsReceiptToolbar } from '@/components/inventory/goods-receipts/GoodsReceiptToolbar';
import { GoodsReceiptTable } from '@/components/inventory/goods-receipts/GoodsReceiptTable';
import { CreateGoodsReceiptModal } from '@/components/inventory/goods-receipts/CreateGoodsReceiptModal';
import { GoodsReceiptDetailModal } from '@/components/inventory/goods-receipts/GoodsReceiptDetailModal';
import { SupplierTable } from '@/components/inventory/SupplierTable';
import { StockTransferTable } from '@/components/inventory/StockTransferTable';
import { Icons } from '@/components/ui/Icons';

export default function InventoryPage() {
  const { user, branch } = useAuth();

  // สถานะแท็บที่กำลังเปิดใช้งาน (stocks | orders | receipts)
  const [activeTab, setActiveTab] = useState<InventoryTabType>('stocks');

  // สถานะสาขาและการสิทธิ์เปลี่ยนสาขา (ADMIN สลับได้)
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // ผู้จัดจำหน่าย (Suppliers) ใช้ร่วมกันระหว่าง PO และ GR
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // ==========================================
  // 1. สถานะข้อมูลสต็อกสินค้า (Stocks)
  // ==========================================
  const [stocks, setStocks] = useState<StockLevel[]>([]);
  const [valuationData, setValuationData] = useState<InventoryValuationResponse | null>(null);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [isLoadingValuation, setIsLoadingValuation] = useState(true);

  // ตัวกรองและการค้นหาสต็อก
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [stockPage, setStockPage] = useState(1);
  const stockPageSize = 20;

  // Modal สแกนบาร์โค้ดด้วยกล้อง
  const [isBarcodeScanOpen, setIsBarcodeScanOpen] = useState(false);

  // Modal ปรับยอดสต็อก
  const [adjustingStock, setAdjustingStock] = useState<StockLevel | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // ==========================================
  // 2. สถานะข้อมูลใบสั่งซื้อสินค้า (Purchase Orders)
  // ==========================================
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoadingPOs, setIsLoadingPOs] = useState(false);
  const [poSearchQuery, setPoSearchQuery] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState<PurchaseOrderStatus | ''>('');
  const [poSupplierFilter, setPoSupplierFilter] = useState('');
  const [poPage, setPoPage] = useState(1);
  const poPageSize = 20;
  const [totalPOs, setTotalPOs] = useState(0);

  // Modals ใบสั่งซื้อ
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);
  const [selectedDetailPO, setSelectedDetailPO] = useState<PurchaseOrder | null>(null);
  const [isPODetailModalOpen, setIsPODetailModalOpen] = useState(false);

  // ==========================================
  // 3. สถานะข้อมูลตรวจรับสินค้าเข้าคลัง (Goods Receipts)
  // ==========================================
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [isLoadingGRs, setIsLoadingGRs] = useState(false);
  const [grSearchQuery, setGrSearchQuery] = useState('');
  const [grStatusFilter, setGrStatusFilter] = useState<GoodsReceiptStatus | ''>('');
  const [grSupplierFilter, setGrSupplierFilter] = useState('');
  const [grPage, setGrPage] = useState(1);
  const grPageSize = 20;
  const [totalGRs, setTotalGRs] = useState(0);

  // Modals ตรวจรับสินค้า
  const [isCreateGRModalOpen, setIsCreateGRModalOpen] = useState(false);
  const [sourcePOForReceipt, setSourcePOForReceipt] = useState<PurchaseOrder | null>(null);
  const [selectedDetailGR, setSelectedDetailGR] = useState<GoodsReceipt | null>(null);
  const [isGRDetailModalOpen, setIsGRDetailModalOpen] = useState(false);

  // แจ้งเตือน Toast
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. กำหนดสาขาเริ่มต้นและดึงสาขา / ซัพพลายเออร์
  useEffect(() => {
    const initialBranchId = branch?.id || user?.branchId || '';
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

    // ดึงรายชื่อผู้จัดจำหน่าย
    procurementService
      .getSuppliers({ isActive: true })
      .then((res) => {
        if (res && res.data) {
          setSuppliers(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch suppliers:', err);
      });
  }, [isAdmin, branch?.id, user?.branchId]);

  // ==========================================
  // ดึงข้อมูลสต็อกสินค้า (Stocks)
  // ==========================================
  const fetchStocks = useCallback(async () => {
    if (!selectedBranchId) return;

    try {
      setIsLoadingStocks(true);
      const res = await inventoryService.getStockLevels({
        branchId: selectedBranchId,
        lowStockOnly,
        page: 1,
        pageSize: 100,
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

  const fetchValuation = useCallback(async () => {
    if (!selectedBranchId) return;

    try {
      setIsLoadingValuation(true);
      const res = await inventoryService.getInventoryValuation(selectedBranchId);
      if (res && res.data) {
        setValuationData(res.data);
      }
    } catch {
      setValuationData(null);
    } finally {
      setIsLoadingValuation(false);
    }
  }, [selectedBranchId]);

  // ==========================================
  // ดึงข้อมูลใบสั่งซื้อสินค้า (Purchase Orders)
  // ==========================================
  const fetchPurchaseOrders = useCallback(async () => {
    if (!selectedBranchId) return;

    try {
      setIsLoadingPOs(true);
      const res = await procurementService.getPurchaseOrders({
        branchId: selectedBranchId,
        status: poStatusFilter || undefined,
        supplierId: poSupplierFilter || undefined,
        search: poSearchQuery || undefined,
        page: poPage,
        limit: poPageSize,
      });

      if (res && res.data) {
        setPurchaseOrders(res.data);
        setTotalPOs(res.meta?.pagination?.totalItems ?? res.data.length);
      } else {
        setPurchaseOrders([]);
        setTotalPOs(0);
      }
    } catch (err: unknown) {
      console.error('Failed to load purchase orders:', err);
      showToast('ไม่สามารถโหลดรายการใบสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง', 'error');
      setPurchaseOrders([]);
    } finally {
      setIsLoadingPOs(false);
    }
  }, [
    selectedBranchId,
    poStatusFilter,
    poSupplierFilter,
    poSearchQuery,
    poPage,
    poPageSize,
  ]);

  // ==========================================
  // ดึงข้อมูลตรวจรับสินค้าเข้าคลัง (Goods Receipts)
  // ==========================================
  const fetchGoodsReceipts = useCallback(async () => {
    if (!selectedBranchId) return;

    try {
      setIsLoadingGRs(true);
      const res = await procurementService.getGoodsReceipts({
        branchId: selectedBranchId,
        status: grStatusFilter || undefined,
        supplierId: grSupplierFilter || undefined,
        search: grSearchQuery || undefined,
        page: grPage,
        limit: grPageSize,
      });

      if (res && res.data) {
        setGoodsReceipts(res.data);
        setTotalGRs(res.meta?.pagination?.totalItems ?? res.data.length);
      } else {
        setGoodsReceipts([]);
        setTotalGRs(0);
      }
    } catch (err: unknown) {
      console.error('Failed to load goods receipts:', err);
      showToast('ไม่สามารถโหลดประวัติการตรวจรับสินค้าได้', 'error');
      setGoodsReceipts([]);
    } finally {
      setIsLoadingGRs(false);
    }
  }, [
    selectedBranchId,
    grStatusFilter,
    grSupplierFilter,
    grSearchQuery,
    grPage,
    grPageSize,
  ]);

  // สลับแท็บและดึงข้อมูลตามบริบท
  useEffect(() => {
    if (selectedBranchId) {
      if (activeTab === 'stocks') {
        fetchStocks();
        fetchValuation();
      } else if (activeTab === 'orders') {
        fetchPurchaseOrders();
      } else if (activeTab === 'receipts') {
        fetchGoodsReceipts();
      }
    }
  }, [
    activeTab,
    selectedBranchId,
    fetchStocks,
    fetchValuation,
    fetchPurchaseOrders,
    fetchGoodsReceipts,
  ]);

  // ==========================================
  // Handlers สำหรับ Purchase Orders
  // ==========================================
  const handleCreatePOSubmit = async (data: CreatePurchaseOrderRequest) => {
    await procurementService.createPurchaseOrder(data);
    showToast('สร้างใบสั่งซื้อสินค้าเรียบร้อยแล้ว', 'success');
    fetchPurchaseOrders();
  };

  const handleConfirmPO = async (po: PurchaseOrder) => {
    try {
      await procurementService.confirmPurchaseOrder(po.id);
      showToast(`ยืนยันการสั่งซื้อ ${po.poNo || ''} เรียบร้อยแล้ว`, 'success');
      fetchPurchaseOrders();
    } catch (err: unknown) {
      console.error('Confirm PO failed:', err);
      showToast('ยืนยันใบสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleCancelPO = async (po: PurchaseOrder) => {
    const confirmCancel = window.confirm(
      `คุณต้องการยกเลิกใบสั่งซื้อ ${po.poNo || ''} ใช่หรือไม่?`
    );
    if (!confirmCancel) return;

    try {
      await procurementService.cancelPurchaseOrder(po.id);
      showToast(`ยกเลิกใบสั่งซื้อ ${po.poNo || ''} เรียบร้อยแล้ว`, 'success');
      fetchPurchaseOrders();
    } catch (err: unknown) {
      console.error('Cancel PO failed:', err);
      showToast('ยกเลิกใบสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleForceClosePO = async (po: PurchaseOrder) => {
    const confirmClose = window.confirm(
      `คุณต้องการบังคับปิดใบสั่งซื้อ ${po.poNo || ''} ใช่หรือไม่?`
    );
    if (!confirmClose) return;

    try {
      await procurementService.forceClosePurchaseOrder(po.id);
      showToast(`ปิดใบสั่งซื้อ ${po.poNo || ''} เรียบร้อยแล้ว`, 'success');
      fetchPurchaseOrders();
    } catch (err: unknown) {
      console.error('Force close PO failed:', err);
      showToast('ปิดใบสั่งซื้อไม่สำเร็จ', 'error');
    }
  };

  const handleOpenReceivePO = (po: PurchaseOrder) => {
    setSourcePOForReceipt(po);
    setIsCreateGRModalOpen(true);
  };

  // ==========================================
  // Handlers สำหรับ Goods Receipts
  // ==========================================
  const handleCreateGRSubmit = async (data: CreateGoodsReceiptRequest) => {
    await procurementService.createGoodsReceipt(data);
    showToast('บันทึกการตรวจรับสินค้าเข้าคลังเรียบร้อยแล้ว', 'success');

    // อัปเดตรายการทั้ง GR, PO และสต็อก
    fetchGoodsReceipts();
    fetchPurchaseOrders();
    fetchStocks();
    fetchValuation();
  };

  const handleCompleteGR = async (gr: GoodsReceipt) => {
    try {
      await procurementService.completeGoodsReceipt(gr.id);
      showToast(
        `ยืนยันตรวจรับ ${gr.receiptNo || ''} นำสต็อกเข้าคลังเรียบร้อยแล้ว`,
        'success'
      );
      fetchGoodsReceipts();
      fetchStocks();
      fetchValuation();
    } catch (err: unknown) {
      console.error('Complete GR failed:', err);
      showToast('ยืนยันตรวจรับไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleCancelGR = async (gr: GoodsReceipt) => {
    const confirmCancel = window.confirm(
      `คุณต้องการยกเลิกใบตรวจรับ ${gr.receiptNo || ''} ใช่หรือไม่?`
    );
    if (!confirmCancel) return;

    try {
      await procurementService.cancelGoodsReceipt(gr.id);
      showToast(`ยกเลิกใบตรวจรับ ${gr.receiptNo || ''} เรียบร้อยแล้ว`, 'success');
      fetchGoodsReceipts();
    } catch (err: unknown) {
      console.error('Cancel GR failed:', err);
      showToast('ยกเลิกใบตรวจรับไม่สำเร็จ', 'error');
    }
  };

  const handleOpenDirectGR = () => {
    setSourcePOForReceipt(null);
    setIsCreateGRModalOpen(true);
  };

  // ==========================================
  // Stocks Filter & Calculations
  // ==========================================
  const filteredStocks = useMemo(() => {
    let result = stocks;
    if (lowStockOnly) {
      result = result.filter((item) => {
        const isWeightBased = item.product?.productType === 'BY_WEIGHT';
        if (isWeightBased) return false;
        const minStock = item.product?.minStock ?? 5;
        return item.quantity <= minStock;
      });
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase().trim();
    return result.filter((item) => {
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
  }, [stocks, searchQuery, lowStockOnly]);

  const summaryStats = useMemo(() => {
    const totalSkus = stocks.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let computedValuationSatang = 0;

    for (const item of stocks) {
      const isWeightBased = item.product?.productType === 'BY_WEIGHT';
      if (!isWeightBased) {
        const qty = item.quantity;
        const minStock = item.product?.minStock ?? 5;
        if (qty <= 0) {
          outOfStockCount += 1;
        } else if (qty <= minStock) {
          lowStockCount += 1;
        }

        const unitCost = item.product?.costPerBaseUnit ?? item.product?.price ?? 0;
        computedValuationSatang += Math.max(0, qty) * unitCost;
      }
    }

    const totalValuationBaht =
      typeof valuationData?.totalCostValue === 'number'
        ? valuationData.totalCostValue
        : computedValuationSatang;

    return {
      totalSkus: valuationData?.totalItems ?? totalSkus,
      lowStockCount,
      outOfStockCount,
      totalValuationBaht,
    };
  }, [stocks, valuationData]);

  const paginatedStocks = useMemo(() => {
    const start = (stockPage - 1) * stockPageSize;
    return filteredStocks.slice(start, start + stockPageSize);
  }, [filteredStocks, stockPage, stockPageSize]);

  // สแกนบาร์โค้ดค้นหาสต็อก
  const handleBarcodeCapture = (barcode: string) => {
    setSearchQuery(barcode);
    setIsBarcodeScanOpen(false);
    showToast(`สแกนบาร์โค้ดสำเร็จ: ${barcode}`, 'success');
  };

  const handleOpenAdjustment = (stock: StockLevel) => {
    if (stock.product?.productType === 'BY_WEIGHT') return;
    setAdjustingStock(stock);
    setIsAdjustmentModalOpen(true);
  };

  const handleAdjustmentSuccess = () => {
    showToast('ปรับปรุงยอดสต็อกสินค้าเรียบร้อยแล้ว', 'success');
    fetchStocks();
    fetchValuation();
  };

  // นับจำนวน PO ที่กำลังรอรับ (สำหรับแสดง Badge บนแท็บ)
  const pendingOrdersBadge = useMemo(() => {
    return purchaseOrders.filter(
      (po) => po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED'
    ).length;
  }, [purchaseOrders]);

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Icons.Boxes className="w-6 h-6" />
            </span>
            <span>คลังและสต็อกสินค้า (Inventory & Procurement)</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            จัดการยอดคงเหลือ สั่งซื้อสินค้า และตรวจรับสินค้าเข้าคลังสาขาอย่างครบวงจร
          </p>
        </div>
      </div>

      {/* แถบแท็บนำทางหลัก (InventoryTabs) */}
      <InventoryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ordersBadge={pendingOrdersBadge}
      />

      {/* ======================================================== */}
      {/* แท็บที่ 1: สต็อกสินค้าคงเหลือ (Stocks)                   */}
      {/* ======================================================== */}
      {activeTab === 'stocks' && (
        <div className="space-y-6 animate-in fade-in duration-200">
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
            currentPage={stockPage}
            pageSize={stockPageSize}
            totalItems={filteredStocks.length}
            onPageChange={setStockPage}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* แท็บที่ 2: ใบสั่งซื้อสินค้า (Purchase Orders)             */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* แถบเครื่องมือ PO */}
          <PurchaseOrderToolbar
            searchQuery={poSearchQuery}
            onSearchChange={setPoSearchQuery}
            statusFilter={poStatusFilter}
            onStatusFilterChange={setPoStatusFilter}
            supplierFilter={poSupplierFilter}
            onSupplierFilterChange={setPoSupplierFilter}
            suppliers={suppliers}
            selectedBranchId={selectedBranchId}
            onBranchChange={setSelectedBranchId}
            branches={branches}
            canSwitchBranch={isAdmin}
            onRefresh={fetchPurchaseOrders}
            onCreateNewPO={() => setIsCreatePOModalOpen(true)}
            isLoading={isLoadingPOs}
          />

          {/* ตารางแสดงรายการ PO */}
          <PurchaseOrderTable
            items={purchaseOrders}
            isLoading={isLoadingPOs}
            onViewDetails={(po) => {
              setSelectedDetailPO(po);
              setIsPODetailModalOpen(true);
            }}
            onReceiveGoods={handleOpenReceivePO}
            onConfirmPO={handleConfirmPO}
            onCancelPO={handleCancelPO}
            currentPage={poPage}
            pageSize={poPageSize}
            totalItems={totalPOs}
            onPageChange={setPoPage}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* แท็บที่ 3: ตรวจรับสินค้าเข้าคลัง (Goods Receipts)           */}
      {/* ======================================================== */}
      {activeTab === 'receipts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* แถบเครื่องมือ GR */}
          <GoodsReceiptToolbar
            searchQuery={grSearchQuery}
            onSearchChange={setGrSearchQuery}
            statusFilter={grStatusFilter}
            onStatusFilterChange={setGrStatusFilter}
            supplierFilter={grSupplierFilter}
            onSupplierFilterChange={setGrSupplierFilter}
            suppliers={suppliers}
            selectedBranchId={selectedBranchId}
            onBranchChange={setSelectedBranchId}
            branches={branches}
            canSwitchBranch={isAdmin}
            onRefresh={fetchGoodsReceipts}
            onCreateDirectReceipt={handleOpenDirectGR}
            isLoading={isLoadingGRs}
          />

          {/* ตารางแสดงประวัติ GR */}
          <GoodsReceiptTable
            items={goodsReceipts}
            isLoading={isLoadingGRs}
            onViewDetails={(gr) => {
              setSelectedDetailGR(gr);
              setIsGRDetailModalOpen(true);
            }}
            onCompleteGR={handleCompleteGR}
            onCancelGR={handleCancelGR}
            currentPage={grPage}
            pageSize={grPageSize}
            totalItems={totalGRs}
            onPageChange={setGrPage}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* แท็บที่ 4: ผู้จัดจำหน่ายและคู่ค้า (Suppliers)             */}
      {/* ======================================================== */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <SupplierTable />
        </div>
      )}

      {/* ======================================================== */}
      {/* แท็บที่ 5: โอนย้ายสินค้าระหว่างสาขา (Stock Transfers)    */}
      {/* ======================================================== */}
      {activeTab === 'transfers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <StockTransferTable currentBranchId={selectedBranchId} />
        </div>
      )}

      {/* ======================================================== */}
      {/* Modals & Dialogs                                         */}
      {/* ======================================================== */}

      {/* Modal สแกนบาร์โค้ดค้นหาสต็อกสินค้า */}
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

      {/* Modal สร้างใบสั่งซื้อสินค้าใหม่ */}
      <CreatePurchaseOrderModal
        isOpen={isCreatePOModalOpen}
        onClose={() => setIsCreatePOModalOpen(false)}
        branchId={selectedBranchId}
        suppliers={suppliers}
        onSubmit={handleCreatePOSubmit}
      />

      {/* Modal ดูรายละเอียดใบสั่งซื้อสินค้า */}
      <PurchaseOrderDetailModal
        isOpen={isPODetailModalOpen}
        onClose={() => setIsPODetailModalOpen(false)}
        purchaseOrder={selectedDetailPO}
        onConfirmPO={handleConfirmPO}
        onCancelPO={handleCancelPO}
        onForceClosePO={handleForceClosePO}
        onReceiveGoods={handleOpenReceivePO}
      />

      {/* Modal ตรวจรับสินค้าเข้าคลัง (จาก PO หรือ Direct) */}
      <CreateGoodsReceiptModal
        isOpen={isCreateGRModalOpen}
        onClose={() => setIsCreateGRModalOpen(false)}
        branchId={selectedBranchId}
        sourcePO={sourcePOForReceipt}
        suppliers={suppliers}
        onSubmit={handleCreateGRSubmit}
      />

      {/* Modal ดูรายละเอียดใบตรวจรับสินค้า */}
      <GoodsReceiptDetailModal
        isOpen={isGRDetailModalOpen}
        onClose={() => setIsGRDetailModalOpen(false)}
        goodsReceipt={selectedDetailGR}
        onCompleteGR={handleCompleteGR}
        onCancelGR={handleCancelGR}
      />
    </div>
  );
}
