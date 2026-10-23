# Tasks: ระบบชำระเงินหน้าร้านและรวมสถานะกะ (POS Checkout & Payment)

**Feature**: `005-pos-checkout-payment`  
**Input**: [specs/005-pos-checkout-payment/plan.md](plan.md), [specs/005-pos-checkout-payment/spec.md](spec.md)  
**Status**: Ready for Implementation  

---

## Phase 1: Setup (Shared Types & Data Contracts)

**Purpose**: สร้างโครงสร้างประเภทข้อมูล (Data Types) และ DTOs สำหรับการขายและการชำระเงินตามสเปก Swagger

- [X] T001 [P] Create sale DTOs and interfaces (`CreateSaleRequest`, `SaleResponse`, `CreateSaleLineItem`, `CreateSalePayment`) in `src/types/sale.ts`
- [X] T002 [P] Create QR payment DTOs and interfaces (`GenerateQRRequest`, `QRPaymentResponse`) in `src/types/payment.ts`
- [X] T003 [P] Create customer credit summary interface (`CustomerSummary`) in `src/types/customer.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: ปรับปรุงโครงสร้างข้อมูลตะกร้าสินค้า (`CartItem.uomId`) และโครงสร้างพื้นฐานที่ทุก User Story ต้องใช้งานร่วมกัน

**⚠️ CRITICAL**: ต้องทำส่วนนี้ให้เสร็จสมบูรณ์ก่อนเริ่มพัฒนา User Stories

- [X] T004 Add `uomId: string` field to `CartItem` interface in `src/types/pos.ts`
- [X] T005 Update `addItem()` in `src/context/PosCartContext.tsx` to populate `uomId` from `product.sellUomId || product.baseUomId || product.baseUom?.id` and validate non-empty
- [X] T006 [P] Implement UUID `generateIdempotencyKey()` helper utility in `src/utils/idempotency.ts`

**Checkpoint**: โครงสร้างพื้นฐานและโมเดลข้อมูลพร้อมสำหรับการพัฒนา User Stories

---

## Phase 3: User Story 2 - รวม State กะการขายให้เป็นศูนย์กลางเดียว (Priority: P1)

**Goal**: รวมการจัดการสถานะกะการขาย (`activeShift`) ไว้ใน `PosCartContext` เพียงที่เดียว ขจัด duplicate state และลด API `GET /api/v1/shifts/active` ซ้ำซ้อน

**Independent Test**: โหลดหน้า `/pos` ตรวจสอบ Network Tab ว่า `GET /api/v1/shifts/active` ถูกเรียกเพียง 1 ครั้ง และเมื่อเปิดกะสำเร็จ PosShiftBanner กับปุ่มคิดเงินอัปเดตสถานะพร้อมกัน

- [X] T007 [US2] Remove duplicate `activeShift` state and initial fetch `useEffect` from `src/app/(main)/pos/page.tsx`
- [X] T008 [US2] Update `src/app/(main)/pos/page.tsx` to consume `activeShift` and `setActiveShift` directly from `usePosCart()`
- [X] T009 [US2] Ensure `PosOpenShiftModal` updates `PosCartContext.setActiveShift` upon successful shift opening in `src/app/(main)/pos/page.tsx`

**Checkpoint**: สถานะกะการขายเป็น Single Source of Truth ผ่าน `PosCartContext` เรียบร้อย

---

## Phase 4: User Story 1 - ชำระเงินสดและบันทึกการขาย (Priority: P1) 🎯 MVP

**Goal**: แคชเชียร์สามารถกดปุ่มชำระเงิน เลือกวิธีเงินสด พิมพ์จำนวนเงินรับผ่าน Numpad สัมผัส คำนวณเงินทอนอัตโนมัติ ส่งบันทึกการขายผ่าน API และเห็น Success Overlay พร้อมเลขที่บิล

**Independent Test**: เพิ่มสินค้าลงตะกร้า กดปุ่มชำระเงิน เลือกเงินสด ใส่เงินรับ 100 บาท ยืนยันการขาย ตรวจสอบว่า `POST /api/v1/sales` ถูกเรียก Success Overlay แสดงเลขที่บิล และกดเริ่มบิลใหม่เพื่อล้างตะกร้า

- [X] T010 [P] [US1] Implement `salesService.createSale(request, idempotencyKey)` with `Idempotency-Key` header in `src/services/sales.service.ts`
- [X] T011 [P] [US1] Create success audio chime helper using Web Audio API in `src/utils/audio.ts`
- [X] T012 [P] [US1] Create `PosSuccessOverlay` component with receipt summary and "เริ่มบิลใหม่" button in `src/components/pos/PosSuccessOverlay.tsx`
- [X] T013 [US1] Create `PosPaymentCash` component with quick-cash buttons, change calculation, and `VirtualNumericKeypad` in `src/components/pos/PosPaymentCash.tsx`
- [X] T014 [US1] Create `PosCheckoutModal` component with payment method selector and grand total display in `src/components/pos/PosCheckoutModal.tsx`
- [X] T015 [US1] Connect `handleCheckout()` in `src/app/(main)/pos/page.tsx` to open `PosCheckoutModal` and handle clear-cart on "เริ่มบิลใหม่"

**Checkpoint**: ระบบชำระเงินสด (MVP) ทำงานได้สมบูรณ์ตั้งแต่ต้นจนจบ พร้อม Success Overlay

---

## Phase 5: User Story 3 - ชำระเงินผ่าน QR พร้อมเพย์ (Priority: P2)

**Goal**: แคชเชียร์สามารถเลือกชำระผ่าน QR พร้อมเพย์ ระบบสร้าง QR Code ให้ลูกค้าสแกน ตรวจสอบสถานะการโอนเงินอัตโนมัติทุก 3 วินาที (timeout 5 นาที) และบันทึกการขายทันทีเมื่อสำเร็จ

**Independent Test**: เลือกชำระเงิน QR พร้อมเพย์ ระบบแสดง QR Code และ Polling สถานะทุก 3 วินาที เมื่อสำเร็จจะบันทึกการขายและแสดง Success Overlay อัตโนมัติ หากปิด Modal Polling จะหยุดทันที

- [X] T016 [P] [US3] Implement `paymentsService.generatePromptPayQR(amount)` and `checkPaymentStatus(ref)` in `src/services/payments.service.ts`
- [X] T017 [US3] Create `PosPaymentQR` component with QR display, 3-second auto-polling loop, 5-minute timeout countdown, and timer cleanup in `src/components/pos/PosPaymentQR.tsx`
- [X] T018 [US3] Integrate `PosPaymentQR` into `src/components/pos/PosCheckoutModal.tsx` to auto-trigger `salesService.createSale` upon QR success

**Checkpoint**: ระบบชำระเงิน QR พร้อมเพย์พร้อม Auto-polling ทำงานได้อย่างถูกต้องและไม่มี Memory Leak

---

## Phase 6: User Story 4 - ชำระเงินด้วยเงินเชื่อลูกค้า (Priority: P3)

**Goal**: แคชเชียร์สามารถเลือกชำระด้วยบัญชีเงินเชื่อ ค้นหาลูกค้า ตรวจสอบวงเงินคงเหลือ และบันทึกการขายแบบ CREDIT

**Independent Test**: เลือกชำระเงินเชื่อ ค้นหาและเลือกลูกค้า ระบบแสดงวงเงินคงเหลือ หากวงเงินพอให้กดยืนยันบันทึกการขายสำเร็จ หากวงเงินไม่พอปุ่มยืนยันจะถูกบล็อก

- [ ] T019 [P] [US4] Implement `customerService.searchCustomers(query, branchId)` in `src/services/customer.service.ts`
- [ ] T020 [US4] Create `PosPaymentCredit` component with customer search, credit balance check, and limit validation in `src/components/pos/PosPaymentCredit.tsx`
- [ ] T021 [US4] Integrate `PosPaymentCredit` into `src/components/pos/PosCheckoutModal.tsx` with customerId and method `CREDIT`

**Checkpoint**: ระบบชำระเงินเชื่อสำหรับลูกค้าประจำทำงานได้สมบูรณ์

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: ปรับปรุงการเข้าถึง ความปลอดภัย การจัดการข้อผิดพลาด และทดสอบความถูกต้องโดยรวม

- [ ] T022 Audit touch target sizes (all buttons >= 48px) and WCAG 2.1 AA color contrast across `PosCheckoutModal` in `src/components/pos/PosCheckoutModal.tsx`
- [ ] T023 Verify error handling displays clear Thai messages on API failure without clearing the cart in `src/components/pos/PosCheckoutModal.tsx`
- [ ] T024 Run TypeScript typecheck (`npm run typecheck`) and ESLint (`npm run lint`) to ensure zero errors in `package.json`
- [ ] T025 Execute manual walkthrough scenarios from `specs/005-pos-checkout-payment/quickstart.md`

---

## Dependencies & Execution Order

```mermaid
graph TD
    subgraph Phase 1: Setup
        T001[T001: Sale Types]
        T002[T002: QR Types]
        T003[T003: Customer Types]
    end

    subgraph Phase 2: Foundational
        T004[T004: CartItem uomId]
        T005[T005: addItem with uomId]
        T006[T006: Idempotency Helper]
    end

    subgraph Phase 3: User Story 2 (P1)
        T007[T007: Remove duplicate shift in PosPage]
        T008[T008: Consume shift from context]
        T009[T009: Shift modal callback sync]
    end

    subgraph Phase 4: User Story 1 (P1 - MVP)
        T010[T010: salesService]
        T011[T011: Web Audio Beep]
        T012[T012: PosSuccessOverlay]
        T013[T013: PosPaymentCash]
        T014[T014: PosCheckoutModal]
        T015[T015: Connect handleCheckout]
    end

    subgraph Phase 5: User Story 3 (P2)
        T016[T016: paymentsService]
        T017[T017: PosPaymentQR]
        T018[T018: Integrate QR into Modal]
    end

    subgraph Phase 6: User Story 4 (P3)
        T019[T019: customerService]
        T020[T020: PosPaymentCredit]
        T021[T021: Integrate Credit into Modal]
    end

    subgraph Phase 7: Polish
        T022[T022: Accessibility Audit]
        T023[T023: Error Handling Review]
        T024[T024: Lint & Typecheck]
        T025[T025: Quickstart Scenarios]
    end

    T001 --> T010
    T004 --> T005
    T005 --> T007
    T007 --> T008 --> T009
    T009 --> T014
    T006 --> T010
    T010 --> T014
    T011 --> T012
    T012 --> T014
    T013 --> T014
    T014 --> T015

    T002 --> T016
    T016 --> T017
    T017 --> T018
    T015 --> T018

    T003 --> T019
    T019 --> T020
    T020 --> T021
    T018 --> T021

    T015 --> T022
    T021 --> T022
    T022 --> T023 --> T024 --> T025
```

---

## Parallel Execution Opportunities

### Phase 1 & 2 (Setup & Foundational)
```bash
# Parallel data models creation:
Task: "T001 [P] Create sale DTOs and interfaces in src/types/sale.ts"
Task: "T002 [P] Create QR payment DTOs and interfaces in src/types/payment.ts"
Task: "T003 [P] Create customer credit summary interface in src/types/customer.ts"
Task: "T006 [P] Implement UUID generateIdempotencyKey() helper in src/utils/idempotency.ts"
```

### Phase 4 (User Story 1 - Cash Flow)
```bash
# Parallel independent components for US1:
Task: "T010 [P] [US1] Implement salesService in src/services/sales.service.ts"
Task: "T011 [P] [US1] Create success audio chime helper in src/utils/audio.ts"
Task: "T012 [P] [US1] Create PosSuccessOverlay component in src/components/pos/PosSuccessOverlay.tsx"
```

---

## Implementation Strategy & MVP Scope

- **MVP Target**: Phase 1 + Phase 2 + Phase 3 (US2: Shift Consolidation) + Phase 4 (US1: Cash Payment & Sale Recording)
  - หลังจบ Phase 4 แคชเชียร์สามารถเปิดกะขาย, สแกนสินค้า, กดปุ่มชำระเงิน, ใส่เงินสด, ทอนเงิน, บันทึกการขายเข้า API จริง, และพิมพ์/ดูเลขที่บิลสำเร็จได้ครบ 100%
- **Incremental Enhancements**:
  - Phase 5 เพิ่มช่องทางชำระ QR พร้อมเพย์แบบ Auto-polling
  - Phase 6 เพิ่มช่องทางชำระเงินเชื่อสำหรับลูกค้าประจำ
  - Phase 7 ปรับแต่ง Accessibility & Verification
