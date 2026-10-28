# Tasks: ระบบใบสั่งซื้อสินค้าและตรวจรับสินค้าเข้าคลัง (Purchase Orders & Goods Receipts)

**Feature**: `017-purchase-orders-and-goods-receipts`
**Date**: 2026-10-27
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: จัดเตรียมประเภทข้อมูล (Type Definitions) และฟังก์ชันบริการเชื่อมต่อ API กลาง

- [x] T001 Create TypeScript type definitions for Purchase Orders, Goods Receipts, Suppliers, and Receipt Previews in `src/types/procurement.ts`
- [x] T002 Implement procurement service client functions for PO, GR, and Supplier APIs in `src/services/procurement.service.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: โครงสร้างส่วนกลางที่ต้องเสร็จสมบูรณ์ก่อนเริ่มพัฒนาฟังก์ชันในแต่ละ User Story

**⚠️ CRITICAL**: ต้องเสร็จสิ้นขั้นตอนนี้ก่อนเริ่มพัฒนาส่วนประกอบใน User Stories

- [x] T003 [P] Implement currency formatting and satang conversion helpers in `src/utils/currencyHelper.ts`
- [x] T004 Implement Tab navigation bar (`InventoryTabs`) supporting Stock Levels, Purchase Orders, and Goods Receipts in `src/components/inventory/InventoryTabs.tsx`
- [x] T005 Integrate `InventoryTabs` into main inventory layout state in `src/app/(main)/inventory/page.tsx`

**Checkpoint**: Foundation ready - ส่วนประกอบพื้นฐานและแท็บการสลับหน้าจอพร้อมใช้งาน

---

## Phase 3: User Story 1 - จัดการและติดตามใบสั่งซื้อสินค้า (Purchase Orders) (Priority: P1) 🎯 MVP

**Goal**: ผู้ใช้สามารถดูรายการใบสั่งซื้อ กรองสถานะ/สาขา/ซัพพลายเออร์ สร้างใบสั่งซื้อใหม่ ยืนยันการสั่งซื้อ (Confirm PO) และยกเลิกใบสั่งซื้อได้

**Independent Test**: เปิดแท็บ "ใบสั่งซื้อสินค้า" บน `/inventory` สามารถดูตาราง PO, สร้าง PO ใหม่ และกดยืนยันสั่งซื้อสำเร็จ

### Implementation for User Story 1

- [x] T006 [P] [US1] Create PurchaseOrderToolbar component with search, status filters, branch selector, and New PO button in `src/components/inventory/purchase-orders/PurchaseOrderToolbar.tsx`
- [x] T007 [P] [US1] Create PurchaseOrderTable component displaying PO list, status badges, amounts, and action buttons in `src/components/inventory/purchase-orders/PurchaseOrderTable.tsx`
- [x] T008 [US1] Create CreatePurchaseOrderModal component for creating/editing PO with supplier selector, item rows, unit cost, and satang calculation in `src/components/inventory/purchase-orders/CreatePurchaseOrderModal.tsx`
- [x] T009 [US1] Create PurchaseOrderDetailModal component displaying PO details, line items, and confirm/cancel/close action triggers in `src/components/inventory/purchase-orders/PurchaseOrderDetailModal.tsx`
- [x] T010 [US1] Wire PO state, actions, and API Action Loading Overlay in `src/app/(main)/inventory/page.tsx`

**Checkpoint**: User Story 1 ใช้งานได้สมบูรณ์และทดสอบได้แบบอิสระ (ส่งมอบ MVP ได้ทันที)

---

## Phase 4: User Story 2 - ตรวจรับสินค้าเข้าคลังจากใบสั่งซื้อ (Goods Receipt from PO) (Priority: P2)

**Goal**: ตรวจรับสินค้าเข้าคลังโดยดึงรายการค้างรับจาก PO (`/receipt-preview`), รองรับการนับด้วยกล้องสแกนบาร์โค้ด, บันทึก Lot/Expiry, ตรวจสอบยอดเกิน (Over-delivery) และยืนยัน Complete GR เพื่อเพิ่มยอดสต็อก

**Independent Test**: เลือก PO สถานะ ORDERED กดตรวจรับสินค้า ดึงรายการค้างรับมาอัตโนมัติ สแกน/ระบุจำนวน และกดยืนยันตรวจรับ สต็อกสาขาเพิ่มขึ้นทันที

### Implementation for User Story 2

- [x] T011 [P] [US2] Create OverDeliveryWarningModal confirmation dialog for excess quantity in `src/components/inventory/goods-receipts/OverDeliveryWarningModal.tsx`
- [x] T012 [US2] Create CreateGoodsReceiptModal component supporting PO receipt-preview loading, line inspection, lot/expiry, and BarcodeCaptureModal camera scan integration in `src/components/inventory/goods-receipts/CreateGoodsReceiptModal.tsx`
- [x] T013 [US2] Implement Complete Goods Receipt confirmation flow with API Action Loading Overlay and stock level refresh in `src/app/(main)/inventory/page.tsx`

**Checkpoint**: User Stories 1 และ 2 ทำงานร่วมกันและทดสอบได้อย่างสมบูรณ์

---

## Phase 5: User Story 3 - ดูประวัติใบตรวจรับสินค้าและการตรวจรับโดยตรง (Priority: P3)

**Goal**: ดูตารางรายการใบตรวจรับสินค้าทั้งหมด (GR History) และสร้างใบตรวจรับตรง (Direct Goods Receipt)

**Independent Test**: เปิดแท็บ "ตรวจรับสินค้าเข้าคลัง" ดูประวัติใบตรวจรับ และสามารถสร้างใบตรวจรับตรงโดยระบุซัพพลายเออร์และสินค้าได้

### Implementation for User Story 3

- [x] T014 [P] [US3] Create GoodsReceiptToolbar component with search, date range, supplier filter, and New Direct Receipt button in `src/components/inventory/goods-receipts/GoodsReceiptToolbar.tsx`
- [x] T015 [P] [US3] Create GoodsReceiptTable component displaying GR list, invoice number, items, and status badges in `src/components/inventory/goods-receipts/GoodsReceiptTable.tsx`
- [x] T016 [US3] Create GoodsReceiptDetailModal component displaying received items, rejected quantity, and reject reasons in `src/components/inventory/goods-receipts/GoodsReceiptDetailModal.tsx`
- [x] T017 [US3] Integrate Direct Goods Receipt workflow and GR history state in `src/app/(main)/inventory/page.tsx`

**Checkpoint**: User Stories ทั้ง 3 ส่วนทำงานสมบูรณ์ครบวงจร

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบความสอดคล้องตามธรรมนูญ ประสิทธิภาพ และการทำงานแบบ End-to-End

- [x] T018 [P] Verify touch targets (>= 48x48px) and high contrast on all new buttons and inputs across mobile and desktop views in `src/components/inventory/`
- [x] T019 [P] Update navigation documentation and system API guide in `docs/`
- [x] T020 Run end-to-end validation according to `specs/017-purchase-orders-and-goods-receipts/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ไม่มี Dependency สามารถเริ่มได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Setup (Phase 1) - บล็อกทุก User Story
- **User Stories (Phase 3+)**: ขึ้นอยู่กับ Foundational (Phase 2)
  - พัฒนาตามลำดับความสำคัญ (P1 → P2 → P3)
- **Polish (Phase 6)**: ขึ้นอยู่กับ User Stories ทั้งหมด

### User Story Dependencies

- **User Story 1 (P1)**: สามารถเริ่มได้ทันทีหลัง Phase 2
- **User Story 2 (P2)**: เริ่มได้หลัง Phase 2 (ใช้รายการ PO จาก US1 ในการทดสอบ receipt-preview)
- **User Story 3 (P3)**: เริ่มได้หลัง Phase 2 (แชร์คอมโพเนนต์และการตรวจรับร่วมกับ US2)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ดำเนินการ Phase 1 (Setup) และ Phase 2 (Foundational)
2. ดำเนินการ Phase 3 (User Story 1: Purchase Orders)
3. ตรวจสอบและทดสอบ User Story 1 แบบอิสระ (ส่งมอบ MVP ใช้งานได้ทันที)

### Incremental Delivery

1. Setup + Foundation พร้อม
2. เพิ่ม User Story 1 (PO) → ตรวจสอบการออกใบสั่งซื้อ
3. เพิ่ม User Story 2 (GR from PO) → ตรวจสอบการดึงค้างรับและนำสต็อกเข้าคลัง
4. เพิ่ม User Story 3 (Direct GR & History) → ตรวจสอบประวัติและการรับตรง
