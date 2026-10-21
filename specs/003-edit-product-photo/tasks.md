# Tasks: การแก้ไขข้อมูลสินค้า - ถ่ายภาพโดยตรงและแสดงผลในหน้ารายการทันที (Product Edit: Direct Camera Photo Capture & Instant List Image Display)

**Input**: Design artifacts from `specs/003-edit-product-photo/` (spec.md, plan.md, data-model.md, contracts/product-image-upload.md, research.md, quickstart.md)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: จัดเตรียม Type Definitions และโครงสร้างพื้นฐานสำหรับจัดการรูปภาพและกล้อง

- [x] T001 [P] อัปเดต Type Definitions สำหรับ Camera Capture State และ Image Response ใน `src/types/catalog.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: โครงสร้างคอมโพเนนต์กล้องและการอัปโหลดรูปภาพที่ทุก User Story ต้องใช้งานร่วมกัน

**⚠️ CRITICAL**: ต้องทำส่วนนี้ให้เสร็จก่อนเริ่มเชื่อมต่อ User Story

- [x] T002 [P] สร้างโครงคอมโพเนนต์ CameraCaptureModal สำหรับเปิดกล้อง แสดงภาพสด และปุ่มชัตเตอร์ขนาด $\ge 64$px ใน `src/components/catalog/CameraCaptureModal.tsx`
- [x] T003 [P] ปรับปรุง ImageUploader เพื่อรองรับปุ่มเปิดกล้องถ่ายภาพควบคู่กับปุ่มเลือกไฟล์เดิม ใน `src/components/catalog/ImageUploader.tsx`

**Checkpoint**: โครงสร้างคอมโพเนนต์พื้นฐานพร้อมสำหรับการพัฒนา User Story

---

## Phase 3: User Story 1 - ถ่ายภาพสินค้าจากกล้องของอุปกรณ์โดยตรงในหน้าแก้ไขข้อมูลสินค้า (Priority: P1) 🎯 MVP

**Goal**: ผู้ใช้สามารถเปิดกล้อง จับภาพสินค้าจากช่องมองภาพสด และนำภาพมาใช้ในแบบฟอร์มแก้ไขสินค้าได้ทันที

**Independent Test**: เปิดฟอร์มแก้ไขสินค้า กด "ถ่ายภาพด้วยกล้อง" กล้องเปิดสด กดชัตเตอร์เพื่อจับภาพ กดยืนยัน ภาพจะมาปรากฏในช่องรูปภาพของฟอร์มทันที

### Implementation for User Story 1

- [x] T004 [US1] พัฒนาระบบเชื่อมต่อกล้องผ่าน WebRTC `getUserMedia` พร้อมฉายภาพสดลงใน `<video>` และคำสั่งปิด Stream ทันทีเมื่อปิดหน้าต่าง ใน `src/components/catalog/CameraCaptureModal.tsx`
- [x] T005 [US1] พัฒนาระบบจับภาพนิ่งผ่าน `<canvas>` แปลงเป็น File/Blob พร้อมหน้าจอตรวจสอบภาพ ปุ่ม "ถ่ายใหม่" และปุ่ม "ใช้ภาพนี้" ใน `src/components/catalog/CameraCaptureModal.tsx`
- [x] T006 [US1] เชื่อมต่อ CameraCaptureModal เข้ากับ ImageUploader และส่งไฟล์ภาพต่อไปยังฟอร์มแก้ไขสินค้า ใน `src/components/catalog/ProductFormModal.tsx`

**Checkpoint**: User Story 1 ทำงานได้สมบูรณ์และทดสอบการจับภาพจากกล้องเข้าสู่ฟอร์มแก้ไขได้

---

## Phase 4: User Story 2 - แสดงภาพสินค้าที่อัปเดตใหม่ในตารางรายการสินค้าทันทีโดยไม่ต้องรีเฟรชหน้าเว็บ (Priority: P1)

**Goal**: เมื่อบันทึกการแก้ไขสินค้าพร้อมรูปภาพใหม่สำเร็จ ตารางรายการสินค้าจะอัปเดตและแสดงรูปภาพใหม่ทันทีแบบ Real-time โดยไม่ต้องรีเฟรชเบราว์เซอร์

**Independent Test**: แก้ไขสินค้า เปลี่ยนรูปภาพใหม่ กดบันทึก หน้าต่างปิดลง แถวสินค้าในตารางแสดงภาพใหม่ล่าสุดทันทีโดยไม่โหลดหน้าใหม่

### Implementation for User Story 2

- [x] T007 [US2] ปรับปรุงลำดับการบันทึกข้อมูลและอัปโหลดรูปภาพใน ProductFormModal เพื่อส่งข้อมูลสินค้าที่อัปเดตสมบูรณ์พร้อม URL รูปภาพใหม่กลับไปยัง callback ใน `src/components/catalog/ProductFormModal.tsx`
- [x] T008 [US2] จัดการ Reactive State อัปเดตตารางรายการสินค้าทันทีพร้อม Timestamp สำหรับ Cache-Busting ใน `src/app/(main)/catalog/page.tsx`
- [x] T009 [P] [US2] ปรับปรุง ProductImageThumbnail ใน ProductTable ให้รองรับ Cache-Busting Query Parameter ป้องกันเบราว์เซอร์แสดงภาพเก่าค้าง ใน `src/components/catalog/ProductTable.tsx`

**Checkpoint**: User Story 2 ทำงานได้สมบูรณ์ ตารางสินค้าอัปเดตภาพใหม่ทันที 0ms หลังบันทึก

---

## Phase 5: User Story 3 - การควบคุมอุปกรณ์กล้องและทางเลือกการนำเข้ารูปภาพ (Priority: P2)

**Goal**: รองรับการสลับกล้องหน้า/กล้องหลังบนอุปกรณ์ที่มีหลายกล้อง และแสดงข้อความแจ้งเตือนที่ชัดเจนเมื่อไม่ได้รับสิทธิ์เข้าถึงกล้อง

**Independent Test**: ทดสอบสลับกล้องหน้า/หลังได้บนแท็บเล็ต/มือถือ และทดสอบการปฏิเสธสิทธิ์กล้อง ระบบจะแสดงข้อความเตือนภาษาไทยและให้เลือกไฟล์แทนได้

### Implementation for User Story 3

- [ ] T010 [US3] พัฒนาระบบสลับกล้องหน้า/กล้องหลัง (Facing Mode: environment / user) เมื่อมีกล้องมากกว่าหนึ่งตัว ใน `src/components/catalog/CameraCaptureModal.tsx`
- [ ] T011 [US3] พัฒนาระบบจัดการข้อผิดพลาดกรณีปฏิเสธสิทธิ์ หรือไม่พบกล้อง พร้อมข้อความแจ้งเตือนภาษาไทยที่ชัดเจน ใน `src/components/catalog/CameraCaptureModal.tsx`
- [ ] T012 [US3] ปรับปรุง Fallback บนอุปกรณ์ที่ไม่มีกล้องให้แสดงเฉพาะปุ่มเลือกไฟล์ตามปกติ ใน `src/components/catalog/ImageUploader.tsx`

**Checkpoint**: User Story 3 ทำงานได้สมบูรณ์ รองรับอุปกรณ์และกรณีข้อผิดพลาดของกล้องทุกรูปแบบ

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบมาตรฐานการออกแบบและความสมบูรณ์ของระบบ

- [ ] T013 [P] ตรวจสอบและปรับแต่งขนาด Touch Target ปุ่มควบคุมทั้งหมด ($\ge 48$px และชัตเตอร์ $\ge 64$px) ตามมาตรฐาน Elderly-Friendly ใน `src/components/catalog/CameraCaptureModal.tsx`
- [ ] T014 [P] อัปเดต ProductFormDrawer ให้รองรับการถ่ายภาพและการแสดงผลทันทีให้สอดคล้องกัน ใน `src/components/catalog/ProductFormDrawer.tsx`
- [ ] T015 ดำเนินการทดสอบระบบแบบ End-to-End ตามขั้นตอนใน `specs/003-edit-product-photo/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ไม่มี Dependencies - สามารถเริ่มทำได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Phase 1 - เป็นเงื่อนไขบังคับก่อนเริ่ม User Stories
- **User Stories (Phase 3+)**:
  - **User Story 1 (P1)**: สามารถเริ่มได้ทันทีหลัง Phase 2
  - **User Story 2 (P1)**: สามารถทำควบคู่หรือต่อจาก User Story 1
  - **User Story 3 (P2)**: ต่อยอดระบบกล้องจาก User Story 1
- **Polish (Phase 6)**: ดำเนินการหลัง User Stories ทั้งหมดแล้วเสร็จ

### Parallel Opportunities

- T001, T002, T003 สามารถเริ่มร่างควบคู่กันได้
- T009 สามารถทำควบคู่กับ T007 และ T008 ได้
- T013 และ T014 สามารถดำเนินการควบคู่กันได้

---

## Implementation Strategy

### MVP First (User Story 1 & 2)
1. ดำเนินการ Phase 1 (Setup) และ Phase 2 (Foundational)
2. ดำเนินการ Phase 3 (US1 - ถ่ายภาพด้วยกล้อง)
3. ดำเนินการ Phase 4 (US2 - อัปเดตแสดงผลในหน้ารายการทันที)
4. ทดสอบความถูกต้อง (ได้ Core Value ของฟีเจอร์ครบตามที่ผู้ใช้ร้องขอ)
5. ดำเนินการ Phase 5 (US3 - การจัดการกล้องขั้นสูงและสลับกล้อง) และ Phase 6 (Polish)
