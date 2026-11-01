/**
 * เซอร์วิสสำหรับจัดการกะการทำงานและลิ้นชักเก็บเงิน (Shift Service)
 * โครงการ ice-pos-web
 */

import { api, ApiError } from '@/services/api';
import { ApiResponse, RequestOptions } from '@/types/auth';
import { ShiftInfo, OpenShiftRequest, CloseShiftRequest } from '@/types/shift';

export const shiftService = {
  /**
   * ตรวจสอบกะการขายที่กำลังเปิดใช้งานอยู่ปัจจุบันของสาขา
   * ค่าเริ่มต้นใช้ silent: true เพื่อไม่ให้บล็อก Overlay ระหว่างตรวจสอบกะเบื้องหลัง
   */
  async getActiveShift(
    branchId: string,
    options?: RequestOptions
  ): Promise<ApiResponse<ShiftInfo | null>> {
    try {
      return await api.get<ShiftInfo | null>('/api/v1/shifts/active', {
        silent: true,
        ...options,
        params: { branchId, ...options?.params },
      });
    } catch (error) {
      // สเปกประกาศว่า GET /shifts/active ตอบ 200 พร้อม data = null เมื่อยังไม่เปิดกะ
      // แต่บาง deployment ตอบ 404 — รองรับทั้งสองทางเพื่อไม่ให้หน้าจอค้าง
      if (
        error instanceof ApiError &&
        (error.status === 404 || error.code === 404 || error.code === 4040)
      ) {
        return {
          code: 0,
          message: 'ไม่มีกะที่เปิดใช้งานอยู่',
          data: null,
        };
      }
      throw error;
    }
  },

  /**
   * เปิดกะการขายใหม่พร้อมระบุเงินทอนเริ่มต้น
   */
  async openShift(data: OpenShiftRequest): Promise<ApiResponse<ShiftInfo>> {
    return api.post<ShiftInfo>('/api/v1/shifts/open', data);
  },

  /**
   * ปิดกะการขายและกระทบยอดเงินสด
   */
  async closeShift(id: string, data: CloseShiftRequest): Promise<ApiResponse<ShiftInfo>> {
    return api.post<ShiftInfo>(`/api/v1/shifts/${id}/close`, data);
  },
};
