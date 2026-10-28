/**
 * เซอร์วิสสำหรับระบบจัดการผู้ใช้งานและพนักงาน (User Management Service)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: /users
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ResetPasswordRequest,
  ResetPinRequest,
  UserQueryParams,
} from '@/types/user';

export const userService = {
  /**
   * ดึงรายชื่อพนักงานทั้งหมด (List Staff Users)
   * GET /api/v1/users
   */
  async getUsers(params?: UserQueryParams): Promise<ApiResponse<UserResponse[]>> {
    const queryParams: Record<string, string | boolean> = {};
    if (params?.branchId) queryParams.branchId = params.branchId;
    if (params?.role) queryParams.role = params.role;
    if (typeof params?.isActive === 'boolean') queryParams.isActive = params.isActive;
    if (params?.search) queryParams.search = params.search;

    return api.get<UserResponse[]>('/api/v1/users', {
      params: queryParams,
      loadingMessage: 'กำลังดึงรายชื่อพนักงาน...',
    });
  },

  /**
   * ดึงข้อมูลพนักงานตาม ID
   * GET /api/v1/users/{id}
   */
  async getUserById(id: string): Promise<ApiResponse<UserResponse>> {
    return api.get<UserResponse>(`/api/v1/users/${id}`, {
      loadingMessage: 'กำลังดึงข้อมูลพนักงาน...',
    });
  },

  /**
   * สร้างบัญชีผู้ใช้งานใหม่
   * POST /api/v1/users
   */
  async createUser(data: CreateUserRequest): Promise<ApiResponse<UserResponse>> {
    return api.post<UserResponse>('/api/v1/users', data, {
      loadingMessage: 'กำลังสร้างบัญชีพนักงานใหม่...',
    });
  },

  /**
   * แก้ไขข้อมูลพนักงาน
   * PUT /api/v1/users/{id}
   */
  async updateUser(
    id: string,
    data: UpdateUserRequest
  ): Promise<ApiResponse<UserResponse>> {
    return api.put<UserResponse>(`/api/v1/users/${id}`, data, {
      loadingMessage: 'กำลังบันทึกข้อมูลพนักงาน...',
    });
  },

  /**
   * ระงับการใช้งานบัญชีพนักงาน (Soft Delete)
   * DELETE /api/v1/users/{id}
   */
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/api/v1/users/${id}`, {
      loadingMessage: 'กำลังระงับบัญชีผู้ใช้งาน...',
    });
  },

  /**
   * รีเซ็ตรหัสผ่านพนักงาน
   * POST /api/v1/users/{id}/reset-password
   */
  async resetPassword(id: string, newPassword: string): Promise<ApiResponse<void>> {
    const body: ResetPasswordRequest = { newPassword };
    return api.post<void>(`/api/v1/users/${id}/reset-password`, body, {
      loadingMessage: 'กำลังรีเซ็ตรหัสผ่าน...',
    });
  },

  /**
   * รีเซ็ต PIN แคชเชียร์
   * POST /api/v1/users/{id}/reset-pin
   */
  async resetPin(id: string, pin: string): Promise<ApiResponse<void>> {
    const body: ResetPinRequest = { pin };
    return api.post<void>(`/api/v1/users/${id}/reset-pin`, body, {
      loadingMessage: 'กำลังรีเซ็ต PIN แคชเชียร์...',
    });
  },

  /**
   * ปลดล็อกบัญชีพนักงานที่ถูกระงับจากการล็อกอินผิดพลาด
   * POST /api/v1/users/{id}/unlock
   */
  async unlockUser(id: string): Promise<ApiResponse<void>> {
    return api.post<void>(`/api/v1/users/${id}/unlock`, undefined, {
      loadingMessage: 'กำลังปลดล็อกบัญชีผู้ใช้งาน...',
    });
  },
};
