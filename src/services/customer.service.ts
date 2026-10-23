/**
 * บริการเชื่อมต่อ API ลูกค้าและบัญชีเงินเชื่อ (Customer & Credit Service)
 * โครงการ ice-pos-web
 */

import { request } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { CustomerSummary } from '@/types/customer';

export const customerService = {
  /**
   * ค้นหารายการลูกค้าและตรวจสอบยอดเงินเชื่อคงเหลือ
   * @param query คำค้นหา (ชื่อ, รหัส, เบอร์โทร)
   * @param branchId UUID ของสาขา
   */
  searchCustomers: async (
    query: string = '',
    branchId?: string
  ): Promise<ApiResponse<CustomerSummary[]>> => {
    return request<CustomerSummary[]>('/api/v1/customers', {
      method: 'GET',
      params: {
        search: query || undefined,
        branchId: branchId || undefined,
        page: 1,
        pageSize: 20,
      },
    });
  },

  /**
   * ดึงรายละเอียดลูกค้าตาม ID
   */
  getCustomerById: async (id: string): Promise<ApiResponse<CustomerSummary>> => {
    return request<CustomerSummary>(`/api/v1/customers/${id}`, {
      method: 'GET',
    });
  },
};
