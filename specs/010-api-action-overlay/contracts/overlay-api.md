# Interface Contracts: API Action Loading Overlay

**Feature**: `010-api-action-overlay` | **Date**: 2026-10-25

## 1. Overlay Coordinator Contract (`src/services/overlay-coordinator.ts`)

โมดูลกลางสำหรับควบคุมสถานะ Overlay นอก React Tree

```typescript
export interface IOverlayCoordinator {
  /**
   * แจ้งเริ่มคำขอ API ใหม่
   * @param message ข้อความภาษาไทยที่ต้องการแสดงบน Overlay
   */
  startRequest(message?: string): void;

  /**
   * แจ้งสิ้นสุดคำขอ API
   */
  endRequest(): void;

  /**
   * ดึงสถานะปัจจุบันของ Overlay
   */
  getState(): OverlayState;

  /**
   * ลงทะเบียนรับฟังการเปลี่ยนแปลงสถานะ
   * @returns ฟังก์ชันยกเลิกการลงทะเบียน (Unsubscribe)
   */
  subscribe(listener: OverlayListener): () => void;

  /**
   * บังคับปิด Overlay ทันทีในกรณีฉุกเฉินหรือ Timeout
   */
  reset(): void;
}
```

---

## 2. React Context Contract (`src/context/LoadingOverlayContext.tsx`)

React Hook และ Context สำหรับ Component ภายใน UI

```typescript
export interface LoadingOverlayContextValue {
  /**
   * สถานะเปิด/ปิดของ Overlay
   */
  isLoading: boolean;

  /**
   * ข้อความที่กำลังแสดงผลบน Overlay
   */
  message: string;

  /**
   * สั่งเปิด Overlay ด้วยตนเอง (สำหรับการประมวลผลที่ซับซ้อนในหน้าบ้าน)
   */
  showOverlay: (message?: string) => void;

  /**
   * สั่งปิด Overlay
   */
  hideOverlay: () => void;

  /**
   * ตัวช่วยครอบฟังก์ชัน Async ให้แสดง Overlay อัตโนมัติจนกว่าจะทำงานเสร็จ
   */
  withOverlay: <T>(action: () => Promise<T>, message?: string, timeoutMs?: number) => Promise<T>;
}

/**
 * Hook สำหรับเรียกใช้งานภายใน React Components
 */
export function useLoadingOverlay(): LoadingOverlayContextValue;
```

---

## 3. UI Component Contract (`src/components/ui/LoadingOverlay.tsx`)

Component แสดงผลหน้าจอ Overlay

```typescript
export interface LoadingOverlayProps {
  /**
   * ข้อความสถานะที่ต้องการแสดงผล (ค่าเริ่มต้น: "กำลังดำเนินการ กรุณารอสักครู่...")
   */
  message?: string;

  /**
   * ควบคุมการแสดงผล (หากไม่ส่ง จะใช้สถานะจาก useLoadingOverlay())
   */
  isOpen?: boolean;

  /**
   * คลาสตกแต่งเพิ่มเติม
   */
  className?: string;
}
```
