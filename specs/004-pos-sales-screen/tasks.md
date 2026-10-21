# Tasks: ระบบจุดขายสินค้าหน้าร้าน (POS Sales Screen & Barcode Scanning)

**Feature Branch**: `004-pos-sales-screen`  
**Input**: Feature Specification from `specs/004-pos-sales-screen/spec.md` and Plan from `specs/004-pos-sales-screen/plan.md`  

---

## Phase 1: Setup (Shared Types & Utilities)

**Purpose**: จัดเตรียม Type Definitions และฟังก์ชันยูทิลิตีพื้นฐานที่ใช้ร่วมกันในระบบขายหน้าร้าน

- [x] T001 [P] Create POS types and Cart interfaces in `src/types/pos.ts` (CartItem, CartSummary, BarcodeScanResult, PosViewState)
- [x] T002 [P] Create Shift types and OpenShiftRequest interfaces in `src/types/shift.ts` (ShiftInfo, OpenShiftRequest, CloseShiftRequest)
- [x] T003 [P] Implement Web Audio API Sound Synthesizer in `src/utils/audio.ts` (playSuccessBeep 880Hz, playErrorBuzzer 200Hz)
- [x] T004 [P] Implement Barcode Helper & Thai-English keycode converter in `src/utils/barcode.ts` (mapThaiToEnglishBarcode, isLikelyBarcodeScannerEvent)

---

## Phase 2: Foundational (Core State & Services)

**Purpose**: โครงสร้างพื้นฐานหลักของการจัดการสถานะตะกร้าสินค้าและการเชื่อมต่อข้อมูลกะการขาย (Blocking prerequisites for user stories)

- [x] T005 Implement Shift API Service in `src/services/shift.service.ts` (`getActiveShift`, `openShift`, `closeShift`)
- [x] T006 Implement POS Cart State Context in `src/context/PosCartContext.tsx` (cart items management, add item, update quantity, remove item, clear cart, total calculations)

**Checkpoint**: โครงสร้างสถานะและยูทิลิตีพร้อมสำหรับการสร้างหน้าจอและ Component ของแต่ละ User Story

---

## Phase 3: User Story 1 - การเลือกสินค้าขายด้วยตนเอง (Priority: P1) 🎯 MVP

**Goal**: แคชเชียร์สามารถดูรายการสินค้า ค้นหา กรองหมวดหมู่ และแตะเลือกสินค้าลงตะกร้าขายได้ทันที

**Independent Test**: สามารถเปิดหน้า POS เลือกหมวดหมู่ ค้นหาสินค้า แตะการ์ดสินค้า และสินค้าถูกเพิ่มลงในตะกร้าพร้อมเสียง Beep ตอบรับ

- [x] T007 [P] [US1] Create Quick Search Bar component in `src/components/pos/PosSearchBar.tsx` (>=48px touch height, clear button, instant debounce)
- [x] T008 [P] [US1] Create Category Selection Tabs component in `src/components/pos/PosCategoryTabs.tsx` (scrollable pills, min 48px touch target, active indicator)
- [x] T009 [US1] Create Product Catalog Card and Grid in `src/components/pos/PosProductGrid.tsx` (large touch card >=160px, product image, name, price, stock status, tap-to-add)
- [x] T010 [US1] Integrate Manual Catalog selection into main POS page layout in `src/app/(main)/pos/page.tsx`

**Checkpoint**: แคชเชียร์สามารถค้นหาและจิ้มเลือกสินค้าลงบิลได้สำเร็จเป็นส่วนแรกของ MVP

---

## Phase 4: User Story 4 - การจัดการรายการในตะกร้าขายและปรับจำนวน (Priority: P1) 🎯 MVP

**Goal**: แคชเชียร์สามารถดูรายการในตะกร้า ปรับเพิ่ม/ลดจำนวน ลบรายการ และคำนวณยอดเงินรวมแบบเรียลไทม์ พร้อม Numpad สัมผัส

**Independent Test**: เพิ่มสินค้าลงตะกร้า ปรับจำนวนด้วยปุ่ม +/- หรือ Virtual Numpad ยอดเงินรวมและภาษีคำนวณถูกต้อง และมีปุ่มล้างตะกร้าพร้อมกล่องยืนยัน

- [x] T011 [P] [US4] Create Individual Cart Item Row in `src/components/pos/PosCartItemRow.tsx` (product name, locked unit price, +/- buttons >=48px, line total, delete button)
- [x] T012 [US4] Integrate Virtual Numeric Keypad for quantity editing in `src/components/pos/PosQuantityModal.tsx` (modal with `src/components/ui/VirtualNumericKeypad.tsx`)
- [x] T013 [US4] Create POS Cart Panel and Order Summary in `src/components/pos/PosCartPanel.tsx` (item count, subtotal, VAT 7%, grand total with large font, clear cart confirmation, checkout button)
- [x] T014 [US4] Connect Cart Panel and Catalog Grid together in `src/app/(main)/pos/page.tsx` (2-column layout 60/40)

**Checkpoint**: MVP สำเร็จสมบูรณ์! หน้าจอ POS สามารถเลือกสินค้า ปรับจำนวน ดูยอดเงินรวม และจัดการตะกร้าขายได้ครบวงจร

---

## Phase 5: User Story 2 - การสแกนบาร์โค้ดด้วยเครื่องสแกนฮาร์ดแวร์ (Priority: P1)

**Goal**: รองรับการยิงบาร์โค้ดจากเครื่องสแกนเนอร์ USB/Bluetooth โดยดักจับคีย์บอร์ดทั่วทั้งหน้าจอ และเพิ่มสินค้าลงตะกร้าอัตโนมัติ

**Independent Test**: ยิงบาร์โค้ดสินค้าจริง (หรือพิมพ์รหัสเร็วๆ จบด้วย Enter) ขณะไม่ได้โฟกัสช่องค้นหา สินค้าถูกค้นหาและเพิ่มลงในตะกร้าขายทันที พร้อมเสียง Beep

- [x] T015 [US2] Implement Global Barcode Scanner Hook in `src/hooks/useBarcodeScanner.ts` (listens to window keydown, buffers keystrokes, converts Thai layout via `utils/barcode.ts`, triggers lookup)
- [x] T016 [US2] Integrate Barcode Scanner Hook into `src/app/(main)/pos/page.tsx` with `catalogService.lookupProduct` and `catalogService.getProducts`
- [x] T017 [US2] Implement Non-blocking Red Toast Notification for unrecognised barcodes in `src/components/pos/PosScanToast.tsx` with Error Buzzer sound

**Checkpoint**: แคชเชียร์สามารถยิงบาร์โค้ดสินค้าด้วยเครื่องสแกนฮาร์ดแวร์ได้อย่างรวดเร็วและต่อเนื่อง

---

## Phase 6: User Story 3 - การสแกนบาร์โค้ดสินค้าด้วยกล้อง (Priority: P2)

**Goal**: มีหน้าต่างป๊อปอัปกล้องส่องบาร์โค้ด พร้อมกรอบเล็ง ตรวจจับบาร์โค้ดแบบเรียลไทม์ และโหมดสแกนต่อเนื่อง

**Independent Test**: แตะปุ่มเปิดกล้องบนหน้า POS นำสินค้ามาส่องในกรอบเล็ง กล้องอ่านรหัส เพิ่มสินค้าลงบิล ส่งเสียง Beep และเปิดรอสแกนชิ้นต่อไปได้ทันที

- [x] T018 [US3] Create Camera Viewfinder and Scanner Modal in `src/components/pos/PosCameraScannerModal.tsx` (`BarcodeDetector` API / Canvas video stream, camera switch, flash toggle, large finish button)
- [x] T019 [US3] Implement Continuous Scanning with Debounce in `src/components/pos/PosCameraScannerModal.tsx` (auto add to cart, play success beep, debounce 1.5s per code)
- [x] T020 [US3] Add Camera Launch Button to POS Header/Toolbar in `src/app/(main)/pos/page.tsx` and handle permission denied fallback

**Checkpoint**: ร้านค้าที่ไม่มีเครื่องยิงบาร์โค้ดสามารถใช้กล้องของแท็บเล็ตหรือโน้ตบุ๊กสแกนสินค้าได้อย่างสมบูรณ์

---

## Phase 7: User Story 5 - การตรวจสอบสถานะกะขายและความพร้อมในการขาย (Priority: P2)

**Goal**: ตรวจสอบสถานะกะขายผ่าน API แสดงแถบเตือนสีส้มหากยังไม่เปิดกะ และมี Modal บังคับเปิดกะก่อนเข้าสู่ขั้นตอนชำระเงิน

**Independent Test**: เข้าหน้า POS เมื่อยังไม่มีกะ แถบเตือนสีส้มแสดงขึ้น เลือกสินค้าใส่ตะกร้าได้ แต่เมื่อกด "ชำระเงิน" จะมี Modal เปิดกะขึ้นมาให้บันทึกเงินทอนเริ่มต้น

- [x] T021 [P] [US5] Create Active Shift Warning Banner in `src/components/pos/PosShiftBanner.tsx` (orange banner, active cashier/shift details or "ยังไม่ได้เปิดกะขาย" warning)
- [x] T022 [US5] Create Open Shift Modal in `src/components/pos/PosOpenShiftModal.tsx` (starting cash input with `VirtualNumericKeypad`, submit to `shiftService.openShift`)
- [x] T023 [US5] Integrate Shift Check & Checkout Gate in `src/components/pos/PosCartPanel.tsx` (verify `activeShift`, trigger OpenShiftModal if no active shift on checkout click)

**Checkpoint**: ระบบควบคุมความถูกต้องทางบัญชีเงินสด ป้องกันการขายโดยไม่ระบุเงินทอนเริ่มต้น

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: ตรวจสอบความสมบูรณ์ ความถูกต้องตามธรรมนูญ และการทดสอบรวมทุกระบบ

- [ ] T024 [P] Review and enforce Touch Target sizes (>=48x48px) and WCAG 2.1 AA Contrast across all POS components
- [ ] T025 [P] Optimize Product Card image loading and fallback placeholder for products without images
- [ ] T026 Execute Quickstart Scenarios in `specs/004-pos-sales-screen/quickstart.md` and verify end-to-end user flows
- [ ] T027 Run TypeScript strict check (`npm run build` or `npx tsc --noEmit`) and verify zero errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: ไม่มี Dependencies - สามารถเริ่มต้นได้ทันที
- **Phase 2 (Foundational)**: ขึ้นอยู่กับ Phase 1 - เป็นตัวบล็อก (Blocker) ของทุก User Story
- **Phase 3 (US1 - Manual Browse)**: ขึ้นอยู่กับ Phase 2
- **Phase 4 (US4 - Cart & Totals)**: ขึ้นอยู่กับ Phase 2 และ Phase 3 (ผสานเพื่อส่งมอบเป็น MVP ชุดแรก)
- **Phase 5 (US2 - Hardware Scanner)**: ขึ้นอยู่กับ Phase 4 (เพิ่มสินค้าลงตะกร้า)
- **Phase 6 (US3 - Camera Scanner)**: ขึ้นอยู่กับ Phase 4
- **Phase 7 (US5 - Shift Gate)**: ขึ้นอยู่กับ Phase 4
- **Phase 8 (Polish)**: ขึ้นอยู่กับทุก Phase ก่อนหน้า

---

## Parallel Opportunities

```bash
# Phase 1 Parallel tasks:
Task: T001 "Create POS types in src/types/pos.ts"
Task: T002 "Create Shift types in src/types/shift.ts"
Task: T003 "Implement Web Audio in src/utils/audio.ts"
Task: T004 "Implement Barcode Helper in src/utils/barcode.ts"

# Phase 3 Parallel tasks:
Task: T007 "Create Quick Search Bar in src/components/pos/PosSearchBar.tsx"
Task: T008 "Create Category Tabs in src/components/pos/PosCategoryTabs.tsx"

# Phase 4 Parallel tasks:
Task: T011 "Create Cart Item Row in src/components/pos/PosCartItemRow.tsx"
Task: T012 "Create Quantity Modal in src/components/pos/PosQuantityModal.tsx"
```

---

## Implementation Strategy (MVP First)

1. **Phase 1 + 2**: สร้าง Types, Audio, Barcode helper, Shift service และ `PosCartContext`
2. **Phase 3 + 4 (MVP Delivery)**: สร้างหน้าจอ 2 คอลัมน์ เลือกสินค้าด้วยตนเอง และจัดการตะกร้าสินค้า (สามารถขายหน้าร้านได้ทันที!)
3. **Phase 5**: เพิ่มความเร็วด้วยการยิงเครื่องสแกนบาร์โค้ดฮาร์ดแวร์ + Thai Key Mapping
4. **Phase 6**: เพิ่มทางเลือกการสแกนด้วยกล้องบนแท็บเล็ต/โน้ตบุ๊ก
5. **Phase 7**: เพิ่มระบบควบคุมกะขาย (Shift Management Gate)
6. **Phase 8**: ตรวจสอบเกณฑ์ผู้สูงอายุ (Elderly-Friendly) และ Quickstart validation
