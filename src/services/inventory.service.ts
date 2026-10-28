/**
 * เซอร์วิสสำหรับคลังและสต็อกสินค้า (Inventory Service)
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import {
  StockLevel,
  StockQueryParams,
  AdjustStockRequest,
  InventoryValuationResponse,
  CreateStockTransferRequest,
  StockTransferResponse,
} from '@/types/inventory';

export const inventoryService = {
  /**
   * ดูยอดสต็อกสินค้าคงเหลือรายสาขา (List Stock Levels)
   * GET /api/v1/inventory/stocks
   */
  async getStockLevels(params?: StockQueryParams): Promise<ApiResponse<StockLevel[]>> {
    const pageSize = params?.pageSize ? Math.min(Math.max(params.pageSize, 1), 100) : 100;
    return api.get<StockLevel[]>('/api/v1/inventory/stocks', {
      params: {
        branchId: params?.branchId,
        lowStockOnly: params?.lowStockOnly,
        page: params?.page || 1,
        pageSize,
      },
    });
  },

  /**
   * ปรับยอดสต็อกสินค้า (Adjust Stock)
   * POST /api/v1/inventory/adjust?branchId={branchId}
   * หมายเหตุ: สเปกประกาศ branchId เป็น query parameter ที่ required
   * จึงส่งทาง query เท่านั้น ไม่ส่งซ้ำใน body
   */
  async adjustStock(
    branchId: string,
    request: AdjustStockRequest
  ): Promise<ApiResponse<{ message?: string }>> {
    return api.post<{ message?: string }>(
      '/api/v1/inventory/adjust',
      request,
      {
        params: { branchId },
      }
    );
  },

  /**
   * ดูรายงานสรุปมูลค่าสินค้าคงคลัง (Inventory Valuation Report)
   * GET /api/v1/reports/inventory-valuation?branchId={branchId}
   */
  async getInventoryValuation(
    branchId?: string
  ): Promise<ApiResponse<InventoryValuationResponse>> {
    return api.get<InventoryValuationResponse>('/api/v1/reports/inventory-valuation', {
      params: {
        branchId: branchId || undefined,
      },
    });
  },

  /**
   * สร้างใบโอนย้ายสินค้าระหว่างสาขา (Create Stock Transfer)
   * POST /api/v1/inventory/transfers
   */
  async createStockTransfer(
    request: CreateStockTransferRequest
  ): Promise<ApiResponse<StockTransferResponse>> {
    return api.post<StockTransferResponse>(
      '/api/v1/inventory/transfers',
      request,
      {
        loadingMessage: 'กำลังสร้างใบโอนย้ายสินค้าระหว่างสาขา...',
      }
    );
  },

  /**
   * รับสินค้าโอนย้ายเข้าสาขาปลายทาง (Receive Stock Transfer)
   * POST /api/v1/inventory/transfers/{id}/receive
   */
  async receiveStockTransfer(id: string): Promise<ApiResponse<void>> {
    return api.post<void>(
      `/api/v1/inventory/transfers/${id}/receive`,
      undefined,
      {
        loadingMessage: 'กำลังบันทึกการรับสินค้าโอนเข้าสาขา...',
      }
    );
  },
};
