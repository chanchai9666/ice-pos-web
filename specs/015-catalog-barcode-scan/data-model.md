# Data Model: ปุ่มสแกนบาร์โค้ดในฟอร์มสินค้า

**Feature Branch**: `015-catalog-barcode-scan`  
**Date**: 2026-10-27

ฟีเจอร์นี้ไม่เพิ่ม entity ในฐานข้อมูล และไม่เปลี่ยน schema สินค้า — ใช้ฟิลด์บาร์โค้ดของสินค้าที่มีอยู่ และสถานะ UI ชั่วคราวในฟอร์ม/Modal

## Entities (from catalog domain — อ้างอิงเท่านั้น)

### Product (สินค้า) — existing
| Field | Type | Notes |
|-------|------|-------|
| `barcode` | `string \| undefined` | ค่าที่ฟอร์มจะอัปเดตหลังสแกนสำเร็จ |
| อื่น ๆ | — | ไม่เกี่ยวกับฟีเจอร์นี้ |

**Validation (ไม่เปลี่ยนในขั้นตอนสแกน)**:
- ตอนสแกน: รับค่าหลัง `cleanBarcode` ที่ไม่ว่าง; ไม่ตรวจซ้ำกับสินค้าอื่น
- ตอนบันทึก: ตามกฎฟอร์ม/API เดิม

## UI State Models

### ProductFormBarcodeScanState (ใน Modal/Drawer)
| Field | Type | Rules |
|-------|------|-------|
| `barcode` | `string` | ค่าในช่องบาร์โค้ด; ถูกแทนที่เมื่อ capture สำเร็จ |
| `isInternalBarcode` | `boolean` | ต้องเป็น `false` หลังสแกนจากกล้อง (ไม่ใช่บาร์โค้ดที่สร้างอัตโนมัติในรอบนั้น) |
| `isBarcodeScanOpen` | `boolean` | เปิด/ปิด `BarcodeCaptureModal` |

### BarcodeCaptureSession (ใน BarcodeCaptureModal)
| Field | Type | Rules |
|-------|------|-------|
| `isOpen` | `boolean` | ควบคุมการแสดงและ lifecycle กล้อง |
| `hasPermissionError` | `boolean` | true เมื่อ getUserMedia ล้มเหลวหรือถูกปฏิเสธ |
| `errorMessage` | `string` | ข้อความไทยสำหรับผู้ใช้ |
| `facingMode` | `'environment' \| 'user'` | ค่าเริ่มต้น `environment` |
| `capturedOnce` | internal guard | หลังอ่านสำเร็จครั้งแรกต้องไม่ประมวลผลซ้ำก่อนปิด |

## State Transitions

```text
[Form idle]
    │ กด "สแกนบาร์โค้ด"
    ▼
[Scan modal open → camera starting]
    ├─ permission denied / no camera → [Error state] → ผู้ใช้ปิด → [Form idle] (barcode ไม่เปลี่ยน)
    ├─ ผู้ใช้ยกเลิก → stop camera → [Form idle] (barcode ไม่เปลี่ยน)
    └─ decode success (ครั้งแรก)
           → cleanBarcode
           → onCapture(cleaned)
           → stop camera / close modal
           → [Form idle] (barcode = cleaned, isInternalBarcode = false)
```

## Relationships

- `BarcodeCaptureModal.onCapture` → อัปเดต `ProductForm*.barcode` เท่านั้น
- ไม่มีความสัมพันธ์กับ `PosCart` / `BarcodeScanResult` ของ POS ในขอบเขตนี้
