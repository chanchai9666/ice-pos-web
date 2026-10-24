# Phase 1 Data Model: การแสดงจำนวนสินค้าคงเหลือ/ชั่งขาย และปรับปรุงตะกร้าสินค้า POS

**Feature**: `006-pos-stock-and-cart`
**Date**: 2026-10-24
**Status**: Completed

## 1. ข้อมูลระดับสต็อกสินค้าคงคลัง (Stock Level Entity)

อ้างอิงจาก ICE POS API DTO `StockLevelResponse`:

| Field | Type | Description | Validation / Constraints |
|---|---|---|---|
| `id` | `string` (UUID) | รหัสระบุรายการสต็อก | ไม่เป็นค่าว่าง |
| `productId` | `string` (UUID) | รหัสสินค้าที่เชื่อมโยง | ต้องตรงกับ Product ID ในระบบ |
| `branchId` | `string` (UUID) | รหัสสาขาของสต็อกนี้ | ต้องตรงกับ Branch ID ปัจจุบัน |
| `quantity` | `number` | ปริมาณสินค้าคงเหลือจริง | ตัวเลข >= 0 (รองรับทศนิยม) |
| `reservedQuantity`| `number` | จำนวนสินค้าที่ถูกจองไว้ | ตัวเลข >= 0 |
| `updatedAt` | `string` (ISO8601) | วันเวลาที่มีการอัปเดตสต็อกล่าสุด | รูปแบบวันที่มาตรฐาน |

### Client-side Stock Lookup Map
```typescript
export type StockLevelMap = Record<string, number>; // productId -> availableQuantity
```

---

## 2. ข้อมูลการแสดงผลของการ์ดสินค้า (Product Card Display State)

| Attribute | Type | Description |
|---|---|---|
| `stockStatus` | `'IN_STOCK' \| 'LOW_STOCK' \| 'OUT_OF_STOCK' \| 'BY_WEIGHT'` | สถานะสต็อกที่คำนวณสำหรับการแสดงผล |
| `availableQuantity` | `number \| null` | จำนวนสต็อกคงเหลือ (เป็น null หากเป็นสินค้าชั่งขาย) |
| `displayBadgeText` | `string` | ข้อความป้ายกำกับ เช่น "คงเหลือ: 12 ชิ้น", "สินค้าหมด", "ชั่งขาย" |
| `badgeColorVariant`| `'emerald' \| 'amber' \| 'rose' \| 'cyan'` | โทนสีของ Badge เพื่อความชัดเจนตามมาตรฐาน Contrast |

---

## 3. ข้อมูลรายการในตะกร้าสินค้า (Cart Item State Extensions)

อ้างอิงจาก `CartItem` ใน `src/types/pos.ts`:

| Field | Type | Existing / New | Description |
|---|---|---|---|
| `id` | `string` | Existing | รหัสรายการในตะกร้า (UUID / Product ID) |
| `productId` | `string` | Existing | รหัสสินค้า |
| `name` | `string` | Existing | ชื่อสินค้าภาษาไทย |
| `sku` | `string` | Existing | รหัส SKU |
| `barcode` | `string?` | Existing | รหัสบาร์โค้ด |
| `price` | `number` | Existing | ราคาต่อหน่วย (สตางค์) |
| `quantity` | `number` | Existing | จำนวนสินค้า |
| `uomName` | `string` | Existing | ชื่อหน่วยนับ |
| `imageUrl` | `string?` | Existing | URL รูปภาพสินค้า |
| `pricingType` | `'PIECE' \| 'WEIGHT'` | Existing | ประเภทการคิดราคา |
| `lineTotal` | `number` | Existing | ยอดรวมของแถว |

### UI-Level Transient State
| Field | Type | Description |
|---|---|---|
| `lastActiveItemId` | `string \| null` | รหัสของรายการสินค้าล่าสุดที่เพิ่งถูกเพิ่มหรือแก้ไขในตะกร้า |
| `isHighlighted` | `boolean` | สถานะการแสดงแอนิเมชันเน้นรายการล่าสุดใน `PosCartItemRow` |
