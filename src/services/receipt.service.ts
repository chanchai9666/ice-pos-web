/**
 * เซอร์วิสสำหรับระบบใบเสร็จรับเงิน (Receipt Service)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: GET /receipts/{receiptNo}
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { ReceiptResponse } from '@/types/receipt';

export const receiptService = {
  /**
   * ดึงข้อมูล Snapshot ใบเสร็จรับเงินตามเลขที่ใบเสร็จ สำหรับพิมพ์/พิมพ์ซ้ำ
   * GET /api/v1/receipts/{receiptNo}
   */
  async getReceiptByNo(receiptNo: string): Promise<ApiResponse<ReceiptResponse>> {
    return api.get<ReceiptResponse>(`/api/v1/receipts/${encodeURIComponent(receiptNo)}`, {
      loadingMessage: 'กำลังดึงข้อมูลใบเสร็จรับเงิน...',
    });
  },
};
