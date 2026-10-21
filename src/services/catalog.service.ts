/**
 * เซอร์วิสสำหรับจัดการสินค้าและหมวดหมู่ (Catalog Service)
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
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
  async getCategories(params?: CategoryQueryParams): Promise<ApiResponse<Category[]>> {
    return api.get<Category[]>('/api/v1/categories', {
      params: {
        page: params?.page,
        pageSize: params?.pageSize,
      },
    });
  },

  /**
   * ดึงข้อมูลหมวดหมู่สินค้าตาม ID
   */
  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    return api.get<Category>(`/api/v1/categories/${id}`);
  },

  /**
   * สร้างหมวดหมู่สินค้าใหม่
   */
  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    return api.post<Category>('/api/v1/categories', data);
  },

  /**
   * แก้ไขหมวดหมู่สินค้า
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    return api.put<Category>(`/api/v1/categories/${id}`, data);
  },

  /**
   * ลบหมวดหมู่สินค้า
   */
  async deleteCategory(id: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/api/v1/categories/${id}`);
  },

  // ==========================================
  // สินค้า (Products)
  // ==========================================

  /**
   * ค้นหาและดูรายการสินค้า
   */
  async getProducts(params?: ProductQueryParams): Promise<ApiResponse<Product[]>> {
    return api.get<Product[]>('/api/v1/products', {
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
  async getProductById(id: string): Promise<ApiResponse<Product>> {
    return api.get<Product>(`/api/v1/products/${id}`);
  },

  /**
   * ค้นหาสินค้าด้วย SKU หรือ Barcode (Lookup)
   */
  async lookupProduct(code: string): Promise<ApiResponse<Product>> {
    return api.get<Product>(`/api/v1/products/lookup/${encodeURIComponent(code)}`);
  },

  /**
   * สร้างสินค้าใหม่
   */
  async createProduct(data: CreateProductRequest): Promise<ApiResponse<Product>> {
    return api.post<Product>('/api/v1/products', data);
  },

  /**
   * แก้ไขข้อมูลสินค้า
   */
  async updateProduct(id: string, data: UpdateProductRequest): Promise<ApiResponse<Product>> {
    return api.put<Product>(`/api/v1/products/${id}`, data);
  },

  /**
   * ลบสินค้า
   */
  async deleteProduct(id: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/api/v1/products/${id}`);
  },

  /**
   * สร้างบาร์โค้ดภายในร้านอัตโนมัติ (Internal Barcode)
   */
  async generateInternalBarcode(id: string): Promise<ApiResponse<Product>> {
    return api.post<Product>(`/api/v1/products/${id}/internal-barcode`);
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
