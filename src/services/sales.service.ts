/**
 * บริการเชื่อมต่อ API รายการขายและการชำระเงิน (Sales & Checkout Service)
 * โครงการ ice-pos-web
 */

import { request } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { CreateSaleRequest, SaleResponse } from '@/types/sale';

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
    });
  },

  /**
   * ดูรายละเอียดบิลขายตาม ID
   */
  getSaleById: async (id: string): Promise<ApiResponse<SaleResponse>> => {
    return request<SaleResponse>(`/api/v1/sales/${id}`, {
      method: 'GET',
    });
  },
};
