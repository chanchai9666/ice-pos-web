import { ApiResponse } from '@/types/auth';
import { getAccessToken } from '@/utils/storage';

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

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers, ...restOptions } = options;

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
