# Implementation Plan: 014-scan-product-info-display

**Branch**: `014-scan-product-info-display` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-scan-product-info-display/spec.md`

## Summary

ขยายความสามารถของระบบสแกนบาร์โค้ดสินค้า (ทั้งผ่านกล้องใน Modal และผ่านเครื่องยิงฮาร์ดแวร์ในหน้า POS) ให้แสดงข้อมูลของสินค้าที่สแกนพบครบถ้วน ได้แก่ **เลขบาร์โค้ด, ชื่อสินค้า และราคาขาย (ในรูปแบบ Badge ป้ายราคาเด่นชัดตามมาตรฐาน Elderly-Friendly)** และกรณีสแกนแล้วไม่พบสินค้าในระบบ จะแสดงผล**เฉพาะเลขบาร์โค้ดที่สแกนติดเท่านั้น** พร้อมคงการสแกนต่อเนื่อง (Continuous Scanning) อย่างสมบูรณ์

## Technical Context

**Language/Version**: TypeScript 5, Next.js 15 (App Router), React 19  
**Primary Dependencies**: Tailwind CSS, Lucide React, `@zxing/browser`  
**Storage**: N/A (Frontend state & In-Memory / API Lookup)  
**Testing**: Manual E2E via browser & TypeScript typecheck (`npm run build`)  
**Target Platform**: Mobile (iOS Safari / Android Chrome), Tablet, Desktop  
**Project Type**: Web Application (POS Frontend)  
**Performance Goals**: แสดงผลข้อมูลสินค้าและราคาในแถบผลลัพธ์ทันที (<0.3 วินาที) หลังจากการตรวจจับบาร์โค้ด  
**Constraints**: ไม่ทำให้กล้องกระตุกหรือหยุดชะงัก, รองรับ Elderly-Friendly Design (ขนาดตัวอักษรและ Contrast สอดคล้องกับ WCAG 2.1 AA)  
**Scale/Scope**: ปรับปรุง 3 ไฟล์หลัก: `src/types/scanner.ts`, `src/components/pos/PosCameraScannerModal.tsx`, `src/app/(main)/pos/page.tsx`  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 & 2.2 ภาษาไทยเป็นหลัก**: UI และเอกสารใช้ภาษาไทยเป็นหลัก คงคำศัพท์เทคนิคตามจริง
- [x] **3.1 ความถูกต้องมาก่อนความเร็ว**: ตรวจสอบว่าราคาและบาร์โค้ดที่แสดงตรงกับฐานข้อมูลสินค้าจริงทุกประการ
- [x] **Elderly-Friendly UI/UX**: ตัวอักษรชัดเจน ป้ายราคาเด่นชัด รองรับผู้สูงอายุ ใช้งานสะดวกทั้งบนสมาร์ตโฟนและแท็บเล็ต
- [x] **No Full Blocking Overlay for Scans**: การแสดงผลราคาในกล้องไม่ใช้ Blocking Overlay ทับกล้อง และไม่ขัดขวางการทำงาน

## Project Structure

### Documentation (this feature)

```text
specs/014-scan-product-info-display/
├── spec.md              # Feature specification & Clarifications
├── plan.md              # Implementation Plan
├── research.md          # Technical decisions & rationale
├── data-model.md        # Entity & sequence diagrams
├── contracts/           # Interface and UI render contracts
│   └── scanner-contract.md
├── quickstart.md        # Step-by-step verification guide
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Impact

```text
src/
├── types/
│   └── scanner.ts                    # เพิ่ม price?: number ใน BarcodeScanResult และ ScanFeedbackResult
├── components/
│   └── pos/
│       └── PosCameraScannerModal.tsx  # ปรับปรุงแถบแจ้งเตือน Recent Scan Banner ให้แสดง Badge ราคา
└── app/
    └── (main)/
        └── pos/
            └── page.tsx              # ส่งมอบ price จาก catalog กลับมา และแสดงราคาใน Toast Notification
```

## Phases

- **Phase 0**: Research & Decisions (เสร็จสิ้นใน `research.md`)
- **Phase 1**: Design & Contracts (เสร็จสิ้นใน `data-model.md`, `contracts/`, `quickstart.md`)
- **Phase 2**: Task Generation (ดำเนินการใน `/speckit-tasks`)
