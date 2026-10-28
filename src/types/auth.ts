/**
 * ประเภทข้อมูลและ Interface สำหรับระบบยืนยันตัวตน (Authentication Types)
 * โครงการ ice-pos-web
 */

// รูปแบบ Response Envelope มาตรฐานของระบบ ICE POS API
// อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.StandardResponse
export interface PaginationMeta {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
}

// meta ของสเปกเป็น object ซ้อน — pagination อยู่ใต้ meta ไม่ใช่ field แบน
export interface ResponseMeta {
  pagination?: PaginationMeta;
  hasMore?: boolean;
  nextCursor?: string;
  extra?: Record<string, unknown>;
}

// รายละเอียดข้อผิดพลาดระดับฟิลด์ (สเปกใช้ชื่อ message ไม่ใช่ issue)
export interface ErrorDetail {
  field: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  meta?: ResponseMeta;
  details?: ErrorDetail[];
}

// ข้อมูลโปรไฟล์ผู้ใช้งาน
// อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.UserProfileResponse
export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | string;
  branchId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ข้อมูลสาขา
// อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.BranchResponse
export interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  businessDayStart?: string;
  createdAt?: string;
  updatedAt?: string;
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

// ผลลัพธ์เมื่อเข้าสู่ระบบสำเร็จ (รองรับทั้งแบบ Hybrid และ Cookie-based)
// อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.AuthResponse
// หมายเหตุ: สเปกใช้ expiresAt (timestamp สัมบูรณ์) ไม่ใช่ expiresIn (จำนวนวินาที)
export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  user: UserProfile;
}

// โหมดการเข้าสู่ระบบ
export type LoginMode = 'pin' | 'credentials';

// ตัวเลือกการส่งคำขอระดับเครือข่าย (Request Options)
export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  _isRetry?: boolean;
  loadingMessage?: string;
  silent?: boolean;
  timeoutMs?: number;
}

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
  | 'SESSION_NETWORK_ERROR'
  | 'LOGOUT';

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

