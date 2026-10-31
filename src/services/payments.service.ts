/**
 * บริการเชื่อมต่อ API สำหรับการชำระเงินและ QR พร้อมเพย์ (Payments Service)
 * โครงการ ice-pos-web
 */

import { request } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { GenerateQRRequest, QRPaymentResponse, QRStatusResponse } from '@/types/payment';
import { generateIdempotencyKey } from '@/utils/idempotency';

export const paymentsService = {
  /**
   * สร้าง Dynamic QR PromptPay ตามยอดเงินที่ต้องชำระ (หน่วยสตางค์)
   * @param amount ยอดเงินในหน่วยสตางค์
   * @param idempotencyKey รหัสป้องกันการทำรายการซ้ำ (Idempotency Key)
   */
  generatePromptPayQR: async (
    amount: number,
    idempotencyKey?: string
  ): Promise<ApiResponse<QRPaymentResponse>> => {
    const payload: GenerateQRRequest = { amount };
    return request<QRPaymentResponse>('/api/v1/payments/qr', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey || generateIdempotencyKey(),
      },
      body: JSON.stringify(payload),
    });
  },

  /**
   * ตรวจสอบสถานะการชำระเงินผ่าน QR พร้อมเพย์
   * @param ref รหัสอ้างอิง QR
   */
  checkPaymentStatus: async (ref: string): Promise<ApiResponse<QRStatusResponse>> => {
    return request<QRStatusResponse>(`/api/v1/payments/${encodeURIComponent(ref)}/status`, {
      method: 'GET',
    });
  },
};
