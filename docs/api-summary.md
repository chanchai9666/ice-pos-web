# สรุปข้อมูลระบบ ICE POS API (API Specification Summary)

เอกสารฉบับนี้จัดทำขึ้นเพื่อเป็นข้อมูลอ้างอิงกลางในการพัฒนาส่วนหน้าบ้าน (Frontend) ของโปรเจกต์ `ice-pos-web` โดยสรุปโครงสร้างจากเอกสาร Swagger ของระบบ ICE POS Backend API

---

## 1. ข้อมูลทั่วไปของ API (API Overview)

- **ชื่อระบบ**: ICE POS API - ระบบจัดการขายหน้าร้านและคลังสินค้า (POS & Inventory)
- **เวอร์ชัน**: 1.2.0
- **คำอธิบาย**: ระบบ Backend API สำหรับระบบขายหน้าร้าน (Point of Sale), จัดการคลังและสต็อกสินค้า, บัญชีลูกหนี้เงินเชื่อ, รายงานสรุปยอดขาย และรองรับการทำงานแบบ Offline-First Sync พัฒนาด้วย Go Fiber v3 Clean Architecture
- **Host**: `http://127.0.0.1:8080`
- **Base Path**: `/api/v1`
- **Swagger Documentation URL**: `http://127.0.0.1:8080/docs#/`
- **Swagger Schema (JSON)**: `http://127.0.0.1:8080/swagger/doc.json` (บันทึกสำเนาไว้ที่ [docs/swagger.json](file:///Users/chanchai/workshop/CODE/ice-pos-web/docs/swagger.json))
- **Consumes / Produces**: `application/json`

---

## 2. การยืนยันตัวตนและความปลอดภัย (Authentication & Security)

ระบบใช้ **JWT (JSON Web Token)** ในการรักษาความปลอดภัย:
- **Header**: `Authorization: Bearer <accessToken>`
- สำหรับ Endpoint สาธารณะ (ไม่ต้องใช้ Token):
  - `POST /api/v1/auth/login` (เข้าสู่ระบบด้วย Username/Password)
  - `POST /api/v1/auth/pin-login` (เข้าสู่ระบบแคชเชียร์ด่วนด้วย PIN + สาขา)
  - `POST /api/v1/auth/refresh` (ขอต่ออายุ Token)
  - `GET /api/v1/health` (Health Check)
  - `GET /api/v1/branches` (ดึงรายชื่อสาขาสำหรับหน้า Login/PIN)
- Endpoint อื่นๆ ทั้งหมดต้องแนบ `Authorization: Bearer <accessToken>` ใน Header เสมอ

---

## 3. รูปแบบ Response กลางของระบบ (Standard API Response Format)

### 3.1 กรณีทำงานสำเร็จ (Success Response)
HTTP Status: `200 OK`, `201 Created`
```json
{
  "code": 0,
  "message": "ok",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPage": 5
  }
}
```

### 3.2 กรณีเกิดข้อผิดพลาด (Error Response)
HTTP Status: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Internal Server Error`
```json
{
  "code": 4000,
  "message": "ข้อความอธิบายข้อผิดพลาด",
  "data": null,
  "details": [
    {
      "field": "username",
      "issue": "is required"
    }
  ]
}
```

---

## 4. สรุปสาระสำคัญตามโมดูลหลัก (Core Functional Modules)

| ลำดับ | โมดูล (Module) | จำนวน Endpoints | รายละเอียดหน้าที่หลัก |
| :---: | :--- | :---: | :--- |
| 1 | **ระบบยืนยันตัวตน (Authentication)** | 5 | Login ผ่าน Username/Password, Quick PIN Login สำหรับแคชเชียร์, Refresh Token, ดึง Profile และสาขา |
| 2 | **จัดการสมาชิกและผู้ใช้งาน (User Management)** | 8 | จัดการผู้ใช้งานพนักงาน (CRUD), รีเซ็ตรหัสผ่าน, รีเซ็ต PIN ด่วน, ปลดล็อกบัญชี |
| 3 | **จัดการสินค้าและหมวดหมู่ (Product Catalog)** | 15 | จัดการหมวดหมู่สินค้า, รายการสินค้า, สแกน Barcode/SKU lookup, อัปโหลดรูปภาพสินค้าแปลงเป็น WebP, เจนเนอเรตบาร์โค้ดภายใน |
| 4 | **ข้อมูลตั้งค่าพื้นฐานสินค้า (Catalog Metadata)** | 2 | รายการอัตราภาษี (Tax Rates), รายการหน่วยนับ (UOMs) |
| 5 | **ลูกค้าและบัญชีเงินเชื่อ (Customers & Credit)** | 8 | ทะเบียนลูกค้า, ยอดค้างชำระ, ปรับวงเงินเครดิต, บันทึกการรับชำระหนี้, รายงาน AR Aging |
| 6 | **จัดซื้อและซัพพลายเออร์ (Suppliers, PO, Goods Receipt)** | 21 | จัดการคู่ค้า (Suppliers), ใบสั่งซื้อสินค้า (PO), ยืนยัน/ปิด PO, ใบตรวจรับสินค้าเข้าคลัง (Goods Receipts) |
| 7 | **คลังและสต็อกสินค้า (Inventory & Stock)** | 4 | ดูยอดสต็อกคงเหลือ, ปรับยอดสต็อก (Stock Adjustment), โอนย้ายสินค้าระหว่างสาขา (Stock Transfer) |
| 8 | **กะการทำงานและลิ้นชักเงินสด (Shifts & Cash Drawer)** | 3 | ตรวจสอบกะขายปัจจุบัน (Active Shift), เปิดกะพร้อมระบุเงินทอนเริ่มต้น, ปิดกะและกระทบยอดเงินสด |
| 9 | **การขายและชำระเงิน (Sales & Checkout)** | 4 | สร้างบิลขายสินค้า (Checkout) รองรับหลายวิธีชำระ, ประวัติบิลขาย, รายละเอียดบิล, ขอยกเลิกบิล (Void) |
| 10 | **การรับคืนสินค้าและคืนเงิน (Returns & Refunds)** | 1 | รับคืนสินค้าและคืนเงินพร้อมระบุสาเหตุและปรับสต็อก |
| 11 | **ใบเสร็จรับเงิน (Receipts)** | 1 | ดึงข้อมูลใบเสร็จรับเงินสำหรับพิมพ์ซ้ำ (Reprint Receipt) |
| 12 | **การชำระเงินและพร้อมเพย์ (Payments & QR PromptPay)** | 2 | สร้าง QR Code พร้อมเพย์, ตรวจสอบสถานะการชำระเงิน |
| 13 | **รายงานและการวิเคราะห์ (Reports & Analytics)** | 3 | สรุปยอดขาย กำไรขั้นต้น และภาษี, รายงานสินค้าขายดี, รายงานมูลค่าสินค้าคงเหลือ |
| 14 | **การเชื่อมต่อออฟไลน์ (Offline Synchronization)** | 2 | อัปโหลดบิลและสต็อกที่ทำขณะออฟไลน์ (Push Batch), ดึงข้อมูลเปลี่ยนแปลงลงเครื่อง POS (Delta Sync) |

---

## 5. รายการ Endpoint ทั้งหมดแยกตามกลุ่มงาน (Complete Endpoint Directory)


### 00. ระบบ (System & Health) (1 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | ตรวจสอบสถานะการทำงานของระบบ (Health Check) | - |

### 01. ระบบยืนยันตัวตน (Authentication) (5 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | เข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน (Username/Password Login) | request (body, required) |
| `GET` | `/api/v1/auth/me` | ดึงข้อมูลโปรไฟล์ผู้ใช้งานปัจจุบัน (Current User Profile) | - |
| `POST` | `/api/v1/auth/pin-login` | เข้าสู่ระบบแคชเชียร์หน้าร้านด้วยรหัส PIN (PIN Login) | request (body, required) |
| `POST` | `/api/v1/auth/refresh` | ขอต่ออายุ Access Token (Refresh Token) | request (body, required) |
| `GET` | `/api/v1/branches` | ดูรายชื่อสาขาทั้งหมด (List Branches) | - |

### 02. จัดการสินค้าและหมวดหมู่ (Product Catalog) (15 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | ดูรายการหมวดหมู่สินค้าทั้งหมด (List All Categories) | page (query)<br/>pageSize (query) |
| `POST` | `/api/v1/categories` | สร้างหมวดหมู่สินค้าใหม่ (Create Category) | request (body, required) |
| `GET` | `/api/v1/categories/{id}` | ดึงข้อมูลหมวดหมู่สินค้าตาม ID (Get Category By ID) | id (path, required) |
| `PUT` | `/api/v1/categories/{id}` | แก้ไขข้อมูลหมวดหมู่สินค้า (Update Category) | id (path, required)<br/>request (body, required) |
| `DELETE` | `/api/v1/categories/{id}` | ลบหมวดหมู่สินค้า (Delete Category) | id (path, required) |
| `GET` | `/api/v1/products` | ค้นหาและดูรายการสินค้า (List Products with Pagination & Filter) | categoryId (query)<br/>category_id (query)<br/>barcode (query)<br/>search (query)<br/>isActive (query)<br/>is_active (query)<br/>page (query)<br/>pageSize (query) |
| `POST` | `/api/v1/products` | สร้างสินค้าใหม่ (Create Product) | request (body, required) |
| `GET` | `/api/v1/products/barcode/{barcode}` | สแกนหรือค้นหาสินค้าด้วย Barcode (Scan / Search Product by Barcode) | barcode (path, required) |
| `GET` | `/api/v1/products/lookup/{code}` | ค้นหาสินค้าด่วนด้วย SKU หรือบาร์โค้ด (Lookup Product by Code) | code (path, required) |
| `GET` | `/api/v1/products/{id}` | ดึงข้อมูลสินค้าตาม ID (Get Product By ID) | id (path, required) |
| `PUT` | `/api/v1/products/{id}` | แก้ไขข้อมูลสินค้า (Update Product) | id (path, required)<br/>request (body, required) |
| `DELETE` | `/api/v1/products/{id}` | ลบสินค้า (Delete Product) | id (path, required) |
| `POST` | `/api/v1/products/{id}/image` | อัปโหลดรูปภาพสินค้าโดยตรงพร้อมปรับขนาดและแปลงเป็น WebP (Upload, Resize & Convert Product Image) | id (path, required)<br/>file (formData, required) |
| `POST` | `/api/v1/products/{id}/internal-barcode` | สร้างบาร์โค้ดภายในร้านอัตโนมัติ (Generate Internal Barcode) | id (path, required) |
| `POST` | `/api/v1/uploads/images` | อัปโหลดรูปภาพพร้อมปรับขนาดและแปลงเป็น WebP (Upload, Resize & Convert to WebP) | file (formData, required) |

### 02. ระบบจัดการสมาชิกและผู้ใช้งาน (User Management) (8 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | ดึงรายชื่อพนักงานทั้งหมด (List Staff Users) | branchId (query)<br/>role (query)<br/>isActive (query)<br/>search (query) |
| `POST` | `/api/v1/users` | สร้างบัญชีผู้ใช้งานใหม่ (Create Staff User) | request (body, required) |
| `GET` | `/api/v1/users/{id}` | ดึงข้อมูลพนักงานตาม ID (Get User By ID) | id (path, required) |
| `PUT` | `/api/v1/users/{id}` | แก้ไขข้อมูลพนักงาน (Update Staff User) | id (path, required)<br/>request (body, required) |
| `DELETE` | `/api/v1/users/{id}` | ระงับการใช้งานบัญชีพนักงาน (Deactivate Staff User / Soft Delete) | id (path, required) |
| `POST` | `/api/v1/users/{id}/reset-password` | รีเซ็ตรหัสผ่านพนักงาน (Reset Staff Password) | id (path, required)<br/>request (body, required) |
| `POST` | `/api/v1/users/{id}/reset-pin` | รีเซ็ต PIN เข้าใช้งานด่วน (Reset Quick-Login PIN) | id (path, required)<br/>request (body, required) |
| `POST` | `/api/v1/users/{id}/unlock` | ปลดล็อกบัญชีพนักงาน (Unlock Staff Account) | id (path, required) |

### 03. ข้อมูลตั้งค่าพื้นฐานสินค้า (Catalog Metadata) (2 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/taxes` | ดูรายการอัตราภาษีทั้งหมด (List Tax Rates) | - |
| `GET` | `/api/v1/uoms` | ดูรายการหน่วยนับทั้งหมด (List All UOMs) | - |

### 04. ลูกค้าและบัญชีเงินเชื่อ (Customers & Credit) (8 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/customers` | ดูรายการลูกค้าและยอดค้างชำระ (List Customers & Balances) | branchId (query)<br/>search (query)<br/>isMember (query)<br/>page (query)<br/>pageSize (query) |
| `POST` | `/api/v1/customers` | ลงทะเบียนลูกค้าใหม่และเปิดบัญชีเงินเชื่อ (Create Customer & Credit Account) | request (body, required) |
| `GET` | `/api/v1/customers/reports/ar-aging` | รายงานลูกหนี้ค้างชำระตามอายุหนี้ (AR Aging Report) | branchId (query) |
| `GET` | `/api/v1/customers/{id}` | ดูรายละเอียดข้อมูลลูกค้า (Get Customer By ID) | id (path, required) |
| `PUT` | `/api/v1/customers/{id}` | แก้ไขข้อมูลลูกค้า (Update Customer) | id (path, required)<br/>request (body, required) |
| `DELETE` | `/api/v1/customers/{id}` | ลบข้อมูลลูกค้า (Delete Customer) | id (path, required) |
| `PUT` | `/api/v1/customers/{id}/credit-limit` | กำหนดหรือปรับเปลี่ยนวงเงินเครดิตลูกค้า (Set Credit Limit) | id (path, required)<br/>request (body, required) |
| `POST` | `/api/v1/customers/{id}/pay-credit` | บันทึกการรับชำระหนี้จากลูกค้า (Record Debt Payment) | id (path, required)<br/>request (body, required) |

### 04.1 ผู้จัดจำหน่าย (Suppliers) (5 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/suppliers` | รายการผู้จัดจำหน่ายทั้งหมด (List Suppliers) | page (query)<br/>limit (query)<br/>search (query)<br/>isActive (query) |
| `POST` | `/api/v1/suppliers` | สร้างข้อมูลผู้จัดจำหน่าย/คู่ค้าใหม่ (Create Supplier) | request (body, required) |
| `GET` | `/api/v1/suppliers/{id}` | ดูรายละเอียดผู้จัดจำหน่าย (Get Supplier by ID) | id (path, required) |
| `PUT` | `/api/v1/suppliers/{id}` | แก้ไขข้อมูลผู้จัดจำหน่าย (Update Supplier) | id (path, required)<br/>request (body, required) |
| `DELETE` | `/api/v1/suppliers/{id}` | ลบ/ปิดการใช้งานผู้จัดจำหน่าย (Delete Supplier) | id (path, required) |

### 04.2 ใบสั่งซื้อสินค้า (Purchase Orders) (8 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/purchase-orders` | รายการใบสั่งซื้อสินค้าทั้งหมด (List Purchase Orders) | branchId (query)<br/>supplierId (query)<br/>status (query)<br/>startDate (query)<br/>endDate (query)<br/>search (query)<br/>page (query)<br/>limit (query) |
| `POST` | `/api/v1/purchase-orders` | สร้างใบสั่งซื้อสินค้าใหม่ (Create Purchase Order) | request (body, required) |
| `GET` | `/api/v1/purchase-orders/{id}` | ดูรายละเอียดใบสั่งซื้อสินค้า (Get Purchase Order by ID) | id (path, required) |
| `PUT` | `/api/v1/purchase-orders/{id}` | แก้ไขใบสั่งซื้อสินค้า (Update Purchase Order) | id (path, required)<br/>request (body, required) |
| `POST` | `/api/v1/purchase-orders/{id}/cancel` | ยกเลิกใบสั่งซื้อสินค้า (Cancel Purchase Order) | id (path, required) |
| `POST` | `/api/v1/purchase-orders/{id}/close` | บังคับปิดใบสั่งซื้อสินค้า (Force Close Purchase Order) | id (path, required) |
| `POST` | `/api/v1/purchase-orders/{id}/confirm` | ยืนยันการสั่งซื้อสินค้า (Confirm Purchase Order) | id (path, required) |
| `GET` | `/api/v1/purchase-orders/{id}/receipt-preview` | ดึงรายการสินค้าที่ยังค้างรับในใบสั่งซื้อ (Get Pending Items for Goods Receipt) | id (path, required) |

### 04.3 ตรวจรับสินค้าเข้าคลัง (Goods Receipts) (5 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/goods-receipts` | รายการใบตรวจรับสินค้าทั้งหมด (List Goods Receipts) | branchId (query)<br/>purchaseOrderId (query)<br/>supplierId (query)<br/>status (query)<br/>startDate (query)<br/>endDate (query)<br/>search (query)<br/>page (query)<br/>limit (query) |
| `POST` | `/api/v1/goods-receipts` | สร้างใบตรวจรับสินค้าเข้าคลัง (Create Goods Receipt) | request (body, required) |
| `GET` | `/api/v1/goods-receipts/{id}` | ดูรายละเอียดใบตรวจรับสินค้า (Get Goods Receipt by ID) | id (path, required) |
| `POST` | `/api/v1/goods-receipts/{id}/cancel` | ยกเลิกใบตรวจรับสินค้า (Cancel Goods Receipt) | id (path, required) |
| `POST` | `/api/v1/goods-receipts/{id}/complete` | ยืนยันการตรวจรับสินค้าเข้าคลัง (Complete Goods Receipt) | id (path, required) |

### 05. คลังและสต็อกสินค้า (Inventory & Stock) (4 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/inventory/adjust` | ปรับยอดสต็อกสินค้า (Adjust Stock) | branchId (query, required)<br/>request (body, required) |
| `GET` | `/api/v1/inventory/stocks` | ดูยอดสต็อกสินค้าคงเหลือ (List Stock Levels) | branchId (query)<br/>lowStockOnly (query)<br/>page (query)<br/>pageSize (query) |
| `POST` | `/api/v1/inventory/transfers` | สร้างใบโอนย้ายสินค้าระหว่างสาขา (Create Stock Transfer) | request (body, required) |
| `POST` | `/api/v1/inventory/transfers/{id}/receive` | รับสินค้าโอนย้ายเข้าสาขาปลายทาง (Receive Stock Transfer) | id (path, required) |

### 06. กะการทำงานและลิ้นชักเก็บเงิน (Shifts & Cash Drawer) (3 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/shifts/active` | ตรวจสอบกะขายที่กำลังเปิดใช้งาน (Get Active Shift) | branchId (query, required) |
| `POST` | `/api/v1/shifts/open` | เปิดกะการขาย (Open Shift) | request (body, required) |
| `POST` | `/api/v1/shifts/{id}/close` | ปิดกะการขายและกระทบยอดเงินสด (Close Shift) | id (path, required)<br/>request (body, required) |

### 07. รายการขายและชำระเงิน (Sales & Checkout) (4 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/sales` | ค้นหาและดูประวัติการขาย (List Sales History) | branchId (query)<br/>cashierId (query)<br/>customerId (query)<br/>status (query)<br/>startDate (query)<br/>endDate (query)<br/>page (query)<br/>pageSize (query) |
| `POST` | `/api/v1/sales` | บันทึกการขายสินค้า (Create Sale / Checkout) | Idempotency-Key (header)<br/>X-Device-Id (header)<br/>request (body, required) |
| `GET` | `/api/v1/sales/{id}` | ดูรายละเอียดบิลขายตาม ID (Get Sale By ID) | id (path, required) |
| `POST` | `/api/v1/sales/{id}/void` | ยกเลิกบิลขาย (Void Sale) | id (path, required)<br/>request (body, required) |

### 08. การรับคืนสินค้าและคืนเงิน (Returns & Refunds) (1 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/returns` | ทำรายการรับคืนสินค้าและคืนเงิน (Product Return & Refund) | request (body, required) |

### 09. ใบเสร็จรับเงิน (Receipts) (1 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/receipts/{receiptNo}` | ดึงข้อมูลใบเสร็จรับเงินสำหรับสั่งพิมพ์ (Reprint Receipt) | receiptNo (path, required) |

### 10. ช่องทางชำระเงินและพร้อมเพย์ (Payments & QR PromptPay) (2 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/qr` | สร้าง QR Code พร้อมเพย์สำหรับรับชำระเงิน (Generate QR PromptPay - Mock Service) | request (body, required) |
| `GET` | `/api/v1/payments/{ref}/status` | ตรวจสอบสถานะการชำระเงินผ่าน QR พร้อมเพย์ (Check QR Payment Status - Mock Service) | ref (path, required) |

### 11. รายงานและการวิเคราะห์ (Reports & Analytics) (3 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/best-sellers` | รายงานสินค้าขายดี (Best Selling Products Report) | branchId (query)<br/>startDate (query)<br/>endDate (query)<br/>limit (query) |
| `GET` | `/api/v1/reports/inventory-valuation` | รายงานมูลค่าสินค้าคงเหลือ (Inventory Valuation Report) | branchId (query) |
| `GET` | `/api/v1/reports/sales-summary` | รายงานสรุปยอดขาย กำไรขั้นต้น และภาษี (Sales Summary Report) | branchId (query)<br/>startDate (query)<br/>endDate (query) |

### 12. การเชื่อมต่อแบบออฟไลน์ (Offline Synchronization) (2 Endpoints)

| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/sync/batch` | อัปโหลดรายการขายและสต็อกที่ทำขณะออฟไลน์ (Offline Push Batch) | request (body, required) |
| `GET` | `/api/v1/sync/changes` | ดึงข้อมูลที่เปลี่ยนแปลงสำหรับเครื่อง POS ออฟไลน์ (Offline Delta Sync) | X-Device-Id (header)<br/>since (query)<br/>batchSize (query) |

---

## 6. แนวทางปฏิบัติสำหรับ Frontend ตามธรรมนูญโครงการ (Constitution Compliance)

1. **ห้ามทำการจำลองข้อมูล (Mock Data) ขึ้นเอง**:
   - การเชื่อมต่อส่วนหน้าบ้านต้องอ้างอิงโครงสร้าง Schema และ Endpoint จริงจากเอกสารฉบับนี้
   - หาก Endpoint หรือฟิลด์ข้อมูลที่ต้องการไม่มีในเอกสาร หรือไม่แน่ใจ ต้องหยุดและสอบถามเพื่อขอความชัดเจนก่อนเริ่มเขียนโค้ด
2. **การจัดการข้อผิดพลาด (Error Handling)**:
   - ตรวจสอบฟิลด์ `code`, `message`, และ `details` ของ Error Response เสมอเพื่อนำไปแสดงข้อความแจ้งเตือนที่เข้าใจง่ายเป็นภาษาไทย
3. **การรายงานและสรุปผลกระทบต่อ API (API Change Request)**:
   - หากการออกแบบหรือปรับปรุง UI ส่งผลให้ต้องการฟิลด์เพิ่มเติม หรือ Endpoint ใหม่ ต้องจัดทำเอกสารสรุปเป็นไฟล์ เช่น `docs/api-change-requests.md` ระบุสิ่งที่ต้องการอย่างละเอียด เพื่อส่งต่อให้ทีม Backend ดำเนินการ
