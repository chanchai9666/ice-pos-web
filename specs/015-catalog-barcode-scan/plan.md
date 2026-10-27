# Implementation Plan: ปุ่มสแกนบาร์โค้ดในฟอร์มเพิ่ม/แก้ไขสินค้า

**Branch**: `015-catalog-barcode-scan` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-catalog-barcode-scan/spec.md`

## Summary

เพิ่มปุ่ม **"สแกนบาร์โค้ด"** ในฟอร์มเพิ่ม/แก้ไขสินค้าบนหน้า `/catalog` (ทั้ง `ProductFormModal` และ `ProductFormDrawer`) วางคู่กับปุ่ม "สร้างบาร์โค้ดอัตโนมัติ" เมื่อกดแล้วเปิดโหมดสแกนด้วยกล้องแบบ **อ่านครั้งเดียว (single capture)** แล้วนำเลขบาร์โค้ดใส่ช่อง "บาร์โค้ดสินค้า" ทันที โดยไม่ค้นหาสินค้า ไม่เพิ่มเข้าตะกร้า และไม่นำทางไป POS

แนวทางเทคนิค: สร้าง Modal ใหม่สำหรับจับบาร์โค้ดเพื่อเติมฟอร์ม (`BarcodeCaptureModal`) ที่ใช้ Hybrid Decoder Engine แบบเดียวกับ POS (`BarcodeDetector` + `@zxing/browser`) และยูทิลิตี `cleanBarcode` ที่มีอยู่แล้ว โดย **ไม่แก้พฤติกรรม** ของ `PosCameraScannerModal`

## Technical Context

**Language/Version**: TypeScript 5, React 19.3.0, Next.js 16.4.2 (App Router)  
**Primary Dependencies**: TailwindCSS v4, `@zxing/browser` / `@zxing/library` (มีอยู่แล้ว), WebRTC `getUserMedia`, `cleanBarcode` จาก `@/utils/barcode`  
**Storage**: N/A (เติม state ฟอร์มในหน่วยความจำเท่านั้น จนกว่าผู้ใช้จะบันทึกสินค้าตาม flow เดิม)  
**Testing**: ESLint, TypeScript (`next build`), Manual UI verification ตาม `quickstart.md`  
**Target Platform**: Responsive Web (Desktop, Tablet, Mobile; iOS Safari / Android Chrome)  
**Project Type**: Web POS Frontend Application  
**Performance Goals**: เปิดกล้องภายใน ~1 วินาที; หลังอ่านบาร์โค้ดสำเร็จ ปิดโหมดสแกนและใส่ค่าลงช่องภายใน < 300ms  
**Constraints**: Touch target >= 48px; UI ภาษาไทย; single capture; ไม่เรียก lookup API ตอนสแกน; รักษาปุ่มสร้างบาร์โค้ดอัตโนมัติและพิมพ์มือ  
**Scale/Scope**: 2 ฟอร์มสินค้า (`ProductFormModal`, `ProductFormDrawer`) + Modal สแกนใหม่ 1 ตัว; ไม่มี API ใหม่

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: ป้ายปุ่ม/ข้อความแจ้งเตือนกล้องเป็นภาษาไทย ("สแกนบาร์โค้ด")
- [x] **3.2 ความเรียบง่าย**: ไม่ผูกฟอร์มแคตตาล็อกเข้ากับ `PosCameraScannerModal` ของ POS; สร้าง Modal จับบาร์โค้ดแยกหน้าที่ชัดเจน
- [x] **3.3 รักษาความสามารถเดิม**: ไม่เปลี่ยนตรรกะขาย/ตะกร้า/ตัวนับสแกน POS; คงพิมพ์มือและสร้างบาร์โค้ดอัตโนมัติ
- [x] **5.1 ห้ามจำลองข้อมูล / ไม่เดา API**: ฟีเจอร์นี้ไม่เรียก API ตอนสแกน; การบันทึกสินค้าใช้ endpoint เดิม
- [x] **6.1 UI Consistency**: สไตล์ปุ่มสอดคล้องปุ่ม cyan ของ "สร้างบาร์โค้ดอัตโนมัติ"
- [x] **6.5 Elderly-Friendly**: พื้นที่สัมผัสปุ่มและปุ่มปิดสแกน >= 48px
- [x] **6.6 API Overlay**: ไม่มี API ใหม่ตอนสแกน; การบันทึกฟอร์มยังใช้ overlay เดิม
- [x] **8 ประสิทธิภาพทรัพยากร**: หยุดกล้อง/decoder เมื่อปิด Modal หลัง capture สำเร็จหรือยกเลิก
- [x] **10 Dependency**: ใช้ `@zxing/*` ที่มีอยู่แล้ว ไม่เพิ่มแพ็กเกจใหม่โดยไม่จำเป็น

**Post-design re-check**: ผ่าน — contracts ระบุ single-capture + form-fill only; ไม่แตะ POS cart flow

## Project Structure

### Documentation (this feature)

```text
specs/015-catalog-barcode-scan/
├── spec.md
├── plan.md                 # this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contracts.md
├── checklists/
│   └── requirements.md
└── tasks.md                # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── catalog/
│   │   ├── ProductFormModal.tsx      # เพิ่มปุ่มสแกน + เปิด BarcodeCaptureModal + setBarcode
│   │   └── ProductFormDrawer.tsx     # เช่นเดียวกับ Modal
│   └── shared/                       # หรือ catalog/ ตามความเหมาะสมใน research
│       └── BarcodeCaptureModal.tsx   # Modal สแกน single-capture สำหรับเติมฟอร์ม
├── utils/
│   ├── barcode.ts                    # ใช้ cleanBarcode เดิม
│   └── audioFeedback.ts              # ใช้ playSuccessBeep (optional) เมื่อ capture สำเร็จ
└── components/ui/
    └── Icons.tsx                     # ใช้ Icons.Barcode หรือ Icons.Camera ที่มีอยู่
```

**Structure Decision**: โปรเจกต์เดี่ยว frontend ภายใต้ `src/` — เพิ่ม Modal จับบาร์โค้ดที่ใช้ซ้ำได้ และผูกเข้าฟอร์มแคตตาล็อกทั้งสองตัวโดยไม่แก้ `PosCameraScannerModal`

## Complexity Tracking

> ไม่มี constitution violations ที่ต้อง justify

## Plan Phases

- **Phase 0**: Outline & Research → `research.md`
- **Phase 1**: Design & Contracts → `data-model.md`, `contracts/ui-contracts.md`, `quickstart.md`
- **Phase 2**: Implementation Tasks → `/speckit-tasks` → `tasks.md`
