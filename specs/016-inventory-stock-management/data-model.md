# Data Model: ระบบจัดการคลังและสต็อกสินค้า (Inventory & Stock Management)

**Feature**: `016-inventory-stock-management` | **Date**: 2026-10-27

โมเดลข้อมูลสำหรับระบบคลังและสต็อกสินค้า อิงตามสัญญา Backend API จริงจาก `docs/swagger.json`

## 1. Domain Entities (อิงตาม API)

### StockLevel (ระดับสต็อกสินค้าคงคลัง)
ตรงตาม Swagger DTO: `StockLevelResponse`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `id` | `string` | Yes | รหัส UUID ของรายการสต็อก |
| `productId` | `string` | Yes | รหัส UUID ของสินค้า |
| `branchId` | `string` | Yes | รหัส UUID ของสาขา |
| `quantity` | `number` | Yes | ปริมาณสินค้าคงเหลือจริงพร้อมขาย (รองรับทศนิยมสำหรับสินค้าชั่งน้ำหนัก) |
| `reservedQuantity` | `number` | Yes | ปริมาณสินค้าที่ถูกจอง/ค้างในกะขาย (ค่าเริ่มต้น 0) |
| `updatedAt` | `string` | No | วันที่และเวลาที่อัปเดตล่าสุด (ISO 8601) |
| `version` | `number` | No | Version สำหรับ Optimistic Locking |
| `product` | `Product` | No | ข้อมูลสินค้าที่แนบมา (ชื่อ, SKU, บาร์โค้ด, หมวดหมู่, หน่วยนับ, ต้นทุน, ราคาขาย, minStock) |

### StockAdjustment (การปรับยอดสต็อก)
ตรงตาม Swagger DTO: `AdjustStockRequest`

| Field | Type | Required | Description |
|---|---|:---:|---|
| `branchId` | `string` | Yes | รหัส UUID ของสาขาที่เกิดการปรับยอด |
| `productId` | `string` | Yes | รหัส UUID ของสินค้าที่ต้องการปรับยอด |
| `type` | `StockAdjustmentType` | Yes | ประเภทการปรับยอด: `'IN' \| 'OUT' \| 'ADJUST' \| 'AUDIT' \| 'DAMAGE' \| 'EXPIRED'` |
| `quantityDelta` | `number` | Yes | จำนวนความเปลี่ยนแปลง (+ หรือ -) หรือยอดนับจริงสำหรับ AUDIT |
| `reason` | `string` | Yes | เหตุผลในการปรับยอด (ความยาวสูงสุด 500 ตัวอักษร) |
| `idempotencyKey` | `string` | Yes | UUID ป้องกันการส่งคำขอซ้ำซ้อน |

### StockAdjustmentType (ประเภทการปรับยอด)
```typescript
export type StockAdjustmentType =
  | 'IN'        // รับสินค้าเข้าคลัง (+)
  | 'OUT'       // ปรับยอดสินค้าออก (-)
  | 'ADJUST'    // ปรับปรุงยอดทั่วไป (+/-)
  | 'AUDIT'     // ตรวจนับสต็อกตามจริง
  | 'DAMAGE'    // ตัดสินค้าชำรุดเสียหาย (-)
  | 'EXPIRED';  // ตัดสินค้าหมดอายุ (-)
```

### InventoryValuation (มูลค่าสต็อกสินค้าคงคลัง)
ตรงตาม Swagger DTO: `InventoryValuationResponse` (หรือคำนวณจากยอดสต็อกรวม)

| Field | Type | Required | Description |
|---|---|:---:|---|
| `totalSkus` | `number` | Yes | จำนวนรายการสินค้า (SKU) ทั้งหมดในคลัง |
| `totalQuantity` | `number` | Yes | จำนวนชิ้น/หน่วยสินค้ารวมทั้งหมด |
| `totalValuationSatang` | `number` | Yes | มูลค่าต้นทุนรวมทั้งหมดในหน่วยสตางค์ |

---

## 2. UI State Models

### InventoryPageState
สถานะของหน้าจอหลัก `/inventory`

| Field | Type | Initial | Description |
|---|---|---|---|
| `branchId` | `string` | `currentBranchId` | สาขาที่กำลังเรียกดูข้อมูล |
| `searchQuery` | `string` | `''` | คำค้นหา (ชื่อสินค้า, SKU, บาร์โค้ด) |
| `lowStockOnly` | `boolean` | `false` | แสดงเฉพาะสินค้าที่สต็อกต่ำกว่าเกณฑ์ |
| `currentPage` | `number` | `1` | หน้าปัจจุบันของตาราง |
| `pageSize` | `number` | `20` | จำนวนรายการต่อหน้า |
| `isBarcodeScanOpen` | `boolean` | `false` | สถานะเปิด/ปิด Modal สแกนบาร์โค้ดด้วยกล้อง |
| `adjustingStock` | `StockLevel \| null` | `null` | รายการสินค้าที่กำลังเปิด Modal ปรับสต็อก |
| `isLoading` | `boolean` | `true` | สถานะกำลังโหลดข้อมูลสต็อก |

### StockAdjustmentModalState
สถานะภายในหน้าต่าง Modal ปรับสต็อก

| Field | Type | Initial | Description |
|---|---|---|---|
| `type` | `StockAdjustmentType` | `'AUDIT'` | ประเภทการปรับยอดที่เลือก |
| `inputValue` | `string` | `''` | ค่าที่ผู้ใช้กรอกในช่องจำนวน |
| `reason` | `string` | `''` | เหตุผลในการปรับยอด |
| `calculatedDelta` | `number` | `0` | ค่าผลต่างที่คำนวณได้อัตโนมัติ |
| `isSubmitting` | `boolean` | `false` | สถานะกำลังส่งคำขอไปยัง API |
| `error` | `string \| null` | `null` | ข้อความแจ้งเตือนข้อผิดพลาด |
