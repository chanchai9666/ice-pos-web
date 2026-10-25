# Tasks: ระบบแสดง Loading Overlay บล็อกการทำงานขณะมี Action เรียกใช้งาน API (API Action Loading Overlay & Interaction Blocking)

**Branch**: `010-api-action-overlay` | **Date**: 2026-10-25 | **Spec**: [spec.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/010-api-action-overlay/spec.md) | **Plan**: [plan.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/010-api-action-overlay/plan.md)

## Phase 1: Setup (Types & Core Definitions)

**Purpose**: กำหนดโครงสร้างประเภทข้อมูลพื้นฐานและขยายพารามิเตอร์การเรียก API เพื่อรองรับการควบคุม Overlay

- [X] T001 Define `OverlayState`, `OverlayListener`, and `LoadingOverlayContextValue` in `src/types/overlay.ts`
- [X] T002 [P] Extend `RequestOptions` with `loadingMessage?: string`, `silent?: boolean`, and `timeoutMs?: number` in `src/types/auth.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: โครงสร้างพื้นฐานหลักของระบบ Coordinator, React Context และ UI Component ซึ่งต้องเสร็จก่อนเริ่มเชื่อมต่อใน User Stories

**⚠️ CRITICAL**: ต้องสร้าง Coordinator และ Context ให้เสร็จสมบูรณ์ก่อนเพื่อรองรับการเรียกใช้งานในทุก User Story

- [ ] T003 Implement `overlayCoordinator` with reference counter, listener subscription, and emergency reset in `src/services/overlay-coordinator.ts`
- [ ] T004 Create `LoadingOverlayContext` and `LoadingOverlayProvider` subscribing to coordinator state in `src/context/LoadingOverlayContext.tsx`
- [ ] T005 [P] Create Elderly-Friendly presentation component `LoadingOverlay` with high contrast backdrop and large spinner in `src/components/ui/LoadingOverlay.tsx`
- [ ] T006 Mount `LoadingOverlayProvider` and `<LoadingOverlay />` at the root application layout in `src/app/layout.tsx`

**Checkpoint**: โครงสร้างพื้นฐาน Overlay พร้อมใช้งานและพร้อมเชื่อมโยงกับคำขอเครือข่าย

---

## Phase 3: User Story 1 - Transaction & Form Submission Blocking Overlay (Priority: P1) 🎯 MVP

**Goal**: เมื่อผู้ใช้กดกระทำการสำคัญ (ชำระเงิน, บันทึกฟอร์ม, ลบสินค้า) ระบบจะแสดง Backdrop และ Loading Spinner บล็อกการกดหน้าจอซ้ำจนกว่า API จะประมวลผลเสร็จสิ้น

**Independent Test**: ทำการเลือกสินค้าและกดปุ่มยืนยันชำระเงิน ตรวจสอบว่าหน้าจอถูกบล็อกด้วย Backdrop และข้อความโหลดทันที ไม่สามารถคลิกปุ่มซ้ำได้ และปลดล็อกเมื่อทำรายการสำเร็จหรือเกิดข้อผิดพลาด

- [ ] T007 [US1] Integrate `overlayCoordinator.startRequest()` and `overlayCoordinator.endRequest()` into `request()` in `src/services/api.ts`
- [ ] T008 [US1] Add timeout auto-dismissal (15s default, 30s payment/checkout) with `AbortController` in `src/services/api.ts`
- [ ] T009 [US1] Ensure checkout and payment submission in `src/components/pos/PosCheckoutModal.tsx` activates the blocking overlay with message "กำลังประมวลผลการชำระเงิน กรุณารอสักครู่..."
- [ ] T010 [US1] Ensure error handling in `src/services/api.ts` dismisses overlay and propagates Thai error alert cleanly without UI freeze

**Checkpoint**: ระบบป้องกันการกดส่งข้อมูลซ้ำในธุรกรรมสำคัญสำเร็จตามข้อกำหนด MVP

---

## Phase 4: User Story 2 - Data Query & Navigation Action Overlay (Priority: P2)

**Goal**: จัดการแสดงผลและควบคุมสถานะเมื่อผู้ใช้ค้นหาหรือโหลดข้อมูลรายการสินค้า/หมวดหมู่ เพื่อไม่ให้เกิดภาวะข้อมูลสับสนหรือกดย้ำ

**Independent Test**: ทำการพิมพ์ค้นหาสินค้าหรือกดสลับหมวดหมู่สินค้า ตรวจสอบว่าระบบแสดงข้อความโหลดบอกความคืบหน้าและควบคุมไม่ให้กดซ้ำรัวๆ

- [ ] T011 [US2] Update catalog/product search and category change triggers to display loading overlay/indicator in `src/components/pos/PosProductGrid.tsx`
- [ ] T012 [US2] Support custom `loadingMessage` parameter in `src/services/product.service.ts` for product fetching and filtering

**Checkpoint**: การค้นหาและสลับหมวดหมู่สินค้าทำงานร่วมกับระบบแสดงสถานะได้อย่างราบรื่น

---

## Phase 5: User Story 3 - Silent Background Requests Differentiation (Priority: P3)

**Goal**: ยกเว้นคำขอประมวลผลเบื้องหลังแบบเงียบ (เช่น Silent Token Refresh) ไม่ให้แสดง Full Blocking Overlay ตามธรรมนูญ v1.5.1

**Independent Test**: ขณะเลือกดูสินค้าบนหน้าจอขาย POS จำลองให้ Access Token หมดอายุ ตรวจสอบว่าระบบต่ออายุ Token เบื้องหลังสำเร็จโดยไม่มี Full Blocking Overlay ขัดขวางการทำงาน

- [ ] T013 [US3] Configure `performTokenRefresh()` in `src/services/api.ts` to pass `{ silent: true }` so it bypasses overlay coordinator
- [ ] T014 [US3] Verify that background network requests and token refresh execute without mounting or triggering the global blocking backdrop

**Checkpoint**: คำของานเบื้องหลังแบบเงียบทำงานได้อย่างราบรื่นโดยไม่กระทบต่อประสบการณ์ของแคชเชียร์

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบความสมบูรณ์ ความสอดคล้องกับธรรมนูญ และการทดสอบตามสถานการณ์

- [ ] T015 [P] Verify Elderly-Friendly accessibility, minimum font size 18px, and WCAG 2.1 AA contrast in `src/components/ui/LoadingOverlay.tsx`
- [ ] T016 Run full validation scenarios per `quickstart.md` across POS checkout, error recovery, and silent refresh

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ไม่มี dependencies - เริ่มต้นได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Phase 1 - เป็นเงื่อนไขบังคับก่อนเริ่ม User Stories ทั้งหมด
- **User Story 1 (Phase 3)**: ขึ้นอยู่กับ Phase 2 - ส่งมอบเป็น MVP แรก
- **User Story 2 (Phase 4)**: ขึ้นอยู่กับ Phase 2 และ 3
- **User Story 3 (Phase 5)**: ขึ้นอยู่กับ Phase 2 และ 3
- **Polish (Phase 6)**: ดำเนินการหลัง User Stories เสร็จสิ้น

### Parallel Opportunities

- T001 และ T002 สามารถทำควบคู่กันได้ (คนละไฟล์)
- T004 และ T005 สามารถทำควบคู่กันได้
- T011 และ T013 อยู่คนละไฟล์ สามารถพัฒนาควบคู่กันได้หลังจาก Foundation เสร็จสิ้น
- T015 สามารถทำควบคู่กับงาน Polish อื่นๆ ได้

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. ดำเนินการ Phase 1 (Setup Types)
2. ดำเนินการ Phase 2 (Foundational Coordinator & Context)
3. ดำเนินการ Phase 3 (User Story 1 - Blocking Overlay สำหรับชำระเงินและบันทึกฟอร์ม)
4. ทดสอบความถูกต้อง: ตรวจสอบการบล็อกคลิกซ้ำ และการปลดล็อกเมื่อสำเร็จ/ล้มเหลว
5. ต่อยอด User Story 2 และ 3 ตามลำดับ
