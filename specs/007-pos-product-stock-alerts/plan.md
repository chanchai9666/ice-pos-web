# Implementation Plan: การแสดงจำนวนสินค้าคงเหลือและการแจ้งเตือนขอบสีสต็อกบนการ์ดสินค้า POS (POS Product Stock Level & Border Status Alerts)

**Branch**: `007-pos-product-stock-alerts` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-pos-product-stock-alerts/spec.md`

## Summary

ปรับปรุงการ์ดสินค้าในหน้าจอขาย POS (`PosProductGrid.tsx`) และหน้าจอหลักของจุดขาย (`pos/page.tsx`) เพื่อให้:
1. สินค้าทุกรายการที่ไม่ใช่แบบชั่งขาย (`productType !== 'BY_WEIGHT'`) แสดงจำนวนสินค้าคงเหลือพร้อมหน่วยนับเสมอ โดยหากยังไม่มีข้อมูลสต็อกในสาขาให้กำหนดค่าเริ่มต้นเป็น 0 ชิ้น ป้องกันการปล่อยว่าง
2. การ์ดสินค้าแสดงเส้นขอบสีเตือนสถานะความพร้อมของสต็อกอย่างเด่นชัดตามเกณฑ์ Elderly-Friendly:
   - **ขอบสีส้ม** (`border-amber-500` หนา 2px) เมื่อสต็อกใกล้หมด (`0 < quantity <= (minStock || 5)`)
   - **ขอบสีแดง** (`border-rose-500` หนา 2px) เมื่อสินค้าหมดสต็อก (`quantity <= 0`)
   - ขอบปกติ (`border-slate-800`) สำหรับสินค้าที่มีสต็อกเพียงพอ หรือสินค้าประเภทชั่งขาย
3. เมื่อแคชเชียร์กดเลือกการ์ดสินค้าที่หมดสต็อก (ขอบสีแดง) ระบบอนุญาตให้เพิ่มสินค้าลงในบิลได้ตามปกติ แต่จะแสดง Toast Notification แจ้งเตือนว่าสินค้าหมดสต็อกแล้ว เพื่อให้การขายหน้าร้านมีความคล่องตัว

## Technical Context

**Language/Version**: TypeScript 5+  
**Primary Dependencies**: Next.js 16+ (App Router), React 19, Tailwind CSS v4, Lucide React  
**Storage**: Client State / LocalStorage (ตะกร้าสินค้า) & REST API (`inventoryService.getStockLevels`)  
**Testing**: TypeScript Strict Check (`npx tsc --noEmit`), ESLint (`npm run lint`), Manual Browser Test  
**Target Platform**: Desktop & Tablet POS (Touchscreen 1080p+, Chrome/Safari/Edge)  
**Project Type**: Single Frontend Web Application (`src/`)  
**Performance Goals**: คำนวณและเรนเดอร์สถานะขอบสีของการ์ดสินค้าทั้งหมดได้ภายใน < 16ms (60 FPS) ไม่กระตุกระหว่างค้นหาหรือสลับหมวดหมู่  
**Constraints**: ปฏิบัติตามธรรมนูญ ice-pos-web (Constitution v1.4.0) ด้าน Elderly-Friendly (ขอบหนา 2px, คอนทราสต์สี WCAG 2.1 AA, มีข้อความกำกับคู่กับสีเสมอ)  
**Scale/Scope**: ปรับปรุงคอมโพเนนต์ `PosProductGrid.tsx` และฟังก์ชัน `handleSelectProduct` ใน `src/app/(main)/pos/page.tsx`  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: UI ข้อความ ป้ายสถานะ และการแจ้งเตือนใช้ภาษาไทย 100%
- [x] **3.1 ความถูกต้องมาก่อนความรวดเร็ว**: แสดงยอดสต็อกตามจริงจากสาขาที่แคชเชียร์กำลังเปิดกะทำงาน
- [x] **3.3 รักษาความสามารถเดิมของระบบ**: ไม่รบกวนการทำงานของสินค้าชั่งขาย (`BY_WEIGHT`), การสแกนบาร์โค้ด, และการคิดเงิน
- [x] **5.1 สัญญาการเชื่อมต่อและไม่สร้างข้อมูลสมมุติ**: ใช้ฟิลด์ `minStock` จาก `Product` และสต็อกจริงจาก `StockLevelMap`
- [x] **6.5 การออกแบบที่เหมาะสมกับผู้สูงอายุ (Elderly-Friendly)**: ขอบหนา 2px, สีคอนทราสต์ชัดเจนบน Dark Mode, มีป้ายข้อความกำกับสถานะเสมอ (ไม่พึ่งพาสีเพียงอย่างเดียว)
- [x] **13.0 ข้อกำหนด AI Agent**: ปฏิบัติตามมาตรฐานและขั้นตอนอย่างเคร่งครัด

**Gate Status**: PASSED (ไม่มีข้อขัดแย้งกับธรรมนูญ)

## Project Structure

### Documentation (this feature)

```text
specs/007-pos-product-stock-alerts/
├── spec.md              # Feature specification & clarified requirements
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 technical research & decision records
├── data-model.md        # Phase 1 data models & presentation resolution logic
├── quickstart.md        # Phase 1 verification scenarios & test commands
├── contracts/           # Phase 1 UI component & interaction contracts
│   └── product-card-stock.contract.md
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code Impact

```text
src/
├── components/
│   └── pos/
│       └── PosProductGrid.tsx       # ปรับปรุงตรรกะคำนวณสต็อก, แสดงขอบสีส้ม/แดง และป้ายกำกับ
└── app/
    └── (main)/
        └── pos/
            └── page.tsx             # เพิ่มการแจ้งเตือน Toast เมื่อเลือกสินค้าที่หมดสต็อก
```

**Structure Decision**: ทำงานโดยตรงภายในโปรเจกต์เดี่ยว (`src/`) โดยปรับปรุงคอมโพเนนต์และการจัดการเหตุการณ์ที่เกี่ยวข้องโดยตรง ไม่ต้องเพิ่มสถาปัตยกรรมหรือไลบรารีใหม่ที่ซับซ้อนเกินความจำเป็น

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | ไม่มีส่วนใดที่ละเมิดธรรมนูญหรือมีความซับซ้อนเกินความจำเป็น | - |

---

## Phase Execution Summary

- **Phase 0: Outline & Research**: สรุปเกณฑ์ `minStock`, Fallback 0 สำหรับสินค้าชิ้น, และพฤติกรรมแจ้งเตือนเมื่อหมดสต็อก ลงใน `research.md` สำเร็จ
- **Phase 1: Design & Contracts**: กำหนด `ProductStockPresentation` และตรรกะ `resolveProductStockPresentation` ใน `data-model.md`, สัญญาการเรียกใช้ใน `contracts/product-card-stock.contract.md`, และคู่มือการทดสอบใน `quickstart.md` สำเร็จ
- **Next Step**: พร้อมดำเนินการสร้าง Task งานด้วย `/speckit-tasks` เพื่อเตรียมการ Implement ต่อไป
