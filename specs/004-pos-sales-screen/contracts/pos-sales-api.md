# API Contract: จุดขายสินค้าหน้าร้านและกะการขาย (POS Sales & Shifts API)

**Feature Branch**: `004-pos-sales-screen`  
**Base Path**: `/api/v1`  
**Header**: `Authorization: Bearer <token>`  

---

## 1. ดึงข้อมูลสินค้าด้วย SKU หรือ Barcode (Product Lookup)

- **Method**: `GET`
- **Endpoint**: `/api/v1/products/lookup/{code}`
- **Path Parameter**: `code` (string, required) - รหัส SKU หรือบาร์โค้ดสินค้า

### Success Response (`200 OK`)
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "c1f7a8b9-1234-5678-90ab-cdef12345678",
    "name": "น้ำดื่มสิงห์ 600ml",
    "sku": "DRK-SNG-600",
    "barcode": "8850999001234",
    "categoryId": "cat-001",
    "category": {
      "id": "cat-001",
      "name": "เครื่องดื่ม"
    },
    "retailPrice": 1000,
    "costPrice": 750,
    "pricingType": "PIECE",
    "baseUomId": "uom-piece",
    "baseUom": {
      "id": "uom-piece",
      "name": "ขวด",
      "code": "BTL"
    },
    "taxRateId": "tax-vat-7",
    "taxRate": {
      "id": "tax-vat-7",
      "name": "VAT 7%",
      "rate": 7.00
    },
    "imageUrl": "https://storage.googleapis.com/.../drink.webp",
    "isActive": true
  }
}
```

### Error Response (`404 Not Found`)
```json
{
  "code": 4040,
  "message": "ไม่พบข้อมูลสินค้า",
  "data": null
}
```

---

## 2. ดึงรายการสินค้าทั้งหมดพร้อมค้นหาและตัวกรอง (List Products)

- **Method**: `GET`
- **Endpoint**: `/api/v1/products`
- **Query Parameters**:
  - `search`: string (คำค้นหาชื่อ, SKU หรือ Barcode)
  - `categoryId`: string (กรองตามหมวดหมู่)
  - `isActive`: boolean (true เฉพาะสินค้าที่เปิดขาย)
  - `page`: number (default: 1)
  - `pageSize`: number (default: 50)

### Success Response (`200 OK`)
```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "c1f7a8b9-1234-5678-90ab-cdef12345678",
      "name": "น้ำดื่มสิงห์ 600ml",
      "sku": "DRK-SNG-600",
      "barcode": "8850999001234",
      "categoryId": "cat-001",
      "retailPrice": 1000,
      "pricingType": "PIECE",
      "imageUrl": "...",
      "isActive": true
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 120,
    "totalPages": 3
  }
}
```

---

## 3. ดึงหมวดหมู่สินค้าทั้งหมด (List Categories)

- **Method**: `GET`
- **Endpoint**: `/api/v1/categories`

### Success Response (`200 OK`)
```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "cat-001",
      "name": "เครื่องดื่ม",
      "sortOrder": 1,
      "isActive": true
    },
    {
      "id": "cat-002",
      "name": "ขนมขบเคี้ยว",
      "sortOrder": 2,
      "isActive": true
    }
  ]
}
```

---

## 4. ตรวจสอบกะขายที่กำลังเปิดใช้งาน (Get Active Shift)

- **Method**: `GET`
- **Endpoint**: `/api/v1/shifts/active`
- **Query Parameter**: `branchId` (string, required)

### Success Response (`200 OK` - มีกะเปิดอยู่)
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "shf-12345",
    "branchId": "br-001",
    "cashierId": "usr-002",
    "openingCash": 200000,
    "openedAt": "2026-10-21T08:00:00Z",
    "status": "OPEN"
  }
}
```

### Response กรณีไม่มีกะเปิดอยู่ (`200 OK` with null data หรือ `404 Not Found`)
```json
{
  "code": 0,
  "message": "no active shift",
  "data": null
}
```

---

## 5. เปิดกะการขาย (Open Shift)

- **Method**: `POST`
- **Endpoint**: `/api/v1/shifts/open`
- **Request Body**:
```json
{
  "branchId": "br-001",
  "openingCash": 200000
}
```

> `openingCash` เป็นจำนวนเงินหน่วยสตางค์ และเป็นชื่อฟิลด์ตาม Swagger จริง (ไม่ใช่ `startingCash`)

### Success Response (`201 Created`)
```json
{
  "code": 0,
  "message": "เปิดกะการขายสำเร็จ",
  "data": {
    "id": "shf-12345",
    "branchId": "br-001",
    "cashierId": "usr-002",
    "openingCash": 200000,
    "openedAt": "2026-10-21T08:00:00Z",
    "status": "OPEN"
  }
}
```

### Error Response (`400 Bad Request`)
```json
{
  "code": 4000,
  "message": "มีกะการขายที่เปิดค้างอยู่แล้ว",
  "data": null
}
```
