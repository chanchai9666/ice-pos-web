# API Contracts: Inventory & Stock Management

**Feature**: `016-inventory-stock-management` | **Date**: 2026-10-27

อ้างอิงจาก Backend API Swagger Schema (`docs/swagger.json`)

## 1. GET `/api/v1/inventory/stocks`

ดึงรายการยอดสต็อกสินค้าคงเหลือรายสาขา

### Request
- **Method**: `GET`
- **Headers**:
  - `Authorization: Bearer <token>`
- **Query Parameters**:
  - `branchId` (string, optional): UUID ของสาขา
  - `lowStockOnly` (boolean, optional): กรองเฉพาะสินค้าสต็อกต่ำกว่าเกณฑ์ (`true` / `false`)
  - `page` (integer, optional, default: 1)
  - `pageSize` (integer, optional, default: 20 หรือ 100)

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "productId": "550e8400-e29b-41d4-a716-446655440003",
      "branchId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 125,
      "reservedQuantity": 0,
      "updatedAt": "2026-10-27T08:00:00Z",
      "version": 1,
      "product": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "น้ำแข็งหลอดเล็ก 5kg",
        "sku": "ICE-S-001",
        "barcode": "885000100001",
        "price": 5000,
        "costPerBaseUnit": 3000,
        "minStock": 20,
        "productType": "PRICE_PER_UNIT",
        "baseUom": {
          "id": "uom-01",
          "name": "ถุง",
          "symbol": "bag"
        },
        "category": {
          "id": "cat-01",
          "name": "น้ำแข็งถุง"
        }
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 2. POST `/api/v1/inventory/adjust`

บันทึกการปรับยอดสต็อกสินค้า

### Request
- **Method**: `POST`
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Query Parameters**:
  - `branchId` (string, required): UUID ของสาขา
- **Body (`AdjustStockRequest`)**:
```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440000",
  "productId": "550e8400-e29b-41d4-a716-446655440003",
  "type": "AUDIT",
  "quantityDelta": -5,
  "reason": "ตรวจนับสต็อกประจำวัน พบสินค้าขาดหาย 5 ถุง",
  "idempotencyKey": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "ปรับยอดสต็อกสำเร็จ"
}
```

### Error Responses
- **400 Bad Request**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ADJUSTMENT",
    "message": "ยอดสต็อกไม่สามารถติดลบได้"
  }
}
```

---

## 3. GET `/api/v1/reports/inventory-valuation`

ดึงข้อมูลสรุปมูลค่าสต็อกสินค้าคงคลัง

### Request
- **Method**: `GET`
- **Query Parameters**:
  - `branchId` (string, optional): UUID ของสาขา

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "totalSkus": 45,
    "totalQuantity": 1520,
    "totalValuation": 4560000
  }
}
```
*(หาก Endpoint นี้ยังไม่พร้อม สามารถ Fallback เป็นการคำนวณจากผลรวมของยอดสต็อกในหน้ารายการได้)*
