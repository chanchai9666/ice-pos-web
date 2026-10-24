/**
 * ประเภทข้อมูลและ Interface สำหรับระบบยืนยันตัวตน (Authentication Types)
 * โครงการ ice-pos-web
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

// ข้อมูลสำหรับส่งเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน
export interface LoginRequest {
  username: string;
  password: string;
}

// ข้อมูลสำหรับส่งเข้าสู่ระบบด่วนด้วย PIN ประจำสาขา
export interface PinLoginRequest {
  branchId: string;
  pin: string;
}

// ผลลัพธ์เมื่อเข้าสู่ระบบสำเร็จ
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

// โหมดการเข้าสู่ระบบ
export type LoginMode = 'pin' | 'credentials';

// ข้อมูลที่บันทึกไว้ในอุปกรณ์ (Device Preferences)
export interface DevicePreferences {
  lastBranchId: string | null;
  lastLoginMode: LoginMode;
}

// ==========================================
// การต่ออายุ Token และวงจรชีวิตของเซสชัน (Token Refresh & Session Lifecycle)
// ==========================================

/**
 * เหตุการณ์เกี่ยวกับวงจรชีวิตของเซสชันผู้ใช้งาน
 */
export type SessionEventType =
  | 'SESSION_REFRESHED'
  | 'SESSION_EXPIRED'
  | 'SESSION_NETWORK_ERROR';

/**
 * รายละเอียดของเหตุการณ์เซสชัน
 */
export interface SessionEventPayload {
  type: SessionEventType;
  message?: string;
  timestamp: number;
}

/**
 * ฟังก์ชัน Callback สำหรับลงทะเบียนรับฟังเหตุการณ์เซสชันหมดอายุ
 */
export type SessionExpiredListener = (payload: SessionEventPayload) => void;

/**
 * สถานะการขอต่ออายุ Token เบื้องหลัง (Interceptor Coordinator State)
 */
export interface TokenRefreshCoordinatorState {
  isRefreshing: boolean;
  refreshPromise: Promise<string> | null;
  queuedRequests: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }>;
}

