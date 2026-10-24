# Contract: Inventory Stock Levels API

**Protocol**: HTTP/1.1 REST
**Base Path**: `/api/v1`
**Authorization**: `Authorization: Bearer <accessToken>`

## Endpoint: GET `/api/v1/inventory/stocks`

ดึงรายงานยอดสต็อกสินค้าคงเหลือรายสาขาแบบ Real-time

### Request Parameters (Query)
| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `branchId` | query | string (UUID) | No (Fallback to user branch) | รหัสสาขาที่ต้องการดูสต็อก |
| `lowStockOnly` | query | boolean | No | แสดงเฉพาะสินค้าที่สต็อกต่ำกว่าเกณฑ์ |
| `page` | query | integer | No | หน้าที่ต้องการ (default: 1) |
| `pageSize` | query | integer | No | จำนวนรายการต่อหน้า (default: 100) |

### Response Schema (200 OK)
```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "productId": "550e8400-e29b-41d4-a716-446655440003",
      "branchId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 125,
      "reservedQuantity": 0,
      "updatedAt": "2026-10-24T08:00:00Z",
      "version": 1
    }
  ],
  "meta": {
    "page": 1,
    "limit": 100,
    "total": 1,
    "totalPage": 1
  }
}
```
