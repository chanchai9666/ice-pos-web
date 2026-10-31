/**
 * เซอร์วิสสำหรับระบบแดชบอร์ดภาพรวม (Dashboard Service)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา API: GET /api/v1/dashboard/overview
 * เอกสาร: DASHBOARD_API_INTEGRATION_GUIDE.md
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import {
  DashboardOverviewResponse,
  DashboardQueryParams,
} from '@/types/dashboard';

export const dashboardService = {
  /**
   * ดึงข้อมูลสรุปภาพรวมแดชบอร์ด (Overview Dashboard)
   * GET /api/v1/dashboard/overview
   *
   * @param params พารามิเตอร์ตัวกรอง (สาขา, รอบเวลา, เปรียบเทียบ)
   * @param options ตัวเลือกเสริม เช่น silent: true เพื่อไม่แสดง Global Blocking Overlay ตอน Auto-refresh
   */
  async getOverview(
    params?: DashboardQueryParams,
    options?: { silent?: boolean }
  ): Promise<ApiResponse<DashboardOverviewResponse>> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params?.branchId) queryParams.branchId = params.branchId;
    if (params?.period) queryParams.period = params.period;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (typeof params?.comparePrevious === 'boolean') {
      queryParams.comparePrevious = params.comparePrevious;
    }

    return api.get<DashboardOverviewResponse>('/api/v1/dashboard/overview', {
      params: queryParams,
      silent: options?.silent,
      loadingMessage: options?.silent ? undefined : 'กำลังดึงข้อมูลแดชบอร์ดภาพรวม...',
    });
  },
};

