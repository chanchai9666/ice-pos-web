# Implementation Plan: ระบบชำระเงินหน้าร้านและบันทึกการขาย (POS Checkout & Payment)

**Branch**: `005-pos-checkout-payment` | **Date**: 2026-10-23 | **Spec**: [specs/005-pos-checkout-payment/spec.md](spec.md)

**Input**: Feature specification from `/specs/005-pos-checkout-payment/spec.md`

---

## Summary

พัฒนาระบบชำระเงินหน้าร้าน (POS Checkout & Payment) และรวมการจัดการ State กะการขาย (Shift State Consolidation) ให้เป็นศูนย์กลางเดียว โดยมีเป้าหมายหลัก 2 ประการ:
1. **แก้ปัญหา Duplicate Shift State**: ย้ายการจัดการ `activeShift` จาก `PosPage.tsx` ไปไว้ใน `PosCartContext.tsx` เพียงแห่งเดียว ขจัด API call ซ้ำซ้อน 100% ทำให้ทุก Component อ่านสถานะกะที่ตรงกันเสมอ
2. **พัฒนาระบบชำระเงินและบันทึกการขายจริง**:
   - เพิ่ม `uomId` ลงใน `CartItem` และบันทึกตั้งแต่ตอน `addItem()`
   - สร้าง Component `PosCheckoutModal` รองรับการชำระเงินสด (CASH, P1) พร้อมแป้นตัวเลขสัมผัสขนาดใหญ่และคำนวณเงินทอนอัตโนมัติ, ชำระผ่าน QR พร้อมเพย์ (QR_PROMPTPAY, P2) พร้อมระบบ Auto-polling ทุก 3 วินาที (timeout 5 นาที), และชำระด้วยเงินเชื่อลูกค้า (CREDIT, P3) พร้อมตรวจสอบวงเงินคงเหลือ
   - สร้าง `sales.service.ts` เชื่อมต่อ API `POST /api/v1/sales` พร้อม Header `Idempotency-Key` ป้องกันการทำรายการซ้ำ
   - แสดง **Success Overlay** หลังบันทึกการขายสำเร็จ พร้อมเลขที่บิล ยอดรวม และปุ่ม "เริ่มบิลใหม่" เพื่อล้างตะกร้าสินค้า

---

## Technical Context

**Language/Version**: TypeScript 5+ (Strict Mode)  
**Primary Dependencies**: Next.js 16 (App Router), React 19, Lucide React (Icons), Tailwind CSS v4, Web Audio API (สำหรับเสียง Beep ยืนยัน)  
**Storage**: Web Storage (LocalStorage สำหรับสำรองข้อมูลตะกร้าชั่วคราว) และ REST API  
**Testing**: Manual Walkthrough ผ่าน Quickstart Scenarios, TypeScript Typecheck (`npm run typecheck` หรือ `tsc`), Next.js Linter  
**Target Platform**: Web Browser บนหน้าจอสัมผัส POS, คอมพิวเตอร์ตั้งโต๊ะ และแท็บเล็ต  
**Project Type**: Next.js Web Application (Route `/pos`)  
**Performance Goals**: ทำรายการชำระเงินสดเสร็จสิ้นภายใน 30 วินาทีต่อบิล (SC-001), Success Overlay ปรากฏภายใน 3 วินาทีหลังยืนยัน (SC-003)  
**Constraints**: ปฏิบัติตามธรรมนูญโครงการ v1.4.0 (Elderly-Friendly Touch Target >= 48px, High Contrast WCAG 2.1 AA, No Ad-hoc Mock Data, Thai Language UI)  
**Scale/Scope**: รองรับรายการขายสูงสุดหลายสิบรายการต่อบิล, รองรับ QR Auto-polling แบบไม่มี Memory Leak (SC-006)  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| หมวดในธรรมนูญ | ข้อกำหนด | ผลการประเมิน | หมายเหตุ |
| :--- | :--- | :---: | :--- |
| **2. ภาษา** | ใช้ภาษาไทยเป็นหลักในการสื่อสาร UI Text และเอกสาร | **ผ่าน** | UI และข้อความแจ้งเตือนทั้งหมดใน Modal เป็นภาษาไทย คงชื่อทางเทคนิคในโค้ด |
| **3.1 ความถูกต้อง** | ห้ามสร้าง Mock Data ขึ้นเอง อ้างอิง Swagger API จริง | **ผ่าน** | เชื่อมต่อ `POST /api/v1/sales`, `POST /api/v1/payments/qr`, `GET /api/v1/payments/{ref}/status`, `GET /api/v1/customers` |
| **3.2 ความเรียบง่าย** | ไม่สร้างความซับซ้อนเกินจำเป็น | **ผ่าน** | ใช้ Modal ซ้อนบนหน้าเดิมแทนการเปลี่ยนหน้า (Single Page), รวบ State ไว้ใน `PosCartContext` |
| **5.1 สัญญา API** | ใช้ Standard Envelope `{ code, message, data, meta }` | **ผ่าน** | กำหนด Request/Response DTOs ตรงตาม Swagger สเปกจริง 100% |
| **5.3 ความถูกต้องข้อมูล** | หน่วยเงิน Satang (Integer) ↔ Baht ถูกต้องแม่นยำ | **ผ่าน** | ใช้ `currency.ts` (`formatSatangToBaht`, `bahtToSatang`) จัดการสตางค์ทั้งหมด |
| **6.5 ผู้สูงอายุและจอสัมผัส** | Touch Target >= 48px, ฟอนต์ใหญ่, Virtual Numpad | **ผ่าน** | ทุกปุ่มมีขนาด >= 48px, มี `VirtualNumericKeypad` ป้อนเงินสด, ตัวเลขยอดเงินเด่นชัด |
| **8. ทรัพยากรและประสิทธิภาพ** | ป้องกัน Memory Leak จาก Background Timer | **ผ่าน** | มี Cleanup Function ใน `useEffect` สำหรับ QR Polling Timer เมื่อ Modal ปิด |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-pos-checkout-payment/
├── spec.md              # Feature specification
├── plan.md              # This file (Implementation Plan)
├── research.md          # Phase 0: Technical research & decisions
├── data-model.md        # Phase 1: Data models & state diagrams
├── contracts/           # Phase 1: API contracts
│   └── pos-checkout-api.md
├── quickstart.md        # Phase 1: Validation walkthrough guide
├── checklists/          # Checklists
│   └── requirements.md
└── tasks.md             # Phase 2: Actionable tasks (/speckit-tasks output)
```

### Source Code Layout

```text
src/
├── types/
│   ├── pos.ts                     # เพิ่ม uomId ใน CartItem และประเภทข้อมูล CheckoutSession
│   ├── sale.ts                    # CreateSaleRequest, SaleResponse, LineItem, Payment (NEW)
│   ├── payment.ts                 # GenerateQRRequest, QRPaymentResponse (NEW)
│   └── customer.ts                # CustomerSummary สำหรับเงินเชื่อ (NEW หรืออัปเดต)
├── services/
│   ├── sales.service.ts           # API Service สำหรับ POST /api/v1/sales (NEW)
│   ├── payments.service.ts        # API Service สำหรับ QR PromptPay (NEW)
│   └── customer.service.ts        # API Service สำหรับค้นหาลูกค้าและวงเงินเครดิต (NEW)
├── context/
│   └── PosCartContext.tsx         # จุดศูนย์กลาง Shift State + เพิ่ม uomId ตอน addItem
├── components/
│   └── pos/
│       ├── PosCheckoutModal.tsx   # Modal ชำระเงินหลัก (NEW)
│       ├── PosPaymentCash.tsx     # ส่วนการชำระเงินสด + Numpad (NEW)
│       ├── PosPaymentQR.tsx       # ส่วนการชำระผ่าน QR พร้อมเพย์ + Auto-polling (NEW)
│       ├── PosPaymentCredit.tsx   # ส่วนการชำระด้วยเงินเชื่อลูกค้า (NEW)
│       └── PosSuccessOverlay.tsx  # หน้าจอแสดงความสำเร็จและพิมพ์บิล (NEW)
└── app/
    └── (main)/
        └── pos/
            └── page.tsx           # ลบ Duplicate Shift State + เชื่อมต่อ PosCheckoutModal
```

**Structure Decision**: สถาปัตยกรรมระดับโมดูลแบ่งแยกหน้าที่อย่างชัดเจน (Types -> Services -> Context -> UI Components -> Page View) ตามธรรมนูญ Ice POS

---

## Implementation Phases & Strategy

### Phase 1: Foundational Prerequisites (งานเตรียมพร้อมหลัก)
1. **Shift State Consolidation**: ลบ `activeShift` state ซ้ำซ้อนใน `PosPage.tsx` และเปลี่ยนมาใช้จาก `PosCartContext`
2. **UOM Handling**: เพิ่ม `uomId: string` ใน `CartItem` (`src/types/pos.ts`) และแมปค่า `uomId` จาก `product` ใน `PosCartContext.addItem()`

### Phase 2: API Services & Data Types (โมเดลและบริการเชื่อมต่อ API)
1. สร้าง DTOs: `src/types/sale.ts`, `src/types/payment.ts`
2. สร้าง Services: `src/services/sales.service.ts`, `src/services/payments.service.ts`, `src/services/customer.service.ts`

### Phase 3: Core Checkout & Cash Payment Flow (User Story 1 - P1)
1. สร้าง Component `PosCheckoutModal.tsx` และ `PosPaymentCash.tsx`
2. จัดการแป้นตัวเลขสัมผัส `VirtualNumericKeypad` และคำนวณเงินทอนอัตโนมัติ
3. สร้าง `PosSuccessOverlay.tsx` แสดงผลการขายสำเร็จ และส่งเสียง Success Beep ผ่าน Web Audio API
4. เชื่อมต่อปุ่ม "ชำระเงิน" ใน `PosPage.tsx` เปิด `PosCheckoutModal`

### Phase 4: QR PromptPay Payment Flow (User Story 3 - P2)
1. สร้าง Component `PosPaymentQR.tsx` เรียกสร้าง QR Code
2. ติดตั้งระบบ Auto-polling ทุก 3 วินาที พร้อม Timeout 5 นาที และปุ่ม Manual fallback
3. เพิ่มระบบ Cleanup ป้องกัน Memory Leak เมื่อปิด Modal

### Phase 5: Customer Credit Payment Flow (User Story 4 - P3)
1. สร้าง Component `PosPaymentCredit.tsx` ค้นหาลูกค้าและแสดงวงเงินคงเหลือ
2. ตรวจสอบเงื่อนไขวงเงินเพียงพอก่อนอนุญาตให้บันทึกการขาย

### Phase 6: Polish, Accessibility & Testing (การตรวจสอบและปรับแต่ง)
1. ตรวจสอบ Touch Target ขนาด >= 48px และ Contrast WCAG 2.1 AA
2. ตรวจสอบ Error Handling ครบถ้วนทุกจุด (0% Data Loss เมื่อเกิดข้อผิดพลาด)
3. รันการทดสอบตามคู่มือ `quickstart.md`

---

## Complexity Tracking

*ไม่มีรายการที่ละเมิดธรรมนูญโครงการ*
