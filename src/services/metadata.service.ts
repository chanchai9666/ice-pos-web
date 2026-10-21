/**
 * เซอร์วิสสำหรับดึงข้อมูลตั้งค่าพื้นฐานของสินค้า (Metadata Service)
 * เช่น อัตราภาษี (Taxes) และ หน่วยนับสินค้า (UOMs)
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { Tax, Uom } from '@/types/catalog';

export const metadataService = {
  /**
   * ดูรายการอัตราภาษีทั้งหมด
   */
  async getTaxes(): Promise<ApiResponse<Tax[]>> {
    return api.get<Tax[]>('/api/v1/taxes');
  },

  /**
   * ดูรายการหน่วยนับสินค้าทั้งหมด
   */
  async getUoms(): Promise<ApiResponse<Uom[]>> {
    return api.get<Uom[]>('/api/v1/uoms');
  },
};
