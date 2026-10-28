/**
 * ประเภทข้อมูลสำหรับระบบ Offline Synchronization
 * อ้างอิงตาม Swagger: POST /sync/batch, GET /sync/changes
 * โครงการ ice-pos-web
 */

import { Category, Product, Uom, Tax } from '@/types/catalog';

export interface SyncChangesParams {
  since?: string;
  batchSize?: number;
  deviceId?: string;
}

export interface SyncChangesResponse {
  since?: string;
  nextCursor?: string;
  hasMore?: boolean;
  categories?: Category[];
  products?: Product[];
  taxes?: Tax[];
  uoms?: Uom[];
}

export interface SyncItemResult {
  id?: string;
  idempotencyKey?: string;
  status?: 'APPLIED' | 'REJECTED' | 'CONFLICT' | string;
  code?: number;
  message?: string;
}

export interface SyncBatchResponse {
  appliedCount?: number;
  rejectedCount?: number;
  results?: SyncItemResult[];
}

export interface SyncBatchRequestDTO {
  deviceId?: string;
  sales?: unknown[];
  returns?: unknown[];
  customers?: unknown[];
  stockMovements?: unknown[];
}
