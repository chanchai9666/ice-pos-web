/**
 * เซอร์วิสสำหรับระบบรายงานและการวิเคราะห์ (Reports Service)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: /reports
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import {
  SalesSummaryResponse,
  BestSellerResponse,
  ReportQueryParams,
} from '@/types/report';

export const reportService = {
  /**
   * รายงานสรุปยอดขาย กำไรขั้นต้น และภาษี (Sales Summary Report)
   * GET /api/v1/reports/sales-summary
   */
  async getSalesSummary(
    params?: ReportQueryParams
  ): Promise<ApiResponse<SalesSummaryResponse>> {
    const queryParams: Record<string, string | number> = {};
    if (params?.branchId) queryParams.branchId = params.branchId;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;

    return api.get<SalesSummaryResponse>('/api/v1/reports/sales-summary', {
      params: queryParams,
      loadingMessage: 'กำลังดึงรายงานสรุปยอดขาย...',
    });
  },

  /**
   * รายงานสินค้าขายดี (Best Selling Products Report)
   * GET /api/v1/reports/best-sellers
   */
  async getBestSellers(
    params?: ReportQueryParams
  ): Promise<ApiResponse<BestSellerResponse[]>> {
    const queryParams: Record<string, string | number> = {};
    if (params?.branchId) queryParams.branchId = params.branchId;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.limit) queryParams.limit = params.limit;

    return api.get<BestSellerResponse[]>('/api/v1/reports/best-sellers', {
      params: queryParams,
      loadingMessage: 'กำลังดึงรายงานสินค้าขายดี...',
    });
  },
};

