# Tasks: การแสดงจำนวนสินค้าคงเหลือและการแจ้งเตือนขอบสีสต็อกบนการ์ดสินค้า POS (POS Product Stock Level & Border Status Alerts)

**Feature**: `007-pos-product-stock-alerts`  
**Input**: Design artifacts from `specs/007-pos-product-stock-alerts/` (`spec.md`, `plan.md`, `data-model.md`, `contracts/`, `quickstart.md`)  
**Status**: Ready for Implementation  

---

## Phase 1: Setup (Types & Presentation Helpers)

**Purpose**: จัดเตรียม Type Definitions และฟังก์ชันคำนวณสถานะสต็อกสำหรับการ์ดสินค้า

- [x] T001 [P] เพิ่มประเภทข้อมูล `ProductStockStatus` ('IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK') และ `ProductStockPresentation` ใน `src/types/inventory.ts`
- [x] T002 [P] สร้างฟังก์ชัน Helper `resolveProductStockPresentation` ตามสัญญาใน `data-model.md` ใน `src/utils/posStockHelper.ts`

---

## Phase 2: Foundational (Product Grid Integration Preparation)

**Purpose**: เชื่อมโยงฟังก์ชัน Helper เข้ากับคอมโพเนนต์การ์ดสินค้าใน POS

- [x] T003 นำเข้า `resolveProductStockPresentation` และเตรียมโครงสร้างการนำเสนอผลสต็อกบนการ์ดสินค้าใน `src/components/pos/PosProductGrid.tsx`

---

## Phase 3: User Story 1 - การแสดงจำนวนสินค้าคงเหลือสำหรับสินค้าที่ไม่ใช่ชั่งขาย (Priority: P1) 🎯 MVP

**Goal**: สินค้าที่ไม่ใช่แบบชั่งขายทุกรายการต้องแสดงจำนวนสินค้าคงเหลือพร้อมหน่วยนับเสมอ (เช่น "คงเหลือ: 15 ชิ้น" หรือ "คงเหลือ 0 ชิ้น") โดยไม่ปล่อยว่างหรือซ่อนข้อมูล

**Independent Test**: เปิดหน้าจอ POS และตรวจสอบการ์ดสินค้าทุกรายการ: สินค้าขายตามหน่วยต้องแสดงจำนวนสต็อกคงเหลือชัดเจน ไม่มีการ์ดใดตกหล่น และสินค้าชั่งขายแสดงป้าย "ชั่งขาย"

### Implementation for User Story 1

- [x] T004 [US1] ปรับปรุง `src/components/pos/PosProductGrid.tsx` ให้แสดงตัวเลขสต็อกคงเหลือพร้อมหน่วยนับของสินค้าที่ไม่ใช่ชั่งขายทุกรายการ โดยกำหนดค่าเริ่มต้นเป็น 0 เสมอเมื่อไม่พบยอดสต็อกในสาขา
- [x] T005 [US1] คงการแสดงผลป้ายกำกับและข้อความ "ชั่งขาย" สำหรับสินค้าประเภทขายตามน้ำหนัก (`productType === 'BY_WEIGHT'`) โดยไม่แสดงตัวเลขคงเหลือเป็นชิ้นใน `src/components/pos/PosProductGrid.tsx`

---

## Phase 4: User Story 2 - การแจ้งเตือนด้วยขอบสีส้มสำหรับสินค้าใกล้หมด และขอบสีแดงสำหรับสินค้าหมด (Priority: P1)

**Goal**: การ์ดสินค้าแสดงขอบสีส้มหนา 2px (`border-amber-500`) เมื่อสต็อกใกล้หมด และขอบสีแดงหนา 2px (`border-rose-500`) เมื่อสินค้าหมดสต็อก ตามเกณฑ์ Elderly-Friendly

**Independent Test**: ตรวจสอบการ์ดสินค้าที่มีระดับสต็อกต่างกัน: สต็อก `<= 0` มีขอบสีแดงพร้อมป้าย "สินค้าหมด", สต็อก `<= (minStock || 5)` มีขอบสีส้มพร้อมป้าย "ใกล้หมด: X", สต็อกปกติมีขอบมาตรฐาน

### Implementation for User Story 2

- [x] T006 [US2] ปรับแต่งขอบการ์ดสินค้าเป็นเส้นขอบสีส้มหนา 2px (`border-amber-500`) พร้อมป้ายสีส้มและตัวหนังสือระบุสถานะใกล้หมดใน `src/components/pos/PosProductGrid.tsx`
- [x] T007 [US2] ปรับแต่งขอบการ์ดสินค้าเป็นเส้นขอบสีแดงหนา 2px (`border-rose-500`) พร้อมป้ายสีแดง "สินค้าหมด" ใน `src/components/pos/PosProductGrid.tsx`
- [x] T008 [US2] กำหนดให้สินค้าสต็อกปกติและสินค้าชั่งขายคงเส้นขอบมาตรฐาน (`border-slate-800 hover:border-cyan-500/60`) พร้อมรักษาคอนทราสต์เมื่อนำเมาส์ชี้หรือแตะสัมผัสใน `src/components/pos/PosProductGrid.tsx`

---

## Phase 5: User Story 3 - การตอบสนองเมื่อแคชเชียร์เลือกสินค้าที่มีการแจ้งเตือนสต็อก (Priority: P2)

**Goal**: เมื่อแคชเชียร์กดเลือกสินค้าที่มีขอบสีแดง (สินค้าหมด) ระบบอนุญาตให้เพิ่มลงในบิลได้ตามปกติ แต่จะแสดง Toast Notification เตือนให้แคชเชียร์รับทราบ

**Independent Test**: แตะเลือกการ์ดสินค้าที่มีขอบสีแดง แล้วตรวจสอบว่าสินค้าถูกเพิ่มลงในตะกร้าพร้อมมี Toast แจ้งเตือนสินค้าหมดสต็อกปรากฏขึ้น

### Implementation for User Story 3

- [x] T009 [US3] ปรับปรุงฟังก์ชัน `handleSelectProduct` ใน `src/app/(main)/pos/page.tsx` ให้เพิ่มสินค้าลงตะกร้าตามปกติ พร้อมแสดง Toast Notification แจ้งเตือนเมื่อสินค้าที่เลือกมีสต็อก `<= 0`

---

## Phase 6: Polish & Verification

**Purpose**: ตรวจสอบคุณภาพโค้ด ความเข้ากันได้ของระบบ และยืนยันความถูกต้องตามเกณฑ์ทั้งหมด

- [x] T010 [P] ตรวจสอบ TypeScript Strict Types ทั่วทั้งโปรเจกต์ด้วย `npx tsc --noEmit`
- [x] T011 [P] ตรวจสอบ Linting และมาตรฐานโค้ดด้วย `npm run lint`
- [x] T012 ดำเนินการทดสอบยืนยันตามสถานการณ์ใน `specs/007-pos-product-stock-alerts/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) ──► Phase 2 (Foundational) ──► Phase 3 (US1: Stock Display) 🎯 MVP
                                            ├──► Phase 4 (US2: Border Alerts)
                                            └──► Phase 5 (US3: Out-of-Stock Selection)
                                                     │
                                                     ▼
                                              Phase 6 (Polish & Verification)
```

- **Phase 1 (Setup)**: ไม่มี Dependencies สามารถดำเนินการได้ทันที
- **Phase 2 (Foundational)**: ขึ้นอยู่กับ Phase 1
- **Phase 3 & 4 (User Stories 1 & 2 - P1)**: ดำเนินการหลัง Phase 2 เสร็จสมบูรณ์ (สามารถทำควบคู่กันได้)
- **Phase 5 (User Story 3 - P2)**: ดำเนินการต่อจาก Phase 3 & 4
- **Phase 6 (Polish & Verification)**: ดำเนินการหลังทุก User Story เสร็จสิ้น

### Parallel Opportunities

- `T001` และ `T002` ใน Phase 1 สามารถทำพร้อมกันได้ ([P]) เนื่องจากทำงานคนละไฟล์
- `T010` และ `T011` ใน Phase 6 สามารถรันพร้อมกันได้ ([P])

---

## Implementation Strategy

### MVP Scope (User Story 1 Only)
1. ทำ Phase 1 (Setup: Types & Helper)
2. ทำ Phase 2 (Foundational)
3. ทำ Phase 3 (User Story 1: แสดงสต็อกครบทุกสินค้าที่ไม่ใช่ชั่งขาย)
4. ตรวจสอบการ์ดสินค้าบนหน้าจอ POS ว่าทุกรายการมีตัวเลขสต็อกแสดงชัดเจน

### Full Feature Delivery
1. ต่อยอดด้วย Phase 4 (User Story 2: แสดงขอบสีส้มและขอบสีแดงตามเกณฑ์สต็อก)
2. ต่อยอดด้วย Phase 5 (User Story 3: เพิ่ม Toast แจ้งเตือนเมื่อขายสินค้าหมดสต็อก)
3. ปิดท้ายด้วย Phase 6 (ตรวจสอบ Types, Lint และ Quickstart)
