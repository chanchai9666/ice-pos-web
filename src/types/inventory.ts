/**
 * ประเภทข้อมูลสำหรับระบบคลังและสต็อกสินค้า (Inventory & Stock Types)
 * โครงการ ice-pos-web
 */

import { Product } from '@/types/catalog';

/**
 * ข้อมูลระดับสต็อกสินค้าคงคลังรายสาขา (Stock Level)
 */
export interface StockLevel {
  id: string;
  productId: string;
  branchId: string;
  quantity: number;
  reservedQuantity: number;
  updatedAt?: string;
  version?: number;
  product?: Product;
}

/**
 * โครงสร้าง Map เก็บระดับสต็อกสำหรับค้นหาด่วนตาม Product ID (productId -> availableQuantity)
 */
export type StockLevelMap = Record<string, number>;

/**
 * พารามิเตอร์สำหรับการสืบค้นสต็อกสินค้า
 */
export interface StockQueryParams {
  branchId?: string;
  lowStockOnly?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * สถานะระดับสต็อกสินค้าสำหรับ POS
 */
export type ProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

/**
 * ข้อมูลการนำเสนอผลสต็อกบนการ์ดสินค้า POS
 */
export interface ProductStockPresentation {
  /** เป็นสินค้าขายตามน้ำหนักหรือไม่ */
  isWeightBased: boolean;

  /** ปริมาณสต็อกคงเหลือจริง (fallback เป็น 0 สำหรับสินค้าชิ้นที่ไม่มีข้อมูล) */
  stockQuantity: number;

  /** เกณฑ์สต็อกใกล้หมดที่ใช้เปรียบเทียบ (จาก product.minStock หรือ 5) */
  threshold: number;

  /** สถานะสต็อกของสินค้า */
  status: ProductStockStatus;

  /** คลาส Tailwind สำหรับเส้นขอบการ์ดสินค้า */
  cardBorderClass: string;

  /** คลาส Tailwind สำหรับเงาเรืองแสง */
  cardShadowClass: string;

  /** ข้อความป้ายสถานะมุมซ้ายบน (Badge) */
  badgeText: string;

  /** คลาส Tailwind สำหรับป้ายมุมซ้ายบน */
  badgeClass: string;

  /** ข้อความระบุจำนวนคงเหลือใต้ชื่อสินค้า */
  detailStockText: string;

  /** คลาสสีตัวอักษรสำหรับข้อความคงเหลือ */
  detailStockColorClass: string;
}

/**
 * ประเภทการปรับยอดสต็อกสินค้า (Stock Adjustment Type)
 * อิงตาม Swagger schema: ice-pos-api_internal_delivery_http_dto.AdjustStockRequest
 * สเปกประกาศ enum ไว้ 10 ค่า — ต้องตรงทั้งหมด ไม่ใช่แค่ subset ที่หน้าจอใช้
 */
export type StockAdjustmentType =
  | 'IN'         // รับสินค้าเข้า (+)
  | 'OUT'        // ปรับยอดสินค้าออก (-)
  | 'ADJUST'     // ปรับปรุงยอดทั่วไป (+/-)
  | 'TRANSFER'   // รับ/จ่ายจากการโอนย้ายระหว่างสาขา
  | 'SALE'       // ตัดจากการขาย
  | 'RETURN'     // คืนเข้าจากการรับคืนสินค้า
  | 'BAD_STOCK'  // สินค้าเสีย/ใช้ไม่ได้
  | 'EXPIRED'    // สินค้าหมดอายุ (-)
  | 'AUDIT'      // ตรวจนับสต็อกตามจริง
  | 'DAMAGE';    // สินค้าชำรุดเสียหาย (-)

/**
 * ข้อมูลคำขอปรับยอดสต็อกสินค้า (Adjust Stock Request DTO)
 */
export interface AdjustStockRequest {
  branchId: string;
  productId: string;
  type: StockAdjustmentType;
  quantityDelta: number;
  reason: string;
  idempotencyKey?: string;
}

/**
 * ข้อมูลสรุปมูลค่าสต็อกสินค้าคงคลัง (Inventory Valuation Response)
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.ValuationResponse
 */
export interface InventoryValuationResponse {
  totalItems?: number;
  totalQuantity?: number;
  totalCostValue?: number; // สตางค์
  totalSaleValue?: number; // สตางค์
}

/**
 * ข้อมูลแถวสินค้าในคำขอสร้างใบโอนย้ายสินค้า (Stock Transfer Line Request)
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.StockTransferLineRequest
 */
export interface StockTransferLineRequest {
  productId: string;
  qty?: number;
  quantity?: number;
  uomId?: string;
}

/**
 * คำขอสร้างใบโอนย้ายสินค้าระหว่างสาขา (Create Stock Transfer Request)
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.CreateStockTransferRequest
 */
export interface CreateStockTransferRequest {
  fromBranchId: string;
  toBranchId: string;
  lines: StockTransferLineRequest[];
}

/**
 * แถวสินค้าในใบโอนย้ายสินค้า (Stock Transfer Line Item Response)
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.StockTransferLineItemResponse
 */
export interface StockTransferLineItemResponse {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  uomId?: string;
}

/**
 * ข้อมูลใบโอนย้ายสินค้าระหว่างสาขา (Stock Transfer Response)
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.StockTransferResponse
 */
export interface StockTransferResponse {
  id: string;
  transferNo: string;
  fromBranchId: string;
  toBranchId: string;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED' | string;
  lines?: StockTransferLineItemResponse[];
  createdBy?: string;
  createdAt?: string;
  receivedAt?: string;
}
