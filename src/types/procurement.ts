/**
 * ประเภทข้อมูลสำหรับการจัดซื้อและตรวจรับสินค้าเข้าคลัง (Procurement & Goods Receipts)
 * โครงการ ice-pos-web
 */

import { Product, Uom } from './catalog';

// ========================================================
// 1. ผู้จัดจำหน่าย (Suppliers)
// ========================================================

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxId?: string | null;
  creditDays?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierRequest {
  name: string;
  code?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  creditDays?: number;
  isActive?: boolean;
}

export interface UpdateSupplierRequest {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  creditDays?: number;
  isActive?: boolean;
}

// ========================================================
// 2. ใบสั่งซื้อสินค้า (Purchase Orders)
// ========================================================

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId?: string;
  productId: string;
  product?: Product | null;
  productName?: string;
  productSku?: string;
  quantity: number;
  receivedQuantity: number;
  uomId?: string | null;
  uom?: Uom | null;
  uomName?: string | null;
  unitCost: number; // หน่วย: สตางค์ (Satang)
  lineTotal?: number; // หน่วย: สตางค์ (Satang)
  note?: string | null;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  branchId: string;
  branchName?: string | null;
  supplierId?: string | null;
  supplier?: Supplier | null;
  status: PurchaseOrderStatus;
  orderDate?: string;
  expectedDeliveryDate?: string;
  subtotal: number; // หน่วย: สตางค์ (Satang)
  taxAmount: number; // หน่วย: สตางค์ (Satang)
  grandTotal: number; // หน่วย: สตางค์ (Satang)
  note?: string | null;
  createdBy?: string | null;
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderLineRequest {
  productId: string;
  quantity: number;
  uomId?: string | null;
  unitCost?: number; // หน่วย: สตางค์ (Satang)
  note?: string | null;
}

export interface CreatePurchaseOrderRequest {
  branchId: string;
  supplierId?: string | null;
  orderDate?: string;
  expectedDeliveryDate?: string;
  note?: string | null;
  status?: 'DRAFT' | 'ORDERED';
  taxAmount?: number;
  lines: CreatePurchaseOrderLineRequest[];
}

export interface UpdatePurchaseOrderRequest {
  branchId?: string;
  supplierId?: string | null;
  orderDate?: string;
  expectedDeliveryDate?: string;
  note?: string | null;
  taxAmount?: number;
  lines?: CreatePurchaseOrderLineRequest[];
}

export interface PurchaseOrderQueryParams {
  branchId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus | '';
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ========================================================
// 3. รายการสินค้าค้างรับในใบสั่งซื้อ (Receipt Preview)
// ========================================================

export interface ReceiptPreviewItem {
  purchaseOrderLineId: string;
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitCost: number; // หน่วย: สตางค์
  uomId?: string | null;
  uomName?: string | null;
}

// ========================================================
// 4. ตรวจรับสินค้าเข้าคลัง (Goods Receipts)
// ========================================================

export type GoodsReceiptStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export interface GoodsReceiptLine {
  id: string;
  goodsReceiptId?: string;
  productId: string;
  product?: Product | null;
  productName?: string;
  productSku?: string;
  orderedQuantity?: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  rejectReason?: string | null;
  unitCost: number; // หน่วย: สตางค์
  lineTotal?: number; // หน่วย: สตางค์
  uomId?: string | null;
  uom?: Uom | null;
  uomName?: string | null;
  batchCode?: string | null;
  expiryDate?: string | null;
  purchaseOrderLineId?: string | null;
  note?: string | null;
}

export interface GoodsReceipt {
  id: string;
  receiptNo: string;
  branchId: string;
  branchName?: string | null;
  purchaseOrderId?: string | null;
  purchaseOrderNo?: string | null;
  supplierId?: string | null;
  supplier?: Supplier | null;
  supplierInvoiceNo?: string | null;
  receivedDate?: string;
  receivedBy?: string | null;
  status: GoodsReceiptStatus;
  grandTotal?: number; // หน่วย: สตางค์
  note?: string | null;
  lines: GoodsReceiptLine[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateGoodsReceiptLineRequest {
  productId: string;
  orderedQuantity?: number;
  receivedQuantity?: number;
  rejectedQuantity?: number;
  rejectReason?: string | null;
  unitCost?: number;
  uomId?: string | null;
  batchCode?: string | null;
  expiryDate?: string | null;
  purchaseOrderLineId?: string | null;
  note?: string | null;
}

export interface CreateGoodsReceiptRequest {
  branchId: string;
  purchaseOrderId?: string | null;
  supplierId?: string | null;
  supplierInvoiceNo?: string | null;
  receivedDate?: string;
  status?: 'DRAFT' | 'COMPLETED';
  note?: string | null;
  lines: CreateGoodsReceiptLineRequest[];
}

export interface GoodsReceiptQueryParams {
  branchId?: string;
  purchaseOrderId?: string;
  supplierId?: string;
  status?: GoodsReceiptStatus | '';
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}
