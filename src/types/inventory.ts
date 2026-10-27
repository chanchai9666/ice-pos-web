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
 */
export type StockAdjustmentType =
  | 'IN'        // รับสินค้าเข้า (+)
  | 'OUT'       // ปรับยอดสินค้าออก (-)
  | 'ADJUST'    // ปรับปรุงยอดทั่วไป (+/-)
  | 'AUDIT'     // ตรวจนับสต็อกตามจริง
  | 'DAMAGE'    // สินค้าชำรุดเสียหาย (-)
  | 'EXPIRED';  // สินค้าหมดอายุ (-)

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
 */
export interface InventoryValuationResponse {
  totalSkus?: number;
  totalQuantity?: number;
  totalValuation?: number;
}
