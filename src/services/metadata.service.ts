/**
 * เซอร์วิสสำหรับดึงข้อมูลตั้งค่าพื้นฐานของสินค้า (Metadata Service)
 * เช่น อัตราภาษี (Taxes) และ หน่วยนับสินค้า (UOMs)
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { Tax, Uom } from '@/types/catalog';

/**
 * สเปกส่ง UomResponse มาเป็น nameTh / nameEn (ไม่มี name)
 * normalize เป็น name ให้ UI ใช้ชื่อเดียวได้ทั่วโปรเจกต์
 */
function normalizeUom(raw: Uom): Uom {
  return {
    ...raw,
    name: raw.name || raw.nameTh || raw.nameEn || raw.code || '',
  };
}

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
    const res = await api.get<Uom[]>('/api/v1/uoms');
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map(normalizeUom);
    }
    return res;
  },
};
