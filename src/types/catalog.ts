/**
 * ประเภทข้อมูลและ Interface สำหรับระบบจัดการสินค้าและหมวดหมู่ (Product Catalog Types)
 * โครงการ ice-pos-web
 */

// ประเภทสินค้า
export type ProductType = 'PRICE_PER_UNIT' | 'BY_WEIGHT';

// ข้อมูลหมวดหมู่สินค้า
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  createdAt?: string;
  updatedAt?: string;
}

// ข้อมูลสำหรับสร้างหมวดหมู่ใหม่
export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
}

// ข้อมูลสำหรับแก้ไขหมวดหมู่
export interface UpdateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

// ข้อมูลหน่วยนับสินค้า
export interface Uom {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

// ข้อมูลอัตราภาษีมูลค่าเพิ่ม
export interface Tax {
  id: string;
  code: string;
  name: string;
  rate: number; // e.g. 0.07 สำหรับ 7%
  isActive: boolean;
}

// ข้อมูลสินค้า
export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  isInternalBarcode: boolean;
  name: string;
  description?: string;
  categoryId?: string | null;
  category?: Category | null;
  baseUomId: string;
  baseUom?: Uom | null;
  purchaseUomId?: string | null;
  purchaseUom?: Uom | null;
  sellUomId?: string | null;
  sellUom?: Uom | null;
  purchaseRatio?: number;
  price: number; // หน่วยสตางค์ (satang)
  costPerBaseUnit?: number; // หน่วยสตางค์ (satang)
  taxId?: string | null;
  tax?: Tax | null;
  productType: ProductType;
  minStock: number;
  trackExpiry: boolean;
  imageUrl?: string;
  imageTimestamp?: number; // สำหรับ Client-side Cache-Busting รูปภาพ
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ข้อมูลผลลัพธ์การอัปโหลดรูปภาพ
export interface ProductImageUploadResponse {
  imageUrl: string;
}

// ข้อมูลสถานะอุปกรณ์กล้อง
export interface CameraDeviceState {
  isStreaming: boolean;
  facingMode: 'user' | 'environment';
  hasMultipleCameras: boolean;
  error: string | null;
}

// ข้อมูลภาพถ่ายจากกล้องที่พร้อมใช้งาน
export interface CapturedImageResult {
  file: File;
  previewUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

// ข้อมูลสำหรับสร้างสินค้าใหม่
export interface CreateProductRequest {
  name: string;
  sku: string;
  barcode?: string;
  isInternalBarcode?: boolean;
  categoryId?: string | null;
  baseUomId: string;
  purchaseUomId?: string | null;
  sellUomId?: string | null;
  purchaseRatio?: number;
  price: number; // หน่วยสตางค์ (satang)
  costPerBaseUnit?: number; // หน่วยสตางค์ (satang)
  taxId?: string | null;
  productType: ProductType;
  minStock?: number;
  trackExpiry?: boolean;
  imageUrl?: string;
  isActive?: boolean;
  description?: string;
}

// ข้อมูลสำหรับแก้ไขสินค้า
export interface UpdateProductRequest extends CreateProductRequest {
  id?: string;
}

// พารามิเตอร์ค้นหาสินค้า
export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  category_id?: string;
  barcode?: string;
  isActive?: boolean;
  is_active?: boolean;
  page?: number;
  pageSize?: number;
}

// พารามิเตอร์ค้นหาหมวดหมู่
export interface CategoryQueryParams {
  page?: number;
  pageSize?: number;
}
