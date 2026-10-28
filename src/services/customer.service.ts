/**
 * บริการเชื่อมต่อ API ลูกค้าและบัญชีเงินเชื่อ (Customer & Credit Service)
 * โครงการ ice-pos-web
 */

import { request } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { CustomerSummary } from '@/types/customer';

export interface SearchCustomersParams {
  search?: string;
  branchId?: string;
  isMember?: boolean;
  page?: number;
  pageSize?: number;
}

export const customerService = {
  /**
   * ค้นหารายการลูกค้าและตรวจสอบยอดเงินเชื่อคงเหลือ
   * อ้างอิงสเปก: GET /customers (query: branchId, search, isMember, page, pageSize)
   */
  searchCustomers: async (
    query: string = '',
    branchId?: string,
    options?: Omit<SearchCustomersParams, 'search' | 'branchId'>
  ): Promise<ApiResponse<CustomerSummary[]>> => {
    return request<CustomerSummary[]>('/api/v1/customers', {
      method: 'GET',
      params: {
        search: query || undefined,
        branchId: branchId || undefined,
        isMember: options?.isMember,
        page: options?.page ?? 1,
        pageSize: options?.pageSize ?? 20,
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
