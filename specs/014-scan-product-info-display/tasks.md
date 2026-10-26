# Tasks: 014-scan-product-info-display

**Feature**: แสดงข้อมูลสินค้าที่สแกนพบ (เลขบาร์โค้ด ชื่อสินค้า ราคา) และแสดงเฉพาะบาร์โค้ดเมื่อไม่พบสินค้า  
**Feature Branch**: `014-scan-product-info-display`  
**Input**: Design artifacts from `specs/014-scan-product-info-display/`  
**Status**: Completed  

---

## Phase 1: Setup (Type Definitions & Shared Contracts)

**Purpose**: ปรับปรุงโครงสร้าง Data Types ในระบบให้รองรับฟิลด์ราคาขาย

- [x] T001 [P] อัปเดต Type Definitions ใน `src/types/scanner.ts` โดยเพิ่ม `price?: number` ใน `BarcodeScanResult` และ `ScanFeedbackResult` ตาม `specs/014-scan-product-info-display/data-model.md`

---

## Phase 2: Foundational (Callback & Data Flow Prerequisites)

**Purpose**: ปรับปรุงการส่งต่อข้อมูลราคาจากหน้าจอ POS และการบันทึกลง State ของ Modal สแกน

**⚠️ CRITICAL**: ต้องทำส่วนนี้ให้เสร็จก่อน User Stories จึงจะได้รับข้อมูลราคาไปแสดงผล

- [x] T002 อัปเดตฟังก์ชัน `handleBarcodeScanned` ใน `src/app/(main)/pos/page.tsx` ให้ส่งคืนค่า `price` ของสินค้า (`localFound.price` จากแคช และ `res.data.price` จาก API lookup) ในออบเจกต์ `BarcodeScanResult`
- [x] T003 อัปเดตฟังก์ชัน `processBarcode` ใน `src/components/pos/PosCameraScannerModal.tsx` ให้ส่งต่อฟิลด์ `price` จาก `result` ไปยัง State `lastScanFeedback` เมื่อสแกนสำเร็จ

**Checkpoint**: โครงสร้าง Callback และ State ใน Modal พร้อมรับและเก็บข้อมูลราคาเรียบร้อย

---

## Phase 3: User Story 1 - แสดงข้อมูลสินค้าครบถ้วนเมื่อสแกนพบ (เลขบาร์โค้ด, ชื่อสินค้า, ราคา) (Priority: P1) 🎯 MVP

**Goal**: เมื่อสแกนบาร์โค้ดพบสินค้า แถบแสดงผลการสแกนล่าสุด (Recent Scan Banner) จะแสดงชื่อสินค้า, เลขบาร์โค้ด และ Badge ป้ายราคาขายอย่างครบถ้วน

**Independent Test**: เปิดหน้าต่างกล้องสแกน สแกนสินค้าที่มีในระบบ ตรวจสอบว่าแถบเขียวแสดงทั้งชื่อสินค้า เลขบาร์โค้ดในวงเล็บ และ Badge ป้ายราคา `฿XX.XX` อย่างชัดเจน

### Implementation for User Story 1

- [x] T004 [US1] ปรับปรุงส่วนแสดงผล Recent Scan Banner เมื่อ `lastScanFeedback.status === 'SUCCESS'` ใน `src/components/pos/PosCameraScannerModal.tsx` ให้แสดงเลขบาร์โค้ด `(${lastScanFeedback.barcode})` ควบคู่กับชื่อสินค้าอย่างชัดเจน
- [x] T005 [US1] เพิ่มการแสดงผล Badge ป้ายราคา เช่น `฿XX.XX` ด้วยฟอนต์ Monospace ตัวหนาในแถบสแกนสำเร็จ ใน `src/components/pos/PosCameraScannerModal.tsx` ตาม `specs/014-scan-product-info-display/contracts/scanner-contract.md`
- [x] T006 [US1] ปรับปรุงข้อความ Toast Notification ใน `handleBarcodeScanned` (`src/app/(main)/pos/page.tsx`) ให้แสดงชื่อสินค้าพร้อมระบุราคาขาย เช่น `ชื่อสินค้า (฿XX.XX)` เมื่อสแกนพบสินค้าผ่านเครื่องอ่านบาร์โค้ดหรือการค้นหา

**Checkpoint**: สแกนพบสินค้าแล้วแสดงครบทั้งเลขบาร์โค้ด ชื่อสินค้า และราคา ทั้งใน Modal และ Toast

---

## Phase 4: User Story 2 - แสดงเฉพาะเลขบาร์โค้ดเมื่อสแกนไม่พบสินค้าในระบบ (Priority: P1)

**Goal**: เมื่อสแกนบาร์โค้ดไม่พบสินค้า แถบสถานะต้องแสดงเฉพาะเลขบาร์โค้ดที่สแกนติดเท่านั้น และไม่มีข้อมูลชื่อหรือราคาแสดงอยู่

**Independent Test**: สแกนบาร์โค้ดที่ไม่มีในระบบ ตรวจสอบว่าแถบแดงแสดง "ไม่พบสินค้าในระบบ: [บาร์โค้ด]" โดยไม่มีราคาหรือชื่อสินค้าหลุดรอดออกมา และกล้องยังคงเปิดสแกนต่อเนื่อง

### Implementation for User Story 2

- [x] T007 [US2] ตรวจสอบและปรับปรุง Recent Scan Banner เมื่อ `lastScanFeedback.status === 'NOT_FOUND'` ใน `src/components/pos/PosCameraScannerModal.tsx` ให้แสดงเฉพาะเลขบาร์โค้ด `lastScanFeedback.barcode` และข้อความแจ้งเตือน โดยรับประกันว่าไม่มีการเรนเดอร์ราคาหรือชื่อสินค้า

**Checkpoint**: สแกนไม่พบสินค้าแล้วแสดงเฉพาะบาร์โค้ดตามที่ระบุ 100%

---

## Phase 5: User Story 3 - การแสดงผลตัวอักษรและราคาตามมาตรฐาน Elderly-Friendly (Priority: P2)

**Goal**: ปรับปรุงขนาดตัวอักษร ความคมชัด และการจัดวาง Responsive ให้เป็นไปตามมาตรฐาน Elderly-Friendly

**Independent Test**: ทดสอบบนขนาดหน้าจอมือถือและเดสก์ท็อป ตรวจสอบว่าชื่อสินค้ายาวไม่ทับหรือเบียดป้ายราคา และสีมี Contrast สูงอ่านง่าย

### Implementation for User Story 3

- [x] T008 [US3] ปรับปรุง Responsive Layout ของ Recent Scan Banner ใน `src/components/pos/PosCameraScannerModal.tsx` ให้รองรับชื่อสินค้ายาว (truncate) โดยไม่เบียดหรือบดบัง Badge ป้ายราคาบนหน้าจอขนาดเล็ก (Mobile / Tablet)
- [x] T009 [US3] ตรวจสอบและจัดรูปแบบราคาให้รองรับค่า 0 บาท (`฿0.00`) และทศนิยม 2 ตำแหน่งสม่ำเสมอใน `src/components/pos/PosCameraScannerModal.tsx`

**Checkpoint**: การแสดงผลสวยงาม คมชัด อ่านง่ายตามธรรมนูญระบบบนทุกขนาดหน้าจอ

---

## Phase 6: Polish & Verification

**Purpose**: ตรวจสอบความถูกต้องของ Typecheck และรัน Validation ตาม Quickstart

- [x] T010 ตรวจสอบ Typecheck ด้วย `npx tsc --noEmit` เพื่อรับรองว่าไม่มีข้อผิดพลาดด้าน TypeScript
- [x] T011 ตรวจสอบความถูกต้องตามขั้นตอนใน `specs/014-scan-product-info-display/quickstart.md` ทั้ง 3 Scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ไม่มี Dependency — เริ่มได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Phase 1 — ต้องเสร็จก่อน User Stories
- **User Story 1 (Phase 3)**: ขึ้นอยู่กับ Phase 2
- **User Story 2 (Phase 4)**: ขึ้นอยู่กับ Phase 2
- **User Story 3 (Phase 5)**: ขึ้นอยู่กับ Phase 3
- **Polish (Phase 6)**: ทำหลังทุก User Story เสร็จสิ้น

### Parallel Opportunities

- T001 สามารถทำคู่ขนานกับการเตรียมการได้
- T006 (Toast) สามารถทำคู่ขนานกับ T004, T005 (Modal Banner) ได้เพราะคนละไฟล์

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. ดำเนินการ Phase 1 (T001) ปรับปรุง Type definitions
2. ดำเนินการ Phase 2 (T002, T003) เชื่อมต่อ Callback ส่งมอบราคา
3. ดำเนินการ Phase 3 (T004, T005, T006) แสดงเลขบาร์โค้ด ชื่อสินค้า และราคา
4. ทดสอบและตรวจสอบ MVP พร้อมใช้งานทันที
