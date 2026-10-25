import {
  AuthResponse,
  Branch,
  LoginRequest,
  PinLoginRequest,
  UserProfile,
} from '@/types/auth';
import { api } from './api';

export const authService = {
  /**
   * เข้าสู่ระบบด้วยชื่อผู้ใช้งานและรหัสผ่าน
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      '/api/v1/auth/login',
      credentials
    );
    return response.data;
  },

  /**
   * เข้าสู่ระบบด่วนด้วยรหัส PIN สำหรับแคชเชียร์
   */
  async pinLogin(credentials: PinLoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      '/api/v1/auth/pin-login',
      credentials
    );
    return response.data;
  },

  /**
   * ดึงข้อมูลโปรไฟล์ผู้ใช้งานปัจจุบัน
   */
  async getMe(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/api/v1/auth/me');
    return response.data;
  },

  /**
   * ดึงรายการสาขาทั้งหมดสำหรับให้เลือกเข้าใช้งาน
   */
  async getBranches(): Promise<Branch[]> {
    const response = await api.get<Branch[]>('/api/v1/branches');
    return response.data || [];
  },

  /**
   * ขอต่ออายุ Access Token (รองรับทั้งการส่ง Refresh Token และการใช้ Cookie)
   */
  async refreshToken(refreshToken?: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      '/api/v1/auth/refresh',
      refreshToken ? { refreshToken } : {}
    );
    return response.data;
  },

  /**
   * ออกจากระบบและสั่งให้เซิร์ฟเวอร์เพิกถอนสิทธิ์พร้อมล้าง HttpOnly Cookie
   */
  async logout(): Promise<void> {
    await api.post<void>('/api/v1/auth/logout');
  },
};
