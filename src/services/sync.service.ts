/**
 * เซอร์วิสสำหรับระบบเชื่อมต่อและซิงค์ข้อมูลออฟไลน์ (Offline Sync Service)
 * โครงการ ice-pos-web
 */

import { api } from '@/services/api';
import { ApiResponse } from '@/types/auth';
import {
  SyncChangesParams,
  SyncChangesResponse,
  SyncBatchRequestDTO,
  SyncBatchResponse,
} from '@/types/sync';

const DEVICE_ID_KEY = 'ice_pos_device_id';
const LAST_SYNC_KEY = 'ice_pos_last_sync_timestamp';

/**
 * ดึงหรือสร้างรหัสประจำอุปกรณ์ (Device ID) สำหรับเครื่อง POS
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server-device';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export const syncService = {
  /**
   * ดึงข้อมูลการเปลี่ยนแปลงจากเซิร์ฟเวอร์สำหรับเครื่อง POS ออฟไลน์ (Delta Sync)
   * GET /api/v1/sync/changes
   */
  async getSyncChanges(
    params?: SyncChangesParams
  ): Promise<ApiResponse<SyncChangesResponse>> {
    const deviceId = params?.deviceId || getDeviceId();
    const lastSync = params?.since || (typeof window !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) || undefined : undefined);

    const headers: Record<string, string> = {
      'X-Device-Id': deviceId,
    };

    const res = await api.get<SyncChangesResponse>('/api/v1/sync/changes', {
      headers,
      params: {
        since: lastSync,
        batchSize: params?.batchSize || 100,
      },
      loadingMessage: 'กำลังตรวจสอบและซิงค์ข้อมูลล่าสุด...',
    });

    // บันทึก timestamp ของการซิงค์ล่าสุด
    if (res.data?.nextCursor && typeof window !== 'undefined') {
      localStorage.setItem(LAST_SYNC_KEY, res.data.nextCursor);
    }

    return res;
  },

  /**
   * อัปโหลดรายการขาย ข้อมูลลูกค้า และสต็อกที่บันทึกขณะออฟไลน์ขึ้นเซิร์ฟเวอร์ (Push Batch)
   * POST /api/v1/sync/batch
   */
  async syncBatch(
    data: SyncBatchRequestDTO
  ): Promise<ApiResponse<SyncBatchResponse>> {
    const payload: SyncBatchRequestDTO = {
      ...data,
      deviceId: data.deviceId || getDeviceId(),
    };

    return api.post<SyncBatchResponse>('/api/v1/sync/batch', payload, {
      loadingMessage: 'กำลังอัปโหลดรายการขายและสต็อกขณะออฟไลน์...',
      timeoutMs: 45000,
    });
  },
};

