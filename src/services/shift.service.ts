/**
 * เซอร์วิสสำหรับจัดการกะการทำงานและลิ้นชักเก็บเงิน (Shift Service)
 * โครงการ ice-pos-web
 */

import { api, ApiError } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { ShiftInfo, OpenShiftRequest, CloseShiftRequest } from '@/types/shift';

export const shiftService = {
  /**
   * ตรวจสอบกะการขายที่กำลังเปิดใช้งานอยู่ปัจจุบันของสาขา
   */
  async getActiveShift(branchId: string): Promise<ApiResponse<ShiftInfo | null>> {
    try {
      return await api.get<ShiftInfo | null>('/api/v1/shifts/active', {
        params: { branchId },
      });
    } catch (error) {
      // หากเซิร์ฟเวอร์ตอบ 404 หรือไม่มีกะเปิดอยู่ ให้คืนค่า data: null เพื่อให้หน้าจอแสดงสถานะยังไม่ได้เปิดกะ
      if (error instanceof ApiError && (error.code === 404 || error.code === 4040)) {
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
