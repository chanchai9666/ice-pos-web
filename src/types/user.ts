/**
 * ประเภทข้อมูลสำหรับระบบจัดการผู้ใช้งานและพนักงาน (User Management Types)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: /users
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

/**
 * ข้อมูลพนักงาน/ผู้ใช้งาน
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.UserResponse
 */
export interface UserResponse {
  id: string;                       // รหัสพนักงาน (UUID)
  username: string;                 // ชื่อผู้ใช้สำหรับล็อกอิน
  name: string;                     // ชื่อ-นามสกุลพนักงาน
  role: UserRole | string;          // บทบาทสิทธิ์การใช้งาน
  branchId?: string;                // รหัสสาขาที่สังกัด
  branch?: {
    id?: string;
    code?: string;
    name?: string;
  };
  isActive?: boolean;               // สถานะเปิดใช้งานบัญชี
  isLocked?: boolean;               // สถานะบัญชีถูกระงับชั่วคราวจากการล็อกอินพลาด
  failedLoginAttempts?: number;     // จำนวนครั้งที่พยายามล็อกอินผิด
  lockedUntil?: string;             // ปลดล็อกเมื่อ (ISO8601)
  lastLoginAt?: string;             // วันเวลาที่ล็อกอินล่าสุด
  createdAt?: string;
  updatedAt?: string;
}

/**
 * คำขอสร้างพนักงานใหม่
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.CreateUserRequest
 */
export interface CreateUserRequest {
  name: string;                     // ชื่อ-นามสกุล (1-100 ตัวอักษร)
  username: string;                 // ชื่อผู้ใช้ (3-50 ตัวอักษร)
  password: string;                 // รหัสผ่าน (8-100 ตัวอักษร)
  role: UserRole;                   // ADMIN, MANAGER, CASHIER
  branchId?: string;
  pin?: string;                     // PIN สำหรับล็อกอินด่วน (4-6 หลัก)
}

/**
 * คำขอแก้ไขข้อมูลพนักงาน
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.UpdateUserRequest
 */
export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  branchId?: string;
  isActive?: boolean;
}

/**
 * คำขอรีเซ็ตรหัสผ่านพนักงาน
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.ResetPasswordRequest
 */
export interface ResetPasswordRequest {
  newPassword: string;              // รหัสผ่านใหม่ (8-100 ตัวอักษร)
}

/**
 * คำขอรีเซ็ต PIN แคชเชียร์
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.ResetPinRequest
 */
export interface ResetPinRequest {
  pin: string;                      // PIN ใหม่ (4-6 หลัก)
}

/**
 * ตัวกรองการค้นหารายชื่อพนักงาน
 */
export interface UserQueryParams {
  branchId?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
}
