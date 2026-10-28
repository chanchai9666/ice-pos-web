/**
 * เซอร์วิสตรวจสอบสถานะระบบ (Health Service)
 * GET /api/v1/health
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';

export interface HealthCheckResponse {
  status?: string;
  [key: string]: unknown;
}

export const healthService = {
  /**
   * ตรวจสอบสถานะการทำงานของเซิร์ฟเวอร์ Backend (Health Check)
   * GET /api/v1/health
   */
  async checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    return api.get<HealthCheckResponse>('/api/v1/health', {
      silent: true,
      timeoutMs: 5000,
    });
  },
};
