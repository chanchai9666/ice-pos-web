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
import { generateIdempotencyKey } from '@/utils/idempotency';

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
   * @param branchId รหัสสาขา
   * @param request ข้อมูลคำขอปรับยอดสต็อก
   * @param idempotencyKey รหัสป้องกันการทำรายการซ้ำ (Idempotency Key)
   */
  async adjustStock(
    branchId: string,
    request: AdjustStockRequest,
    idempotencyKey?: string
  ): Promise<ApiResponse<{ message?: string }>> {
    const key = idempotencyKey || request.idempotencyKey || generateIdempotencyKey();
    return api.post<{ message?: string }>(
      '/api/v1/inventory/adjust',
      request,
      {
        params: { branchId },
        headers: {
          'Idempotency-Key': key,
        },
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
   * @param request ข้อมูลคำขอโอนย้ายสินค้า
   * @param idempotencyKey รหัสป้องกันการทำรายการซ้ำ (Idempotency Key)
   */
  async createStockTransfer(
    request: CreateStockTransferRequest,
    idempotencyKey?: string
  ): Promise<ApiResponse<StockTransferResponse>> {
    const key = idempotencyKey || generateIdempotencyKey();
    return api.post<StockTransferResponse>(
      '/api/v1/inventory/transfers',
      request,
      {
        headers: {
          'Idempotency-Key': key,
        },
        loadingMessage: 'กำลังสร้างใบโอนย้ายสินค้าระหว่างสาขา...',
      }
    );
  },

  /**
   * รับสินค้าโอนย้ายเข้าสาขาปลายทาง (Receive Stock Transfer)
   * POST /api/v1/inventory/transfers/{id}/receive
   * @param id รหัสใบโอนสินค้า
   * @param payloadOrIdempotencyKey ข้อมูลคำขอ หรือรหัสป้องกันการทำรายการซ้ำ (Idempotency Key)
   * @param idempotencyKey รหัสป้องกันการทำรายการซ้ำ (กรณีส่ง payload มาด้วย)
   */
  async receiveStockTransfer(
    id: string,
    payloadOrIdempotencyKey?: unknown,
    idempotencyKey?: string
  ): Promise<ApiResponse<void>> {
    const isKey = typeof payloadOrIdempotencyKey === 'string';
    const key = isKey
      ? (payloadOrIdempotencyKey as string)
      : idempotencyKey || generateIdempotencyKey();
    const body =
      !isKey && typeof payloadOrIdempotencyKey === 'object' && payloadOrIdempotencyKey !== null
        ? payloadOrIdempotencyKey
        : undefined;

    return api.post<void>(
      `/api/v1/inventory/transfers/${id}/receive`,
      body,
      {
        headers: {
          'Idempotency-Key': key,
        },
        loadingMessage: 'กำลังบันทึกการรับสินค้าโอนเข้าสาขา...',
      }
    );
  },
};
