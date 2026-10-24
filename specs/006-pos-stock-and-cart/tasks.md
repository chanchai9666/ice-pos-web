# Tasks: การแสดงจำนวนสินค้าคงเหลือ/ชั่งขาย และปรับปรุงตะกร้าสินค้า POS (POS Stock Level Display & Cart UX Enhancements)

## Phase 1: Setup (Shared Types & Data Contracts)

**Purpose**: กำหนดประเภทข้อมูลและโมเดลสำหรับระดับสต็อกสินค้าคงคลัง

- [X] T001 [P] Create inventory TypeScript types and StockLevelMap interface in src/types/inventory.ts
- [X] T002 [P] Update CartItem and Pos types in src/types/pos.ts to support active highlight and thumbnail rendering

---

## Phase 2: Foundational (Inventory Service & API Integration)

**Purpose**: สร้างเซอร์วิสเชื่อมต่อ API สต็อกสินค้าคงคลังระดับสาขาที่ทุก User Story ต้องใช้งาน

**⚠️ CRITICAL**: ต้องทำให้เสร็จก่อนเริ่มการแสดงผลสต็อกบนหน้าจอขาย

- [X] T003 Implement inventoryService.getStockLevels in src/services/inventory.service.ts matching GET /api/v1/inventory/stocks
- [X] T004 Integrate branch stock level fetching and stockMap state in src/app/(main)/pos/page.tsx

**Checkpoint**: โครงสร้างข้อมูลสต็อกและเซอร์วิสพร้อมใช้งาน — สามารถเริ่มพัฒนา User Story แต่ละส่วนได้

---

## Phase 3: User Story 1 - การแสดงจำนวนสินค้าคงเหลือและการระบุสินค้าชั่งขายบนการ์ดสินค้า (Priority: P1) 🎯 MVP

**Goal**: แสดงสถานะสต็อกคงเหลือจริงสำหรับสินค้าขายเป็นชิ้น และแสดงป้าย "ชั่งขาย" สำหรับสินค้าขายตามน้ำหนัก บนการ์ดสินค้าของ POS

**Independent Test**: เปิดหน้า POS ตรวจสอบการ์ดสินค้า: สินค้าประเภท PRICE_PER_UNIT แสดงจำนวนคงเหลือหรือป้าย "สินค้าหมด" ส่วนสินค้าประเภท BY_WEIGHT แสดงป้าย "ชั่งขาย" อย่างชัดเจน

### Implementation for User Story 1

- [X] T005 [US1] Update PosProductGridProps to accept stockMap in src/components/pos/PosProductGrid.tsx
- [X] T006 [US1] Implement stock level badges (in-stock, low-stock, out-of-stock) for PRICE_PER_UNIT products in src/components/pos/PosProductGrid.tsx
- [X] T007 [US1] Implement "ชั่งขาย" badge for BY_WEIGHT products in src/components/pos/PosProductGrid.tsx
- [X] T008 [US1] Connect stockMap from page state into PosProductGrid in src/app/(main)/pos/page.tsx

**Checkpoint**: User Story 1 ใช้งานได้สมบูรณ์ แคชเชียร์มองเห็นสต็อกและประเภทชั่งขายอย่างถูกต้อง

---

## Phase 4: User Story 2 - การแสดงรูปภาพขนาดเล็กในแต่ละรายการของตะกร้าสินค้า (Priority: P1)

**Goal**: แสดงรูปภาพตัวอย่างขนาดเล็ก (Thumbnail) ในแต่ละแถวของตะกร้าสินค้า เพื่อให้ตรวจสอบรายการในบิลได้รวดเร็ว

**Independent Test**: เพิ่มสินค้าลงในตะกร้า ทั้งรายการที่มีรูปและไม่มีรูป ตรวจสอบว่ามีรูปขนาดเล็ก 44-48px หรือไอคอน Fallback ปรากฏอย่างสวยงามโดยไม่กระทบขนาดปุ่มกด >= 48px

### Implementation for User Story 2

- [X] T009 [US2] Update PosCartItemRow layout to include a 44x44px product thumbnail image with rounded corners in src/components/pos/PosCartItemRow.tsx
- [X] T010 [US2] Implement fallback icon handling with Icons.Package and onError handling in src/components/pos/PosCartItemRow.tsx
- [X] T011 [US2] Ensure touch targets of +/- quantity buttons and delete button remain >= 48px in src/components/pos/PosCartItemRow.tsx

**Checkpoint**: User Story 2 ใช้งานได้สมบูรณ์ แถวรายการในตะกร้ามีรูปภาพประกอบชัดเจน

---

## Phase 5: User Story 3 - การเลื่อนแสดงสินค้าล่าสุดในตะกร้าอัตโนมัติ ไม่ค้างอยู่ด้านบน (Priority: P1)

**Goal**: เมื่อเพิ่มสินค้าใหม่หรือแก้ไขจำนวนสินค้า แผงตะกร้าจะเลื่อนมุมมองไปยังตำแหน่งสินค้าล่าสุดโดยอัตโนมัติ พร้อมไฮไลต์สีชั่วคราว

**Independent Test**: ใส่สินค้า 6-10 รายการจนเกิด Scrollbar เลื่อนขึ้นบนสุด แล้วสแกนสินค้าใหม่ ตรวจสอบว่าหน้าจอตะกร้าเลื่อนไปยังสินค้าชิ้นล่าสุดอย่างราบรื่น (Smooth Scroll) พร้อมไฮไลต์เตือน

### Implementation for User Story 3

- [X] T012 [US3] Add lastActiveItemId state and tracking in addItem and updateQuantity in src/context/PosCartContext.tsx
- [X] T013 [US3] Implement auto-scroll ref and scrollIntoView logic for lastActiveItemId in src/components/pos/PosCartPanel.tsx
- [X] T014 [US3] Add visual pulse/ring highlight styling to PosCartItemRow when isHighlighted is true in src/components/pos/PosCartItemRow.tsx

**Checkpoint**: User Story 3 ใช้งานได้สมบูรณ์ รายการล่าสุดในตะกร้าถูกเลื่อนแสดงทันที ไม่ค้างอยู่ด้านบน

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบคุณภาพโค้ด การแสดงผลบนจอสัมผัส และความเข้ากันได้ตามมาตรฐานของระบบ

- [X] T015 Run TypeScript build check (npm run build or npx tsc --noEmit) to ensure zero compilation errors
- [X] T016 Run ESLint check to ensure code conforms to repository linting rules
- [X] T017 Execute end-to-end verification scenarios per specs/006-pos-stock-and-cart/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: สามารถเริ่มทำได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Phase 1 (ต้องการ Type จาก T001, T002)
- **User Story 1 (Phase 3)**: ขึ้นอยู่กับ Phase 2 (ต้องการ Stock Service และ Loader จาก T003, T004)
- **User Story 2 (Phase 4)**: สามารถทำควบคู่กับ Phase 3 หรือทำต่อจาก Phase 2 ได้ทันที
- **User Story 3 (Phase 5)**: ขึ้นอยู่กับ PosCartContext และ PosCartPanel
- **Polish (Phase 6)**: ดำเนินการเมื่อ User Story ทุกข้อเสร็จสิ้น

### Parallel Opportunities

- T001 และ T002 สามารถทำพร้อมกันได้ [P]
- Phase 3 (US1) และ Phase 4 (US2) ทำงานกับคนละคอมโพเนนต์หลัก (`PosProductGrid` vs `PosCartItemRow`) สามารถพัฒนาควบคู่กันได้

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. เสร็จสิ้น Phase 1 และ Phase 2
2. เสร็จสิ้น Phase 3 (User Story 1 - สต็อกคงเหลือ และ ชั่งขาย)
3. ตรวจสอบความถูกต้องของการ์ดสินค้า

### Incremental Delivery

1. ติดตั้ง Phase 1 + Phase 2 (โครงสร้างข้อมูลและ Service)
2. ติดตั้ง Phase 3 (สต็อกบนการ์ดสินค้า)
3. ติดตั้ง Phase 4 (Thumbnail ในตะกร้า)
4. ติดตั้ง Phase 5 (Auto-Scroll และ Highlight)
5. สรุปผลและตรวจสอบ Phase 6 (Polish & Verification)
