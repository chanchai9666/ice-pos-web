# Tasks: Mobile & Tablet POS Usability and Login Alignment

**Branch**: `011-mobile-tablet-pos-ux`
**Date**: 2026-10-25
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: ตรวจสอบสภาพแวดล้อมและการจัดเตรียมฟังก์ชันตัวช่วยสำหรับ Viewport

- [X] T001 Verify project environment, Next.js build scripts, and dependencies in package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: โครงสร้างพื้นฐานด้าน Viewport และ Safe Area ที่ทุก User Story ต้องใช้งานร่วมกัน

- [X] T002 [P] Create viewport and safe-area helper utilities in src/utils/viewport.ts

**Checkpoint**: โครงสร้างพื้นฐานพร้อม เริ่มต้นพัฒนา User Stories แต่ละส่วนได้อย่างอิสระ

---

## Phase 3: User Story 1 - สลับโหมดเข้าสู่ระบบได้อย่างราบรื่นโดยการ์ดไม่กระตุกหรือเปลี่ยนความสูงกะทันหัน (Priority: P1) 🎯 MVP

**Goal**: ปรับปรุงความสูงและการจัดวางของฟอร์มเข้าสู่ระบบด้วย Username/Password ให้เท่ากับส่วน PIN Numpad ไม่เกิดอาการการ์ดยุบตัววูบวาบ

**Independent Test**: เข้าหน้า `/login` สลับโหมดไปมาระหว่าง "รหัส PIN แคชเชียร์" และ "ชื่อผู้ใช้ / รหัสผ่าน" การ์ดต้องคงความสูงเดิมและไม่กระตุก โดยฟอร์มจัดอยู่กึ่งกลางแนวตั้งสวยงาม

- [X] T003 [US1] Update CredentialLogin component with min-h-[490px], flex vertical centering, and touch-target inputs (>= 48px) in src/components/auth/CredentialLogin.tsx
- [X] T004 [US1] Update Login page layout and container styles in src/app/(auth)/login/page.tsx

**Checkpoint**: User Story 1 ใช้งานได้สมบูรณ์และทดสอบได้ทันที

---

## Phase 4: User Story 2 - ชำระเงินบนหน้าจุดขายได้อย่างสะดวกรวดเร็วเมื่อใช้งานผ่านมือถือหรือแท็บเล็ต/iPad (Priority: P1)

**Goal**: ปรับหน้าจุดขาย (POS Terminal) บนหน้าจอพกพา (< 1024px) ให้แคตตาล็อกแสดงเต็มจอ และมีแถบสรุปตะกร้าลอยพร้อมลิ้นชัก Bottom Sheet สำหรับตรวจสอบรายการและกดชำระเงินได้ทันทีใน 1 สัมผัส

**Independent Test**: ปรับ Viewport เป็นหน้าจอมือถือหรือ iPad แตะเพิ่มสินค้าลงตะกร้า จะเห็นแถบสรุปยอดเงิน แตะเปิดลิ้นชัก Bottom Sheet ดูรายการสินค้าและกดปุ่มชำระเงินเพื่อเปิด `PosCheckoutModal` ได้ทันที

- [X] T005 [P] [US2] Implement PosCartFloatingBar component showing item count, total price, and cart trigger in src/components/pos/PosCartFloatingBar.tsx
- [X] T006 [P] [US2] Implement PosCartBottomSheet drawer component with item management and checkout button in src/components/pos/PosCartBottomSheet.tsx
- [X] T007 [US2] Update POS Terminal page layout for responsive switching between 2-column Desktop and Full-width Mobile/Tablet in src/app/(main)/pos/page.tsx

**Checkpoint**: User Story 2 ใช้งานได้สมบูรณ์ แคชเชียร์สามารถคิดเงินบนมือถือและแท็บเล็ตได้อย่างรวดเร็ว

---

## Phase 5: User Story 3 - แถบนำทางระดับแอพและคำสั่งด่วนด้านล่าง (Global Bottom Nav) บนอุปกรณ์พกพา (Priority: P2)

**Goal**: เพิ่มแถบนำทางหลักของแอพพลิเคชันด้านล่าง (Global App Bottom Navigation) บนหน้าจอพกพา (< 1024px) สำหรับสลับหน้าระบบอย่างสะดวก

**Independent Test**: เปิดใช้งานบนหน้าจอขนาดพกพา ตรวจสอบการแสดงผลแถบ Bottom Nav ชิดขอบล่างของหน้าจอ มีปุ่มนำทางไปยัง POS, แคตตาล็อก และปุ่มเปิดเมนูข้าง (Drawer) พร้อมเว้นระยะขอบปลอดภัยด้านล่าง (Safe Area Inset)

- [X] T008 [P] [US3] Create AppBottomNav component with elderly-friendly touch buttons (>= 48px) in src/components/layout/AppBottomNav.tsx
- [X] T009 [US3] Integrate AppBottomNav and bottom-padding adjustments into MainLayout in src/app/(main)/layout.tsx

**Checkpoint**: ทุก User Story ครบถ้วนและสามารถทำงานร่วมกันได้อย่างสมบูรณ์

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบคุณภาพโค้ด ประสิทธิภาพ และการทำงานร่วมกันทุกขนาดหน้าจอ

- [X] T010 [P] Run TypeScript type check and ESLint lint verification across modified files
- [X] T011 Run quickstart verification scenarios for mobile, tablet, and desktop viewports per specs/011-mobile-tablet-pos-ux/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: ไม่มี Dependency สามารถเริ่มได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Setup และเป็นข้อกำหนดเบื้องต้นสำหรับ User Stories
- **User Story 1 (Phase 3 - P1)**: เริ่มต้นได้ทันทีหลังจาก Phase 2 เสร็จสิ้น (ทำงานแยกอิสระในส่วน Auth)
- **User Story 2 (Phase 4 - P1)**: ขึ้นอยู่กับ Phase 2 (ส่วน POS Terminal)
- **User Story 3 (Phase 5 - P2)**: ขึ้นอยู่กับ Phase 2 และเชื่อมโยงกับ MainLayout
- **Polish (Phase 6)**: ทำหลังทุก User Story เสร็จสิ้น

### Parallel Opportunities
- T003 (US1 Login) สามารถพัฒนาคู่ขนานกับ T005/T006 (US2 POS Components) ได้
- T005 (PosCartFloatingBar), T006 (PosCartBottomSheet) และ T008 (AppBottomNav) สามารถสร้างไฟล์คู่ขนานกันได้ [P]

---

## Implementation Strategy

### MVP First (User Story 1)
1. ดำเนินการ Phase 1 และ Phase 2
2. ดำเนินการ Phase 3 (User Story 1: Login Height Alignment)
3. ตรวจสอบการสลับโหมดในหน้า Login

### Incremental Delivery
1. เพิ่ม Phase 4 (User Story 2: Mobile POS Cart Bottom Sheet)
2. เพิ่ม Phase 5 (User Story 3: Global App Bottom Nav)
3. รันการตรวจสอบใน Phase 6 (Type check, Lint, Quickstart)
