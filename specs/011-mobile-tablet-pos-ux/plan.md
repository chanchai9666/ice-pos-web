# Implementation Plan: Mobile & Tablet POS Usability and Login Alignment

**Branch**: `011-mobile-tablet-pos-ux` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-mobile-tablet-pos-ux/spec.md`

## Summary

ปรับปรุงประสบการณ์ผู้ใช้งาน (UX/UI) บนระบบ ice-pos-web ให้รองรับหน้าจอสัมผัสขนาดพกพา (มือถือ และ iPad/แท็บเล็ต) และเพิ่มความสมดุลของการ์ดเข้าสู่ระบบ ประกอบด้วย:
1. ปรับฟอร์มเข้าสู่ระบบด้วย Username/Password ให้มีความสูงขั้นต่ำและจัดวางสมดุลเท่ากับส่วน PIN Numpad
2. ปรับเลย์เอาต์หน้าจุดขาย (POS Terminal) บนหน้าจอขนาดพกพา (`< 1024px`) ให้แคตตาล็อกสินค้าแสดงผลเต็มจอ และนำเสนอการจัดการตะกร้าผ่านลิ้นชัก Bottom Sheet
3. เพิ่มแถบนำทางระดับแอพพลิเคชันด้านล่าง (`AppBottomNav`) สำหรับอุปกรณ์พกพา พร้อมผสานการแสดงผลสรุปยอดตะกร้าและการชำระเงินที่รวดเร็วใน 1 สัมผัส

## Technical Context

**Language/Version**: TypeScript 5, React 19.3.0, Next.js 16.4.2 (App Router)
**Primary Dependencies**: TailwindCSS v4, Next.js Navigation
**Storage**: Client Storage (`localStorage`, `sessionStorage`, HTTPOnly Cookies)
**Testing**: ESLint, TypeScript Compilation (`next build`), Manual UI & Responsive Verification
**Target Platform**: Responsive Web (Desktop, iPad/Tablet, Mobile touch screens, iOS Safari / Android Chrome)
**Project Type**: Web POS Frontend Application
**Performance Goals**: 60fps animations for Bottom Sheet transitions, < 100ms touch interaction response
**Constraints**: ปฏิบัติตามมาตรฐาน Elderly-Friendly (ขนาดปุ่มสัมผัส >= 48x48px, High Contrast, เว้นระยะ Safe Area Inset)
**Scale/Scope**: ส่วน UI Components หน้า Login, Layout Navigation และ POS Sales Screen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: ข้อความ UI Text และปุ่มคำสั่งทั้งหมดใช้ภาษาไทยที่ชัดเจน
- [x] **3.3 รักษาความสามารถเดิมของระบบ**: โค้ดเดิมบนหน้าจอ Desktop 2 คอลัมน์ และ Business Logic การขาย/คิดเงินยังทำงานได้ครบถ้วน
- [x] **6.3 การรองรับหน้าจอและแพลตฟอร์ม**: รองรับการปรับตามขนาดหน้าจอ (Desktop, Tablet, Mobile) ได้อย่างสมบูรณ์
- [x] **6.5 การออกแบบที่เหมาะสมกับผู้สูงอายุและการสัมผัส**: ปุ่มกด >= 48px คอนทราสต์สูง ช่องกรอกขนาดใหญ่
- [x] **6.6 Loading Overlay**: กระบวนการที่เชื่อมโยงกับ API ยังคงอยู่ภายใต้กลไก Loading Overlay ตามเดิม

## Project Structure

### Documentation (this feature)

```text
specs/011-mobile-tablet-pos-ux/
├── spec.md              # Feature specification & clarified decisions
├── checklists/
│   ├── requirements.md  # Requirements quality checklist
│   └── ux.md            # Custom UX requirements checklist
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 technical decisions
├── data-model.md        # Phase 1 UI state model
├── contracts/
│   └── ui-contracts.md  # Phase 1 component contracts
├── quickstart.md        # Phase 1 verification guide
└── tasks.md             # Phase 2 implementation tasks
```

### Source Code Changes

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                        # ปรับโครงสร้างครอบการ์ดให้สมดุล
│   └── (main)/
│       ├── layout.tsx                          # เพิ่ม AppBottomNav สำหรับ < 1024px
│       └── pos/
│           └── page.tsx                        # เลย์เอาต์ Responsive สำหรับ Desktop vs Mobile/Tablet
└── components/
    ├── auth/
    │   └── CredentialLogin.tsx                 # เพิ่ม min-h-[490px] และจัดกึ่งกลางฟอร์ม
    ├── layout/
    │   └── AppBottomNav.tsx                    # คอมโพเนนต์แถบนำทางด้านล่างใหม่
    └── pos/
        ├── PosCartBottomSheet.tsx              # คอมโพเนนต์ลิ้นชักตะกร้าสินค้าสำหรับมือถือ/แท็บเล็ต
        └── PosCartFloatingBar.tsx              # แถบสรุปยอดและปุ่มดูตะกร้าลอยเหนือ BottomNav
```

## Plan Phases

- **Phase 0**: Outline & Research (Completed in `research.md`)
- **Phase 1**: Design & Contracts (Completed in `data-model.md`, `contracts/ui-contracts.md`, `quickstart.md`)
- **Phase 2**: Implementation Tasks (To be generated via `/speckit-tasks`)
