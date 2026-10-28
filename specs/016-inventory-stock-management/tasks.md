# Tasks: ระบบจัดการคลังและสต็อกสินค้า (Inventory & Stock Management)

**Input**: Design documents from `specs/016-inventory-stock-management/` (`spec.md`, `plan.md`, `data-model.md`, `contracts/`, `quickstart.md`)

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

**Tests**: ไม่สร้าง automated test tasks เนื่องจาก spec ไม่ได้ระบุ TDD; เน้นการตรวจสอบผ่าน Typecheck, Linter และคู่มือ `quickstart.md`

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: สามารถทำคู่ขนานได้ (คนละไฟล์ ไม่ขึ้นต่อกัน)
- **[Story]**: ระบุ [US1], [US2], [US3] ตาม User Stories ใน spec.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: เตรียมโครงสร้างไฟล์และคอมโพเนนต์สำหรับโมดูลคลังสินค้า

- [X] T001 สร้างโฟลเดอร์ `src/components/inventory/` สำหรับบรรจุคอมโพเนนต์เฉพาะของระบบคลังสินค้า

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ขยาย Type Definitions และ Service API ที่ทุก User Story จำเป็นต้องใช้

**⚠️ CRITICAL**: ต้องเสร็จสิ้นก่อนเริ่มทำ User Story

- [X] T002 [P] เพิ่มประเภทข้อมูล `StockAdjustmentType`, `AdjustStockRequest`, และ `InventoryValuationResponse` ใน `src/types/inventory.ts` ตาม `specs/016-inventory-stock-management/data-model.md`
- [X] T003 เพิ่มฟังก์ชัน `adjustStock(branchId: string, request: AdjustStockRequest)` และ `getInventoryValuation(branchId?: string)` ใน `src/services/inventory.service.ts` ตาม `specs/016-inventory-stock-management/contracts/inventory-api.contract.md`

**Checkpoint**: Foundation ready - Type definitions และ Service methods พร้อมสำหรับการพัฒนา UI ใน User Story

---

## Phase 3: User Story 1 - ดูภาพรวมและรายการสต็อกสินค้าคงเหลือรายสาขา (Priority: P1) 🎯 MVP

**Goal**: ผู้ใช้สามารถเปิดหน้า `/inventory` ดูภาพรวมสถิติสต็อก กรองสต็อกต่ำ สลับสาขา และค้นหาสินค้าด้วยการพิมพ์หรือสแกนบาร์โค้ดด้วยกล้อง

**Independent Test**: เข้าหน้า `/inventory` แล้วเห็นรายการสต็อกสินค้าของสาขาปัจจุบัน การ์ดสรุปตัวเลขถูกต้อง สามารถกดกรอง "เฉพาะสต็อกต่ำกว่าเกณฑ์" และค้นหาด้วยชื่อ/SKU/บาร์โค้ดได้

### Implementation for User Story 1

- [X] T004 [P] [US1] สร้างคอมโพเนนต์การ์ดสรุปตัวเลขสถิติภาพรวมสต็อก `InventorySummaryCards.tsx` ใน `src/components/inventory/InventorySummaryCards.tsx` (สินค้าทั้งหมด, สต็อกต่ำ, สินค้าหมด, มูลค่าสต็อกรวม)
- [X] T005 [P] [US1] สร้างคอมโพเนนต์แถบเครื่องมือค้นหาและตัวกรอง `InventoryToolbar.tsx` ใน `src/components/inventory/InventoryToolbar.tsx` รองรับช่องค้นหา, ปุ่มเปิดสแกนบาร์โค้ดด้วยกล้อง, สวิตช์กรองสต็อกต่ำ, Dropdown สลับสาขาสำหรับ ADMIN, และปุ่มรีเฟรช (Touch target >= 48px)
- [X] T006 [P] [US1] สร้างคอมโพเนนต์ตารางแสดงรายการสต็อกสินค้า `InventoryStockTable.tsx` ใน `src/components/inventory/InventoryStockTable.tsx` แสดงข้อมูลสินค้า, บาร์โค้ด, หน่วยนับ, สต็อกคงเหลือ, สถานะสี Badge (เขียว: ปกติ, เหลือง: สต็อกต่ำ, แดง: สินค้าหมด), และปุ่ม "ปรับยอดสต็อก"
- [X] T007 [US1] สร้างหน้าจอหลัก `src/app/(main)/inventory/page.tsx` ควบคุมการตรวจสอบสิทธิ์ ADMIN/MANAGER, ดึงข้อมูลจาก `inventoryService.getStockLevels`, จัดการ State การค้นหาและสลับสาขา, เชื่อมโยง `BarcodeCaptureModal` เข้ากับปุ่มสแกนใน Toolbar และรองรับ Pagination

**Checkpoint**: User Story 1 (MVP) ใช้งานได้สมบูรณ์ สามารถดูสต็อก กรอง ค้นหา และสแกนบาร์โค้ดได้

---

## Phase 4: User Story 2 - ปรับยอดสต็อกสินค้าตามประเภทเหตุการณ์ (Priority: P2)

**Goal**: ผู้จัดการร้านสามารถกดปรับยอดสต็อก (IN, OUT, AUDIT, DAMAGE, EXPIRED) พร้อมคำนวณผลต่างอัตโนมัติสำหรับการตรวจนับ และป้องกันสต็อกติดลบ

**Independent Test**: กดปุ่ม "ปรับยอดสต็อก" ที่รายการสินค้าในตาราง เลือกประเภท AUDIT กรอกยอดนับจริง ระบบคำนวณผลต่างให้ ระบุเหตุผล บันทึกสำเร็จแล้วยอดสต็อกในตารางอัปเดตทันที

### Implementation for User Story 2

- [X] T008 [US2] สร้างคอมโพเนนต์ Modal ปรับยอดสต็อก `StockAdjustmentModal.tsx` ใน `src/components/inventory/StockAdjustmentModal.tsx` ตาม `specs/016-inventory-stock-management/contracts/ui-contracts.md` (รองรับประเภท IN, OUT, AUDIT, DAMAGE, EXPIRED; โหมด AUDIT รับค่ายอดนับจริงและคำนวณ Delta ให้อัตโนมัติ; มีช่องระบุเหตุผลบังคับ; ป้องกันสต็อกติดลบ; สร้าง Idempotency Key ด้วย UUID)
- [X] T009 [US2] เชื่อมต่อ `StockAdjustmentModal` เข้ากับ `src/app/(main)/inventory/page.tsx` โดยส่งต่อ `adjustingStock`, `selectedBranchId`, เรียกใช้ `inventoryService.adjustStock` พร้อมแสดง Loading Overlay ระหว่างทำรายการ และรีเฟรชตารางสต็อกเมื่อสำเร็จ

**Checkpoint**: User Story 1 และ User Story 2 ใช้งานร่วมกันได้อย่างสมบูรณ์

---

## Phase 5: User Story 3 - ดูสรุปมูลค่าสต็อกสินค้าคงเหลือ (Priority: P3)

**Goal**: แสดงสรุปมูลค่ารวมของสินค้าคงคลังตามต้นทุนจริงของแต่ละสาขาในหน้าจอ

**Independent Test**: ดูการ์ดสรุป "มูลค่าสินค้าคงคลัง" ที่ส่วนหัวของหน้าคลังสินค้า มูลค่ารวมต้องคำนวณและแสดงผลในสกุลเงินบาทอย่างถูกต้องตาม API หรือยอดรวมต้นทุน x จำนวนคงเหลือ

### Implementation for User Story 3

- [X] T010 [US3] ใน `src/app/(main)/inventory/page.tsx` และ `src/components/inventory/InventorySummaryCards.tsx` เชื่อมต่อการดึงข้อมูลมูลค่าต้นทุนสินค้าคงคลังรวม (จาก `inventoryService.getInventoryValuation` หรือคำนวณจาก `costPerBaseUnit * quantity`) และแสดงผลในรูปแบบสกุลเงินบาทพร้อมคลาสสีที่อ่านง่าย คอนทราสต์สูง

**Checkpoint**: User Story 1, 2, และ 3 ใช้งานได้ครบถ้วนตามข้อกำหนด

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบคุณภาพและความสมบูรณ์ของระบบให้เป็นไปตามมาตรฐานธรรมนูญ

- [X] T011 [P] รันการตรวจสอบ Static Typing ด้วย `npx tsc --noEmit` และแก้ไข Type Error ที่เกี่ยวข้อง
- [X] T012 [P] รันการตรวจสอบโค้ดด้วย `npm run lint` และแก้ไขประเด็น Linting ทั้งหมด
- [X] T013 ทดสอบการสร้าง Production Bundle ด้วย `npm run build`
- [X] T014 ตรวจสอบความถูกต้องตามสถานการณ์ใน `specs/016-inventory-stock-management/quickstart.md` (S1 ถึง S4)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**: ไม่มี Dependency สามารถเริ่มได้ทันที
- **Phase 2 Foundational**: ขึ้นกับ Phase 1 — **บล็อกการเริ่มทำ User Story ทั้งหมด**
- **Phase 3 User Story 1 (P1 MVP)**: ขึ้นกับ Phase 2
- **Phase 4 User Story 2 (P2)**: ขึ้นกับ Phase 3 (เปิด Modal จากรายการสินค้าในตารางของ US1)
- **Phase 5 User Story 3 (P3)**: ขึ้นกับ Phase 3 (แสดงตัวเลขบน Summary Cards ของ US1)
- **Phase 6 Polish**: ดำเนินการหลังพัฒนา User Story ครบถ้วน

### Parallel Opportunities

- T004, T005, T006 สามารถพัฒนาคู่ขนานกันได้หลังจาก Phase 2 เสร็จสิ้น
- T011 และ T012 สามารถรันคู่ขนานกันได้ใน Phase 6
