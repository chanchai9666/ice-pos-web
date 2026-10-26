# Tasks: แก้ไขระบบสแกนบาร์โค้ดผ่านกล้องและเพิ่มตัวนับจำนวนสแกนสำเร็จ/ไม่สำเร็จ

**Feature Branch**: `013-barcode-scan-fix-and-counters`  
**Input**: Design artifacts from `specs/013-barcode-scan-fix-and-counters/`  
**Status**: Completed  

---

## Phase 1: Setup (Dependencies & Infrastructure)

**Purpose**: ติดตั้งไลบรารีและจัดเตรียมโครงสร้างพื้นฐานสำหรับการถอดรหัสบาร์โค้ดข้ามแพลตฟอร์ม

- [x] T001 ติดตั้งแพ็กเกจ `@zxing/library` และ `@zxing/browser` ใน `package.json`
- [x] T002 [P] สร้างอินเทอร์เฟซและ Type definitions สำหรับการสแกนใน `src/types/scanner.ts` อ้างอิงตาม `specs/013-barcode-scan-fix-and-counters/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ปรับโครงสร้าง Callback และระบบเสียงสังเคราะห์ที่เป็นรากฐานก่อนเริ่ม User Story

**⚠️ CRITICAL**: ต้องทำส่วนนี้ให้เสร็จก่อน User Story จะสามารถเชื่อมต่อผลลัพธ์ได้

- [x] T003 สร้างยูทิลิตี้เสียงสังเคราะห์ `playSuccessBeep` (880Hz, 120ms) และ `playErrorBuzzer` (160Hz, 250ms) ด้วย Web Audio API ใน `src/utils/audioFeedback.ts`
- [x] T004 ปรับปรุงฟังก์ชัน `handleBarcodeScanned` ใน `src/app/(main)/pos/page.tsx` ให้คืนค่า `Promise<BarcodeScanResult>` (`{ success: boolean; productName?: string }`) ทั้งกรณีค้นหาในแคชท้องถิ่นและค้นหาผ่าน `catalogService.lookupProduct`

**Checkpoint**: โครงสร้าง Callback และระบบเสียงพร้อมรองรับการทำงานของ User Stories

---

## Phase 3: User Story 1 - สแกนบาร์โค้ดด้วยกล้องได้จริงบนทุกเบราว์เซอร์และอุปกรณ์ (Priority: P1) 🎯 MVP

**Goal**: ทำให้กล้องตรวจจับและอ่านค่าบาร์โค้ด (EAN-13, Code-128, QR Code ฯลฯ) ได้สำเร็จบน Safari (iOS / macOS), Chrome และทุกเบราว์เซอร์ โดยไม่มีอาการเปิดกล้องค้างแล้วไม่ยอมอ่านรหัส

**Independent Test**: เปิดหน้าต่างกล้องสแกนบน Safari แล้วนำบาร์โค้ดสินค้ามาส่อง ระบบต้องตรวจพบรหัสได้ภายใน 1.5 วินาที

### Implementation for User Story 1

- [x] T005 [US1] ติดตั้ง Hybrid Barcode Decoder Engine ใน `src/components/pos/PosCameraScannerModal.tsx` โดยใช้ Native `window.BarcodeDetector` เมื่อมี และสลับไปใช้ `@zxing/browser` (`BrowserMultiFormatReader`) อัตโนมัติเมื่อไม่มี
- [x] T006 [US1] เชื่อมต่อระบบทำความสะอาดรหัส `cleanBarcode` และระบบ Debounce หน่วงเวลา 1.5 วินาทีสำหรับรหัสเดิมใน `src/components/pos/PosCameraScannerModal.tsx`
- [x] T007 [US1] จัดการ Error Handling และ Fallback State เมื่ออุปกรณ์ไม่รองรับหรือผู้ใช้ไม่อนุญาตการเข้าถึงกล้องใน `src/components/pos/PosCameraScannerModal.tsx`

**Checkpoint**: กล้องสามารถตรวจจับบาร์โค้ดได้จริงบนทุกเบราว์เซอร์ รวมถึง Safari บน iOS

---

## Phase 4: User Story 2 - ตัวนับจำนวนสินค้าที่สแกนได้และสแกนไม่ได้ในรอบการสแกน (Priority: P1)

**Goal**: แสดงผลตัวนับจำนวน "สแกนสำเร็จ" และ "ไม่พบสินค้า" แยกกันอย่างชัดเจนแบบการ์ด 2 ช่องคู่ พร้อมรองรับ Continuous Scanning เมื่อไม่พบสินค้า

**Independent Test**: สแกนสินค้าที่มีในระบบ 2 ชิ้น และสแกนบาร์โค้ดที่ไม่มีในระบบ 1 ชิ้น ตรวจสอบว่าตัวเลขแสดง "สแกนสำเร็จ: 2" และ "ไม่พบสินค้า: 1" อย่างถูกต้องโดยไม่ต้องกดปิดกล่องเตือน

### Implementation for User Story 2

- [x] T008 [US2] เพิ่ม State `successCount`, `failedCount` และ `lastScanFeedback` ใน `src/components/pos/PosCameraScannerModal.tsx`
- [x] T009 [US2] ออกแบบและเรนเดอร์การ์ดสรุป 2 ช่องคู่กัน — กล่องเขียว "สแกนสำเร็จ" (`bg-emerald-950/40 border-emerald-500/30 text-emerald-400`) และกล่องแดง "ไม่พบสินค้า" (`bg-rose-950/40 border-rose-500/30 text-rose-400`) พร้อมตัวเลขขนาดใหญ่ (`text-2xl sm:text-3xl font-black`) ใน `src/components/pos/PosCameraScannerModal.tsx`
- [x] T010 [US2] อัปเดตกระบวนการสแกนให้กล้องเปิดทำงานต่อเนื่อง (Continuous Scanning) เมื่อไม่พบสินค้า โดยอัปเดต `failedCount + 1` โดยไม่หยุดวิดีโอและไม่ต้องกดปิดกล่องแจ้งเตือนใน `src/components/pos/PosCameraScannerModal.tsx`
- [x] T011 [US2] อัปเดตฟังก์ชันป้อนรหัสด้วยตนเอง (`handleManualSubmit`) ใน `src/components/pos/PosCameraScannerModal.tsx` ให้นับเข้าตัวนับสำเร็จหรือไม่สำเร็จตามผลการค้นหาจริง

**Checkpoint**: ตัวนับทั้งสองช่องทำงานถูกต้องตรงตามยอดจริง และสแกนต่อเนื่องได้อย่างราบรื่น

---

## Phase 5: User Story 3 - สัญญาณตอบรับและประวัติการสแกนล่าสุดที่เข้าใจง่ายสำหรับผู้สูงอายุ (Priority: P2)

**Goal**: เพิ่มแบนเนอร์แสดงประวัติการสแกนล่าสุดขนาดใหญ่ และส่งสัญญาณเสียง Beep/Buzzer ให้แคชเชียร์รับรู้ผลการสแกนได้ทันทีโดยไม่ต้องเพ่งจอ

**Independent Test**: สแกนสินค้าแล้วตรวจสอบว่ามีเสียงตอบรับที่ถูกต้อง (เสียงสูงเมื่อสำเร็จ, เสียงต่ำเมื่อไม่พบ) พร้อมแถบสีและข้อความชื่อสินค้าหรือรหัสบาร์โค้ดล่าสุด

### Implementation for User Story 3

- [x] T012 [US3] เชื่อมต่อสัญญาณเสียง `playSuccessBeep()` เมื่อสแกนสำเร็จ และ `playErrorBuzzer()` เมื่อไม่พบสินค้าใน `src/components/pos/PosCameraScannerModal.tsx`
- [x] T013 [US3] สร้างแถบสถานะการสแกนล่าสุด (Recent Scan Feedback Banner) ขนาดใหญ่ คอนทราสต์สูง แสดงชื่อสินค้าสีเขียวเมื่อสำเร็จ หรือข้อความเตือนสีแดงพร้อมรหัสเมื่อไม่พบสินค้า ใน `src/components/pos/PosCameraScannerModal.tsx`
- [x] T014 [US3] ตรวจสอบความสูงและขนาดเป้าหมายการสัมผัส (Touch Targets >= 48px) สำหรับปุ่มสลับกล้องและปุ่มเสร็จสิ้นตามมาตรฐาน Elderly-Friendly ใน `src/components/pos/PosCameraScannerModal.tsx`

**Checkpoint**: หน้าต่างสแกนให้ Feedback ทางสายตาและเสียงอย่างชัดเจนตามมาตรฐานธรรมนูญข้อ 6.5

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: ปรับปรุงประสิทธิภาพ คืนทรัพยากร และตรวจสอบความถูกต้องทั้งหมด

- [x] T015 ปรับปรุงการคืนทรัพยากรกล้องและการหยุด ZXing Reader / RAF Loop ให้สะอาดยิ่งขึ้นเมื่อปิด Modal หรือ Unmount ใน `src/components/pos/PosCameraScannerModal.tsx`
- [x] T016 ตรวจสอบ Type Checking (`npx tsc --noEmit`) และ Code Quality (`npm run lint`) ให้ผ่าน 0 error
- [x] T017 ดำเนินการทดสอบตามคู่มือ `specs/013-barcode-scan-fix-and-counters/quickstart.md` เพื่อยืนยันความถูกต้องครบถ้วน

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ไม่มี dependencies - เริ่มต้นได้ทันที
- **Foundational (Phase 2)**: ขึ้นอยู่กับ Setup (T001-T002) - บล็อกทุก User Story
- **User Story 1 (Phase 3)**: ขึ้นอยู่กับ Foundational (T003-T004)
- **User Story 2 (Phase 4)**: ขึ้นอยู่กับ User Story 1 (กลไกการสแกนพื้นฐาน)
- **User Story 3 (Phase 5)**: สามารถทำร่วมกับ User Story 2 ได้
- **Polish (Phase 6)**: ขึ้นอยู่กับ User Stories ทั้งหมดเสร็จสิ้น

---

## Implementation Strategy

### MVP First (User Story 1 + Setup & Foundation)
1. ดำเนินการ Phase 1 (T001-T002) และ Phase 2 (T003-T004)
2. ดำเนินการ Phase 3 (T005-T007) เพื่อให้ Safari สแกนบาร์โค้ดได้จริง
3. ทดสอบว่ากล้องอ่านบาร์โค้ดได้ (Core Engine Validation)

### Incremental Delivery (User Story 2 & 3)
4. เพิ่มตัวนับการ์ดคู่และ Continuous Scanning (T008-T011)
5. เพิ่มเสียงตอบรับและแบนเนอร์แสดงผลตามมาตรฐาน Elderly-Friendly (T012-T014)
6. ตรวจสอบ Polish และ Lint (T015-T017)
