# Implementation Plan: การแสดงจำนวนสินค้าคงเหลือ/ชั่งขาย และปรับปรุงตะกร้าสินค้า POS (POS Stock Level Display & Cart UX Enhancements)

**Branch**: `006-pos-stock-and-cart` | **Date**: 2026-10-24 | **Spec**: [spec.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/006-pos-stock-and-cart/spec.md)

**Input**: Feature specification from `specs/006-pos-stock-and-cart/spec.md`

## Summary

ปรับปรุงส่วนติดต่อผู้ใช้ของหน้าจอขายหน้าร้าน POS Terminal เพื่อเพิ่มประสิทธิภาพและความแม่นยำในการขายของแคชเชียร์:
1. แสดงจำนวนสินค้าคงเหลือบนการ์ดสินค้าสำหรับสินค้าขายตามหน่วย และแสดงข้อความ "ชั่งขาย" สำหรับสินค้าขายตามน้ำหนัก
2. เพิ่มการแสดงผลรูปภาพขนาดเล็ก (Thumbnail) ในแถวรายการสินค้าของตะกร้าขาย
3. จัดการเลื่อนมุมมองในตะกร้าอัตโนมัติ (Auto-Scroll) ไปยังสินค้าล่าสุดที่เพิ่งถูกเพิ่มหรือแก้ไข พร้อมแสดงเอฟเฟกต์เน้นสายตา (Visual Feedback Highlight) โดยไม่ปล่อยให้หน้าจอค้างอยู่ที่ส่วนบน

## Technical Context

**Language/Version**: TypeScript 5+, React 19, Next.js 16 (App Router)

**Primary Dependencies**: Tailwind CSS v4, Lucide React (Icons), Axios (`src/services/api.ts`)

**Storage**: LocalStorage (ตะกร้าสินค้าชั่วคราว `ice_pos_cart_items`)

**Testing**: Manual End-to-End Verification per quickstart.md, ESLint & TypeScript Compilation

**Target Platform**: Touchscreen POS Terminals, Tablets, Desktops (1024px+ responsive)

**Project Type**: Web Application (Frontend)

**Performance Goals**: Auto-scroll ทำงานภายใน <300ms, การดึงและจับคู่สต็อกสินค้า (O(1) Map Lookup) ไม่ส่งผลต่อความเร็วในการเรนเดอร์

**Constraints**: Elderly-Friendly Accessibility (WCAG 2.1 AA Contrast, Touch Target >= 48px, ขนาดตัวอักษร >= 16px)

**Scale/Scope**: รองรับรายการสินค้าหลัก 100-500 รายการต่อหมวดหมู่ และตะกร้าขาย 1-50 รายการต่อบิล

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: ข้อความ UI ป้ายสถานะ และข้อความสื่อสารใช้ภาษาไทย 100% ("ชั่งขาย", "คงเหลือ", "สินค้าหมด")
- [x] **3.1 ความถูกต้องมาก่อนความเร็ว**: ดึงสต็อกจริงจาก API `GET /api/v1/inventory/stocks` ตามสาขา ไม่สร้าง Mock Data ปลอมขึ้นมาเอง
- [x] **3.3 รักษาความสามารถเดิม**: ปุ่มกด ปรับจำนวน และการคำนวณราคายังคงทำงานถูกต้อง ไม่กระทบ Flow การขายเดิม
- [x] **6.5 การออกแบบที่เหมาะสมกับผู้สูงอายุและการสัมผัส (Elderly-Friendly & Touchscreen Design)**:
  - ขนาด Touch Targets สำหรับปุ่มและพื้นที่สัมผัสไม่ต่ำกว่า 48x48px
  - คอนทราสต์ของสีผ่านเกณฑ์ WCAG 2.1 AA
  - รูปภาพ Thumbnail ขนาดพอเหมาะ ไม่เบียดทับชื่อสินค้าหรือปุ่มกด
- [x] **5.1 สัญญาการเชื่อมต่อ API**: อ้างอิง Swagger Schema `/inventory/stocks` (`StockLevelResponse`) อย่างถูกต้อง

## Project Structure

### Documentation (this feature)

```text
specs/006-pos-stock-and-cart/
├── spec.md                  # Feature Specification
├── plan.md                  # This file
├── research.md              # Phase 0 Decisions
├── data-model.md            # Phase 1 Data Models
├── quickstart.md            # Phase 1 Verification Guide
├── contracts/
│   └── inventory-api.contract.md # API Contract
├── checklists/
│   ├── requirements.md      # Spec Quality Checklist
│   └── ux.md                # UX & Requirements Quality Checklist
└── tasks.md                 # Phase 2 Actionable Tasks
```

### Source Code Components

```text
src/
├── types/
│   ├── inventory.ts         # ประเภทข้อมูลระดับสต็อกสินค้า (StockLevel, StockLevelMap)
│   └── pos.ts               # ตะกร้าและสถานะชั่วคราว (lastActiveItemId)
├── services/
│   └── inventory.service.ts # API Service ดึงสต็อกรายสาขา (/api/v1/inventory/stocks)
├── context/
│   └── PosCartContext.tsx   # เก็บ lastActiveItemId เมื่อเพิ่ม/แก้ไขสินค้า
├── components/pos/
│   ├── PosProductGrid.tsx   # แสดงป้ายสต็อกคงเหลือ / "ชั่งขาย" / "สินค้าหมด" บนการ์ดสินค้า
│   ├── PosCartPanel.tsx     # จัดการ Scroll Container และเลื่อนไปยัง lastActiveItemId
│   └── PosCartItemRow.tsx   # แสดงรูปภาพขนาดเล็ก (Thumbnail) พร้อม Flash Highlight
└── app/(main)/pos/
    └── page.tsx             # ดึงสต็อกตามสาขา (branchId) ส่งเข้า PosProductGrid
```

## Implementation Strategy

1. **Step 1: Foundational API & Types**
   - สร้าง `src/types/inventory.ts` และ `src/services/inventory.service.ts`
2. **Step 2: Product Grid Stock & Weight-based Indicator**
   - อัปเดต `src/app/(main)/pos/page.tsx` ให้โหลดสต็อกตามสาขา
   - ปรับปรุง `src/components/pos/PosProductGrid.tsx` ให้แสดงป้ายสต็อก หรือ "ชั่งขาย"
3. **Step 3: Cart Thumbnail Image**
   - ปรับปรุง `src/components/pos/PosCartItemRow.tsx` เพื่อแสดง Thumbnail 44x44px พร้อม Fallback
4. **Step 4: Cart Auto-Scroll & Visual Highlight**
   - เพิ่ม `lastActiveItemId` ใน `src/context/PosCartContext.tsx`
   - เพิ่ม Auto-scroll logic และ Highlight ใน `src/components/pos/PosCartPanel.tsx` และ `PosCartItemRow.tsx`
5. **Step 5: Verification & Testing**
   - ทดสอบตาม `quickstart.md` และตรวจสอบ Type Check / Lint
