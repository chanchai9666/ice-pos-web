/**
 * เซอร์วิสสำหรับจัดการสินค้าและหมวดหมู่ (Catalog Service)
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse, RequestOptions } from '@/types/auth';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryQueryParams,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductQueryParams,
} from '@/types/catalog';

export const catalogService = {
  // ==========================================
  // หมวดหมู่สินค้า (Categories)
  // ==========================================

  /**
   * ดึงรายการหมวดหมู่สินค้าทั้งหมด
   */
  async getCategories(params?: CategoryQueryParams, options?: RequestOptions): Promise<ApiResponse<Category[]>> {
    return api.get<Category[]>('/api/v1/categories', {
      loadingMessage: 'กำลังโหลดหมวดหมู่สินค้า...',
      ...options,
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
      },
    });
  },

  /**
   * ดึงข้อมูลหมวดหมู่สินค้าตาม ID
   */
  async getCategoryById(id: string, options?: RequestOptions): Promise<ApiResponse<Category>> {
    return api.get<Category>(`/api/v1/categories/${id}`, options);
  },

  /**
   * สร้างหมวดหมู่สินค้าใหม่
   */
  async createCategory(data: CreateCategoryRequest, options?: RequestOptions): Promise<ApiResponse<Category>> {
    return api.post<Category>('/api/v1/categories', data, {
      loadingMessage: 'กำลังบันทึกหมวดหมู่สินค้า...',
      ...options,
    });
  },

  /**
   * แก้ไขหมวดหมู่สินค้า
   */
  async updateCategory(id: string, data: UpdateCategoryRequest, options?: RequestOptions): Promise<ApiResponse<Category>> {
    return api.put<Category>(`/api/v1/categories/${id}`, data, {
      loadingMessage: 'กำลังอัปเดตหมวดหมู่สินค้า...',
      ...options,
    });
  },

  /**
   * ลบหมวดหมู่สินค้า
   */
  async deleteCategory(id: string, options?: RequestOptions): Promise<ApiResponse<null>> {
    return api.delete<null>(`/api/v1/categories/${id}`, {
      loadingMessage: 'กำลังลบหมวดหมู่สินค้า...',
      ...options,
    });
  },

  // ==========================================
  // สินค้า (Products)
  // ==========================================

  /**
   * ค้นหาและดูรายการสินค้า
   */
  async getProducts(params?: ProductQueryParams, options?: RequestOptions): Promise<ApiResponse<Product[]>> {
    return api.get<Product[]>('/api/v1/products', {
      loadingMessage: options?.loadingMessage || 'กำลังโหลดรายการสินค้า...',
      ...options,
      params: {
        search: params?.search,
        categoryId: params?.categoryId || params?.category_id,
        barcode: params?.barcode,
        isActive: params?.isActive !== undefined ? params.isActive : params?.is_active,
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
      },
    });
  },

  /**
   * ดึงข้อมูลสินค้าตาม ID
   */
  async getProductById(id: string, options?: RequestOptions): Promise<ApiResponse<Product>> {
    return api.get<Product>(`/api/v1/products/${id}`, options);
  },

  /**
   * ค้นหาสินค้าด้วย SKU หรือ Barcode (Lookup)
   */
  async lookupProduct(code: string, options?: RequestOptions): Promise<ApiResponse<Product>> {
    return api.get<Product>(`/api/v1/products/lookup/${encodeURIComponent(code)}`, options);
  },

  /**
   * ค้นหารายการสินค้าตามรหัส SKU (Prefix Search)
   * ใช้สำหรับตรวจเช็คความซ้ำซ้อนหรือค้นหาด่วน (ค่าเริ่มต้นเป็น silent request ไม่แสดง blocking overlay)
   */
  async searchProductsBySku(sku: string, options?: RequestOptions): Promise<ApiResponse<Product[]>> {
    return api.get<Product[]>('/api/v1/products/sku', {
      silent: true,
      ...options,
      params: {
        sku: sku.trim(),
      },
    });
  },

  /**
   * สร้างสินค้าใหม่
   */
  async createProduct(data: CreateProductRequest, options?: RequestOptions): Promise<ApiResponse<Product>> {
    return api.post<Product>('/api/v1/products', data, {
      loadingMessage: 'กำลังบันทึกข้อมูลสินค้า...',
      ...options,
    });
  },

  /**
   * แก้ไขข้อมูลสินค้า
   */
  async updateProduct(id: string, data: UpdateProductRequest, options?: RequestOptions): Promise<ApiResponse<Product>> {
    return api.put<Product>(`/api/v1/products/${id}`, data, {
      loadingMessage: 'กำลังอัปเดตข้อมูลสินค้า...',
      ...options,
    });
  },

  /**
   * ลบสินค้า
   */
  async deleteProduct(id: string, options?: RequestOptions): Promise<ApiResponse<null>> {
    return api.delete<null>(`/api/v1/products/${id}`, {
      loadingMessage: 'กำลังลบรายการสินค้า...',
      ...options,
    });
  },

  /**
   * สร้างบาร์โค้ดภายในร้านอัตโนมัติ (Internal Barcode)
   */
  async generateInternalBarcode(id: string, options?: RequestOptions): Promise<ApiResponse<Product>> {
    return api.post<Product>(`/api/v1/products/${id}/internal-barcode`, undefined, options);
  },

  /**
   * อัปโหลดรูปภาพสินค้าพร้อมแปลงเป็น WebP
   */
  async uploadProductImage(id: string, file: File): Promise<ApiResponse<{ imageUrl?: string } | Product>> {
    const formData = new FormData();
    formData.append('file', file);

    const { API_BASE_URL } = await import('@/services/api');
    const { getAccessToken } = await import('@/utils/storage');

    const token = getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || (data.code !== undefined && data.code !== 0)) {
      throw new Error(data.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
    }
    return data;
  },
};
