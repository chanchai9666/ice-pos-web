import {
  ApiResponse,
  AuthResponse,
  RequestOptions,
  SessionEventPayload,
  SessionExpiredListener,
  TokenRefreshCoordinatorState,
} from '@/types/auth';
import {
  clearAuthSession,
  getAccessToken,
  getCurrentBranch,
  getRefreshToken,
  setAuthSession,
} from '@/utils/storage';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export class ApiError extends Error {
  public code: number;
  public details?: Array<{ field: string; issue: string }>;

  constructor(
    message: string,
    code: number = 5000,
    details?: Array<{ field: string; issue: string }>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// ==========================================
// ตัวจัดการคิวและการต่ออายุ Token เบื้องหลัง (Refresh Coordinator)
// ==========================================

const coordinator: TokenRefreshCoordinatorState = {
  isRefreshing: false,
  refreshPromise: null,
  queuedRequests: [],
};

const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * ลงทะเบียนตัวรับฟังเหตุการณ์เซสชันหมดอายุ
 * @returns ฟังก์ชันสำหรับยกเลิกการลงทะเบียน (Unsubscribe)
 */
export function registerSessionExpiredListener(
  listener: SessionExpiredListener
): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

/**
 * ส่งสัญญาณแจ้งเตือนไปยังผู้รับฟังทั้งหมดเมื่อเซสชันหมดอายุ
 */
function notifySessionExpired(payload?: Partial<SessionEventPayload>): void {
  const eventPayload: SessionEventPayload = {
    type: payload?.type || 'SESSION_EXPIRED',
    message: payload?.message || 'เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
    timestamp: payload?.timestamp || Date.now(),
  };

  sessionExpiredListeners.forEach((listener) => {
    try {
      listener(eventPayload);
    } catch (err) {
      console.error('Error executing session expired listener:', err);
    }
  });
}

/**
 * ฟังก์ชันหลักในการขอต่ออายุ Access Token ใหม่ด้วย Refresh Token (รองรับ Hybrid Cookie + Payload)
 */
async function performTokenRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();

  try {
    const refreshUrl = `${API_BASE_URL}/api/v1/auth/refresh`;
    const res = await fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });

    let data: ApiResponse<AuthResponse>;
    try {
      data = (await res.json()) as ApiResponse<AuthResponse>;
    } catch {
      throw new ApiError('รูปแบบการตอบกลับจากระบบไม่ถูกต้อง', res.status);
    }

    if (!res.ok || (data.code !== undefined && data.code !== 0)) {
      throw new ApiError(data.message || 'Refresh token is invalid or expired', data.code || res.status);
    }

    const newAuth = data.data;
    if (newAuth) {
      // อัปเดต Token ชุดใหม่ลงใน Storage โดยคงข้อมูลสาขาเดิมไว้
      const currentBranch = getCurrentBranch();
      setAuthSession(newAuth, currentBranch);
    }

    return newAuth?.accessToken || 'refreshed';
  } catch (error) {
    // ล้างเฉพาะ Token และแจ้งเตือนเซสชันหมดอายุ
    clearAuthSession();
    notifySessionExpired({
      type: 'SESSION_EXPIRED',
      message: 'เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
      timestamp: Date.now(),
    });
    throw error;
  }
}

/**
 * ส่งคำขอ HTTP ไปยัง API พร้อมระบบ Silent Token Refresh และ Auto Retry
 */
export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers, _isRetry, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = getAccessToken();
  const isFormData = typeof FormData !== 'undefined' && restOptions.body instanceof FormData;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      credentials: options.credentials || 'include',
      ...restOptions,
      headers: requestHeaders,
    });

    let data: ApiResponse<T>;
    try {
      data = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new ApiError(
        'การตอบกลับจากระบบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
        response.status
      );
    }

    // กรณีได้รับ HTTP 401 และไม่ใช่ Endpoint เข้าสู่ระบบ, ออกจากระบบ หรือ Refresh Token
    const isAuthEndpoint =
      endpoint.startsWith('/api/v1/auth/login') ||
      endpoint.startsWith('/api/v1/auth/pin-login') ||
      endpoint.startsWith('/api/v1/auth/refresh') ||
      endpoint.startsWith('/api/v1/auth/logout');

    if (response.status === 401 && !isAuthEndpoint && !_isRetry) {
      // 1. หากมีคำขออื่นกำลัง Refresh อยู่ ให้คำขอนี้รอในคิว
      if (coordinator.isRefreshing && coordinator.refreshPromise) {
        return new Promise<string>((resolve, reject) => {
          coordinator.queuedRequests.push({ resolve, reject });
        }).then(() => {
          return request<T>(endpoint, { ...options, _isRetry: true });
        });
      }

      // 2. หากยังไม่มีใครเริ่ม Refresh ให้คำขอนี้เริ่มกระบวนการขอ Token ใหม่
      coordinator.isRefreshing = true;
      coordinator.refreshPromise = performTokenRefresh();

      try {
        await coordinator.refreshPromise;

        // ปลดปล่อยคำขออื่นๆ ที่รออยู่ในคิวทั้งหมด
        const queued = [...coordinator.queuedRequests];
        coordinator.queuedRequests = [];
        queued.forEach((item) => item.resolve('refreshed'));

        // ส่งคำขอปัจจุบันซ้ำ (Retry original request with new token)
        return await request<T>(endpoint, { ...options, _isRetry: true });
      } catch (refreshErr) {
        // แจ้งปฏิเสธคำขอที่รออยู่ในคิวทั้งหมด
        const queued = [...coordinator.queuedRequests];
        coordinator.queuedRequests = [];
        queued.forEach((item) => item.reject(refreshErr));

        throw new ApiError(
          'เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
          401
        );
      } finally {
        coordinator.isRefreshing = false;
        coordinator.refreshPromise = null;
      }
    }

    if (!response.ok || (data.code !== undefined && data.code !== 0)) {
      const errorMessage =
        data.message ||
        (response.status === 401
          ? 'ข้อมูลเข้าสู่ระบบไม่ถูกต้อง หรือบัญชีถูกระงับการใช้งาน'
          : 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง');

      throw new ApiError(errorMessage, data.code || response.status, data.details);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // กรณีเครือข่ายขัดข้อง หรือเชื่อมต่อ Backend ไม่ได้
    throw new ApiError(
      'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อเครือข่ายและสถานะ API',
      503
    );
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
