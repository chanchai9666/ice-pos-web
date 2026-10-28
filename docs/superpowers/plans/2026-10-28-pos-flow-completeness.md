# Phase 1: POS Flow Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เติมเต็ม Flow การทำงานของระบบขายหน้าร้าน (Cashier Lifecycle) ให้ครบสมบูรณ์ ประกอบด้วยระบบปิดกะการขายพร้อมนับเงินสดจริง (Close Shift), ระบบค้นหาประวัติการขายและขอยกเลิกบิล (Sales History & Void Sale), และระบบดึงข้อมูลพิมพ์ใบเสร็จรับเงินซ้ำ (Receipt Reprint) โดยอ้างอิง API Backend และสัญญา Swagger จริง 100% ปราศจาก Mock Data

**Architecture:** สถาปัตยกรรม React Next.js 16 (App Router) + TypeScript ตามมาตรฐาน Elderly-Friendly (เป้าหมายสัมผัส >= 48px, WCAG 2.1 AA Contrast) และ Constitution ข้อ 6.6 (Global Action Loading Overlay Coordinator) ปฏิบัติตาม Satang Currency Standard (จำนวนเงินใน API เป็นสตางค์ทั้งหมด)

**Tech Stack:** Next.js 16.4, React 19, TypeScript 5, Tailwind CSS v4, Fetch API wrapper (`src/services/api.ts`)

**Spec:** [docs/api-implementation-status-and-roadmap.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/docs/api-implementation-status-and-roadmap.md), [docs/swagger.json](file:///Users/chanchai/workshop/CODE/ice-pos-web/docs/swagger.json), [.specify/memory/constitution.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/.specify/memory/constitution.md)

## Global Constraints

- ทุกจำนวนเงินที่ส่งและรับจาก API ต้องเป็นหน่วย **สตางค์ (satang: integer)** เสมอ แปลงแสดงผลด้วย `formatSatangToBaht` และ `parseBahtToSatang`
- ใช้ข้อมูลจาก API จริงตาม `docs/swagger.json` ห้ามสร้างหรือจำลองข้อมูล Mock เองโดยเด็ดขาด (Constitution 5.1, 13)
- การเรียก API Action ทุกครั้งต้องส่ง `loadingMessage` เข้า API wrapper เพื่อแสดง Full Blocking Overlay ป้องกันการกดย้ำ (ยกเว้น Silent background polling)
- การเรียก `POST /sales/{id}/void` ต้องแนบ Header `Idempotency-Key: UUIDv4`
- ปุ่มกดและเป้าหมายสัมผัส (Touch Targets) ต้องมีขนาดไม่เล็กกว่า 48x48px และมีตัวหนังสือคมชัด ไม่ใช้ตัวอักษรสีเทาจาง (Elderly-Friendly & WCAG AA)
- การสื่อสารและคำอธิบาย UI เป็นภาษาไทย 100%

## Review Focus

1. **ผลต่างเงินสดกะ (Cash Difference Calculation):** เมื่อแคชเชียร์กรอกเงินสดที่นับได้จริง `countedCash` ต้องคำนวณเปรียบเทียบกับ `expectedCash` ที่ API ตอบกลับ และแสดงสถานะ ขาด (Shortage) / เกิน (Overage) / ตรงพอดี อย่างชัดเจน
2. **การยกเลิกบิลซ้ำ (Double Voiding Prevention):** บิลที่สถานะเป็น `VOID` หรือ `VOIDED` ไปแล้ว ต้องไม่แสดงปุ่มยกเลิกบิลซ้ำ และหาก API ตอบกลับ 400 (บิลถูกยกเลิกแล้ว) ต้องแสดงข้อความแจ้งเตือนอย่างถูกต้อง
3. **การล้าง State กะขายหลังปิดกะ:** เมื่อปิดกะสำเร็จ `activeShift` ใน `PosCartContext` ต้องถูกรีเซ็ตเป็น `null` ทันที เพื่อป้องกันไม่ให้แคชเชียร์ขายสินค้าต่อในกะที่ปิดไปแล้ว
4. **การ Parse ข้อมูลใบเสร็จ JSON (contentJson Robustness):** ใน `ReceiptResponse` ข้อมูลใบเสร็จเก็บเป็น JSON string ในฟิลด์ `contentJson` ต้องรองรับการ Parse ข้อมูลอย่างปลอดภัยและมี fallback ป้องกันหน้าจอ Error
5. **การกรองประวัติบิลขายตามสาขาปัจจุบัน:** หน้าประวัติการขายต้องส่ง `branchId` ของสาขาปัจจุบันเป็นค่าเริ่มต้น เพื่อไม่ให้โหลดรายการขายปะปนกับสาขาอื่น

---

### Task 1: Type Definitions & Services for Phase 1 APIs

**Files:**
- Modify: `src/types/sale.ts` (เพิ่ม `VoidSaleRequest`, `SalesQueryParams`)
- Create: `src/types/receipt.ts` (สร้าง `ReceiptResponse`, `ReceiptContent`)
- Modify: `src/services/sales.service.ts` (เพิ่ม `getSalesHistory`, `voidSale`)
- Create: `src/services/receipt.service.ts` (สร้าง `receiptService.getReceiptByNo`)

**Interfaces:**
- Consumes: `api` & `request` from `src/services/api.ts`, `ApiResponse` from `src/types/auth.ts`
- Produces:
  - `VoidSaleRequest`: `{ reason: string }`
  - `SalesQueryParams`: `{ branchId?: string; cashierId?: string; customerId?: string; status?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number; }`
  - `salesService.getSalesHistory(params?: SalesQueryParams): Promise<ApiResponse<SaleResponse[]>>`
  - `salesService.voidSale(id: string, reason: string): Promise<ApiResponse<void>>`
  - `ReceiptResponse`: `{ id: string; receiptNo: string; refId: string; type: string; contentJson: string; printCount: number; createdAt: string; }`
  - `receiptService.getReceiptByNo(receiptNo: string): Promise<ApiResponse<ReceiptResponse>>`

- [ ] **Step 1: อัปเดต `src/types/sale.ts` และสร้าง `src/types/receipt.ts`**
  - เพิ่ม `VoidSaleRequest` และ `SalesQueryParams` ลงใน `src/types/sale.ts`
  - สร้าง `src/types/receipt.ts` ตรงตาม DTO `ice-pos-api_internal_delivery_http_dto.ReceiptResponse` ใน `docs/swagger.json`

- [ ] **Step 2: อัปเดต `src/services/sales.service.ts`**
  - เพิ่ม `getSalesHistory(params?: SalesQueryParams)` ยิง `GET /api/v1/sales`
  - เพิ่ม `voidSale(id: string, reason: string)` ยิง `POST /api/v1/sales/${id}/void` พร้อมแนบ `Idempotency-Key` header และ `loadingMessage: 'กำลังยกเลิกบิลขาย กรุณารอสักครู่...'`

- [ ] **Step 3: สร้าง `src/services/receipt.service.ts`**
  - สร้าง `receiptService.getReceiptByNo(receiptNo: string)` ยิง `GET /api/v1/receipts/${receiptNo}`

- [ ] **Step 4: ตรวจสอบความถูกต้องของ Type ด้วย TypeScript compiler**
  - Run: `npx tsc --noEmit`
  - Expected: PASS with 0 errors

- [ ] **Step 5: Commit**
  ```bash
  git add src/types/sale.ts src/types/receipt.ts src/services/sales.service.ts src/services/receipt.service.ts
  git commit -m "feat(api): เพิ่ม DTO และ Service สำหรับ Close Shift, Sales History, Void และ Receipt Reprint"
  ```

---

### Task 2: Close Shift Modal & Workflow (`POST /shifts/{id}/close`)

**Files:**
- Create: `src/components/pos/PosCloseShiftModal.tsx`
- Modify: `src/components/pos/PosShiftBanner.tsx` (เพิ่มปุ่ม "ปิดกะการขาย" เมื่อสถานะกะเปิดอยู่)
- Modify: `src/app/(main)/pos/page.tsx` (เพิ่ม State และ Handler การเปิด/ปิด Modal และอัปเดต Cart Context)

**Interfaces:**
- Consumes: `shiftService.closeShift(id, data)` from `src/services/shift.service.ts`, `ShiftInfo`, `CloseShiftRequest` from `src/types/shift.ts`, `formatSatangToBaht`, `parseBahtToSatang` from `src/utils/currency.ts`
- Produces: `PosCloseShiftModal` component with interactive cash breakdown/numpad, shift comparison (opening cash vs counted cash), and callback `onCloseSuccess: () => void`

- [ ] **Step 1: สร้างคอมโพเนนต์ `PosCloseShiftModal.tsx`**
  - ออกแบบ Modal ขนาดใหญ่ รองรับการป้อนยอดเงินสดที่นับได้จริง (Counted Cash) ทั้งแบบกรอกตัวเลข และปุ่มทางลัดธนบัตร/เหรียญ
  - แสดงข้อมูลกะปัจจุบัน: วันเวลาเปิดกะ, เงินทอนเริ่มต้น (`openingCash`)
  - เมื่อกดยืนยันปิดกะ เรียก `shiftService.closeShift(activeShift.id, { countedCash })`
  - แสดงผลสรุปยอดเมื่อปิดสำเร็จ: แสดงยอดเงินขาด/เกิน (`difference`), เวลาปิดกะ, พร้อมปุ่มพิมพ์สรุปกะหรือเสร็จสิ้น
  - เมื่อปิดสำเร็จ เรียก `onCloseSuccess` เพื่อเคลียร์ `activeShift`

- [ ] **Step 2: อัปเดต `PosShiftBanner.tsx`**
  - เพิ่ม prop `onCloseShiftClick?: () => void` ใน `PosShiftBannerProps`
  - ในส่วนที่กะเปิดอยู่ เพิ่มปุ่ม "ปิดกะการขาย" ขนาดความสูงขั้นต่ำ 48px พร้อมไอคอนปิดกะและสีแจ้งเตือนชัดเจน

- [ ] **Step 3: เชื่อมต่อ Modal ใน `src/app/(main)/pos/page.tsx`**
  - เพิ่ม state `isCloseShiftModalOpen`
  - ส่ง callback ให้ `PosShiftBanner` เพื่อเปิด Modal
  - จัดการ `handleCloseShiftSuccess` โดยเซ็ต `setActiveShift(null)` และล้างตะกร้าหากจำเป็น พร้อมแจ้งเตือน Success Toast

- [ ] **Step 4: ตรวจสอบความถูกต้องและทดสอบ Lint/Type**
  - Run: `npx tsc --noEmit && npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/pos/PosCloseShiftModal.tsx src/components/pos/PosShiftBanner.tsx src/app/\(main\)/pos/page.tsx
  git commit -m "feat(pos): เพิ่มระบบปิดกะการขายและ Modal นับเงินสดกระทบยอด"
  ```

---

### Task 3: Sales History & Void Sale Modal (`GET /sales`, `POST /sales/{id}/void`)

**Files:**
- Create: `src/components/pos/PosSalesHistoryModal.tsx`
- Create: `src/components/pos/PosVoidConfirmModal.tsx`
- Modify: `src/app/(main)/pos/page.tsx` (เพิ่มปุ่มเปิดประวัติการขายใน Header/Toolbar และเชื่อม Modal)

**Interfaces:**
- Consumes: `salesService.getSalesHistory`, `salesService.voidSale`, `SaleResponse` from `src/types/sale.ts`
- Produces:
  - `PosSalesHistoryModal`: ตารางประวัติการขาย, ตัวกรองวันที่, รายละเอียดแถวสินค้าในบิล, ปุ่มสั่งพิมพ์ใบเสร็จซ้ำ และปุ่มขอยกเลิกบิล
  - `PosVoidConfirmModal`: กล่องยืนยันการยกเลิกบิลพร้อมช่องใส่เหตุผล (Reason) ไม่น้อยกว่า 3 ตัวอักษร

- [ ] **Step 1: สร้างคอมโพเนนต์ `PosVoidConfirmModal.tsx`**
  - แสดงรายละเอียดบิลที่จะยกเลิก: เลขที่บิล, ยอดเงินรวม, วิธีชำระเงิน
  - กล่องข้อความแจ้งเตือนสีแดงเด่นชัด: "การยกเลิกบิลจะทำการคืนสต็อกสินค้ากลับเข้าคลัง และคืนวงเงินเครดิตให้ลูกค้าโดยอัตโนมัติ"
  - ช่องกรอกเหตุผลในการยกเลิกบิล (`reason`) กำหนดความยาว 3-500 ตัวอักษร
  - ปุ่ม "ยืนยันยกเลิกบิล" (สีแดง, สูง >= 48px) และปุ่ม "ยกเลิก"

- [ ] **Step 2: สร้างคอมโพเนนต์ `PosSalesHistoryModal.tsx`**
  - ตารางแสดงรายการขายย้อนหลัง ดึงข้อมูลผ่าน `salesService.getSalesHistory({ branchId })`
  - แสดงเลขที่บิล (`saleNo`), วันเวลา, ยอดเงินรวม (`grandTotal`), วิธีชำระเงิน, สถานะบิล (`COMPLETED`, `VOIDED`)
  - รองรับการคลิกดูรายละเอียดสินค้าในบิล (รายการสินค้า, จำนวน, ราคาต่อหน่วย, ยอดสุทธิ)
  - ปุ่ม "พิมพ์ใบเสร็จซ้ำ" (เชื่อมต่อกับ Task 4)
  - ปุ่ม "ยกเลิกบิล" (แสดงเฉพาะบิลที่สถานะไม่ใช่ `VOIDED` และเปิด `PosVoidConfirmModal`)
  - จัดการ Loading state และ Empty state ชัดเจน

- [ ] **Step 3: นำปุ่มเปิดประวัติการขายเข้าสู่หน้า POS ใน `src/app/(main)/pos/page.tsx`**
  - เพิ่มปุ่ม "ประวัติการขาย" ในทูลบาร์ของหน้า POS (เช่น ข้างปุ่มเปิดกล้องหรือในส่วนการจัดการ)
  - ผูก state เปิด/ปิด `PosSalesHistoryModal` และรีเฟรชสต็อกสินค้าเมื่อมีการ Void สำเร็จ

- [ ] **Step 4: ตรวจสอบความถูกต้องและทดสอบ Lint/Type**
  - Run: `npx tsc --noEmit && npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/pos/PosSalesHistoryModal.tsx src/components/pos/PosVoidConfirmModal.tsx src/app/\(main\)/pos/page.tsx
  git commit -m "feat(pos): เพิ่มหน้ารายการประวัติการขายและระบบยกเลิกบิล (Void Sale)"
  ```

---

### Task 4: Receipt Reprint Modal (`GET /receipts/{receiptNo}`)

**Files:**
- Create: `src/components/pos/PosReceiptModal.tsx`
- Modify: `src/components/pos/PosSalesHistoryModal.tsx` (เชื่อมต่อปุ่มพิมพ์ซ้ำเข้ากับ Modal)
- Modify: `src/components/pos/PosSuccessOverlay.tsx` (ให้สามารถเปิดดู/พิมพ์ใบเสร็จหลังคิดเงินเสร็จได้ทันที)

**Interfaces:**
- Consumes: `receiptService.getReceiptByNo` from `src/services/receipt.service.ts`, `ReceiptResponse` from `src/types/receipt.ts`
- Produces: `PosReceiptModal` รองรับ Layout สลิปใบเสร็จความร้อน (80mm / 58mm Thermal Receipt CSS print styles), แสดงหมายเลขบิล, รายการสินค้า, ข้อมูลภาษี, จำนวนครั้งที่พิมพ์ซ้ำ (`printCount`), และปุ่ม `window.print()`

- [ ] **Step 1: สร้างคอมโพเนนต์ `PosReceiptModal.tsx`**
  - เรียก `receiptService.getReceiptByNo(receiptNo)` เพื่อดึงข้อมูล Snapshot ใบเสร็จจริงจาก API
  - จัดการ Parse `contentJson` เพื่อนำรายละเอียดหัวบิล, สาขา, แคชเชียร์, รายการสินค้า, ภาษี, ยอดรวม มาแสดงผล
  - แสดงแสตมป์ "ใบเสร็จพิมพ์ซ้ำ (Reprint #X)" เมื่อ `printCount > 1`
  - มีปุ่ม "พิมพ์ใบเสร็จ" ขนาดใหญ่ ที่สั่งพิมพ์ผ่าน CSS `@media print` สำหรับเครื่องพิมพ์สลิป POS
  - มีปุ่มปิดหน้าต่าง

- [ ] **Step 2: เชื่อมต่อ `PosReceiptModal` เข้ากับ `PosSalesHistoryModal`**
  - เมื่อผู้ใช้กดปุ่มไอคอนเครื่องพิมพ์ในแถวประวัติการขาย ให้เปิด `PosReceiptModal` พร้อมส่งเลขที่ใบเสร็จ

- [ ] **Step 3: เชื่อมต่อ `PosReceiptModal` เข้ากับ `PosSuccessOverlay`**
  - ในหน้าต่างแจ้งเตือนชำระเงินสำเร็จ เพิ่มปุ่ม "ดู/พิมพ์ใบเสร็จรับเงิน" ให้แคชเชียร์สั่งพิมพ์ได้ทันที

- [ ] **Step 4: ตรวจสอบความถูกต้องและทดสอบ Lint/Type**
  - Run: `npx tsc --noEmit && npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 5: Commit**
  ```bash
  git add src/components/pos/PosReceiptModal.tsx src/components/pos/PosSalesHistoryModal.tsx src/components/pos/PosSuccessOverlay.tsx
  git commit -m "feat(pos): เพิ่มระบบดึงข้อมูลและพิมพ์ใบเสร็จรับเงินซ้ำ (Receipt Reprint)"
  ```

---

### Task 5: End-to-End Verification & Documentation Update

**Files:**
- Modify: `docs/api-implementation-status-and-roadmap.md` (อัปเดตสถานะ Phase 1 ให้เป็น 🟢 เชื่อมต่อและใช้งานใน UI แล้ว)

- [ ] **Step 1: รัน Lint และ Type Check ตรวจสอบทั้งโปรเจกต์**
  - Run: `npx tsc --noEmit`
  - Run: `npm run lint`
  - Expected: PASS with 0 errors

- [ ] **Step 2: ทดสอบ Next.js Production Build**
  - Run: `npm run build`
  - Expected: Compiled successfully without any TypeScript or build errors

- [ ] **Step 3: อัปเดตเอกสาร Roadmap `docs/api-implementation-status-and-roadmap.md`**
  - เปลี่ยนสถานะของ `POST /shifts/{id}/close` จาก 🟡 เป็น 🟢
  - เปลี่ยนสถานะของ `GET /sales` จาก 🔴 เป็น 🟢
  - เปลี่ยนสถานะของ `POST /sales/{id}/void` จาก 🔴 เป็น 🟢
  - เปลี่ยนสถานะของ `GET /sales/{id}` จาก 🟡 เป็น 🟢
  - เปลี่ยนสถานะของ `GET /receipts/{receiptNo}` จาก 🔴 เป็น 🟢
  - อัปเดตตัวเลขสรุป Executive Dashboard ในตาราง

- [ ] **Step 4: Commit**
  ```bash
  git add docs/api-implementation-status-and-roadmap.md
  git commit -m "docs: อัปเดตสถานะการพัฒนา Phase 1 สู่สถานะใช้งานจริง (Implemented & Used)"
  ```

