/**
 * ประเภทข้อมูลสำหรับแดชบอร์ดภาพรวม (Overview Dashboard Types)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา API: /api/v1/dashboard/overview
 * เอกสาร: DASHBOARD_API_INTEGRATION_GUIDE.md
 */

export type DashboardPeriodType =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_month'
  | 'custom';

export interface DashboardQueryParams {
  branchId?: string;
  period?: DashboardPeriodType;
  startDate?: string; // RFC3339
  endDate?: string;   // RFC3339
  comparePrevious?: boolean;
}

export interface DashboardPeriod {
  type: DashboardPeriodType;
  startDate: string; // RFC3339 ISO String
  endDate: string;   // RFC3339 ISO String
}

export interface DashboardComparison {
  previousPeriodSales: number; // สตางค์
  salesGrowthPercent: number;  // % เช่น 11.74 หรือ -5.20
  previousPeriodBills: number;
  billsGrowthPercent: number;  // %
}

export interface DashboardSalesKPIs {
  totalSales: number;      // สตางค์
  grossProfit: number;     // สตางค์
  totalCost: number;       // สตางค์
  totalBills: number;
  averageBillSize: number; // สตางค์
  totalDiscount: number;   // สตางค์
  totalVat: number;        // สตางค์
  comparison?: DashboardComparison;
}

export interface DashboardSalesTrendItem {
  bucket: string; // "08:00" หรือ "2026-10-31"
  label: string;  // "08:00" หรือ "31 ต.ค."
  sales: number;  // สตางค์
  bills: number;
}

export interface DashboardPaymentItem {
  method: 'CASH' | 'QR_PROMPTPAY' | 'CREDIT' | 'TRANSFER' | 'WALLET' | 'CARD' | string;
  methodLabel: string; // ภาษาไทย เช่น "เงินสด", "พร้อมเพย์ QR"
  amount: number;      // สตางค์
  billCount: number;
  percentage: number;  // % ทศนิยม 2 ตำแหน่ง
}

export interface DashboardActiveShift {
  hasActiveShift: boolean;
  shiftId: string | null;
  cashierId: string | null;
  cashierName: string | null;
  openedAt: string | null;        // RFC3339
  openingCash: number;            // สตางค์
  currentCashInDrawer: number;    // สตางค์
  expectedCash: number;           // สตางค์
}

export interface DashboardBestSellerItem {
  productId: string;
  productCode: string;
  productName: string;
  totalQtySold: number;
  totalRevenue: number; // สตางค์
  totalProfit: number;  // สตางค์
}

export interface DashboardCriticalItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStock: number;
  uomName: string;
}

export interface DashboardInventoryAlerts {
  lowStockCount: number;
  outOfStockCount: number;
  totalValuationCost: number; // สตางค์
  totalValuationSale: number; // สตางค์
  criticalItems: DashboardCriticalItem[];
}

export interface DashboardRecentSale {
  id: string;
  saleNo: string;
  occurredAt: string; // RFC3339
  grandTotal: number; // สตางค์
  status: 'COMPLETED' | 'VOIDED' | 'REFUNDED' | string;
  paymentMethod: string;
  customerName: string;
}

export interface DashboardOverviewResponse {
  period: DashboardPeriod;
  salesKpis: DashboardSalesKPIs;
  salesTrend: DashboardSalesTrendItem[];
  paymentBreakdown: DashboardPaymentItem[];
  activeShift: DashboardActiveShift;
  bestSellers: DashboardBestSellerItem[];
  inventoryAlerts: DashboardInventoryAlerts;
  recentSales: DashboardRecentSale[];
}

