/**
 * เซอร์วิสสำหรับคลังและสต็อกสินค้า (Inventory Service)
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import { StockLevel, StockQueryParams } from '@/types/inventory';

export const inventoryService = {
  /**
   * ดูยอดสต็อกสินค้าคงเหลือรายสาขา (List Stock Levels)
   * GET /api/v1/inventory/stocks
   */
  async getStockLevels(params?: StockQueryParams): Promise<ApiResponse<StockLevel[]>> {
    return api.get<StockLevel[]>('/api/v1/inventory/stocks', {
      params: {
        branchId: params?.branchId,
        lowStockOnly: params?.lowStockOnly,
        page: params?.page || 1,
        pageSize: params?.pageSize || 100,
      },
    });
  },
};
