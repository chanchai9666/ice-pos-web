# API & UI Interface Contracts: การอัปโหลดรูปภาพและการอัปเดตข้อมูลสินค้า

**Feature**: `003-edit-product-photo`
**Date**: 2026-10-21
**Status**: Completed

## 1. Backend REST API Endpoints

### 1.1 อัปโหลดรูปภาพสินค้า (Upload Product Image)
- **Method**: `POST`
- **URL**: `/api/v1/products/{id}/image`
- **Content-Type**: `multipart/form-data`
- **Authentication**: `Bearer <token>`

#### Request Form Data:
| Field | Type | Description |
| :--- | :--- | :--- |
| `file` | File (Binary) | ไฟล์รูปภาพสินค้า (JPEG, PNG, WebP) ขนาดไม่เกิน 5MB |

#### Response:
```json
{
  "code": 0,
  "message": "อัปโหลดรูปภาพสำเร็จ",
  "data": {
    "imageUrl": "/uploads/products/123e4567-e89b-12d3-a456-426614174000.webp"
  }
}
```

---

### 1.2 แก้ไขข้อมูลสินค้า (Update Product)
- **Method**: `PUT`
- **URL**: `/api/v1/products/{id}`
- **Content-Type**: `application/json`
- **Authentication**: `Bearer <token>`

#### Request Body:
```json
{
  "name": "น้ำแข็งหลอดเล็ก 5kg",
  "sku": "ICE-S-001",
  "barcode": "8850123456789",
  "isInternalBarcode": false,
  "categoryId": "c01-uuid",
  "baseUomId": "uom01-uuid",
  "productType": "STANDARD",
  "price": 4500,
  "costPerBaseUnit": 2000,
  "taxId": "tax01-uuid",
  "minStock": 10,
  "trackExpiry": false,
  "isActive": true,
  "description": "น้ำแข็งหลอดสะอาด บริสุทธิ์",
  "imageUrl": "/uploads/products/123e4567-e89b-12d3-a456-426614174000.webp"
}
```

#### Response:
```json
{
  "code": 0,
  "message": "แก้ไขข้อมูลสินค้าสำเร็จ",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "น้ำแข็งหลอดเล็ก 5kg",
    "sku": "ICE-S-001",
    "imageUrl": "/uploads/products/123e4567-e89b-12d3-a456-426614174000.webp",
    "updatedAt": "2026-10-21T16:20:00Z"
  }
}
```

---

## 2. Frontend Component Interface Contracts

### 2.1 CameraCaptureModal Props
```typescript
export interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
}
```

### 2.2 ImageUploader Enhanced Props
```typescript
export interface ImageUploaderProps {
  currentImageUrl?: string | null;
  onImageSelected: (file: File | null) => void;
  maxSizeBytes?: number; // default 5MB
  enableCamera?: boolean; // default true
}
```

### 2.3 ProductTable Image Display Contract with Cache-Busting
```typescript
interface ProductImageThumbnailProps {
  src?: string | null;
  alt: string;
  cacheKey?: number | string; // e.g. updated timestamp to trigger re-render
}
// Render: `${src}${src.includes('?') ? '&' : '?'}t=${cacheKey || Date.now()}`
```
