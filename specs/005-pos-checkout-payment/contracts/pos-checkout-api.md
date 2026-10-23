# API Contract: ระบบชำระเงินหน้าร้านและบันทึกการขาย (POS Checkout & Payment API)

**Feature Branch**: `005-pos-checkout-payment`  
**Base Path**: `/api/v1`  
**Header**: `Authorization: Bearer <token>`  

---

## 1. บันทึกการขายสินค้า (Create Sale / Checkout)

บันทึกรายการขายสินค้า POS รองรับการชำระเงินหลายรูปแบบ (CASH, QR_PROMPTPAY, CREDIT), ตัดสต็อกสินค้าอัตโนมัติ, คำนวณภาษีมูลค่าเพิ่ม, ออกเลขที่บิล และรองรับ Header `Idempotency-Key`

- **Method**: `POST`
- **Endpoint**: `/api/v1/sales`
- **Headers**:
  - `Content-Type: application/json`
  - `Idempotency-Key: <UUID>` (ป้องกันการทำรายการขายซ้ำ)
  - `X-Device-Id: <string>` (อุปกรณ์ POS, ทางเลือก)

### Request Body (`CreateSaleRequest`)
```json
{
  "branchId": "550e8400-e29b-41d4-a716-446655440000",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440097",
  "billDiscount": 0,
  "customerId": "550e8400-e29b-41d4-a716-446655440006",
  "note": "จัดส่งที่ร้านริมน้ำ",
  "occurredAt": "2026-10-23T10:30:00Z",
  "lines": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440003",
      "uomId": "550e8400-e29b-41d4-a716-446655440001",
      "qty": 5,
      "unitPrice": 4500,
      "lineDiscount": 0
    }
  ],
  "payments": [
    {
      "method": "CASH",
      "amount": 22500,
      "tenderedAmount": 30000,
      "changeAmount": 7500,
      "ref": ""
    }
  ]
}
```

### Success Response (`201 Created`)
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440009",
    "saleNo": "BR-000104",
    "branchId": "550e8400-e29b-41d4-a716-446655440000",
    "shiftId": "550e8400-e29b-41d4-a716-446655440010",
    "cashierId": "550e8400-e29b-41d4-a716-446655440002",
    "customerId": "550e8400-e29b-41d4-a716-446655440006",
    "status": "COMPLETED",
    "grandTotal": 22500,
    "billDiscount": 0,
    "creditPart": 0,
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440097",
    "lines": [
      {
        "id": "line-001",
        "productId": "550e8400-e29b-41d4-a716-446655440003",
        "productName": "น้ำแข็งหลอดเล็ก 5 กก.",
        "uomId": "550e8400-e29b-41d4-a716-446655440001",
        "uomName": "กระสอบ",
        "quantity": 5,
        "unitPrice": 4500,
        "lineTotal": 22500
      }
    ],
    "payments": [
      {
        "id": "pay-001",
        "method": "CASH",
        "amount": 22500,
        "tenderedAmount": 30000,
        "changeAmount": 7500
      }
    ],
    "createdAt": "2026-10-23T10:30:00Z"
  }
}
```

### Error Responses
- **400 Bad Request**: ข้อมูลรายการขายไม่ถูกต้อง หรือยอดชำระไม่ตรงกับยอดรวมบิล
  ```json
  {
    "code": 4001,
    "message": "ยอดเงินที่ชำระไม่ตรงกับยอดสุทธิของบิล",
    "data": null
  }
  ```
- **422 Unprocessable Entity**: สินค้าในสต็อกไม่เพียงพอ หรือวงเงินเครดิตลูกค้าไม่พอ
  ```json
  {
    "code": 4221,
    "message": "วงเงินเครดิตของลูกค้าไม่เพียงพอสำหรับการขายนี้",
    "data": null
  }
  ```

---

## 2. สร้าง QR Code พร้อมเพย์สำหรับรับชำระเงิน (Generate QR PromptPay)

สร้าง Dynamic QR PromptPay ตามยอดเงินที่ต้องชำระ (หน่วยสตางค์)

- **Method**: `POST`
- **Endpoint**: `/api/v1/payments/qr`

### Request Body (`GenerateQRRequest`)
```json
{
  "amount": 22500
}
```

### Success Response (`200 OK`)
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "qrRef": "PP17273390001234",
    "qrImageUrl": "https://promptpay.io/0812345678/225.00",
    "amount": 22500,
    "status": "PENDING",
    "createdAt": "2026-10-23T10:30:00Z"
  }
}
```

---

## 3. ตรวจสอบสถานะการชำระเงินผ่าน QR พร้อมเพย์ (Check QR Payment Status)

ตรวจสอบสถานะว่าลูกค้าโอนเงินเข้าบัญชีตาม QR Ref เรียบร้อยแล้วหรือไม่

- **Method**: `GET`
- **Endpoint**: `/api/v1/payments/{ref}/status`
- **Path Parameter**: `ref` (string, required) - รหัสอ้างอิง QR Reference

### Success Response (`200 OK`) - อยู่ระหว่างรอการชำระ
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "qrRef": "PP17273390001234",
    "amount": 22500,
    "status": "PENDING",
    "paidAt": null
  }
}
```

### Success Response (`200 OK`) - โอนเงินสำเร็จ
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "qrRef": "PP17273390001234",
    "amount": 22500,
    "status": "SUCCESS",
    "paidAt": "2026-10-23T10:30:15Z"
  }
}
```

---

## 4. ค้นหารายการลูกค้าและตรวจสอบวงเงินเครดิต (List Customers & Balances)

ค้นหาลูกค้าตามชื่อ รหัส หรือเบอร์โทรศัพท์ เพื่อดูวงเงินคงเหลือสำหรับการชำระด้วยเงินเชื่อ

- **Method**: `GET`
- **Endpoint**: `/api/v1/customers`
- **Query Parameters**:
  - `branchId`: UUID ของสาขา
  - `search`: คำค้นหา (ชื่อ/รหัส/เบอร์)
  - `page`: หน้าที่ต้องการ (เริ่มต้น 1)
  - `pageSize`: จำนวนต่อหน้า (เช่น 10)

### Success Response (`200 OK`)
```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "code": "CUST-0001",
      "name": "ร้านอาหารริมน้ำ",
      "phone": "0819876543",
      "creditLimit": 5000000,
      "outstandingBalance": 1200000,
      "availableCredit": 3800000,
      "isActive": true
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 5. ตรวจสอบสถานะกะการขายปัจจุบัน (Get Active Shift)

ตรวจสอบว่ามีกะการขายเปิดใช้งานอยู่หรือไม่ สำหรับสาขาปัจจุบัน (เรียกผ่าน `PosCartContext` เพียงครั้งเดียว)

- **Method**: `GET`
- **Endpoint**: `/api/v1/shifts/active?branchId={branchId}`
- **Query Parameter**: `branchId` (string, required)

### Success Response (`200 OK`)
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "id": "shift-1234",
    "branchId": "550e8400-e29b-41d4-a716-446655440000",
    "cashierId": "cashier-001",
    "cashierName": "สมชาย ใจดี",
    "startingCash": 200000,
    "openedAt": "2026-10-23T08:00:00Z",
    "status": "OPEN"
  }
}
```
