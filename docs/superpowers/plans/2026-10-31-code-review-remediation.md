# Code Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับปรุงและแก้ไขข้อบกพร่องตามผลการตรวจ Code Review ทั้งสองมิติ (Standards & Spec) ให้สอดคล้องตามข้อกำหนดใน `AGENTS.md` และธรรมนูญ `constitution.md v1.5.1` ครบถ้วน 100%

**Architecture:** ปรับปรุง Service Layer เพื่อส่ง Idempotency-Key และ Silent Polling, บูรณาการ Currency Helper และจัดการ RouteGuard Whitelist ให้รัดกุม พร้อมปรับปรุง Accessibility Touch Targets บน UI

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript Strict, Tailwind CSS v4

**Spec:** ผลการรีวิว Code Review (Standards & Spec findings), `AGENTS.md`, `.specify/memory/constitution.md`

## Global Constraints

- ยึดหลัก Thai-first: คำอธิบายโค้ด, UI Text และ Git Commit ต้องเป็นภาษาไทย
- ตัวเลขการเงินในระดับ Service/Types ต้องเป็น Satang integer เท่านั้น และแปลงผ่าน `currencyHelper.ts`
- การยิง API ที่เป็นการกลายพันธุ์ข้อมูล (Mutations) สำหรับการเงินและสต็อกต้องส่ง Header `Idempotency-Key`
- Background Polling ต้องส่ง `{ silent: true }` เสมอ เพื่อไม่ให้รบกวน Blocking Loading Overlay
- ปุ่มและองค์ประกอบที่โต้ตอบได้ต้องมี Touch Target ไม่ต่ำกว่า 44-48px ตามเกณฑ์ธรรมนูญข้อ 6.5
- การตรวจสอบความถูกต้องใช้ `make check` (`npx eslint` + `npx tsc --noEmit`) ห้ามสร้าง test script ใหม่

## Review Focus

1. `Idempotency-Key` ส่งครบทุก Mutation สำคัญ (Stock Adjust, Transfers, Goods Receipts, PromptPay QR)
2. `PosPaymentQR` วน Polling โดยไม่เกิด Loading Overlay กระพริบหรือบล็อกหน้าจอ
3. `isRouteAllowedForRole` ป้องกัน Role ต่ำ (เช่น Cashier) เข้าถึงหน้าผู้ดูแลระบบหรือหน้าไม่ได้ลงทะเบียน
4. ไม่มีข้อผิดพลาดหลังรวม `currency.ts` เข้ากับ `currencyHelper.ts` และลบ Dead Code (`ProductFormDrawer.tsx`, `product.service.ts`)
5. Touch Target ของ `PosReturnModal` มีขนาดอย่างน้อย 44px และตัวอักษรอ่านง่ายตามธรรมนูญ

---

### Task 1: แนบ Idempotency-Key ใน Mutation APIs ของสต็อกและการเงิน

**Files:**
- Modify: `src/services/inventory.service.ts`
- Modify: `src/services/procurement.service.ts`
- Modify: `src/services/payments.service.ts`

**Interfaces:**
- Consumes: `generateIdempotencyKey()` จาก `@/utils/idempotency`
- Produces: ส่ง Header `'Idempotency-Key'` สำหรับ requests:
  - `inventoryService.adjustStock(branchId, request, idempotencyKey?)`
  - `inventoryService.createStockTransfer(payload, idempotencyKey?)`
  - `inventoryService.receiveStockTransfer(transferId, payload, idempotencyKey?)`
  - `procurementService.createPurchaseOrder(data, idempotencyKey?)`
  - `procurementService.createGoodsReceipt(data, idempotencyKey?)`
  - `procurementService.completeGoodsReceipt(id, idempotencyKey?)`
  - `paymentsService.generatePromptPayQR(amount, idempotencyKey?)`

- [ ] **Step 1: อัปเดต `src/services/payments.service.ts`**
  - นำเข้า `generateIdempotencyKey` จาก `@/utils/idempotency`
  - ใน `generatePromptPayQR(amount: number, idempotencyKey?: string)` เพิ่ม Header `'Idempotency-Key': idempotencyKey || generateIdempotencyKey()`

- [ ] **Step 2: อัปเดต `src/services/inventory.service.ts`**
  - นำเข้า `generateIdempotencyKey` จาก `@/utils/idempotency`
  - ใน `adjustStock`, `createStockTransfer`, `receiveStockTransfer` เพิ่ม Header `Idempotency-Key`

- [ ] **Step 3: อัปเดต `src/services/procurement.service.ts`**
  - นำเข้า `generateIdempotencyKey` จาก `@/utils/idempotency`
  - ใน `createPurchaseOrder`, `createGoodsReceipt`, `completeGoodsReceipt` เพิ่ม Header `Idempotency-Key`

- [ ] **Step 4: ตรวจสอบ Typecheck**
  - Run: `npx tsc --noEmit`
  - Expected: PASS

- [ ] **Step 5: Commit การเปลี่ยนแปลง**
  - Command: `git add src/services/payments.service.ts src/services/inventory.service.ts src/services/procurement.service.ts`
  - Commit: `git commit -m "fix(services): แนบ Header Idempotency-Key ใน API ปรับสต็อกและชำระเงินตามมาตรฐาน"`

---

### Task 2: แก้ไข Background Polling ด้วย `silent: true` ในระบบตรวจสถานะการชำระเงิน QR

**Files:**
- Modify: `src/services/payments.service.ts`
- Modify: `src/components/pos/PosPaymentQR.tsx`

**Interfaces:**
- Consumes: `checkPaymentStatus(ref: string, options?: { silent?: boolean })`
- Produces: Polling request ที่ไม่บล็อก UI Overlay

- [ ] **Step 1: อัปเดต `checkPaymentStatus` ใน `src/services/payments.service.ts`**
  - เพิ่มพารามิเตอร์ `options?: { silent?: boolean }` โดยกำหนดค่าเริ่มต้น `silent: options?.silent ?? true`
  - ส่งผ่านออปชัน `silent` ให้แก่ `request(...)`

- [ ] **Step 2: อัปเดตการเรียกใช้ใน `src/components/pos/PosPaymentQR.tsx`**
  - ในฟังก์ชัน `checkStatus`: ส่ง `{ silent: !isManual }` หรือปล่อยให้เป็น silent default เมื่อตรวจอัตโนมัติ

- [ ] **Step 3: ตรวจสอบ Typecheck**
  - Run: `npx tsc --noEmit`
  - Expected: PASS

- [ ] **Step 4: Commit การเปลี่ยนแปลง**
  - Command: `git add src/services/payments.service.ts src/components/pos/PosPaymentQR.tsx`
  - Commit: `git commit -m "fix(pos): กำหนดให้ Polling ตรวจสอบสถานะ QR เป็นงานเบื้องหลังแบบเงียบ (silent: true)"`

---

### Task 3: รวม Utility ค่าเงิน และแทนที่ Inline Math ด้วย `currencyHelper.ts`

**Files:**
- Modify: `src/utils/currencyHelper.ts`
- Modify: `src/utils/currency.ts`
- Modify: `src/app/(main)/pos/page.tsx`
- Modify: `src/components/pos/PosPaymentCash.tsx`
- Modify: `src/utils/cashSuggestions.ts`

**Interfaces:**
- Consumes: `toBaht`, `toSatang`, `formatSatangToBaht` จาก `@/utils/currencyHelper`
- Produces: การคำนวณและแสดงผลหน่วยเงินที่เป็นมาตรฐานเดียวกันทั้งระบบ

- [ ] **Step 1: รวม Alias ใน `src/utils/currencyHelper.ts` และเชื่อมโยง `currency.ts`**
  - เพิ่ม export alias `bahtToSatang = toSatang` และ `satangToBahtNumber = toBaht` ใน `currencyHelper.ts`
  - ใน `src/utils/currency.ts` ให้ re-export ทุกฟังก์ชันจาก `currencyHelper.ts` พร้อมระบุ `@deprecated` เพื่อไม่ให้กระทบไฟล์เดิม

- [ ] **Step 2: ปรับแก้การคำนวณ Inline Math (`/ 100`, `* 100`) ในหน้า POS**
  - ใน `src/app/(main)/pos/page.tsx` นำเข้า `toBaht`, `toSatang` จาก `@/utils/currencyHelper` และแทนที่การคูณ/หาร 100 แบบตรงๆ
  - ใน `src/components/pos/PosPaymentCash.tsx` แทนที่ `currentCash / 100` ด้วย `toBaht(currentCash)`
  - ใน `src/utils/cashSuggestions.ts` แทนที่ `amountSatang / 100` ด้วย `toBaht(amountSatang)` และ `suggestion * 100` ด้วย `toSatang(suggestion)`

- [ ] **Step 3: ตรวจสอบ Typecheck และ Lint**
  - Run: `npx tsc --noEmit`
  - Expected: PASS

- [ ] **Step 4: Commit การเปลี่ยนแปลง**
  - Command: `git add src/utils/currencyHelper.ts src/utils/currency.ts src/app/(main)/pos/page.tsx src/components/pos/PosPaymentCash.tsx src/utils/cashSuggestions.ts`
  - Commit: `git commit -m "refactor(currency): รวมศูนย์ Currency Helper และยกเลิกการคำนวณแปลงหน่วยเงินแบบ Inline"`

---

### Task 4: เพิ่มความปลอดภัย RouteGuard และลงทะเบียนเมนูใน Navigation Configuration

**Files:**
- Modify: `src/constants/navigation.ts`

**Interfaces:**
- Consumes: `MAIN_NAV_ITEMS`, `isRouteAllowedForRole(path, role)`
- Produces: การตรวจสอบสิทธิ์ที่รัดกุม ป้องกันการเข้าถึง Route ที่ไม่ได้อนุญาต

- [ ] **Step 1: ลงทะเบียน Dashboard ใน `MAIN_NAV_ITEMS`**
  - เพิ่มเมนู `/dashboard` เข้าใน `MAIN_NAV_ITEMS` (allowedRoles: `['ADMIN', 'MANAGER']`, icon: `'LayoutDashboard'`)

- [ ] **Step 2: ปรับปรุง `isRouteAllowedForRole` ใน `src/constants/navigation.ts`**
  - ตรวจสอบเส้นทางหลักที่อนุญาต: หากเป็น root path `/` ให้ redirect ตามปกติ
  - สำหรับเส้นทางที่มีการจับคู่ ให้ตรวจสอบ `allowedRoles.includes(normalizedRole)`
  - สำหรับเส้นทางที่ไม่อยู่ใน `MAIN_NAV_ITEMS`: หากเป็น Role แคชเชียร์ (`CASHIER`) และพยายามเข้าหน้าอื่นๆ นอกเหนือจาก `/pos` หรือ public paths ให้ส่งคืน `false` เป็นค่าเริ่มต้น

- [ ] **Step 3: ตรวจสอบ Typecheck**
  - Run: `npx tsc --noEmit`
  - Expected: PASS

- [ ] **Step 4: Commit การเปลี่ยนแปลง**
  - Command: `git add src/constants/navigation.ts`
  - Commit: `git commit -m "feat(security): ลงทะเบียน Dashboard และปรับปรุงความปลอดภัย RouteGuard ให้รัดกุม"`

---

### Task 5: ปรับปรุง Touch Target และตัวอักษรสำหรับผู้สูงวัยใน `PosReturnModal`

**Files:**
- Modify: `src/components/pos/PosReturnModal.tsx`

**Interfaces:**
- Consumes: Tailwind CSS v4 utility classes
- Produces: UI ปุ่มเพิ่ม/ลดจำนวนคืน และปุ่มเลือกเหตุผลที่มีขนาด Touch Target >= 44-48px และขนาดฟอนต์ >= 14px

- [ ] **Step 1: ขยาย Touch Target ปุ่มปรับจำนวนสินค้าคืน**
  - เปลี่ยนขนาดปุ่ม `-` และ `+` จาก `w-8 h-8` เป็น `w-11 h-11 text-base font-bold min-w-[44px] min-h-[44px]`
  - ปรับขนาดคอนเทนเนอร์ให้รองรับขนาดปุ่มใหม่อย่างสวยงาม

- [ ] **Step 2: ปรับปรุงปุ่มเลือกเหตุผลคืนสินค้าด่วน (Preset Reasons)**
  - เปลี่ยนจาก `text-[11px] px-2.5 py-1` เป็น `text-sm font-medium px-4 py-2.5 min-h-[44px] rounded-xl`

- [ ] **Step 3: ตรวจสอบ Typecheck**
  - Run: `npx tsc --noEmit`
  - Expected: PASS

- [ ] **Step 4: Commit การเปลี่ยนแปลง**
  - Command: `git add src/components/pos/PosReturnModal.tsx`
  - Commit: `git commit -m "style(pos): ปรับปรุง Touch Target และขนาดตัวอักษรใน Modal รับคืนสินค้าตามมาตรฐานผู้สูงวัย"`

---

### Task 6: ทำความสะอาด Dead Code และโมดูลที่ซ้ำซ้อน

**Files:**
- Delete: `src/components/catalog/ProductFormDrawer.tsx`
- Delete: `src/services/product.service.ts`

**Interfaces:**
- Consumes: ไม่มี (ตรวจสอบแล้วว่าไม่มีการเรียกใช้งานในระบบ)
- Produces: ลดภาระการบำรุงรักษาโค้ดที่ซ้ำซ้อน

- [ ] **Step 1: ลบไฟล์ `ProductFormDrawer.tsx` และ `product.service.ts`**
  - Command: `git rm src/components/catalog/ProductFormDrawer.tsx src/services/product.service.ts`

- [ ] **Step 2: ตรวจสอบ Typecheck และ Lint ให้แน่ใจว่าไม่มีส่วนใดพัง**
  - Run: `npx tsc --noEmit`
  - Expected: PASS

- [ ] **Step 3: Commit การเปลี่ยนแปลง**
  - Command: `git commit -m "chore(cleanup): ลบ Dead Code (ProductFormDrawer และ product.service) ที่ไม่ได้ใช้งาน"`

---

### Task 7: ตรวจสอบความถูกต้องและคุณภาพโค้ดทั้งโปรเจกต์ (Full Verification)

**Files:**
- Check: All modified files

- [ ] **Step 1: รันคำสั่งตรวจสอบ Lint และ Typecheck ทั้งระบบ**
  - Run: `make check`
  - Expected: PASS ไม่มีข้อผิดพลาดหรือ Warning

- [ ] **Step 2: ทดสอบการ Build Production**
  - Run: `npx next build` (หรือ `make ci`)
  - Expected: Build สำเร็จสมบูรณ์ 100%

