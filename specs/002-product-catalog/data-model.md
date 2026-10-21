# Data Model: ระบบเมนูหลักและการจัดการสินค้าและหมวดหมู่ (Product Catalog)

**Feature**: `002-product-catalog`  
**Date**: 2026-10-21  
**Source API**: OpenAPI 2.0 (Swagger) อ้างอิงจาก `docs/api-summary.md` และ `docs/swagger.json`

---

## 1. หมวดหมู่สินค้า (Category)

### Attributes
| Field | Type | Required | Description & Constraints |
| :--- | :--- | :---: | :--- |
| `id` | `string` (UUID) | Yes | รหัสประจำหมวดหมู่ สร้างโดยระบบ |
| `name` | `string` | Yes | ชื่อหมวดหมู่ (ความยาว 2-100 ตัวอักษร) |
| `description` | `string` | No | คำอธิบายหมวดหมู่ (ความยาวไม่เกิน 500 ตัวอักษร) |
| `parentId` | `string` (UUID) | No | รหัสหมวดหมู่หลัก (สำหรับหมวดหมู่ย่อย) |
| `sortOrder` | `integer` | No | ลำดับการจัดเรียง (Default: 0) |
| `isActive` | `boolean` | Yes | สถานะเปิดใช้งาน (Default: true) |
| `children` | `Category[]` | No | รายการหมวดหมู่ย่อยภายใต้หมวดหมู่นี้ |
| `createdAt` | `string` (ISO 8601) | Yes | วันเวลาที่สร้างข้อมูล |
| `updatedAt` | `string` (ISO 8601) | Yes | วันเวลาที่แก้ไขข้อมูลล่าสุด |

### Relationships
- **Self-referencing Hierarchy**: `parentId` ชี้ไปยัง `Category.id` ของหมวดหมู่หลัก
- **Has Many Products**: หนึ่ง Category มีได้หลาย Product

---

## 2. สินค้า (Product)

### Attributes
| Field | Type | Required | Description & Constraints |
| :--- | :--- | :---: | :--- |
| `id` | `string` (UUID) | Yes | รหัสประจำสินค้า สร้างโดยระบบ |
| `sku` | `string` | Yes | รหัส SKU สินค้า ไม่ซ้ำกันในระบบ (ความยาว 1-50 ตัวอักษร) |
| `barcode` | `string` | No | รหัสบาร์โค้ดสินค้า (ความยาวไม่เกิน 50 ตัวอักษร) |
| `isInternalBarcode` | `boolean` | No | เครื่องหมายว่าเป็นบาร์โค้ดที่ระบบสร้างขึ้นภายในร้าน (Default: false) |
| `name` | `string` | Yes | ชื่อสินค้า (ความยาว 1-150 ตัวอักษร) |
| `description` | `string` | No | คำอธิบายสินค้า (ความยาวไม่เกิน 500 ตัวอักษร) |
| `categoryId` | `string` (UUID) | No | รหัสหมวดหมู่ที่สังกัด |
| `category` | `Category` | No | ออบเจกต์หมวดหมู่ที่ดึงร่วมมาแสดงผล |
| `baseUomId` | `string` (UUID) | Yes | รหัสหน่วยนับหลักของสินค้า |
| `baseUom` | `Uom` | No | ออบเจกต์หน่วยนับหลัก |
| `purchaseUomId` | `string` (UUID) | No | รหัสหน่วยนับสำหรับสั่งซื้อ |
| `sellUomId` | `string` (UUID) | No | รหัสหน่วยนับสำหรับขาย |
| `purchaseRatio` | `number` | No | อัตราส่วนหน่วยซื้อต่อหน่วยหลัก (e.g., 1 ลัง = 24 ชิ้น) |
| `price` | `integer` | Yes | ราคาขาย (หน่วย **สตางค์**, ขั้นต่ำ >= 0, e.g. 4500 = 45.00 บาท) |
| `costPerBaseUnit` | `integer` | No | ต้นทุนต่อหน่วยหลัก (หน่วย **สตางค์**, ขั้นต่ำ >= 0) |
| `taxId` | `string` (UUID) | No | รหัสอัตราภาษีมูลค่าเพิ่ม |
| `tax` | `Tax` | No | ออบเจกต์อัตราภาษี |
| `productType` | `enum` | Yes | ชนิดสินค้า: `"PRICE_PER_UNIT"` (ขายต่อหน่วย) หรือ `"BY_WEIGHT"` (ขายตามน้ำหนัก) |
| `minStock` | `number` | No | ระดับสต็อกขั้นต่ำสำหรับแจ้งเตือน (Default: 0) |
| `trackExpiry` | `boolean` | No | ติดตามวันหมดอายุสินค้าหรือไม่ (Default: false) |
| `imageUrl` | `string` (URL) | No | ที่อยู่รูปภาพสินค้า |
| `isActive` | `boolean` | Yes | สถานะเปิด/ปิดการจำหน่าย (Default: true) |
| `createdAt` | `string` (ISO 8601) | Yes | วันเวลาที่สร้างข้อมูล |
| `updatedAt` | `string` (ISO 8601) | Yes | วันเวลาที่แก้ไขข้อมูลล่าสุด |

### Relationships
- **Belongs to Category**: `categoryId` → `Category.id`
- **Belongs to Base UOM**: `baseUomId` → `Uom.id`
- **Belongs to Tax Rate**: `taxId` → `Tax.id`

---

## 3. หน่วยนับสินค้า (UOM - Unit of Measure)

### Attributes
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` (UUID) | Yes | รหัสหน่วยนับ |
| `code` | `string` | Yes | รหัสย่อหน่วยนับ (เช่น `PCS`, `BAG`, `KG`) |
| `name` | `string` | Yes | ชื่อภาษาไทย (เช่น `ชิ้น`, `ถุง`, `กิโลกรัม`) |
| `isActive` | `boolean` | Yes | สถานะเปิดใช้งาน |

---

## 4. อัตราภาษี (Tax Rate)

### Attributes
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` (UUID) | Yes | รหัสอัตราภาษี |
| `code` | `string` | Yes | รหัสภาษี (เช่น `VAT7`, `VAT0`, `EXEMPT`) |
| `name` | `string` | Yes | ชื่อภาษี (เช่น `ภาษีมูลค่าเพิ่ม 7%`, `ยกเว้นภาษี`) |
| `rate` | `number` | Yes | อัตราภาษี (เช่น `0.07` สำหรับ 7%, `0` สำหรับยกเว้น) |
| `isActive` | `boolean` | Yes | สถานะเปิดใช้งาน |

---

## 5. รายการเมนูระบบ (Navigation Menu Item)

### Attributes
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Yes | รหัสเมนู (เช่น `pos`, `catalog`, `inventory`, `reports`, `users`) |
| `label` | `string` | Yes | ข้อความชื่อเมนูภาษาไทย (เช่น `ขายหน้าร้าน (POS)`, `จัดการสินค้าและหมวดหมู่`) |
| `path` | `string` | Yes | เส้นทาง URL (เช่น `/pos`, `/catalog`, `/inventory`) |
| `icon` | `string` | Yes | ชื่อไอคอนสำหรับการแสดงผล |
| `allowedRoles` | `string[]` | Yes | ระดับสิทธิ์ที่มองเห็นเมนูนี้ได้ เช่น `['ADMIN', 'MANAGER']` หรือ `['ADMIN', 'MANAGER', 'CASHIER']` |
| `badge` | `string` | No | ข้อความ Badge กำกับ (ถ้ามี) |
