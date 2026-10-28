# ICE POS API — Contract Map & Gap Analysis

> เอกสารอ้างอิงสัญญา API ฉบับจริง สำหรับทีมหน้าบ้าน `ice-pos-web`
> ที่มา: `http://localhost:8080/swagger/doc.json` (ดึงสด 2026-10-28) เทียบกับ `src/services/*.ts` และ `src/types/*.ts`
> สเปกเวอร์ชัน **1.2.0** · OAS 2.0 · host `localhost:8080` · basePath `/api/v1`

---

## 1. ข้อเท็จจริงตั้งต้น (ตัวเลขจริง ไม่ใช่ประมาณ)

| รายการ | ค่า |
|---|---|
| จำนวน paths | **62** |
| จำนวน operations | **81** |
| จำนวน definitions (DTO) | **95** |
| จำนวน tag (โดเมน) | **17** |
| Security scheme | `BearerAuth` — `apiKey`, header `Authorization`, ค่า `Bearer {token}` |
| Global `security` | **ไม่ประกาศ** (ไม่มีค่า default — ต้องดูราย operation) |

### 1.1 สำเนาสเปกในโปรเจกต์ล้าสมัย

`docs/swagger.json` (21 ต.ค.) เป็นเวอร์ชัน 1.2.0 เหมือนกัน แต่มี **77 operations** ขาด 4 ตัวที่ backend เพิ่งเพิ่ม:

- `POST /auth/logout`
- `GET /products/lookup`
- `GET /products/sku`
- `GET /products/sku/{sku}`

`docs/api-summary.md` เขียนไว้ถูกต้องในระดับหลักการ แต่ยังไม่ครอบคลุม `/shifts/*`, `/sync/*`, `/users/*`, `/sales/{id}/void`, `/returns`, `/receipts/{receiptNo}` — เอกสารฉบับนี้แทนที่ทั้งสองไฟล์ในฐานะสัญญาอ้างอิง

---

## 2. Response Envelope กลาง

ทุก endpoint ตอบด้วยโครงเดียวกัน (`StandardResponse` / `ErrorResponse`):

```json
{
  "code": 0,
  "message": "ok",
  "data": { },
  "meta": {
    "pagination": { "page": 1, "pageSize": 20, "totalItems": 137, "totalPages": 7 },
    "hasMore": false,
    "nextCursor": "",
    "extra": { }
  },
  "details": [ { "field": "sku", "message": "already exists" } ]
}
```

### กติกาที่ต้องยึด

| กติกา | รายละเอียด |
|---|---|
| **Success** | `code === 0` เท่านั้น · HTTP 200 หรือ 201 |
| **Error** | `code !== 0` · ใช้ `ErrorResponse` (ไม่มี `meta`) |
| **`details`** | ใช้กับ validation error · field ชื่อ **`message`** ไม่ใช่ `issue` |
| **`meta.pagination`** | เป็น object ซ้อน **ไม่ใช่** `meta.page` / `meta.pageSize` แบบแบน |
| **`meta.hasMore` / `nextCursor`** | ใช้กับ `/sync/changes` (cursor-based) ไม่ใช่ page-based |
| **HTTP 422** | ใช้เฉพาะ `POST /sales` — สต็อกไม่พอ หรือวงเงินเครดิตไม่พอ (แยกจาก 400 ที่หมายถึง payload ผิด) |
| **HTTP 409** | ใช้กับ `POST /products` (SKU ซ้ำ) และ `POST /users` (username ซ้ำ) |

> **ข้อควรระวัง:** หน้าบ้านประกาศ `ApiResponse.meta` เป็น `{page, pageSize, totalItems, totalPages}` แบนที่ `src/types/auth.ts:11-16` ซึ่ง**ไม่ตรงกับสเปก** — ของจริงซ้อนใต้ `pagination` ถ้าจะอ่านค่าจำนวนหน้าจาก `meta.page` จะได้ `undefined` ทุกครั้ง

---

## 3. กติกาตัวเลข วันที่ และ Key

### 3.1 เงินทุกฟิลด์เป็นสตางค์ (integer)

สเปกเขียนกำกับ `satang` ไว้ชัดใน DTO เหล่านี้:

| DTO | ฟิลด์ที่เป็นสตางค์ |
|---|---|
| `CreateSaleRequest` / `SaleResponse` | `billDiscount`, `grandTotal`, `subTotal`, `vatAmount`, `creditPart`, `unitPrice`, `lineDiscount`, `amount`, `tenderedAmount`, `changeAmount` |
| `CreateProductRequest` / `ProductResponse` | `price`, `costPerBaseUnit` |
| `ProductScanResponse` | `computedLineTotal`, `embeddedPrice` |
| `CreatePurchaseOrderRequest` / `PurchaseOrderResponse` | `taxAmount`, `subtotal`, `grandTotal`, `unitCost`, `lineTotal` |
| `CreateGoodsReceiptRequest` / `GoodsReceiptResponse` | `unitCost`, `lineTotal`, `grandTotal` |
| `CreateCustomerRequest` / `CustomerResponse` | `creditLimit`, `initialCreditLimit`, `outstandingBalance` |
| `SetCreditLimitRequest` / `PayCreditRequest` | `creditLimit`, `amount`, `balanceAfter` |
| `ARAgingItemResponse` | `creditLimit`, `outstandingBalance`, `currentDue`, `due30To60`, `due60To90`, `over90` |
| `GenerateQRRequest` / `QRPaymentResponse` | `amount` |
| `OpenShiftRequest` / `ShiftResponse` / `CloseShiftRequest` | `openingCash`, `countedCash`, `expectedCash`, `difference` |
| `ValuationResponse` / `SalesSummaryResponse` | `totalCostValue`, `totalSaleValue`, `averageBillSize`, `grossProfit`, `totalCost`, `totalSales`, `totalDiscount`, `totalVat` |
| `BestSellerResponse` | `totalProfit`, `totalRevenue` |
| `ReturnResponse` | `totalRefund`, `unitAmount` |

**ข้อยกเว้นที่ต้องระวัง** — ฟิลด์เหล่านี้เป็นจำนวนจริง/ทศนิยม ไม่ใช่สตางค์:

- `minStock`, `purchaseRatio`, `quantity`, `qty`, `receivedQuantity`, `rejectedQuantity`, `orderedQuantity`, `remainingQuantity`, `quantityDelta`, `totalQuantity`, `totalQtySold`, `computedQuantity` → `number`
- `embeddedWeight` → หน่วยกิโลกรัม
- `TaxResponse.rate` → อัตราเศษส่วน (เช่น `0.07` = 7%) **ไม่ใช่** 7

### 3.2 วันที่และเวลา

- ฟิลด์ลงท้าย `At` (`createdAt`, `updatedAt`, `openedAt`, `closedAt`, `paidAt`, `occurredAt`, `receivedAt`, `completedAt`, `lastLoginAt`, `lockedUntil`, `expiresAt`) → **string RFC3339**
- ฟิลด์ลงท้าย `Date` (`orderDate`, `expectedDeliveryDate`, `receivedDate`, `expiryDate`) → string วันที่
- `since` (ใน `/sync/changes`) → cursor timestamp ของ RFC3339 ใช้เป็นจุดตัด delta

### 3.3 Key และ Identifier

- Primary key ทุกตารางเป็น **UUID v4** (string) — ไม่มี integer id
- เลขเอกสารที่มนุษย์อ่าน เป็นฟิลด์แยก: `saleNo`, `poNo`, `receiptNo`, `returnNo`, `transferNo`, `code`
- `idempotencyKey` เป็น UUID ที่ client สร้าง — ใช้กับ `POST /sales`, `POST /inventory/adjust`, `POST /customers/{id}/pay-credit`, `POST /sync/batch`
- `POST /sales` รับ **`Idempotency-Key` ทาง header** ด้วย และ `X-Device-Id` สำหรับ offline
- `GET /sync/changes` รับ **`X-Device-Id` ทาง header** (required ตามบริบทการใช้งาน)

### 3.4 การแบ่งหน้า — สองระบบคู่ขนานที่ต้องแยกให้ออก

| ระบบ | พารามิเตอร์ | ใช้กับ |
|---|---|---|
| **Page-based** | `page` + `pageSize` | `/categories`, `/customers`, `/inventory/stocks`, `/products`, `/sales` |
| **Page-based (ชื่อต่าง)** | `page` + `limit` | `/purchase-orders`, `/goods-receipts`, `/suppliers`, `/reports/best-sellers` |
| **Cursor-based** | `since` + `batchSize` → `meta.nextCursor`, `meta.hasMore` | `/sync/changes` |
| **ไม่มี pagination** | — | `/branches`, `/taxes`, `/uoms`, `/users`, `/reports/*` (ยกเว้น best-sellers) |

> **กับดัก:** `pageSize` กับ `limit` เป็นคนละชื่อในคนละโดเมน ส่งผิดชื่อจะถูกเมินเงียบ ๆ แล้วได้ default ของ backend

---

## 4. Auth Flow

### 4.1 Endpoint

| Method | Path | Body | คืน `data` | ต้องมี token |
|---|---|---|---|---|
| POST | `/auth/login` | `LoginRequest {username*, password*}` | `AuthResponse` | ไม่ |
| POST | `/auth/pin-login` | `PinLoginRequest {branchId*, pin*}` | `AuthResponse` | ไม่ |
| POST | `/auth/refresh` | `RefreshTokenRequest {refreshToken*}` | `AuthResponse` | ไม่ |
| GET | `/auth/me` | — | `UserProfileResponse` | **ใช่** |
| POST | `/auth/logout` | — | `object` | ไม่ (ตามสเปก) |

`AuthResponse` = `{ accessToken, refreshToken, expiresAt, user: UserProfileResponse }`

`UserProfileResponse` = `{ id, username, name, role, branchId, isActive, createdAt }`

> **หมายเหตุสำคัญ:** สเปกใช้ `expiresAt` (timestamp สัมบูรณ์) **ไม่ใช่** `expiresIn` (จำนวนวินาที) และใช้ `name` **ไม่ใช่** `fullName` — หน้าบ้านประกาศผิดทั้งสองจุดที่ `src/types/auth.ts:26` (`fullName`) และ `:62` (`expiresIn`)

### 4.2 PIN Login

- `pin` เป็นตัวเลข 4–6 หลัก (ตาม description)
- ต้องส่ง `branchId` คู่กันเสมอ — เป็นการล็อกอินแคชเชียร์ประจำสาขา
- ใช้เปิดหน้าขาย POS เร็ว ไม่ต้องพิมพ์ username/password

### 4.3 Refresh — Hybrid Cookie + Body

สเปกประกาศว่ารองรับ **ทั้ง Cookie `refresh_token` และ JSON body** หน้าบ้านทำถูกแล้วที่ `src/services/api.ts:86-99`:

- ส่ง `credentials: 'include'` → cookie ไปด้วย
- แนบ `{ refreshToken }` ใน body ถ้ามีใน storage
- ถ้าไม่มี refresh token ใน storage → ส่ง `{}` แล้วพึ่ง cookie อย่างเดียว

### 4.4 Silent Refresh ที่ `api.ts` ทำอยู่ (queue + retry)

ลำดับจริงใน `src/services/api.ts`:

1. ทุกคำขอแนบ `Authorization: Bearer {accessToken}` ถ้ามี token (`:163-165`)
2. ถ้า response เป็น **401** และ endpoint **ไม่ใช่** auth endpoint (`:215-221`)
3. ถ้ามีคำขออื่นกำลัง refresh อยู่แล้ว → คำขอนี้ **เข้าคิวรอ** (`:223-229`)
4. ถ้ายังไม่มีใคร refresh → เริ่ม `performTokenRefresh()` ตัวเดียว (`:231-233`)
5. refresh สำเร็จ → ปลดคิวทั้งหมด แล้ว **retry คำขอเดิมพร้อม `_isRetry: true`** (`:239-244`)
6. refresh ล้มเหลว → reject ทุกคำขอในคิว + ล้าง session + แจ้ง `SESSION_EXPIRED` (`:245-258`)
7. retry ทำได้ **ครั้งเดียว** (`!_isRetry` guard) — 401 รอบสองจะไม่วนซ้ำ

**Timeout แยกตามประเภท endpoint** (`:171-177`):

- `/sales`, `/orders`, `/checkout`, `/payments` → **30,000 ms**
- endpoint อื่นทั้งหมด → **15,000 ms**

**Auth endpoint ที่ยกเว้นจากการ refresh** (`:216-219`): `/auth/login`, `/auth/pin-login`, `/auth/refresh`, `/auth/logout`

### 4.5 ช่องโหว่ของ Auth ที่ต้องตัดสินใจ

สเปกประกาศ `security: BearerAuth` **ไม่สม่ำเสมอ** — GET หลายตัวไม่ประกาศเลย ทั้งที่ข้อมูลไม่ใช่ public:

| ไม่ประกาศ security (คาดว่า public) — **17 operations** | ประกาศ BearerAuth — **64 operations** |
|---|---|
| `/branches`, `/categories` (GET), `/categories/{id}` (GET), `/products` (GET), `/products/{id}` (GET), `/products/lookup*`, `/products/sku*`, `/products/barcode/{barcode}`, `/taxes`, `/uoms`, `/health` | ที่เหลือทั้งหมด รวม `/customers*`, `/sales*`, `/inventory*`, `/purchase-orders*`, `/goods-receipts*`, `/shifts*`, `/sync*`, `/users*`, `/reports*`, `/suppliers*`, `/receipts/*`, `/returns`, `/payments/*` |

หน้าบ้านแนบ Bearer **ทุกคำขอ** รวมถึง GET ที่สเปกไม่ประกาศ — ปลอดภัยกว่า ไม่ผิด แต่ควรยืนยันกับ backend ว่าการไม่ประกาศเป็นเรื่องเอกสารหรือเป็นช่องโหว่จริง

---

## 5. ตาราง Endpoint ทั้งหมด — 81 operations / 17 โดเมน

สัญลักษณ์: `🔒` = ประกาศ `BearerAuth` · `—` = ไม่ประกาศ · `*` = required

### 00. ระบบ (System & Health) — 1

| M | Path | Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/health` | — | `object` | — |

### 01. Authentication — 6

| M | Path | Body | คืน `data` | Auth |
|---|---|---|---|---|
| POST | `/auth/login` | `LoginRequest` | `AuthResponse` | — |
| POST | `/auth/logout` | — | `object` | — |
| GET | `/auth/me` | — | `UserProfileResponse` | 🔒 |
| POST | `/auth/pin-login` | `PinLoginRequest` | `AuthResponse` | — |
| POST | `/auth/refresh` | `RefreshTokenRequest` | `AuthResponse` | — |
| GET | `/branches` | — | `[]BranchResponse` | — |

### 02. Product Catalog — 18

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/categories` | `page`, `pageSize` | `[]CategoryResponse` | — |
| POST | `/categories` | `CreateCategoryRequest` | `CategoryResponse` | 🔒 |
| GET | `/categories/{id}` | — | `CategoryResponse` | — |
| PUT | `/categories/{id}` | `UpdateCategoryRequest` | `CategoryResponse` | 🔒 |
| DELETE | `/categories/{id}` | — | `StandardResponse` | 🔒 |
| GET | `/products` | `categoryId`, `category_id`, `barcode`, `search`, `isActive`, `is_active`, `page`, `pageSize` | `[]ProductResponse` | — |
| POST | `/products` | `CreateProductRequest` | `ProductResponse` · 409 ถ้า SKU ซ้ำ | 🔒 |
| GET | `/products/{id}` | — | `ProductResponse` | — |
| PUT | `/products/{id}` | `UpdateProductRequest` | `ProductResponse` | 🔒 |
| DELETE | `/products/{id}` | — | `StandardResponse` | 🔒 |
| GET | `/products/barcode/{barcode}` | — | `ProductScanResponse` | — |
| GET | `/products/lookup` | `code` | `[]ProductResponse` | — |
| GET | `/products/lookup/{code}` | — | `[]ProductResponse` | — |
| GET | `/products/sku` | `sku` | `[]ProductResponse` | — |
| GET | `/products/sku/{sku}` | — | `[]ProductResponse` | — |
| POST | `/products/{id}/image` | multipart file | `ProductResponse` | 🔒 |
| POST | `/products/{id}/internal-barcode` | — | `object` (EAN-13 ที่สร้าง) | 🔒 |
| POST | `/uploads/images` | multipart file | `FileUploadResponse` | 🔒 |

**`ProductScanResponse`** = `{ scannedBarcode, product, isVariableWeight, embeddedWeight, embeddedPrice, computedQuantity, computedLineTotal }` — รองรับสินค้าชั่งน้ำหนักที่ฝังน้ำหนัก/ราคาไว้ในบาร์โค้ด

### 03. Catalog Metadata — 2

| M | Path | คืน `data` | Auth |
|---|---|---|---|
| GET | `/taxes` | `[]TaxResponse` | — |
| GET | `/uoms` | `[]UomResponse` | — |

`TaxResponse` = `{ id, name, rate, isActive, isIncludeInPrice }` — `rate` เป็นเศษส่วน (0.07)
`UomResponse` = `{ id, code, nameTh, nameEn, category, isActive, createdAt }`

### 04. Customers & Credit — 8

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/customers` | `branchId`, `search`, `isMember`, `page`, `pageSize` | `[]CustomerResponse` | 🔒 |
| POST | `/customers` | `CreateCustomerRequest` | `CustomerResponse` | 🔒 |
| GET | `/customers/{id}` | — | `CustomerResponse` | 🔒 |
| PUT | `/customers/{id}` | `UpdateCustomerRequest` | `CustomerResponse` | 🔒 |
| DELETE | `/customers/{id}` | — | `StandardResponse` | 🔒 |
| PUT | `/customers/{id}/credit-limit` | `SetCreditLimitRequest {creditLimit*}` | `StandardResponse` | 🔒 |
| POST | `/customers/{id}/pay-credit` | `PayCreditRequest {amount*, paymentMethod*, idempotencyKey, note}` | `CreditTransactionResponse` | 🔒 |
| GET | `/customers/reports/ar-aging` | `branchId` | `[]ARAgingItemResponse` | 🔒 |

`CustomerResponse` = `{ id, name, phone, email, branchId, isMember, points, creditLimit, outstandingBalance, creditStatus, version, createdAt, updatedAt }`

`ARAgingItemResponse` = `{ customerId, customerName, phone, creditLimit, outstandingBalance, currentDue (0-30), due30To60, due60To90, over90, status }`

### 04.1 Suppliers — 5

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/suppliers` | `page`, `limit`, `search`, `isActive` | `[]SupplierResponse` | 🔒 |
| POST | `/suppliers` | `CreateSupplierRequest` | `SupplierResponse` | 🔒 |
| GET | `/suppliers/{id}` | — | `SupplierResponse` | 🔒 |
| PUT | `/suppliers/{id}` | `UpdateSupplierRequest` | `SupplierResponse` | 🔒 |
| DELETE | `/suppliers/{id}` | — | `object` · 403 ได้ | 🔒 |

`SupplierResponse` = `{ id, code, name, contactName, phone, email, address, taxId, creditDays, isActive, createdAt, updatedAt }`

### 04.2 Purchase Orders — 8

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/purchase-orders` | `branchId`, `supplierId`, `status`, `startDate`, `endDate`, `search`, `page`, `limit` | `[]PurchaseOrderResponse` | 🔒 |
| POST | `/purchase-orders` | `CreatePurchaseOrderRequest` | `PurchaseOrderResponse` | 🔒 |
| GET | `/purchase-orders/{id}` | — | `PurchaseOrderResponse` | 🔒 |
| PUT | `/purchase-orders/{id}` | `UpdatePurchaseOrderRequest` (เฉพาะ DRAFT) | `PurchaseOrderResponse` | 🔒 |
| POST | `/purchase-orders/{id}/confirm` | — | `object` | 🔒 |
| POST | `/purchase-orders/{id}/cancel` | — | `object` | 🔒 |
| POST | `/purchase-orders/{id}/close` | — | `object` (force close) | 🔒 |
| GET | `/purchase-orders/{id}/receipt-preview` | — | `[]ReceiptPendingItemResponse` | 🔒 |

`PurchaseOrderResponse` = `{ id, poNo, branchId, branchName, supplierId, supplier, status, orderDate, expectedDeliveryDate, subtotal, taxAmount, grandTotal, note, createdBy, lines[], createdAt, updatedAt }`

`ReceiptPendingItemResponse` = `{ purchaseOrderLineId, productId, productName, productSku, product, orderedQuantity, receivedQuantity, remainingQuantity, unitCost, uomId, uomName }`

### 04.3 Goods Receipts — 5

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/goods-receipts` | `branchId`, `purchaseOrderId`, `supplierId`, `status`, `startDate`, `endDate`, `search`, `page`, `limit` | `[]GoodsReceiptResponse` | 🔒 |
| POST | `/goods-receipts` | `CreateGoodsReceiptRequest` | `GoodsReceiptResponse` | 🔒 |
| GET | `/goods-receipts/{id}` | — | `GoodsReceiptResponse` | 🔒 |
| POST | `/goods-receipts/{id}/complete` | — | `GoodsReceiptResponse` | 🔒 |
| POST | `/goods-receipts/{id}/cancel` | — | `object` (เฉพาะ DRAFT) | 🔒 |

### 05. Inventory & Stock — 4

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/inventory/stocks` | `branchId`, `lowStockOnly`, `page`, `pageSize` | `[]StockLevelResponse` | 🔒 |
| POST | `/inventory/adjust` | **`branchId*` ทาง query** + `AdjustStockRequest` | `StandardResponse` | 🔒 |
| POST | `/inventory/transfers` | `CreateStockTransferRequest` | `StockTransferResponse` | 🔒 |
| POST | `/inventory/transfers/{id}/receive` | — | `StandardResponse` | 🔒 |

`AdjustStockRequest.type` enum **10 ค่า**: `IN`, `OUT`, `ADJUST`, `TRANSFER`, `SALE`, `RETURN`, `BAD_STOCK`, `EXPIRED`, `AUDIT`, `DAMAGE`

### 06. Shifts & Cash Drawer — 3

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/shifts/active` | **`branchId*`** | `ShiftResponse` | 🔒 |
| POST | `/shifts/open` | `OpenShiftRequest {branchId*, openingCash}` | `ShiftResponse` | 🔒 |
| POST | `/shifts/{id}/close` | `CloseShiftRequest {countedCash*}` | `ShiftResponse` | 🔒 |

`ShiftResponse` = `{ id, branchId, cashierId, openedAt, closedAt, openingCash, countedCash, expectedCash, difference, status }`

### 07. Sales & Checkout — 4

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/sales` | `branchId`, `cashierId`, `customerId`, `status`, `startDate`, `endDate`, `page`, `pageSize` | `[]SaleResponse` | 🔒 |
| POST | `/sales` | `CreateSaleRequest` + header `Idempotency-Key`, `X-Device-Id` | `SaleResponse` · 422 ถ้าสต็อก/เครดิตไม่พอ | 🔒 |
| GET | `/sales/{id}` | — | `SaleResponse` | 🔒 |
| POST | `/sales/{id}/void` | `VoidSaleRequest {reason*}` | `StandardResponse` | 🔒 |

`SaleResponse` = `{ id, saleNo, branchId, shiftId, cashierId, customerId, status, subTotal, vatAmount, billDiscount, grandTotal, creditPart, note, occurredAt, idempotencyKey, version, lines[], payments[], createdAt }`

`CreateSalePayment.method` enum: `CASH`, `CARD`, `QR_PROMPTPAY`, `WALLET`, `CREDIT`, `TRANSFER`

### 08. Returns & Refunds — 1

| M | Path | Body | คืน `data` | Auth |
|---|---|---|---|---|
| POST | `/returns` | `CreateReturnRequest {saleId*, reason*, refundMethod*, lines*[], returnsStock, branchId}` | `ReturnResponse` | 🔒 |

`CreateReturnLineItem` = `{ saleLineId*, productId*, qty*, unitAmount* }` — **ต้องอ้าง `saleLineId` ของบิลเดิม** ไม่ใช่แค่ productId

### 09. Receipts — 1

| M | Path | คืน `data` | Auth |
|---|---|---|---|
| GET | `/receipts/{receiptNo}` | `ReceiptResponse` | 🔒 |

`ReceiptResponse` = `{ id, receiptNo, type, refId, contentJson, printCount, createdAt }` — `contentJson` เป็น **string ที่บรรจุ JSON snapshot** ต้อง parse ซ้ำอีกชั้น

### 10. Payments & QR PromptPay — 2

| M | Path | Body | คืน `data` | Auth |
|---|---|---|---|---|
| POST | `/payments/qr` | `GenerateQRRequest {amount*}` | `QRPaymentResponse` | 🔒 |
| GET | `/payments/{ref}/status` | — | `object` | 🔒 |

> ทั้งสอง endpoint ระบุใน description ว่าเป็น **Mock Service** — ยังไม่ผูก Payment Gateway จริง ใช้ทดสอบ flow ได้ แต่ห้ามใช้ตัดสินว่าลูกค้าจ่ายจริง

### 11. Reports & Analytics — 3

| M | Path | Query | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/reports/sales-summary` | `branchId`, `startDate`, `endDate` | `SalesSummaryResponse` | 🔒 |
| GET | `/reports/best-sellers` | `branchId`, `startDate`, `endDate`, `limit` | `[]BestSellerResponse` | 🔒 |
| GET | `/reports/inventory-valuation` | `branchId` | `ValuationResponse` | 🔒 |

`SalesSummaryResponse` = `{ totalSales, totalCost, grossProfit, totalDiscount, totalVat, totalBills, averageBillSize }`
`ValuationResponse` = `{ totalItems, totalQuantity, totalCostValue, totalSaleValue }`

### 12. Offline Synchronization — 2

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/sync/changes` | header `X-Device-Id`, `since`, `batchSize` | `SyncChangesResponse` | 🔒 |
| POST | `/sync/batch` | `SyncBatchRequestDTO` | `SyncBatchResponse` | 🔒 |

`SyncChangesResponse` (pull) = `{ since, products[], categories[], uoms[], taxes[], hasMore, nextCursor }`
`SyncBatchRequestDTO` (push) = `{ deviceId, sales[], returns[], customers[], stockMovements[] }`
`SyncBatchResponse` = `{ appliedCount, rejectedCount, results[{ id, idempotencyKey, status, code, message }] }`

### 02b. User Management — 8

| M | Path | Query / Body | คืน `data` | Auth |
|---|---|---|---|---|
| GET | `/users` | `branchId`, `role`, `isActive`, `search` | `[]UserResponse` | 🔒 (403 ได้) |
| POST | `/users` | `CreateUserRequest` | `UserResponse` · 409 ถ้า username ซ้ำ | 🔒 |
| GET | `/users/{id}` | — | `UserResponse` | 🔒 |
| PUT | `/users/{id}` | `UpdateUserRequest` | `UserResponse` | 🔒 |
| DELETE | `/users/{id}` | — | `object` | 🔒 |
| POST | `/users/{id}/reset-password` | `ResetPasswordRequest {newPassword*}` | `object` | 🔒 |
| POST | `/users/{id}/reset-pin` | `ResetPinRequest {pin*}` | `object` | 🔒 |
| POST | `/users/{id}/unlock` | — | `object` | 🔒 |

`UserResponse` = `{ id, username, name, role, branchId, branch, isActive, isLocked, failedLoginAttempts, lockedUntil, lastLoginAt, createdAt, updatedAt }`

---

## 6. State Machine

### 6.1 Purchase Order

```
                    ┌──────────────┐
                    │    DRAFT     │◄── POST /purchase-orders (status=DRAFT)
                    └──────┬───────┘
              PUT /{id}    │  POST /{id}/confirm
              (แก้ได้เฉพาะ DRAFT)  │
                    ┌──────▼───────┐
                    │   ORDERED    │◄── POST /purchase-orders (status=ORDERED)
                    └──────┬───────┘
                           │  POST /goods-receipts/{id}/complete
                           │  (ปรับสถานะ PO อัตโนมัติตามยอดที่รับ)
                    ┌──────▼────────────┐
                    │ PARTIALLY_RECEIVED│
                    └──────┬────────────┘
                           │ รับครบทุก line
                    ┌──────▼───────┐
                    │  COMPLETED   │
                    └──────────────┘

  ทางออกอื่น:
  DRAFT/ORDERED ──POST /{id}/cancel──► CANCELLED   (เฉพาะใบที่ยังไม่มีการรับสินค้า)
  PARTIALLY_RECEIVED ──POST /{id}/close──► ปิดบังคับ (คู่ค้าแจ้งไม่ส่งส่วนที่เหลือ)
```

**เงื่อนไขที่สเปกเขียนไว้ชัด:**

| การเปลี่ยนสถานะ | เงื่อนไข / ผลข้างเคียง |
|---|---|
| `PUT /purchase-orders/{id}` | แก้ได้ **เฉพาะ DRAFT** |
| `POST /{id}/confirm` | `DRAFT → ORDERED` |
| `POST /{id}/cancel` | ทำได้เฉพาะใบที่ **ยังไม่มีการรับสินค้า** |
| `POST /{id}/close` | Force close — ใช้เมื่อรับของบางส่วนแล้วคู่ค้าไม่ส่งที่เหลือ |
| `POST /goods-receipts/{id}/complete` | ปรับสถานะ PO **อัตโนมัติ** ตามยอดที่รับ — ไม่มี endpoint สั่งเปลี่ยน PO status ตรง ๆ |

> **สิ่งที่สเปกไม่ระบุ:** สูตรคำนวณ `PARTIALLY_RECEIVED` vs `COMPLETED` (เทียบจาก `receivedQuantity` รวมทุก line หรือตาม `orderedQuantity`) — ต้องยืนยันกับ backend ก่อนเขียน logic ฝั่งหน้าบ้าน

### 6.2 Goods Receipt

```
   POST /goods-receipts (status=DRAFT)         POST /goods-receipts (status=COMPLETED)
              │                                          │
       ┌──────▼───────┐                                  │ เพิ่มสต็อก + StockMovement ทันที
       │    DRAFT     │                                  │
       └──┬────────┬──┘                                  │
          │        │                                     │
  /complete        /cancel                               │
          │        │                                     │
   ┌──────▼─────┐  │                              ┌──────▼───────┐
   │ COMPLETED  │  └─────────────────────────────►│  CANCELLED   │
   └────────────┘                                 └──────────────┘
```

**จุดที่สต็อกเปลี่ยนจริง — มีสองทาง ต้องเลือกให้ถูก:**

| ทาง | เมื่อไหร่สต็อกเพิ่ม |
|---|---|
| `POST /goods-receipts` ด้วย `status: "COMPLETED"` | **ทันทีตอนสร้าง** — เพิ่มสต็อก + บันทึก StockMovement |
| `POST /goods-receipts` ด้วย `status: "DRAFT"` แล้ว `POST /{id}/complete` | **ตอน complete** — เพิ่มสต็อก (StockMovement: IN), ปรับสถานะ PO, บันทึก Lot/Expiry, ปรับต้นทุนสินค้า |

`POST /{id}/cancel` ยกเลิกได้ **เฉพาะ DRAFT** — ใบที่ COMPLETED แล้วยกเลิกไม่ได้ ต้องใช้ return หรือ adjust แทน

**รองรับกรณีพิเศษ:** ตรวจรับบางส่วน (Partial), สินค้าขาดส่ง (`receivedQuantity: 0`), สินค้าชำรุด (`rejectedQuantity` + `rejectReason`), Lot/Expiry (`batchCode`, `expiryDate`)

### 6.3 Shift

```
  POST /shifts/open ──► OPEN ──POST /shifts/{id}/close──► CLOSED
                          │
                          └─ GET /shifts/active (branchId*) ตรวจกะปัจจุบัน
```

ปิดกะ: ส่ง `countedCash` (นับจริง) → backend คำนวณ `expectedCash` และ `difference` (ขาด/เกิน)

### 6.4 Sale

```
  POST /sales ──► COMPLETED ──POST /sales/{id}/void──► VOIDED
                    │
                    └─ ตัดสต็อกอัตโนมัติ, คำนวณ VAT, ออกใบเสร็จ
```

`void` คืนสต็อกเข้าและคืนวงเงินเครดิตให้ลูกค้า — **ไม่ใช่** การคืนสินค้า (ใช้ `/returns` สำหรับนั้น)

---

## 7. Gap Analysis

### 7.1 ด้าน ก — หน้าบ้านเรียก endpoint ที่ **ไม่มีในสเปก**

**ผลการตรวจ: ไม่พบ** — ทั้ง `/shifts/*`, `/taxes`, `/uoms`, `/suppliers*` มีจริงในสเปกครบ

> แผนงานตั้งสมมติฐานไว้ว่า 3 กลุ่มนี้ขาด — **สมมติฐานนั้นผิด** เกิดจากการอ่านสารบัญ `/docs` ที่ถูกตัดตอนระหว่างดึงข้อมูล ไม่ใช่สเปกขาด
> **บทเรียน:** อย่าตัดสินว่า endpoint ไม่มีจากสารบัญ UI ให้ตรวจ `doc.json` ตรง ๆ เสมอ

### 7.2 ด้าน ข — API มี แต่หน้าบ้านยังไม่ต่อ (32 operations)

| โดเมน | endpoint ที่ยังไม่ต่อ | ผลกระทบทางธุรกิจ |
|---|---|---|
| **Returns** | `POST /returns` | **สูง** — คืนสินค้า/คืนเงินทำในระบบไม่ได้เลย |
| **Sales** | `POST /sales/{id}/void` | **สูง** — ยกเลิกบิลผิดไม่มีทางแก้ ต้องแก้ที่ DB |
| **Receipts** | `GET /receipts/{receiptNo}` | **สูง** — พิมพ์ใบเสร็จซ้ำไม่ได้ ลูกค้าขอใบเสร็จใหม่ไม่ได้ |
| **Customers** | `POST`, `PUT`, `DELETE /customers`, `PUT /{id}/credit-limit`, `POST /{id}/pay-credit`, `GET /reports/ar-aging` | **สูง** — เปิดบัญชีเงินเชื่อ, รับชำระหนี้, ดู aging ต้องทำนอกระบบ |
| **Inventory** | `POST /inventory/transfers`, `POST /{id}/receive` | **กลาง** — โอนสินค้าระหว่างสาขาไม่ได้ |
| **Reports** | `GET /reports/sales-summary`, `GET /reports/best-sellers` | **กลาง** — ไม่มีรายงานยอดขาย/กำไรขั้นต้น |
| **Suppliers** | `POST`, `PUT`, `DELETE /suppliers` | **กลาง** — เพิ่ม/แก้ผู้จำหน่ายต้องทำที่ backend |
| **Users** | ทั้ง 8 operations | **กลาง** — จัดการผู้ใช้/รีเซ็ต PIN/ปลดล็อกทำไม่ได้ |
| **Sync** | `GET /sync/changes`, `POST /sync/batch` | **สูง** — โหมด offline-first ที่ประกาศไว้ยังไม่มีจริง |
| **Products** | `GET /products/barcode/{barcode}`, `GET /products/lookup`, `GET /products/lookup/{code}`, `GET /products/sku/{sku}`, `POST /uploads/images` | **ต่ำ** — มีทางเลือกอื่นที่ใช้ได้แล้ว (`/products/lookup/{code}`, `/products/{id}/image`) |
| **Categories** | — | ครบแล้ว |

**ช่องว่างที่หนักที่สุดคือ offline-first** — สเปกมี `/sync/*` เต็มรูปแบบ แต่หน้าบ้านไม่มี service ใดเรียกเลย ทั้งที่ description ของ API ประกาศว่า "รองรับการทำงานแบบ Offline-First Sync" เป็นคุณสมบัติหลัก

### 7.3 ด้าน ค — ความไม่สอดคล้องของสัญญา (เรียงตามความรุนแรง)

> **สถานะ ณ 2026-10-28: แก้ครบแล้ว 20/22 ข้อ** — ตารางนี้เก็บไว้เป็นบันทึกการวิเคราะห์ตั้งต้น (line number อ้างอิงโค้ดก่อนแก้) ดูสถานะจริงที่ **7.5**

| # | ระดับ | ปัญหา | หลักฐาน |
|---|---|---|---|
| **ค-1** | 🔴 **สูง** | `meta` ผิดโครงสร้าง — หน้าบ้านประกาศแบน `{page,pageSize,totalItems,totalPages}` แต่ของจริงซ้อนใต้ `meta.pagination` | `src/types/auth.ts:11-16` vs `ResponseMeta`/`PaginationMeta` |
| **ค-2** | 🔴 **สูง** | `UserProfile` ใช้ `fullName` แต่สเปกใช้ `name` | `src/types/auth.ts:26` vs `UserProfileResponse` |
| **ค-3** | 🔴 **สูง** | `AuthResponse` ใช้ `expiresIn` (วินาที) แต่สเปกใช้ `expiresAt` (timestamp) | `src/types/auth.ts:62` vs `AuthResponse` |
| **ค-4** | 🔴 **สูง** | `details[].issue` แต่สเปกใช้ `details[].message` | `src/types/auth.ts:17-20` vs `ErrorDetail` |
| **ค-5** | 🟠 กลาง | `AdjustStockRequest.type` หน้าบ้านประกาศ 6 ค่า (`IN`,`OUT`,`ADJUST`,`AUDIT`,`DAMAGE`,`EXPIRED`) แต่สเปกมี **10 ค่า** ขาด `TRANSFER`, `SALE`, `RETURN`, `BAD_STOCK` | `src/types/inventory.ts:81-87` vs `AdjustStockRequest` |
| **ค-6** | 🟠 กลาง | `adjustStock` ส่ง `branchId` **ซ้ำสองที่** — ทั้ง query (`?branchId=`) และ body | `src/services/inventory.service.ts:36-43` |
| **ค-7** | 🟠 กลาง | `PurchaseOrder` ใช้ `poNumber` / `totalAmount` แต่สเปกใช้ `poNo` / `grandTotal` + `subtotal` | `src/types/procurement.ts:51,58` vs `PurchaseOrderResponse` |
| **ค-8** | 🟠 กลาง | `GoodsReceipt` ใช้ `receiptNumber` แต่สเปกใช้ `receiptNo` | `src/types/procurement.ts:148` vs `GoodsReceiptResponse` |
| **ค-9** | 🟠 กลาง | `GoodsReceiptLine` ใช้ `lotNumber` แต่สเปกใช้ `batchCode` | `src/types/procurement.ts:141` vs `CreateGoodsReceiptLineRequest` |
| **ค-10** | 🟠 กลาง | `CustomerSummary` มี `code` / `availableCredit` ที่สเปกไม่มี และขาด `isMember`, `points`, `creditStatus`, `email`, `branchId` | `src/types/customer.ts:9-18` vs `CustomerResponse` |
| **ค-11** | 🟠 กลาง | `SaleLineResponse` หน้าบ้านใช้ `productName`,`uomName`,`quantity`,`lineTotal` แต่สเปกใช้ `product` (object), `qty`, `grossTotal`,`netTotal`,`taxAmount` | `src/types/sale.ts:53-62` vs `SaleLineResponse` |
| **ค-12** | 🟠 กลาง | `SaleResponse` หน้าบ้านขาด `subTotal`, `vatAmount`, `version`, `note`, `occurredAt` | `src/types/sale.ts:79-94` vs `SaleResponse` |
| **ค-13** | 🟡 ต่ำ | `Product` หน้าบ้านมี `imageTimestamp` ที่สเปกไม่มี (เป็น field ฝั่ง client) และขาด `version` | `src/types/catalog.ts:81` vs `ProductResponse` |
| **ค-14** | 🟡 ต่ำ | `Tax` หน้าบ้านมี `code` ที่สเปกไม่มี และขาด `isIncludeInPrice` | `src/types/catalog.ts:48-54` vs `TaxResponse` |
| **ค-15** | 🟡 ต่ำ | `Uom` หน้าบ้านใช้ `name` เดี่ยว แต่สเปกแยก `nameTh` / `nameEn` + `category` | `src/types/catalog.ts:40-45` vs `UomResponse` |
| **ค-16** | 🟡 ต่ำ | `Branch` หน้าบ้านขาด `businessDayStart`, `createdAt`, `updatedAt` | `src/types/auth.ts:36-43` vs `BranchResponse` |
| **ค-17** | 🟡 ต่ำ | `InventoryValuationResponse` หน้าบ้านใช้ `totalSkus`/`totalValuation` แต่สเปกใช้ `totalItems`/`totalCostValue`/`totalSaleValue` | `src/types/inventory.ts:104-108` vs `ValuationResponse` |
| **ค-18** | 🟡 ต่ำ | `QRStatusResponse` หน้าบ้านคาด `{qrRef, amount, status, paidAt}` แต่สเปกประกาศ `data` เป็น `object` ลอย ๆ | `src/types/payment.ts:27-32` vs `/payments/{ref}/status` |
| **ค-19** | 🟡 ต่ำ | `customerService.searchCustomers` ตรึง `pageSize: 20` ไม่เปิดให้ปรับ | `src/services/customer.service.ts:26` |
| **ค-20** | 🟡 ต่ำ | `catalogService` รับทั้ง `categoryId`/`category_id` และ `isActive`/`is_active` คู่ขนาน — สเปกมีทั้งคู่จริง แต่ควรเลือกใช้ชุดเดียว (แนะนำ camelCase) | `src/services/catalog.service.ts:91-93` |
| **ค-21** | 🟡 ต่ำ | `shiftService.getActiveShift` ดัก `code === 404 \|\| 4040` เป็น "ไม่มีกะ" แต่สเปกประกาศแค่ 200 — ไม่มี 404 ในสเปก | `src/services/shift.service.ts:21` vs `/shifts/active` responses |
| **ค-22** | 🟡 ต่ำ | `uploadProductImage` เรียก `fetch` ตรง ไม่ผ่าน `request()` จึง**ไม่มี** silent refresh, ไม่มี timeout, ไม่มี overlay | `src/services/catalog.service.ts:183-187` |

### 7.4 สรุปสิ่งที่ต้องแก้ก่อน

**ต้องแก้ทันที (ค-1 ถึง ค-4)** — เป็น field ที่อ่านค่าผิดเงียบ ๆ ไม่ throw error ทำให้ debug ยาก:

1. `ApiResponse.meta` → เปลี่ยนเป็น `{ pagination?: PaginationMeta; hasMore?: boolean; nextCursor?: string; extra?: object }`
2. `UserProfile.fullName` → `name`
3. `AuthResponse.expiresIn` → `expiresAt`
4. `details[].issue` → `details[].message`

**ต้องแก้ก่อนใช้งานจริง (ค-5 ถึง ค-12)** — ทำให้ส่ง payload ผิดหรืออ่าน response ไม่ครบ

**ควรแก้เมื่อมีเวลา (ค-13 ถึง ค-22)** — ชื่อฟิลด์ไม่ตรงแต่ยังทำงานได้เพราะ optional

### 7.5 สถานะการแก้ไข (อัปเดต 2026-10-28)

แก้ครบทั้ง 22 ข้อแล้ว ยกเว้น 2 ข้อที่เป็นการตัดสินใจเชิงออกแบบ ไม่ใช่บั๊ก

| # | สถานะ | สิ่งที่ทำ |
|---|---|---|
| ค-1 | ✅ แก้แล้ว | `ResponseMeta` + `PaginationMeta` แยก type, `meta.pagination.*` — แก้ call site 5 จุด (`catalog/page.tsx`, `pos/page.tsx`, `inventory/page.tsx` ×2, `ProductSelectModal.tsx` ×2) |
| ค-2 | ✅ แก้แล้ว | `UserProfile.name` — แก้ `pos/page.tsx` ×2, `AppHeader.tsx` ×2 |
| ค-3 | ✅ แก้แล้ว | `AuthResponse.expiresAt: string` (ลบ `expiresIn`, `tokenType`) |
| ค-4 | ✅ แก้แล้ว | `ErrorDetail.message` — แก้ `StockAdjustmentModal.tsx` |
| ค-5 | ✅ แก้แล้ว | `StockAdjustmentType` ครบ 10 ค่า |
| ค-6 | ✅ แก้แล้ว | `adjustStock` ส่ง `branchId` ทาง query อย่างเดียว |
| ค-7 | ✅ แก้แล้ว | `poNo` / `subtotal` / `grandTotal` + `branchName`, `createdBy` |
| ค-8 | ✅ แก้แล้ว | `receiptNo` + `branchName`, `purchaseOrderNo`, `receivedBy`, `grandTotal`, `updatedAt` |
| ค-9 | ✅ แก้แล้ว | `batchCode` ทั้ง type และฟอร์ม `CreateGoodsReceiptModal` |
| ค-10 | ✅ แก้แล้ว | `code` เป็น optional, ลบ `availableCredit` ออกและเพิ่ม `getAvailableCredit()` คำนวณจาก `creditLimit - outstandingBalance`, เพิ่ม `isMember`/`points`/`creditStatus`/`email`/`branchId` |
| ค-11 | ✅ แก้แล้ว | `SaleLineResponse` ตามสเปก (`product` object, `qty`, `grossTotal`/`netTotal`/`taxAmount`) |
| ค-12 | ✅ แก้แล้ว | เพิ่ม `subTotal`, `vatAmount`, `note`, `occurredAt`, `version` |
| ค-13 | ✅ แก้แล้ว | เพิ่ม `version`; คง `imageTimestamp` ไว้เป็น field ฝั่ง client (คอมเมนต์กำกับแล้ว) |
| ค-14 | ✅ แก้แล้ว | `Tax.code` เป็น optional + เพิ่ม `isIncludeInPrice` |
| ค-15 | ✅ แก้แล้ว | `Uom` มี `nameTh`/`nameEn`/`category`; `metadata.service.getUoms()` normalize เป็น `name` ให้ UI ใช้ชื่อเดียวโดยไม่ต้องแก้ 20 call site |
| ค-16 | ✅ แก้แล้ว | `Branch` เพิ่ม `businessDayStart`, `createdAt`, `updatedAt` |
| ค-17 | ✅ แก้แล้ว | `totalItems` / `totalCostValue` / `totalSaleValue` — แก้ `inventory/page.tsx` |
| ค-18 | ⚠️ คงไว้ | สเปกไม่ประกาศ DTO ให้ — คงโครงเดิมและคอมเมนต์ว่า "ต้องยืนยันกับ backend" (ข้อ 9.5) |
| ค-19 | ✅ แก้แล้ว | `searchCustomers` รับ `{ isMember, page, pageSize }` |
| ค-20 | ⚠️ คงไว้ | รับทั้ง camelCase และ snake_case ตามที่สเปกมีทั้งคู่ — ไม่ใช่บั๊ก |
| ค-21 | ✅ แก้แล้ว | เพิ่ม `ApiError.status` (HTTP status จริง) แล้วดักทั้ง `status === 404` และ `code === 404/4040` |
| ค-22 | ✅ แก้แล้ว | `uploadProductImage` ผ่าน `api.post` เต็มรูปแบบ (ได้ silent refresh + timeout 60s + overlay) และเพิ่ม `uploadImage` สำหรับ `POST /uploads/images` |

**เพิ่มเติมนอกเหนือจาก 22 ข้อ:**

- `FileUploadResponse` type ใหม่ + `catalogService.uploadImage()` — ครอบ operation `POST /uploads/images` ที่เดิมไม่มี service รองรับ
- `ApiError.status` — แยก HTTP status ออกจาก `code` ของ envelope ทำให้แยก 404/401 ได้แม่นขึ้น

**ผลตรวจหลังแก้:** `npx tsc --noEmit` → 0 error · `npx eslint src` → 0 error, 2 warning เดิม (`no-img-element` ใน `PosCartItemRow.tsx`, `PosProductGrid.tsx` — ไม่เกี่ยวกับงานนี้) · `npx next build` → compiled successfully, 9/9 static pages, 7 routes (`/`, `/catalog`, `/dashboard`, `/inventory`, `/login`, `/pos`, `/_not-found`)

---

## 8. ตาราง Mapping — service file ↔ endpoint ↔ บรรทัด

### 8.1 ไฟล์ที่มีอยู่และ endpoint ที่เรียก

| Service file | Method | Endpoint | บรรทัด |
|---|---|---|---|
| `src/services/api.ts` | POST | `/auth/refresh` (ใน `performTokenRefresh`) | 90 |
| `src/services/auth.service.ts` | POST | `/auth/login` | 16 |
| | POST | `/auth/pin-login` | 27 |
| | GET | `/auth/me` | 37 |
| | GET | `/branches` | 45 |
| | POST | `/auth/refresh` | 55 |
| | POST | `/auth/logout` | 66 |
| `src/services/catalog.service.ts` | GET | `/categories` | 29 |
| | GET | `/categories/{id}` | 43 |
| | POST | `/categories` | 50 |
| | PUT | `/categories/{id}` | 60 |
| | DELETE | `/categories/{id}` | 70 |
| | GET | `/products` | 86 |
| | GET | `/products/{id}` | 104 |
| | GET | `/products/lookup/{code}` | 111 |
| | GET | `/products/sku?sku=` | 119 |
| | POST | `/products` | 132 |
| | PUT | `/products/{id}` | 142 |
| | DELETE | `/products/{id}` | 152 |
| | POST | `/products/{id}/internal-barcode` | 162 |
| | POST | `/products/{id}/image` (fetch ตรง) | 183 |
| `src/services/product.service.ts` | — | re-export `catalogService` | 10 |
| `src/services/customer.service.ts` | GET | `/customers` | 20 |
| | GET | `/customers/{id}` | 35 |
| `src/services/inventory.service.ts` | GET | `/inventory/stocks` | 17 |
| | POST | `/inventory/adjust` | 36 |
| | GET | `/reports/inventory-valuation` | 54 |
| `src/services/metadata.service.ts` | GET | `/taxes` | 16 |
| | GET | `/uoms` | 23 |
| `src/services/payments.service.ts` | POST | `/payments/qr` | 17 |
| | GET | `/payments/{ref}/status` | 28 |
| `src/services/procurement.service.ts` | GET | `/suppliers` | 39 |
| | GET | `/suppliers/{id}` | 50 |
| | GET | `/purchase-orders` | 74 |
| | GET | `/purchase-orders/{id}` | 87 |
| | POST | `/purchase-orders` | 104 |
| | PUT | `/purchase-orders/{id}` | 122 |
| | POST | `/purchase-orders/{id}/confirm` | 133 |
| | POST | `/purchase-orders/{id}/cancel` | 145 |
| | POST | `/purchase-orders/{id}/close` | 159 |
| | GET | `/purchase-orders/{id}/receipt-preview` | 173 |
| | GET | `/goods-receipts` | 201 |
| | GET | `/goods-receipts/{id}` | 214 |
| | POST | `/goods-receipts` | 234 |
| | POST | `/goods-receipts/{id}/complete` | 245 |
| | POST | `/goods-receipts/{id}/cancel` | 257 |
| `src/services/sales.service.ts` | POST | `/sales` (+ header `Idempotency-Key`) | 26 |
| | GET | `/sales/{id}` | 39 |
| `src/services/shift.service.ts` | GET | `/shifts/active` | 16 |
| | POST | `/shifts/open` | 36 |
| | POST | `/shifts/{id}/close` | 43 |

**สรุป: 12 service files เรียก 49 operations จาก 81 (60%)**

### 8.2 Operations ที่ไม่มี service รองรับ (32 + 1 ซ้ำ)

| # | Method | Path | หมายเหตุ |
|---|---|---|---|
| 1 | GET | `/health` | ไม่มี health check ฝั่งหน้าบ้าน |
| 2 | POST | `/customers` | เปิดบัญชีเงินเชื่อ |
| 3 | PUT | `/customers/{id}` | แก้ข้อมูลลูกค้า |
| 4 | DELETE | `/customers/{id}` | ลบลูกค้า |
| 5 | PUT | `/customers/{id}/credit-limit` | ตั้งวงเงิน |
| 6 | POST | `/customers/{id}/pay-credit` | รับชำระหนี้ |
| 7 | GET | `/customers/reports/ar-aging` | รายงาน aging |
| 8 | POST | `/suppliers` | เพิ่มผู้จำหน่าย |
| 9 | PUT | `/suppliers/{id}` | แก้ผู้จำหน่าย |
| 10 | DELETE | `/suppliers/{id}` | ลบผู้จำหน่าย |
| 11 | GET | `/products/barcode/{barcode}` | สแกนแบบได้น้ำหนัก/ราคา |
| 12 | GET | `/products/lookup` | prefix search (query form) |
| 13 | GET | `/products/sku/{sku}` | prefix search (path form) |
| 14 | POST | `/uploads/images` | อัปโหลดรูปทั่วไป |
| 15 | POST | `/inventory/transfers` | สร้างใบโอน |
| 16 | POST | `/inventory/transfers/{id}/receive` | รับโอน |
| 17 | GET | `/sales` | ประวัติการขาย |
| 18 | POST | `/sales/{id}/void` | ยกเลิกบิล |
| 19 | POST | `/returns` | คืนสินค้า/คืนเงิน |
| 20 | GET | `/receipts/{receiptNo}` | พิมพ์ใบเสร็จซ้ำ |
| 21 | GET | `/reports/sales-summary` | สรุปยอดขาย |
| 22 | GET | `/reports/best-sellers` | สินค้าขายดี |
| 23 | GET | `/sync/changes` | pull delta |
| 24 | POST | `/sync/batch` | push batch |
| 25 | GET | `/users` | รายชื่อผู้ใช้ |
| 26 | POST | `/users` | สร้างผู้ใช้ |
| 27 | GET | `/users/{id}` | ดูผู้ใช้ |
| 28 | PUT | `/users/{id}` | แก้ผู้ใช้ |
| 29 | DELETE | `/users/{id}` | ลบผู้ใช้ |
| 30 | POST | `/users/{id}/reset-password` | รีเซ็ตรหัสผ่าน |
| 31 | POST | `/users/{id}/reset-pin` | รีเซ็ต PIN |
| 32 | POST | `/users/{id}/unlock` | ปลดล็อกบัญชี |
| 33 | GET | `/products/lookup/{code}` | (มี service แล้ว — นับซ้ำไม่ได้) |

> รายการข้างบน 33 บรรทัด มี #33 (`GET /products/lookup/{code}`) ซ้ำกับที่มี service รองรับแล้ว จึงเป็น **32 operations ที่ขาดจริง** (81 − 49 = 32)

---

## 9. สิ่งที่สเปกไม่ระบุ — ต้องยืนยันกับ backend

ห้ามเดา ให้ถามก่อนเขียน logic:

1. **สูตรคำนวณยอดบิล** — `subTotal`, `vatAmount`, `billDiscount`, `grandTotal` เรียงลำดับอย่างไร (หักส่วนลดก่อนหรือหลัง VAT)
2. **เกณฑ์ `PARTIALLY_RECEIVED` → `COMPLETED`** — เทียบจากผลรวม `receivedQuantity` ทุก line หรือตาม `orderedQuantity` ต่อ line
3. **ลำดับการตัดสต็อกตอน `POST /sales`** — ตัดก่อนตรวจเครดิตหรือหลัง, และถ้าตัดแล้วเครดิตไม่พอจะ rollback ไหม
4. **`/shifts/active` เมื่อไม่มีกะเปิด** — คืน `data: null` หรือ 404 (สเปกประกาศแค่ 200) — หน้าบ้านรองรับทั้งสองทางแล้ว แต่ควรรู้ว่าอันไหนคือพฤติกรรมจริง
5. **`/payments/{ref}/status` โครงสร้าง `data`** — สเปกประกาศเป็น `object` ลอย ไม่มี DTO
6. **`/products/{id}/internal-barcode` โครงสร้าง `data`** — เช่นกัน เป็น `object` ลอย
7. **`/purchase-orders/{id}/confirm|cancel|close` โครงสร้าง `data`** — `object` ลอยทั้งสาม
8. **`/goods-receipts/{id}/cancel` โครงสร้าง `data`** — `object` ลอย
9. **`/suppliers/{id}` DELETE เงื่อนไข 403** — เกิดเมื่อมี PO อ้างอิงอยู่หรือไม่
10. **`/users/*` การจำกัดสิทธิ์ตาม role** — 403 เกิดกับ role ใดบ้าง
11. **`TaxResponse.rate`** — ยืนยันว่าเป็นเศษส่วน (0.07) ไม่ใช่เปอร์เซ็นต์ (7)
12. **`/sync/changes` `batchSize` default และ max** — สเปกไม่ระบุ
13. **`/sales` `status` ที่เป็นไปได้** — สเปกประกาศ `string` ไม่มี enum (หน้าบ้านเดาเป็น `COMPLETED`/`VOIDED`)

---

## 10. ข้อสังเกตเพิ่มเติม

- **`docs/swagger.json` และ `docs/api-summary.md` ล้าสมัย** — ควรแทนที่ด้วยสำเนาใหม่จาก `/swagger/doc.json` หรือลบออกเพื่อกันคนอ่านผิด
- **`/products/lookup` กับ `/products/lookup/{code}` ให้ผลเหมือนกัน** — ต่างกันแค่ตำแหน่งพารามิเตอร์ (query vs path) เช่นเดียวกับ `/products/sku` และ `/products/sku/{sku}` เป็นการออกแบบซ้ำซ้อน ควรเลือกใช้ชุดเดียว
- **`/customers` GET ประกาศ `isMember` filter** แต่ `CustomerResponse` มี `points` และ `isMember` — ระบบมีกลไกสมาชิก/สะสมแต้มที่หน้าบ้านยังไม่รองรับ
- **`/suppliers` มี `creditDays`** — มีแนวคิดเครดิตเทอมผู้ขายที่หน้าบ้านยังไม่ใช้
- **`/branches` มี `businessDayStart`** — รองรับสาขาที่วันธุรกิจไม่ตรงเที่ยงคืน หน้าบ้านยังไม่ใช้ (สำคัญต่อรายงานที่ตัดตามวัน)
- **`SyncSaleDTO` มีฟิลด์ซ้ำ** — `subTotal`/`subtotal`, `lines`/`items`, `discount`/`billDiscount`, `grandTotal`/`total` สะท้อนการออกแบบที่ยังไม่นิ่ง ควรถาม backend ว่าตัวไหน canonical

---

*จัดทำ 2026-10-28 · อ้างอิงจาก `http://localhost:8080/swagger/doc.json` (v1.2.0, 62 paths / 81 operations / 95 definitions) และ source code `ice-pos-web` ณ วันเดียวกัน*
