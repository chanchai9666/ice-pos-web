# API Contract: จัดการสินค้าและหมวดหมู่ (Product Catalog API)

**Feature**: `002-product-catalog`  
**Base URL**: `http://127.0.0.1:8080/api/v1`  
**Auth Header**: `Authorization: Bearer <accessToken>`

---

## 1. หมวดหมู่สินค้า (Categories)

### 1.1 ดึงรายการหมวดหมู่ทั้งหมด (List All Categories)
- **Method**: `GET`
- **Path**: `/api/v1/categories`
- **Query Parameters**:
  - `page` (optional, integer, default: 1)
  - `pageSize` (optional, integer, default: 20)
- **Response**: `200 OK`
  ```json
  {
    "code": 0,
    "message": "ok",
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "น้ำแข็งหลอด",
        "description": "น้ำแข็งหลอดสำหรับเครื่องดื่ม",
        "parentId": null,
        "sortOrder": 1,
        "isActive": true,
        "children": [],
        "createdAt": "2026-10-21T00:00:00Z",
        "updatedAt": "2026-10-21T00:00:00Z"
      }
    ]
  }
  ```

### 1.2 สร้างหมวดหมู่สินค้าใหม่ (Create Category)
- **Method**: `POST`
- **Path**: `/api/v1/categories`
- **Request Body**:
  ```json
  {
    "name": "น้ำแข็งเกล็ดกรอบ",
    "description": "น้ำแข็งเกล็ดเคี้ยวเพลิน",
    "parentId": null,
    "sortOrder": 2
  }
  ```
- **Response**: `201 Created`

### 1.3 แก้ไขหมวดหมู่สินค้า (Update Category)
- **Method**: `PUT`
- **Path**: `/api/v1/categories/{id}`
- **Request Body**: Same as Create Category + `isActive`
- **Response**: `200 OK`

### 1.4 ลบหมวดหมู่สินค้า (Delete Category)
- **Method**: `DELETE`
- **Path**: `/api/v1/categories/{id}`
- **Response**: `200 OK` (Error `400` หากมีสินค้าหรือหมวดหมู่ย่อยผูกอยู่)

---

## 2. สินค้า (Products)

### 2.1 ค้นหาและดูรายการสินค้า (List Products with Pagination & Filter)
- **Method**: `GET`
- **Path**: `/api/v1/products`
- **Query Parameters**:
  - `search` (optional, string: ค้นหาจากชื่อ, SKU, หรือ Barcode)
  - `categoryId` (optional, string: UUID)
  - `isActive` (optional, boolean)
  - `page` (optional, integer, default: 1)
  - `pageSize` (optional, integer, default: 20)
- **Response**: `200 OK`
  ```json
  {
    "code": 0,
    "message": "ok",
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "sku": "ICE-001",
        "barcode": "8850123456789",
        "isInternalBarcode": false,
        "name": "น้ำแข็งหลอดเล็ก 5kg",
        "description": "น้ำแข็งหลอดเล็กบรรจุถุง 5 กิโลกรัม",
        "categoryId": "550e8400-e29b-41d4-a716-446655440000",
        "category": { "id": "...", "name": "น้ำแข็งหลอด" },
        "baseUomId": "550e8400-e29b-41d4-a716-446655440001",
        "baseUom": { "id": "...", "name": "ถุง", "code": "BAG" },
        "price": 4500,
        "costPerBaseUnit": 2500,
        "productType": "PRICE_PER_UNIT",
        "minStock": 10,
        "trackExpiry": false,
        "imageUrl": "https://storage.icepos.com/ice-001.webp",
        "isActive": true,
        "createdAt": "2026-10-21T00:00:00Z",
        "updatedAt": "2026-10-21T00:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "totalItems": 15,
      "totalPages": 1
    }
  }
  ```

### 2.2 สร้างสินค้าใหม่ (Create Product)
- **Method**: `POST`
- **Path**: `/api/v1/products`
- **Request Body**:
  ```json
  {
    "name": "น้ำแข็งหลอดเล็ก 5kg",
    "sku": "ICE-001",
    "barcode": "8850123456789",
    "isInternalBarcode": false,
    "categoryId": "550e8400-e29b-41d4-a716-446655440000",
    "baseUomId": "550e8400-e29b-41d4-a716-446655440001",
    "price": 4500,
    "costPerBaseUnit": 2500,
    "productType": "PRICE_PER_UNIT",
    "taxId": "550e8400-e29b-41d4-a716-446655440002",
    "minStock": 10,
    "trackExpiry": false,
    "imageUrl": "",
    "isActive": true
  }
  ```
- **Response**: `201 Created`

### 2.3 สร้างบาร์โค้ดภายในร้านอัตโนมัติ (Generate Internal Barcode)
- **Method**: `POST`
- **Path**: `/api/v1/products/{id}/internal-barcode`
- **Response**: `200 OK` (คืนค่าข้อมูลสินค้าที่มีรหัสบาร์โค้ดภายในร้านกำหนดให้อัตโนมัติ)

### 2.4 อัปโหลดรูปภาพสินค้า (Upload Product Image)
- **Method**: `POST`
- **Path**: `/api/v1/products/{id}/image`
- **Content-Type**: `multipart/form-data`
- **Form Data**: `file` (Binary image file)
- **Response**: `200 OK` (คืนค่า URL ของภาพที่ถูกแปลงเป็น WebP)

---

## 3. ข้อมูลอ้างอิงพื้นฐาน (Metadata)

### 3.1 รายการหน่วยนับสินค้า (List UOMs)
- **Method**: `GET`
- **Path**: `/api/v1/uoms`
- **Response**: `200 OK`

### 3.2 รายการอัตราภาษี (List Tax Rates)
- **Method**: `GET`
- **Path**: `/api/v1/taxes`
- **Response**: `200 OK`
