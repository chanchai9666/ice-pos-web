# Phase 1: Data Model & UI State

**Feature**: ปุ่มสแกนสินค้าด้วยกล้องบน Navbar (Navbar Camera Product Scanner Button)  
**Branch**: `012-navbar-camera-scan`  
**Date**: 2026-10-26  

---

## 1. Entities & UI State

### Entity: NavbarScanTrigger
อธิบายสถานะและการสื่อสารเมื่อมีการกดปุ่มสแกนบน Navbar

| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | ข้อจำกัด (Constraints) | คำอธิบาย (Description) |
| :--- | :--- | :--- | :--- |
| `source` | `enum('HEADER', 'BOTTOM_NAV')` | Required | จุดที่ผู้ใช้กดปุ่มสแกน |
| `targetRoute` | `string` | Required, ค่าคงที่ `/pos` | เส้นทางปลายทางที่รองรับการขายและสแกนสินค้า |
| `queryParam` | `string` | Optional, `scan=camera` | พารามิเตอร์ส่งผ่าน URL เพื่อสั่งเปิดกล้องเมื่อนำทางข้ามหน้า |
| `timestamp` | `number` | Required | เวลาที่เกิดการกดปุ่ม เพื่อป้องกัน race condition |

---

### Entity: PosScannerState (State ในหน้า POS)
อธิบายสถานะของระบบสแกนในหน้าจุดขาย (`/pos`)

| ฟิลด์ (Field) | ชนิดข้อมูล (Type) | ข้อจำกัด (Constraints) | คำอธิบาย (Description) |
| :--- | :--- | :--- | :--- |
| `isCameraModalOpen` | `boolean` | Required | สถานะเปิด/ปิดหน้าต่างกล้องสแกน |
| `isShiftActive` | `boolean` | Required | มีกะการขายเปิดอยู่หรือไม่ (หากยังไม่เปิด จะแสดง `PosOpenShiftModal` ก่อน) |
| `lastScannedBarcode` | `string \| null` | Optional | บาร์โค้ดล่าสุดที่สแกนสำเร็จ |
| `isDebouncingScan` | `boolean` | Required | ป้องกันการอ่านบาร์โค้ดเดิมซ้ำซ้อนภายใน 1-1.5 วินาที |

---

## 2. Event Contract

```typescript
// Custom Event สำหรับส่งคำสั่งเปิดกล้องสแกนภายในแอพ
export const OPEN_CAMERA_SCANNER_EVENT = 'ice-pos:open-camera-scanner';

// Helper function สำหรับสั่งเปิดกล้องสแกนจากที่ใดก็ได้ใน Navbar
export function triggerCameraScanner(router: any, currentPathname: string) {
  if (currentPathname === '/pos') {
    window.dispatchEvent(new CustomEvent(OPEN_CAMERA_SCANNER_EVENT));
  } else {
    router.push('/pos?scan=camera');
  }
}
```
