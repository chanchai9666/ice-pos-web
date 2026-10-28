/**
 * เซอร์วิสสำหรับระบบรับคืนสินค้าและคืนเงิน (Return & Refund Service)
 * โครงการ ice-pos-web
 */

import { request } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { CreateReturnRequest, ReturnResponse } from '@/types/return';
import { generateIdempotencyKey } from '@/utils/idempotency';

export const returnService = {
  /**
   * บันทึกการรับคืนสินค้าและคืนเงิน (Product Return & Refund)
   * POST /api/v1/returns
   * แนบ Header Idempotency-Key เสมอเพื่อป้องกันการคืนเงินซ้ำ
   */
  async createReturn(
    data: CreateReturnRequest,
    idempotencyKey?: string
  ): Promise<ApiResponse<ReturnResponse>> {
    const key = idempotencyKey || generateIdempotencyKey();
    const headers: Record<string, string> = {
      'Idempotency-Key': key,
    };

    return request<ReturnResponse>('/api/v1/returns', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      loadingMessage: 'กำลังบันทึกการรับคืนสินค้าและคืนเงิน...',
      timeoutMs: 30000,
    });
  },
};
