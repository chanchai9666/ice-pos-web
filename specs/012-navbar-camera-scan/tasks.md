# Tasks: ปุ่มสแกนสินค้าด้วยกล้องบน Navbar (Navbar Camera Product Scanner Button)

**Feature**: `012-navbar-camera-scan`  
**Date**: 2026-10-26  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: จัดเตรียมฟังก์ชันตัวกลางและนิยาม Event Contract สำหรับการสั่งเปิดกล้องสแกนจากส่วนต่าง ๆ ของแอพพลิเคชัน

- [X] T001 [P] Define event constant `OPEN_CAMERA_SCANNER_EVENT` and helper function `triggerCameraScanner(router, pathname)` in `src/utils/navigation.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ปรับปรุงหน้าจุดขาย POS เพื่อรองรับการเปิดกล้องสแกนผ่าน Event และ URL Query Parameter

**⚠️ CRITICAL**: ต้องติดตั้งระบบรับ Event ในหน้า POS ให้พร้อมก่อนนำปุ่มบน Navbar มาเชื่อมต่อ

- [X] T002 Implement event listener for `OPEN_CAMERA_SCANNER_EVENT` to open `PosCameraScannerModal` (or `PosOpenShiftModal` if shift inactive) in `src/app/(main)/pos/page.tsx`
- [X] T003 Implement query param handler for `?scan=camera` with automatic URL cleanup (`router.replace`) in `src/app/(main)/pos/page.tsx`

**Checkpoint**: ระบบรับคำสั่งเปิดกล้องสแกนพร้อมทำงาน — เริ่มพัฒนาปุ่มบน Navbar ในแต่ละ User Story ได้ทันที

---

## Phase 3: User Story 1 - สแกนสินค้าด้วยกล้องผ่านปุ่มบนแถบนำทางได้อย่างรวดเร็วในหน้าจุดขาย (Priority: P1) 🎯 MVP

**Goal**: เพิ่มปุ่มสแกนด่วนบนแถบนำทางเพื่อให้แคชเชียร์สามารถกดเปิดกล้องสแกนบาร์โค้ดได้ทันทีขณะอยู่ในหน้า POS

**Independent Test**: เปิดหน้า `/pos` ที่มีกะการขาย กดปุ่มสแกนบน Navbar ตรวจสอบว่า `PosCameraScannerModal` เปิดขึ้นมาพร้อมภาพสดจากกล้อง และเมื่อส่องบาร์โค้ด สินค้าถูกเพิ่มลงตะกร้าพร้อมเสียงแจ้งเตือน

### Implementation for User Story 1

- [X] T004 [US1] Integrate `triggerCameraScanner` into POS page action triggers and verify direct event dispatching in `src/app/(main)/pos/page.tsx`
- [X] T005 [US1] Validate continuous scanning and audio feedback behavior using existing modal in `src/components/pos/PosCameraScannerModal.tsx`

**Checkpoint**: User Story 1 สมบูรณ์ — สามารถกดสแกนกล้องได้รวดเร็วและเพิ่มสินค้าเข้าตะกร้าได้ตามปกติ

---

## Phase 4: User Story 2 - การเข้าถึงปุ่มสแกนกล้องที่เหมาะสมกับทุกขนาดหน้าจอและรองรับผู้สูงอายุ (Priority: P2)

**Goal**: ออกแบบและติดตั้งปุ่มสแกนสินค้าบน Navbar ทั้งบนหน้าจอเดสก์ท็อป (`AppHeader`) และหน้าจอสัมผัสพกพา (`AppBottomNav`) ตามมาตรฐาน Elderly-Friendly (พื้นที่สัมผัส >= 48x48px)

**Independent Test**: ทดสอบบนหน้าจอขนาดเดสก์ท็อป (>= 1024px) และขนาดมือถือ/แท็บเล็ต (< 1024px) วัดขนาดพื้นที่สัมผัสของปุ่มสแกนว่ามีขนาดไม่ต่ำกว่า 48px และมีคอนทราสต์สีชัดเจน

### Implementation for User Story 2

- [X] T006 [P] [US2] Add desktop camera scanner button with `>= 48px` touch target and `Icons.Camera` in `src/components/layout/AppHeader.tsx`
- [X] T007 [P] [US2] Add mobile/tablet quick camera scan button with `>= 48x48px` touch target and high-contrast styling in `src/components/layout/AppBottomNav.tsx`

**Checkpoint**: User Story 2 สมบูรณ์ — ปุ่มสแกนแสดงผลสวยงามและกดง่ายบนทุกขนาดหน้าจอ

---

## Phase 5: User Story 3 - สลับเข้าสู่โหมดการขายและเปิดกล้องสแกนทันทีเมื่อกดปุ่มสแกนจากหน้าอื่น (Priority: P3)

**Goal**: เมื่อผู้ใช้อยู่หน้าอื่นที่ไม่ใช่ POS (เช่น แคตตาล็อกสินค้า หรือ สต็อก) และกดปุ่มสแกนบน Navbar ระบบจะนำทางมายัง `/pos` และเปิดกล้องสแกนให้อัตโนมัติ

**Independent Test**: เปิดหน้า `/catalog` กดปุ่มสแกนบน Navbar ตรวจสอบว่าระบบนำทางมาที่ `/pos` และเปิดหน้าต่างกล้องสแกนทันที

### Implementation for User Story 3

- [X] T008 [US3] Verify cross-page redirection and auto-scan triggering from `AppHeader` and `AppBottomNav` to `src/app/(main)/pos/page.tsx`
- [X] T009 [US3] Verify shift-guard behavior prompting `PosOpenShiftModal` when cross-page scan is triggered without an active shift in `src/app/(main)/pos/page.tsx`

**Checkpoint**: ครบทุก User Story — การนำทางและการสแกนข้ามหน้าทำงานได้อย่างราบรื่น

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบคุณภาพโค้ด การจัดวางเลย์เอาต์ และความปลอดภัย

- [X] T010 [P] Run TypeScript type checking and ESLint across all modified files
- [X] T011 Execute validation scenarios per `specs/012-navbar-camera-scan/quickstart.md`
- [X] T012 Verify touch targets and contrast against `.specify/memory/constitution.md` Section 6.5

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: ไม่มี dependency เริ่มต้นได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Setup (T001) — บล็อก User Stories ทั้งหมด
- **User Stories (Phase 3+)**: ขึ้นอยู่กับ Foundational (T002, T003)
  - US1 (T004, T005) สามารถทดสอบในหน้า POS ได้ทันที
  - US2 (T006, T007) ทำงานคู่ขนานได้บน `AppHeader` และ `AppBottomNav`
  - US3 (T008, T009) ตรวจสอบการเชื่อมโยงข้ามหน้า
- **Polish (Phase 6)**: ดำเนินการหลังทุก User Story เสร็จสิ้น

### Parallel Opportunities
- T006 (`AppHeader.tsx`) และ T007 (`AppBottomNav.tsx`) สามารถพัฒนาพร้อมกันได้เนื่องจากอยู่คนละไฟล์
- T010 (Typecheck/Lint) สามารถรันพร้อมกับการตรวจสอบเกณฑ์ Elderly-Friendly (T012)

---

## Implementation Strategy (MVP First)

1. **Step 1**: พัฒนา Setup & Foundational (`triggerCameraScanner` และ Event/Query listener ใน `pos/page.tsx`)
2. **Step 2**: พัฒนา User Story 1 & 2 (ติดตั้งปุ่มบน `AppHeader` และ `AppBottomNav` พร้อมทดสอบการเปิดกล้องในหน้า POS) -> **ได้ MVP ทันที!**
3. **Step 3**: พัฒนา User Story 3 (ทดสอบการกดสแกนจากหน้าอื่นแล้ว Redirect มา POS)
4. **Step 4**: Polish และ Type Check
