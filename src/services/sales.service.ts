/**
 * บริการเชื่อมต่อ API รายการขายและการชำระเงิน (Sales & Checkout Service)
 * โครงการ ice-pos-web
 */

import { api, request } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import {
  CreateSaleRequest,
  SaleResponse,
  SalesQueryParams,
  VoidSaleRequest,
} from '@/types/sale';
import { generateIdempotencyKey } from '@/utils/idempotency';

export const salesService = {
  /**
   * บันทึกการขายสินค้าหน้าร้าน (Checkout)
   * @param saleData ข้อมูลคำขอสร้างรายการขาย
   * @param idempotencyKey UUID ป้องกันการทำรายการซ้ำ
   */
  createSale: async (
    saleData: CreateSaleRequest,
    idempotencyKey?: string
  ): Promise<ApiResponse<SaleResponse>> => {
    const key = idempotencyKey || saleData.idempotencyKey;
    const headers: Record<string, string> = {};
    if (key) {
      headers['Idempotency-Key'] = key;
    }

    return request<SaleResponse>('/api/v1/sales', {
      method: 'POST',
      headers,
      body: JSON.stringify(saleData),
      loadingMessage: 'กำลังประมวลผลการชำระเงิน กรุณารอสักครู่...',
      timeoutMs: 30000,
    });
  },

  /**
   * ดึงประวัติรายการขายย้อนหลัง พร้อมตัวกรอง (List Sales History)
   * GET /api/v1/sales
   */
  getSalesHistory: async (
    params?: SalesQueryParams
  ): Promise<ApiResponse<SaleResponse[]>> => {
    const queryParams: Record<string, string | number> = {};
    if (params?.branchId) queryParams.branchId = params.branchId;
    if (params?.cashierId) queryParams.cashierId = params.cashierId;
    if (params?.customerId) queryParams.customerId = params.customerId;
    if (params?.status) queryParams.status = params.status;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.page) queryParams.page = params.page;
    if (params?.pageSize) queryParams.pageSize = params.pageSize;

    return api.get<SaleResponse[]>('/api/v1/sales', {
      params: queryParams,
      loadingMessage: 'กำลังโหลดประวัติการขาย...',
    });
  },

  /**
   * ดูรายละเอียดบิลขายตาม ID
   * GET /api/v1/sales/{id}
   */
  getSaleById: async (id: string): Promise<ApiResponse<SaleResponse>> => {
    return request<SaleResponse>(`/api/v1/sales/${id}`, {
      method: 'GET',
    });
  },

  /**
   * ยกเลิกบิลขาย คืนยอดสต็อกเข้าคลัง และคืนวงเงินเครดิต (Void Sale)
   * POST /api/v1/sales/{id}/void
   */
  voidSale: async (
    id: string,
    reason: string
  ): Promise<ApiResponse<void>> => {
    const body: VoidSaleRequest = { reason };
    const idempotencyKey = generateIdempotencyKey();

    return api.post<void>(`/api/v1/sales/${id}/void`, body, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      loadingMessage: 'กำลังยกเลิกบิลขาย กรุณารอสักครู่...',
    });
  },
};
