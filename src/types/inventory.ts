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
