/**
 * สัญญาการเชื่อมต่อ API ยืนยันตัวตน (Authentication API Contracts)
 * อ้างอิงตาม Swagger Specification: http://127.0.0.1:8080/docs#/
 * Base Path: /api/v1
 */

// รูปแบบ Response Envelope มาตรฐานของระบบ ICE POS API
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  };
  details?: Array<{
    field: string;
    issue: string;
  }>;
}

// ข้อมูลโปรไฟล์ผู้ใช้งาน
export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | string;
  branchId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ข้อมูลสาขา
export interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

// ข้อมูลส่งเข้าสู่ระบบด้วย Username & Password (POST /api/v1/auth/login)
export interface LoginRequest {
  username: string;
  password: string;
}

// ข้อมูลส่งเข้าสู่ระบบด้วย PIN สำหรับแคชเชียร์ (POST /api/v1/auth/pin-login)
export interface PinLoginRequest {
  branchId: string;
  pin: string;
}

// ผลลัพธ์เมื่อเข้าสู่ระบบสำเร็จ (AuthResponse)
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

// รายการ Endpoint สัญญาการเชื่อมต่อ
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  PIN_LOGIN: '/api/v1/auth/pin-login',
  ME: '/api/v1/auth/me',
  REFRESH: '/api/v1/auth/refresh',
  BRANCHES: '/api/v1/branches',
} as const;
