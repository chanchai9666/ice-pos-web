/**
 * เซอร์วิสสำหรับระบบจัดซื้อและตรวจรับสินค้าเข้าคลัง (Procurement Service)
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { formatToRFC3339 } from '@/utils/dateHelper';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderQueryParams,
  ReceiptPreviewItem,
  GoodsReceipt,
  CreateGoodsReceiptRequest,
  GoodsReceiptQueryParams,
} from '@/types/procurement';

export const procurementService = {
  // ========================================================
  // 1. ผู้จัดจำหน่าย (Suppliers)
  // ========================================================

  /**
   * ดึงรายการผู้จัดจำหน่ายทั้งหมด
   * GET /api/v1/suppliers
   */
  async getSuppliers(params?: {
    search?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<Supplier[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.isActive !== undefined)
      query.append('isActive', String(params.isActive));

    const endpoint = `/api/v1/suppliers${query.toString() ? `?${query.toString()}` : ''}`;
    return api.get<Supplier[]>(endpoint, {
      loadingMessage: 'กำลังดึงรายชื่อผู้จัดจำหน่าย...',
    });
  },

  /**
   * ดูรายละเอียดผู้จัดจำหน่ายตาม ID
   * GET /api/v1/suppliers/{id}
   */
  async getSupplierById(id: string): Promise<ApiResponse<Supplier>> {
    return api.get<Supplier>(`/api/v1/suppliers/${id}`);
  },

  /**
   * สร้างข้อมูลผู้จัดจำหน่าย/คู่ค้าใหม่
   * POST /api/v1/suppliers
   */
  async createSupplier(
    data: CreateSupplierRequest
  ): Promise<ApiResponse<Supplier>> {
    return api.post<Supplier>('/api/v1/suppliers', data, {
      loadingMessage: 'กำลังสร้างข้อมูลผู้จัดจำหน่าย...',
    });
  },

  /**
   * แก้ไขข้อมูลผู้จัดจำหน่าย
   * PUT /api/v1/suppliers/{id}
   */
  async updateSupplier(
    id: string,
    data: UpdateSupplierRequest
  ): Promise<ApiResponse<Supplier>> {
    return api.put<Supplier>(`/api/v1/suppliers/${id}`, data, {
      loadingMessage: 'กำลังบันทึกข้อมูลผู้จัดจำหน่าย...',
    });
  },

  /**
   * ลบ/ปิดการใช้งานผู้จัดจำหน่าย
   * DELETE /api/v1/suppliers/{id}
   */
  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/api/v1/suppliers/${id}`, {
      loadingMessage: 'กำลังลบข้อมูลผู้จัดจำหน่าย...',
    });
  },

  // ========================================================
  // 2. ใบสั่งซื้อสินค้า (Purchase Orders)
  // ========================================================

  /**
   * ดึงรายการใบสั่งซื้อสินค้าทั้งหมด
   * GET /api/v1/purchase-orders
   */
  async getPurchaseOrders(
    params?: PurchaseOrderQueryParams
  ): Promise<ApiResponse<PurchaseOrder[]>> {
    const query = new URLSearchParams();
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const endpoint = `/api/v1/purchase-orders${
      query.toString() ? `?${query.toString()}` : ''
    }`;
    return api.get<PurchaseOrder[]>(endpoint, {
      loadingMessage: 'กำลังโหลดรายการใบสั่งซื้อสินค้า...',
    });
  },

  /**
   * ดูรายละเอียดใบสั่งซื้อตาม ID
   * GET /api/v1/purchase-orders/{id}
   */
  async getPurchaseOrderById(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return api.get<PurchaseOrder>(`/api/v1/purchase-orders/${id}`, {
      loadingMessage: 'กำลังโหลดรายละเอียดใบสั่งซื้อ...',
    });
  },

  /**
   * สร้างใบสั่งซื้อสินค้าใหม่
   * POST /api/v1/purchase-orders
   */
  async createPurchaseOrder(
    data: CreatePurchaseOrderRequest
  ): Promise<ApiResponse<PurchaseOrder>> {
    const payload: CreatePurchaseOrderRequest = {
      ...data,
      orderDate: formatToRFC3339(data.orderDate),
      expectedDeliveryDate: formatToRFC3339(data.expectedDeliveryDate),
    };
    return api.post<PurchaseOrder>('/api/v1/purchase-orders', payload, {
      loadingMessage: 'กำลังบันทึกใบสั่งซื้อสินค้า...',
    });
  },

  /**
   * แก้ไขใบสั่งซื้อสินค้า (สถานะ DRAFT)
   * PUT /api/v1/purchase-orders/{id}
   */
  async updatePurchaseOrder(
    id: string,
    data: UpdatePurchaseOrderRequest
  ): Promise<ApiResponse<PurchaseOrder>> {
    const payload: UpdatePurchaseOrderRequest = {
      ...data,
      orderDate: formatToRFC3339(data.orderDate),
      expectedDeliveryDate: formatToRFC3339(data.expectedDeliveryDate),
    };
    return api.put<PurchaseOrder>(`/api/v1/purchase-orders/${id}`, payload, {
      loadingMessage: 'กำลังบันทึกการแก้ไขใบสั่งซื้อ...',
    });
  },

  /**
   * ยืนยันการสั่งซื้อสินค้า (DRAFT -> ORDERED)
   * POST /api/v1/purchase-orders/{id}/confirm
   */
  async confirmPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return api.post<PurchaseOrder>(
      `/api/v1/purchase-orders/${id}/confirm`,
      {},
      { loadingMessage: 'กำลังยืนยันการสั่งซื้อสินค้า...' }
    );
  },

  /**
   * ยกเลิกใบสั่งซื้อสินค้า
   * POST /api/v1/purchase-orders/{id}/cancel
   */
  async cancelPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    return api.post<PurchaseOrder>(
      `/api/v1/purchase-orders/${id}/cancel`,
      {},
      { loadingMessage: 'กำลังยกเลิกใบสั่งซื้อสินค้า...' }
    );
  },

  /**
   * บังคับปิดใบสั่งซื้อสินค้า (Force Close)
   * POST /api/v1/purchase-orders/{id}/close
   */
  async forceClosePurchaseOrder(
    id: string
  ): Promise<ApiResponse<PurchaseOrder>> {
    return api.post<PurchaseOrder>(
      `/api/v1/purchase-orders/${id}/close`,
      {},
      { loadingMessage: 'กำลังปิดใบสั่งซื้อสินค้า...' }
    );
  },

  /**
   * ดึงรายการสินค้าที่ยังค้างรับในใบสั่งซื้อ (Preview for GR)
   * GET /api/v1/purchase-orders/{id}/receipt-preview
   */
  async getReceiptPreview(
    id: string
  ): Promise<ApiResponse<ReceiptPreviewItem[]>> {
    return api.get<ReceiptPreviewItem[]>(
      `/api/v1/purchase-orders/${id}/receipt-preview`,
      { loadingMessage: 'กำลังดึงรายการสินค้าค้างรับ...' }
    );
  },

  // ========================================================
  // 3. ตรวจรับสินค้าเข้าคลัง (Goods Receipts)
  // ========================================================

  /**
   * ดึงรายการใบตรวจรับสินค้าทั้งหมด
   * GET /api/v1/goods-receipts
   */
  async getGoodsReceipts(
    params?: GoodsReceiptQueryParams
  ): Promise<ApiResponse<GoodsReceipt[]>> {
    const query = new URLSearchParams();
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.purchaseOrderId)
      query.append('purchaseOrderId', params.purchaseOrderId);
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    if (params?.status) query.append('status', params.status);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const endpoint = `/api/v1/goods-receipts${
      query.toString() ? `?${query.toString()}` : ''
    }`;
    return api.get<GoodsReceipt[]>(endpoint, {
      loadingMessage: 'กำลังโหลดรายการใบตรวจรับสินค้า...',
    });
  },

  /**
   * ดูรายละเอียดใบตรวจรับสินค้าตาม ID
   * GET /api/v1/goods-receipts/{id}
   */
  async getGoodsReceiptById(id: string): Promise<ApiResponse<GoodsReceipt>> {
    return api.get<GoodsReceipt>(`/api/v1/goods-receipts/${id}`, {
      loadingMessage: 'กำลังโหลดรายละเอียดใบตรวจรับ...',
    });
  },

  /**
   * สร้างใบตรวจรับสินค้าเข้าคลัง
   * POST /api/v1/goods-receipts
   */
  async createGoodsReceipt(
    data: CreateGoodsReceiptRequest
  ): Promise<ApiResponse<GoodsReceipt>> {
    const payload: CreateGoodsReceiptRequest = {
      ...data,
      receivedDate: formatToRFC3339(data.receivedDate),
      lines: data.lines?.map((line) => ({
        ...line,
        expiryDate: formatToRFC3339(line.expiryDate),
      })),
    };
    return api.post<GoodsReceipt>('/api/v1/goods-receipts', payload, {
      loadingMessage: 'กำลังสร้างใบตรวจรับสินค้า...',
    });
  },

  /**
   * ยืนยันการตรวจรับสินค้าเข้าคลัง (นำยอดเข้าสต็อกสาขาจริง)
   * POST /api/v1/goods-receipts/{id}/complete
   */
  async completeGoodsReceipt(id: string): Promise<ApiResponse<GoodsReceipt>> {
    return api.post<GoodsReceipt>(
      `/api/v1/goods-receipts/${id}/complete`,
      {},
      { loadingMessage: 'กำลังยืนยันตรวจรับสินค้าเข้าคลัง...' }
    );
  },

  /**
   * ยกเลิกใบตรวจรับสินค้า (สถานะ DRAFT)
   * POST /api/v1/goods-receipts/{id}/cancel
   */
  async cancelGoodsReceipt(id: string): Promise<ApiResponse<GoodsReceipt>> {
    return api.post<GoodsReceipt>(
      `/api/v1/goods-receipts/${id}/cancel`,
      {},
      { loadingMessage: 'กำลังยกเลิกใบตรวจรับสินค้า...' }
    );
  },
};
