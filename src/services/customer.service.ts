/**
 * บริการเชื่อมต่อ API ลูกค้าและบัญชีเงินเชื่อ (Customer & Credit Service)
 * โครงการ ice-pos-web
 */

import { api, request } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import {
  CustomerSummary,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  SetCreditLimitRequest,
  PayCreditRequest,
  CreditTransactionResponse,
  ARAgingItemResponse,
} from '@/types/customer';
import { generateIdempotencyKey } from '@/utils/idempotency';

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
   * GET /api/v1/customers
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
        pageSize: options?.pageSize ?? 50,
      },
    });
  },

  /**
   * ดึงรายละเอียดลูกค้าตาม ID
   * GET /api/v1/customers/{id}
   */
  getCustomerById: async (id: string): Promise<ApiResponse<CustomerSummary>> => {
    return request<CustomerSummary>(`/api/v1/customers/${id}`, {
      method: 'GET',
    });
  },

  /**
   * ลงทะเบียนลูกค้าใหม่และเปิดบัญชีเงินเชื่อ
   * POST /api/v1/customers
   */
  createCustomer: async (
    data: CreateCustomerRequest
  ): Promise<ApiResponse<CustomerSummary>> => {
    return api.post<CustomerSummary>('/api/v1/customers', data, {
      loadingMessage: 'กำลังลงทะเบียนลูกค้าใหม่...',
    });
  },

  /**
   * แก้ไขข้อมูลลูกค้า
   * PUT /api/v1/customers/{id}
   */
  updateCustomer: async (
    id: string,
    data: UpdateCustomerRequest
  ): Promise<ApiResponse<CustomerSummary>> => {
    return api.put<CustomerSummary>(`/api/v1/customers/${id}`, data, {
      loadingMessage: 'กำลังบันทึกข้อมูลลูกค้า...',
    });
  },

  /**
   * ลบข้อมูลลูกค้า
   * DELETE /api/v1/customers/{id}
   */
  deleteCustomer: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/api/v1/customers/${id}`, {
      loadingMessage: 'กำลังลบข้อมูลลูกค้า...',
    });
  },

  /**
   * กำหนดหรือปรับเปลี่ยนวงเงินเครดิตลูกค้า
   * PUT /api/v1/customers/{id}/credit-limit
   */
  setCreditLimit: async (
    id: string,
    creditLimit: number
  ): Promise<ApiResponse<void>> => {
    const body: SetCreditLimitRequest = { creditLimit };
    return api.put<void>(`/api/v1/customers/${id}/credit-limit`, body, {
      loadingMessage: 'กำลังปรับวงเงินเครดิต...',
    });
  },

  /**
   * บันทึกการรับชำระหนี้จากลูกค้า
   * POST /api/v1/customers/{id}/pay-credit
   */
  payCredit: async (
    id: string,
    data: Omit<PayCreditRequest, 'idempotencyKey'>
  ): Promise<ApiResponse<CreditTransactionResponse>> => {
    const idempotencyKey = generateIdempotencyKey();
    const body: PayCreditRequest = {
      ...data,
      idempotencyKey,
    };
    return api.post<CreditTransactionResponse>(`/api/v1/customers/${id}/pay-credit`, body, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      loadingMessage: 'กำลังบันทึกการรับชำระหนี้...',
    });
  },

  /**
   * ดึงรายงานลูกหนี้ค้างชำระตามอายุหนี้ (AR Aging Report)
   * GET /api/v1/customers/reports/ar-aging
   */
  getARAgingReport: async (
    branchId?: string
  ): Promise<ApiResponse<ARAgingItemResponse[]>> => {
    return api.get<ARAgingItemResponse[]>('/api/v1/customers/reports/ar-aging', {
      params: branchId ? { branchId } : undefined,
      loadingMessage: 'กำลังดึงรายงานลูกหนี้คงค้าง...',
    });
  },
};
