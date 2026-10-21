# Implementation Plan: ระบบจุดขายสินค้าหน้าร้าน (POS Sales Screen & Barcode Scanning)

**Branch**: `004-pos-sales-screen` | **Date**: 2026-10-21 | **Spec**: [specs/004-pos-sales-screen/spec.md](spec.md)

**Input**: Feature specification from `/specs/004-pos-sales-screen/spec.md`

## Summary

พัฒนาระบบจุดขายสินค้าหน้าร้าน (POS Sales Screen) ที่รองรับทั้งการขายสินค้าแบบเลือกสินค้าเอง และการเลือกสินค้าด้วยการสแกนบาร์โค้ด (ทั้งจากเครื่องสแกนเนอร์ฮาร์ดแวร์ และการสแกนผ่านกล้องของอุปกรณ์) โดยออกแบบตามมาตรฐานความเหมาะสมกับผู้สูงอายุและหน้าจอสัมผัส (Elderly-Friendly & Touchscreen Design):
1. **เลย์เอาต์หน้าจอขาย 2 คอลัมน์ (Two-Column Layout)**: ฝั่งซ้ายเป็นแผงค้นหา หมวดหมู่ และการ์ดเลือกสินค้า (60-65%), ฝั่งขวาเป็นแผงตะกร้าขาย สรุปยอดเงิน และปุ่มคิดเงิน (35-40%) ติดตรึงไว้
2. **การเลือกสินค้าด้วยตนเอง**: แสดงการ์ดสินค้าขนาดใหญ่พร้อมภาพ ชื่อ SKU/บาร์โค้ด ราคาขาย และตัวกรองหมวดหมู่ด่วน
3. **การสแกนด้วยเครื่องสแกนบาร์โค้ดฮาร์ดแวร์ (Hardware Barcode Scanner)**: Global Keydown Listener พร้อมระบบแปลงผังแป้นพิมพ์ภาษาไทยเป็นภาษาอังกฤษ/ตัวเลข (Thai Key Layout Fallback) 100%
4. **การสแกนด้วยกล้อง (Camera Barcode Scanner)**: Modal Dialog ขนาดใหญ่ตรงกลางจอ พร้อมโหมดสแกนต่อเนื่อง (Continuous Scan) และกรอบเล็ง Viewfinder
5. **ระบบเสียงตอบรับคู่ (Dual Audio Feedback)**: สร้างเสียงสังเคราะห์ผ่าน Web Audio API แยกชัดเจนระหว่างเสียงสำเร็จ (Success High-pitch Beep) และเสียงล้มเหลว (Error Low-pitch Buzzer)
6. **การจัดการตะกร้าและแป้นพิมพ์สัมผัส**: ปรับจำนวนด้วยปุ่ม +/- ขนาดใหญ่ หรือแตะระบุจำนวนผ่าน `VirtualNumericKeypad` โดยล็อกราคาขายตามฐานข้อมูลสินค้า
7. **การตรวจสอบสถานะกะขาย (Shift Prerequisite)**: ตรวจสอบสถานะกะขายผ่าน `GET /api/v1/shifts/active` และมี Modal บังคับเปิดกะก่อนขั้นตอนชำระเงิน

## Technical Context

**Language/Version**: TypeScript 5+ (Strict Mode)  
**Primary Dependencies**: Next.js 16 (App Router), React 19, Lucide React (Icons), Tailwind CSS v4, Web Audio API, HTML5 MediaDevices / BarcodeDetector API  
**Storage**: Web Storage (LocalStorage สำหรับบันทึกสถานะตะกร้าสินค้าชั่วคราว ป้องกันข้อมูลสูญหายเมื่อรีเฟรช) และ REST API  
**Testing**: Manual Walkthrough via Quickstart Scenarios, TypeScript Compile Check, Next.js Linter  
**Target Platform**: Web Browser บนเครื่อง POS หน้าจอสัมผัส, คอมพิวเตอร์ตั้งโต๊ะ, แล็ปท็อป และแท็บเล็ต (iPad/Android)  
**Project Type**: Next.js Single-Page Application (POS Terminal Route `/pos`)  
**Performance Goals**: สแกนบาร์โค้ดและเพิ่มลงตะกร้า <1 วินาที, ค้นหาแคตตาล็อก <300ms, เสียง Beep เล่นทันที <50ms (Zero Latency)  
**Constraints**: ปฏิบัติตามธรรมนูญโครงการ v1.4.0 (Elderly-Friendly Touch Target >= 48px, High Contrast WCAG 2.1 AA, No Ad-hoc Mock Data, Thai Language UI)  
**Scale/Scope**: รองรับแคตตาล็อกสินค้ากว่า 500+ รายการต่อสาขา, บิลขายที่มีสินค้าได้หลายสิบรายการ  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| หมวดในธรรมนูญ | ข้อกำหนด | ผลการประเมิน | หมายเหตุ |
| :--- | :--- | :---: | :--- |
| **2. ภาษา** | ใช้ภาษาไทยเป็นหลักในการสื่อสาร UI Text และเอกสาร | **ผ่าน** | ข้อความในหน้า POS, ป้ายกำกับ, และเสียง/ข้อความแจ้งเตือนเป็นภาษาไทยทั้งหมด |
| **3.1 ความถูกต้อง** | ห้ามสร้าง Mock Data ขึ้นเอง อ้างอิง Swagger API จริง | **ผ่าน** | ใช้งาน API จาก `/products`, `/categories`, `/products/lookup/{code}`, `/shifts/active` |
| **5.1 สัญญา API** | ใช้ Standard Envelope `{ code, message, data, meta }` | **ผ่าน** | กำหนด interface ตรงตาม Swagger และใช้ผ่าน `src/services/` |
| **5.3 ความถูกต้องข้อมูล** | แปลงหน่วยเงิน Satang (Integer) ↔ Baht อย่างแม่นยำ | **ผ่าน** | ใช้ยูทิลิตี `formatSatangToBaht` ป้องกัน Floating Point Error |
| **6. มาตรฐาน UI/UX** | หน้าจอสัมผัส POS เหมาะสมกับผู้สูงอายุ (Elderly-Friendly) | **ผ่าน** | ปุ่มและเป้าหมายสัมผัส >= 48px, คอนทราสต์ WCAG 2.1 AA, ฟอนต์ >= 16px, ราคาตัวเลขเด่นชัด |
| **6.5 ผู้สูงอายุและจอสัมผัส** | แป้นพิมพ์ตัวเลขสัมผัส (Virtual Numpad) สำหรับระบุจำนวน | **ผ่าน** | ผสานการทำงานกับ `VirtualNumericKeypad` เมื่อปรับจำนวนสินค้า |
| **9. การจัดการข้อผิดพลาด** | เสียงเตือนและข้อความแจ้งเตือนที่ชัดเจน | **ผ่าน** | แยกเสียง Beep สำเร็จ / Buzzer ล้มเหลว และแสดง Non-blocking Toast สีแดงเด่นชัด |

## Project Structure

### Documentation (this feature)

```text
specs/004-pos-sales-screen/
├── spec.md              # Feature specification
├── plan.md              # This file (Implementation Plan)
├── research.md          # Architecture decisions & audio/hardware scanner research
├── data-model.md        # CartItem, CartSummary & ShiftInfo data structures
├── contracts/           # API contracts for POS & Shifts
│   └── pos-sales-api.md
├── quickstart.md        # Validation walkthrough scenarios
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Implementation tasks (/speckit-tasks output)
```

### Source Code (repository layout)

```text
src/
├── app/
│   └── (main)/
│       └── pos/
│           └── page.tsx                         # POS Terminal Main Page (2-column layout)
├── components/
│   ├── pos/
│   │   ├── PosProductGrid.tsx                   # Product catalog grid with large cards
│   │   ├── PosCategoryTabs.tsx                  # Category selection pills
│   │   ├── PosSearchBar.tsx                     # Quick search bar with clear button
│   │   ├── PosCartPanel.tsx                     # Cart item list, line items, totals & checkout button
│   │   ├── PosCartItemRow.tsx                   # Individual cart item row with +/- and delete
│   │   ├── PosCameraScannerModal.tsx            # Camera barcode scanner modal with viewfinder
│   │   ├── PosShiftBanner.tsx                   # Active shift warning banner & status
│   │   └── PosOpenShiftModal.tsx                # Open shift modal dialog with starting cash
│   └── ui/
│       ├── VirtualNumericKeypad.tsx             # Existing virtual touch numpad
│       └── Icons.tsx                            # Barcode, Camera, ShoppingCart, Volume icons
├── context/
│   └── PosCartContext.tsx                       # State management for POS cart, items, scanner & sound
├── services/
│   ├── catalog.service.ts                       # Existing catalog & lookup service
│   └── shift.service.ts                         # New shift service (active shift, open shift)
├── types/
│   ├── catalog.ts                               # Existing catalog types
│   ├── pos.ts                                   # New CartItem, CartSummary, ScanEvent types
│   └── shift.ts                                 # New ShiftInfo, OpenShiftRequest types
└── utils/
    ├── audio.ts                                 # Web Audio API Sound Synthesizer (Beep / Buzzer)
    ├── barcode.ts                               # Keyboard barcode listener & Thai-to-English key mapper
    └── currency.ts                              # Existing currency formatting helpers
```
