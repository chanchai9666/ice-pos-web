# Phase 2: Admin Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** พัฒนาหน้าจอหลักส่วนผู้ดูแลและผู้จัดการร้านตาม Navigation Bar ให้สมบูรณ์ ประกอบด้วยระบบจัดการลูกค้าและบัญชีเงินเชื่อ (`/customers`), ระบบรายงานสรุปยอดขายและการวิเคราะห์ (`/reports`), ระบบจัดการพนักงานและสิทธิ์ (`/users`), และระบบจัดการข้อมูลผู้จัดจำหน่าย (Suppliers CRUD ใน `/inventory`) โดยอ้างอิง API Backend จาก Swagger จริง 100% ปราศจาก Mock Data

**Architecture:** Next.js 16 (App Router) + TypeScript ตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, WCAG 2.1 AA Contrast) และ Constitution ข้อ 6.6 (Global Action Loading Overlay Coordinator) และข้อ 5.1 (Satang Currency Standard สำหรับยอดเงินทุกประเภท)

**Tech Stack:** Next.js 16.4, React 19, TypeScript 5, Tailwind CSS v4, Fetch API wrapper (`src/services/api.ts`)

**Spec:** [docs/api-implementation-status-and-roadmap.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/docs/api-implementation-status-and-roadmap.md), [docs/swagger.json](file:///Users/chanchai/workshop/CODE/ice-pos-web/docs/swagger.json), [.specify/memory/constitution.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/.specify/memory/constitution.md)

## Global Constraints

- ทุกจำนวนเงิน (วงเงินเครดิต, ยอดหนี้ค้าง, ยอดรับชำระหนี้, ยอดขาย, กำไร, ภาษี) ต้องเป็นหน่วย **สตางค์ (satang: integer)** เสมอ แปลงแสดงผลด้วย `formatSatangToBaht` และ `parseBahtToSatang` / `bahtToSatang`
- ใช้ข้อมูลจาก API จริงตาม `docs/swagger.json` ห้ามสร้างหรือจำลองข้อมูล Mock เองโดยเด็ดขาด (Constitution 5.1, 13)
- การเรียก API Action ทุกครั้งต้องส่ง `loadingMessage` เข้า API wrapper เพื่อแสดง Full Blocking Overlay ป้องกันการกดย้ำ (ยกเว้น Silent background polling)
- การเรียก `POST /customers/{id}/pay-credit` ต้องแนบ Header `Idempotency-Key: UUIDv4`
- ปุ่มกดและเป้าหมายสัมผัส (Touch Targets) ต้องมีขนาดไม่เล็กกว่า 48x48px และมีตัวหนังสือคมชัด ไม่ใช้ตัวอักษรสีเทาจาง (Elderly-Friendly & WCAG AA)
- การสื่อสารและคำอธิบาย UI เป็นภาษาไทย 100%

## Review Focus

1. **การคำนวณวงเงินคงเหลือของลูกค้า (Available Credit):** สเปก API ไม่ส่งฟิลด์ `availableCredit` มาให้ ต้องคำนวณจาก `creditLimit - outstandingBalance` ในหน่วยสตางค์เสมอ
2. **การรับชำระหนี้ (Debt Repayment Validation):** ยอดรับชำระหนี้ต้องไม่เกินยอดหนี้คงค้างปัจจุบัน และต้องบังคับเลือกวิธีชำระเงิน (CASH, QR_PROMPTPAY, CARD, WALLET)
3. **การป้องกันการลบผู้ใช้ตนเองหรือ Super Admin คนสุดท้าย:** ในหน้า `/users` ต้องมีกล่องยืนยันการระงับการใช้งาน (Soft Delete) และแจ้งเตือนอย่างชัดเจน
4. **ความแม่นยำของรายงานช่วงเวลา (Date Filtering in Reports):** ตัวเลือกช่วงเวลา (วันนี้, 7 วัน, เดือนนี้) ต้องแปลงเป็น ISO8601 ให้สอดคล้องกับ Query Parameters ของ API
5. **การแยกแท็บ Suppliers ใน Inventory:** แท็บผู้จัดจำหน่ายต้องไม่กระทบการทำงานของแท็บสต็อกสินค้า ใบสั่งซื้อ (PO) และใบตรวจรับ (GR) เดิม

---

### Task 1: Customer & Credit Management (`/customers`)

**Files:**
- Modify: `src/types/customer.ts` (เพิ่ม `CreateCustomerRequest`, `UpdateCustomerRequest`, `SetCreditLimitRequest`, `PayCreditRequest`, `CreditTransactionResponse`, `ARAgingItemResponse`)
- Modify: `src/services/customer.service.ts` (เพิ่ม `createCustomer`, `updateCustomer`, `deleteCustomer`, `setCreditLimit`, `payCredit`, `getARAgingReport`)
- Create: `src/components/customer/CustomerFormModal.tsx`
- Create: `src/components/customer/CreditLimitModal.tsx`
- Create: `src/components/customer/PayCreditModal.tsx`
- Create: `src/components/customer/ARAgingReportModal.tsx`
- Create: `src/app/(main)/customers/page.tsx`

**Interfaces:**
- Consumes: `api`, `request` from `src/services/api.ts`, `CustomerSummary` from `src/types/customer.ts`, `generateIdempotencyKey` from `src/utils/idempotency.ts`
- Produces: Complete CRUD & Credit Debt Payment page at `/customers`

- [ ] **Step 1: อัปเดต `src/types/customer.ts` และ `src/services/customer.service.ts`**
  - เพิ่ม Request/Response Interfaces สำหรับลูกค้าและเงินเชื่อตาม Swagger
  - เพิ่มฟังก์ชัน API ใน `customerService`: `createCustomer`, `updateCustomer`, `deleteCustomer`, `setCreditLimit`, `payCredit`, `getARAgingReport`

- [ ] **Step 2: สร้างคอมโพเนนต์ Modals สำหรับลูกค้า**
  - สร้าง `CustomerFormModal.tsx` (ฟอร์มลงทะเบียนลูกค้าใหม่ / แก้ไขข้อมูลลูกค้า)
  - สร้าง `CreditLimitModal.tsx` (ปรับเปลี่ยนวงเงินเครดิต)
  - สร้าง `PayCreditModal.tsx` (บันทึกรับชำระเงินเชื่อเพื่อลดยอดหนี้ พร้อมปุ่มตัดชำระ)
  - สร้าง `ARAgingReportModal.tsx` (ตารางแสดงรายงานอายุหนี้ 0-30, 31-60, 61-90, 90+ วัน)

- [ ] **Step 3: สร้างหน้าจอ `src/app/(main)/customers/page.tsx`**
  - ตารางรายชื่อลูกค้า พร้อมแสดงยอดวงเงินเครดิต ยอดหนี้ค้าง และวงเงินคงเหลือ
  - ช่องค้นหาลูกค้าด่วน และตัวกรองสมาชิก
  - ปุ่มการกระทำต่อลูกค้า: แก้ไขข้อมูล, ปรับวงเงิน, รับชำระหนี้, ลบข้อมูล
  - ปุ่มเปิดรายงานลูกหนี้ค้างชำระ (AR Aging Report)

- [ ] **Step 4: ตรวจสอบความถูกต้องของ Type และ Lint**
  - Run: `npx tsc --noEmit && npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 5: Commit**
  ```bash
  git add src/types/customer.ts src/services/customer.service.ts src/components/customer/ src/app/\(main\)/customers/
  git commit -m "feat(customers): เพิ่มระบบจัดการลูกค้า บัญชีเงินเชื่อ รับชำระหนี้ และรายงานลูกหนี้คงค้าง"
  ```

---

### Task 2: Reports & Analytics (`/reports`)

**Files:**
- Create: `src/types/report.ts` (`SalesSummaryResponse`, `BestSellerResponse`, `ReportQueryParams`)
- Create: `src/services/report.service.ts` (`getSalesSummary`, `getBestSellers`)
- Create: `src/app/(main)/reports/page.tsx`

**Interfaces:**
- Consumes: `api` from `src/services/api.ts`, `formatSatangToBaht` from `src/utils/currency.ts`
- Produces: Executive dashboard and analytics page at `/reports`

- [ ] **Step 1: สร้าง `src/types/report.ts` และ `src/services/report.service.ts`**
  - สร้าง DTO `SalesSummaryResponse` (totalSales, grossProfit, totalCost, totalVat, totalDiscount, totalBills, averageBillSize)
  - สร้าง DTO `BestSellerResponse` (productCode, productName, totalQtySold, totalRevenue, totalProfit)
  - สร้าง `reportService.getSalesSummary` และ `reportService.getBestSellers`

- [ ] **Step 2: สร้างหน้าจอ `src/app/(main)/reports/page.tsx`**
  - ตัวเลือกช่วงเวลา (วันนี้, 7 วันย้อนหลัง, เดือนนี้, กำหนดเอง)
  - บัตรสรุป KPI การเงิน: ยอดขายรวม (Total Sales), กำไรขั้นต้น (Gross Profit), ต้นทุนขาย (COGS), ยอดบิลรวม, ยอดเฉลี่ยต่อบิล
  - ตารางอันดับสินค้าขายดี (Top Best Selling Products) แสดงจำนวนที่ขายได้ รายได้ และกำไร
  - ข้อมูลภาษีมูลค่าเพิ่ม (VAT 7%) และส่วนลดรวม

- [ ] **Step 3: ตรวจสอบความถูกต้องของ Type และ Lint**
  - Run: `npx tsc --noEmit && npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 4: Commit**
  ```bash
  git add src/types/report.ts src/services/report.service.ts src/app/\(main\)/reports/
  git commit -m "feat(reports): เพิ่มหน้ารายงานสรุปยอดขาย กำไรขั้นต้น และสินค้าขายดี"
  ```

---

### Task 3: User & Staff Management (`/users`)

**Files:**
- Create: `src/types/user.ts` (`UserResponse`, `CreateUserRequest`, `UpdateUserRequest`, `ResetPasswordRequest`, `ResetPinRequest`, `UserQueryParams`)
- Create: `src/services/user.service.ts` (`getUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `resetPassword`, `resetPin`, `unlockUser`)
- Create: `src/components/user/UserFormModal.tsx`
- Create: `src/components/user/ResetPasswordModal.tsx`
- Create: `src/components/user/ResetPinModal.tsx`
- Create: `src/app/(main)/users/page.tsx`

**Interfaces:**
- Consumes: `api` from `src/services/api.ts`, `useAuth` from `src/context/AuthContext.tsx`
- Produces: User & cashier credentials administration page at `/users`

- [ ] **Step 1: สร้าง `src/types/user.ts` และ `src/services/user.service.ts`**
  - กำหนด DTO ตาม Swagger: UserResponse, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest, ResetPinRequest
  - สร้าง `userService` ครอบคลุม CRUD, รีเซ็ตรหัสผ่าน, รีเซ็ต PIN, และปลดล็อกบัญชี

- [ ] **Step 2: สร้างคอมโพเนนต์ Modals สำหรับจัดการผู้ใช้**
  - สร้าง `UserFormModal.tsx` (สร้างพนักงานใหม่ / แก้ไขชื่อ บทบาท สาขา)
  - สร้าง `ResetPasswordModal.tsx` (รีเซ็ตรหัสผ่านใหม่ขั้นต่ำ 8 ตัวอักษร)
  - สร้าง `ResetPinModal.tsx` (รีเซ็ต PIN แคชเชียร์ 4-6 หลัก)

- [ ] **Step 3: สร้างหน้าจอ `src/app/(main)/users/page.tsx`**
  - ตารางรายชื่อพนักงาน แสดงชื่อ Username บทบาท (ADMIN, MANAGER, CASHIER) สาขา และสถานะบัญชี (ปกติ / ถูกระงับ / ล็อก)
  - ปุ่มการกระทำ: แก้ไขข้อมูล, รีเซ็ตรหัสผ่าน, รีเซ็ต PIN, ปลดล็อกบัญชี, และระงับบัญชี (Soft Delete)
  - ตัวกรองตามบทบาท และค้นหาตามชื่อ/Username

- [ ] **Step 4: ตรวจสอบความถูกต้องของ Type และ Lint**
  - Run: `npx tsc --noEmit && npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 5: Commit**
  ```bash
  git add src/types/user.ts src/services/user.service.ts src/components/user/ src/app/\(main\)/users/
  git commit -m "feat(users): เพิ่มระบบจัดการพนักงาน สิทธิ์การใช้งาน รีเซ็ตรหัสผ่านและ PIN"
  ```

---

### Task 4: Suppliers Management CRUD (in `/inventory`)

**Files:**
- Modify: `src/types/procurement.ts` (เพิ่ม `CreateSupplierRequest`, `UpdateSupplierRequest` ให้ครบถ้วน)
- Modify: `src/services/procurement.service.ts` (เพิ่ม `createSupplier`, `updateSupplier`, `deleteSupplier`)
- Create: `src/components/inventory/SupplierTable.tsx`
- Create: `src/components/inventory/SupplierFormModal.tsx`
- Modify: `src/app/(main)/inventory/page.tsx` (เพิ่มแท็บ "ผู้จัดจำหน่าย / คู่ค้า")

**Interfaces:**
- Consumes: `SupplierResponse` from `src/types/procurement.ts`, `procurementService`
- Produces: Supplier management tab inside inventory page

- [ ] **Step 1: อัปเดต `src/types/procurement.ts` และ `src/services/procurement.service.ts`**
  - เพิ่ม `CreateSupplierRequest`, `UpdateSupplierRequest`
  - เพิ่ม `createSupplier`, `updateSupplier`, `deleteSupplier` ใน `procurementService`

- [ ] **Step 2: สร้างคอมโพเนนต์ `SupplierTable.tsx` และ `SupplierFormModal.tsx`**
  - สร้าง `SupplierFormModal.tsx` (แบบฟอร์มสร้าง/แก้ไขคู่ค้า: ชื่อ, รหัส, ผู้ติดต่อ, เบอร์โทร, เลขประจำตัวผู้เสียภาษี, เครดิตเทอม)
  - สร้าง `SupplierTable.tsx` (ตารางรายชื่อคู่ค้า, ข้อมูลติดต่อ, เครดิตเทอม, ปุ่มแก้ไข และปุ่มลบ)

- [ ] **Step 3: นำแท็บผู้จัดจำหน่ายเข้าสู่ `src/app/(main)/inventory/page.tsx`**
  - เพิ่มแท็บ 'SUPPLIERS' ในเมนูแท็บของหน้า Inventory
  - เชื่อมต่อการโหลดข้อมูลคู่ค้าและเปิด Modal สร้าง/แก้ไข

- [ ] **Step 4: ตรวจสอบความถูกต้องของ Type และ Lint**
  - Run: `npx tsc --noEmit && npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 5: Commit**
  ```bash
  git add src/types/procurement.ts src/services/procurement.service.ts src/components/inventory/SupplierTable.tsx src/components/inventory/SupplierFormModal.tsx src/app/\(main\)/inventory/page.tsx
  git commit -m "feat(inventory): เพิ่มระบบจัดการข้อมูลผู้จัดจำหน่ายและคู่ค้า (Suppliers CRUD)"
  ```

---

### Task 5: End-to-End Verification & Roadmap Document Update

**Files:**
- Modify: `docs/api-implementation-status-and-roadmap.md` (อัปเดตสถานะ Phase 2 ให้เป็น 🟢 เชื่อมต่อและใช้งานใน UI แล้ว)

- [ ] **Step 1: รัน Lint และ Type Check ตรวจสอบทั้งโปรเจกต์**
  - Run: `npx tsc --noEmit`
  - Run: `npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 2: ทดสอบ Next.js Production Build**
  - Run: `npm run build`
  - Expected: Compiled successfully without any TypeScript or build errors

- [ ] **Step 3: อัปเดตเอกสาร Roadmap `docs/api-implementation-status-and-roadmap.md`**
  - เปลี่ยนสถานะของทั้ง 19 Endpoints ใน Phase 2 สู่ 🟢
  - อัปเดตตัวเลขสรุป Executive Dashboard ในตาราง

- [ ] **Step 4: Commit**
  ```bash
  git add docs/api-implementation-status-and-roadmap.md
  git commit -m "docs: อัปเดตสถานะการพัฒนา Phase 2 สู่สถานะใช้งานจริง (Implemented & Used)"
  ```

