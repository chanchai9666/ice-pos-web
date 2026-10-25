# Tasks: การปรับปรุงระบบพิสูจน์ตัวตนแบบผสมผสาน (Hybrid Authentication Support)

**Branch**: `009-hybrid-auth-support` | **Date**: 2026-10-25 | **Spec**: [spec.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/009-hybrid-auth-support/spec.md) | **Plan**: [plan.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/009-hybrid-auth-support/plan.md)

## Phase 1: Setup (Types & Storage Foundation)

**Purpose**: ปรับปรุงคำนิยามประเภทข้อมูลและการจัดการหน่วยจัดเก็บเพื่อรองรับ Hybrid Auth

- [X] T001 Update `src/types/auth.ts` to define RequestOptions with credentials transport and SessionLifecycleEvent types
- [X] T002 [P] Update storage helpers in `src/utils/storage.ts` to support optional token presence while preserving branch and user preferences

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ปรับปรุงกลไกการส่งคำขอระดับระบบใน API Client ให้รองรับ `credentials: 'include'` และ Header แบบผสมผสาน

**⚠️ CRITICAL**: ต้องปรับปรุงแกนกลางการส่งคำขอให้เรียบร้อยก่อนจึงจะพัฒนา User Story อื่นได้

- [X] T003 Configure default `credentials: 'include'` and hybrid `Authorization: Bearer <token>` attachment in `request()` in `src/services/api.ts`

**Checkpoint**: แกนกลาง API Client รองรับการรับส่ง HttpOnly Cookie ข้าม Origin พร้อมสำหรับการทำงานทุก User Story

---

## Phase 3: User Story 1 - Dual-Credential API Access (Priority: P1) 🎯 MVP

**Goal**: คำขอทุกคำขอส่งผ่านข้อมูลรับรองความปลอดภัยไปยังเซิร์ฟเวอร์ทั้งผ่านคุกกี้และส่วนหัวคำขอได้อย่างราบรื่น

**Independent Test**: เข้าสู่ระบบ POS และเรียกดูข้อมูลร้านค้า ข้อมูลสินค้า และข้อมูลโปรไฟล์ ตรวจสอบว่ามีคุกกี้แนบไปในแท็บ Network และได้รับผลลัพธ์ 200 OK

- [X] T004 [US1] Update `src/services/auth.service.ts` to ensure login and pinLogin endpoints operate with credentials transport
- [X] T005 [US1] Update RouteGuard in `src/components/layout/RouteGuard.tsx` to verify authentication state seamlessly in hybrid mode

**Checkpoint**: ผู้ใช้งานสามารถเข้าสู่ระบบและเรียกใช้งาน Protected Endpoints ทั้งหมดได้อย่างปลอดภัยผ่านคุกกี้และส่วนหัว

---

## Phase 4: User Story 2 - Silent Session Renewal via Hybrid Channels (Priority: P1)

**Goal**: ต่ออายุเซสชันการใช้งานเบื้องหลังโดยอัตโนมัติผ่านช่องทางแบบผสมผสาน (Cookie และ Payload Fallback) โดยไม่ขัดจังหวะการขาย

**Independent Test**: จำลองให้ Access Token หมดอายุขณะทำรายการขาย ตรวจสอบว่าระบบส่งคำขอ `/api/v1/auth/refresh` เบื้องหลังและ Retry คำขอสำเร็จ

- [X] T006 [US2] Update `performTokenRefresh` in `src/services/api.ts` to send `/api/v1/auth/refresh` with `credentials: 'include'` and optional fallback payload
- [X] T007 [US2] Update `refreshToken` method signature and body handling in `src/services/auth.service.ts` to support optional refreshToken argument
- [X] T008 [US2] Verify single-flight refresh queueing and error notification dispatch in `src/services/api.ts`

**Checkpoint**: การต่ออายุเซสชันทำงานได้อย่างเงียบสนิท ไม่เกิดการสะดุดบนหน้าจอขายหน้าร้าน

---

## Phase 5: User Story 3 - Comprehensive Dual-Clear Logout (Priority: P2)

**Goal**: ออกจากระบบอย่างสมบูรณ์ทั้งการสั่งเซิร์ฟเวอร์ล้าง HttpOnly Cookie และการล้างข้อมูลสิทธิ์บนอุปกรณ์ โดยยังคงจดจำสาขาเดิมไว้

**Independent Test**: กดปุ่มออกจากระบบ ตรวจสอบคำขอ `POST /api/v1/auth/logout` ใน Network tab และตรวจสอบว่าคุกกี้และโทเค็นในเครื่องถูกล้างหมดจด

- [X] T009 [US3] Add `logout()` method calling `POST /api/v1/auth/logout` with `credentials: 'include'` in `src/services/auth.service.ts`
- [X] T010 [US3] Update `logout` function in `src/context/AuthContext.tsx` to invoke `authService.logout()` safely before local cleanup
- [X] T011 [US3] Update logout action in `src/components/layout/AppHeader.tsx` to handle graceful transition to login page

**Checkpoint**: การออกจากระบบมีความปลอดภัยสูงสุด ไม่มีคุกกี้ตกค้างในเบราว์เซอร์ และเครื่องพร้อมสำหรับแคชเชียร์คนถัดไป

---

## Phase 6: User Story 4 - POS Continuity & Graceful Fallback (Priority: P2)

**Goal**: รักษาข้อมูลรายการสินค้าในตะกร้าขายและสาขาล่าสุดไว้เมื่อเซสชันหมดอายุ เพื่อให้แคชเชียร์ใส่รหัส PIN กลับมาขายต่อได้ทันที

**Independent Test**: มีสินค้าค้างในตะกร้า แล้วจำลองเซสชันหมดอายุ ตรวจสอบว่ากลับมาหน้าล็อกอินพร้อมสาขาเดิม และเมื่อใส่ PIN กลับมา สินค้าในตะกร้ายังอยู่ครบ

- [X] T012 [US4] Update `handleSessionExpired` in `src/context/AuthContext.tsx` to preserve cart state and branch settings while clearing auth credentials
- [X] T013 [US4] Verify PinLogin in `src/components/auth/PinLogin.tsx` preserves branch and re-authenticates cashier seamlessly

**Checkpoint**: แคชเชียร์สามารถกลับเข้าสู่ระบบและปฏิบัติงานต่อได้ภายใน 5 วินาทีโดยข้อมูลงานขายไม่สูญหาย

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบคุณภาพโค้ด ความปลอดภัย และความสอดคล้องตามมาตรฐานทั้งระบบ

- [X] T014 Run build and lint verification (`npm run build`, `npm run lint`) in repo root to ensure zero TypeScript errors or linter warnings
- [X] T015 Validate end-to-end scenarios against `specs/009-hybrid-auth-support/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ไม่มี Dependency - เริ่มทำได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Phase 1 - บล็อก User Stories ทั้งหมด
- **User Stories (Phase 3-6)**: ขึ้นอยู่กับ Foundational (Phase 2)
  - US1 (P1) และ US2 (P1) เป็นแกนหลักของการทำงาน (MVP)
  - US3 (P2) และ US4 (P2) เสริมความสมบูรณ์ด้านความปลอดภัยและการใช้งานต่อเนื่อง
- **Polish (Phase 7)**: ดำเนินการหลังทุก User Story เสร็จสิ้น

### Parallel Opportunities

- T001 และ T002 สามารถทำคู่ขนานกันได้ (คนละไฟล์)
- T006, T007 สามารถทำคู่ขนานหลัง T003 เสร็จสิ้น
- T009, T010, T011 ใน US3 และ T012, T013 ใน US4 สามารถดำเนินการตามลำดับหรือคู่ขนานได้

---

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. ดำเนินการ Setup (Phase 1) และ Foundational (Phase 2)
2. พัฒนา User Story 1 (Phase 3) เพื่อเปิดใช้งาน `credentials: 'include'` และ Hybrid Request
3. พัฒนา User Story 2 (Phase 4) เพื่อเปิดใช้งาน Silent Token Refresh แบบผสมผสาน
4. **ตรวจสอบความพร้อมของ MVP**: ทดสอบการขายสินค้าและการต่ออายุสิทธิ์เบื้องหลัง

### Incremental Delivery
1. เพิ่ม User Story 3 (Phase 5): การออกจากระบบทั้งฝั่งเซิร์ฟเวอร์และอุปกรณ์
2. เพิ่ม User Story 4 (Phase 6): การคงข้อมูลตะกร้าสินค้าและสาขาสำหรับการเข้าสู่ระบบด่วนด้วย PIN
3. สรุปผลและตรวจสอบความถูกต้องตามคู่มือการทดสอบ (Phase 7)
