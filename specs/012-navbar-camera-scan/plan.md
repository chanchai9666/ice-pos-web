# Implementation Plan: ปุ่มสแกนสินค้าด้วยกล้องบน Navbar (Navbar Camera Product Scanner Button)

**Branch**: `012-navbar-camera-scan` | **Date**: 2026-10-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-navbar-camera-scan/spec.md`

## Summary

เพิ่มทางเข้าการสแกนบาร์โค้ดสินค้าด้วยกล้อง (Camera Barcode Scanner) บนแถบนำทาง (Navbar) เพื่อความสะดวกรวดเร็วในการขายหน้าร้าน โดยคงพฤติกรรมเดิมของระบบสแกน (`PosCameraScannerModal`) ไว้อย่างครบถ้วน ประกอบด้วย:
1. เพิ่มปุ่มสแกนด่วนบนแถบนำทางด้านล่าง (`AppBottomNav`) สำหรับอุปกรณ์หน้าจอพกพา (มือถือ/แท็บเล็ต) ขนาดสัมผัส >= 48px
2. เพิ่มปุ่มสแกนบนแถบนำทางด้านบน (`AppHeader`) สำหรับหน้าจอเดสก์ท็อป
3. เพิ่มระบบรับคำสั่งผ่าน Custom Event และ URL Query Parameter (`/pos?scan=camera`) เพื่อให้สามารถกดปุ่มสแกนจากหน้าใดในระบบแล้วนำทางกลับมาเปิดกล้องสแกนในหน้า POS ได้ทันที

## Technical Context

**Language/Version**: TypeScript 5, React 19.3.0, Next.js 16.4.2 (App Router)  
**Primary Dependencies**: TailwindCSS v4, Next.js Navigation (`useRouter`, `usePathname`, `useSearchParams`), WebRTC MediaDevices API  
**Storage**: Client Storage (`localStorage` สำหรับตะกร้าสินค้า)  
**Testing**: ESLint, TypeScript Compilation (`next build`), Manual UI & Touch Target Verification  
**Target Platform**: Responsive Web (Desktop, iPad/Tablet, Mobile touch screens, iOS Safari / Android Chrome)  
**Project Type**: Web POS Frontend Application  
**Performance Goals**: เปิดหน้าต่างกล้องภายใน < 300ms, สแกนบาร์โค้ดติดภายใน < 1.5 วินาที  
**Constraints**: ขนาดเป้าหมายสัมผัส >= 48x48px (Elderly-Friendly), คอนทราสต์สีสูง, รองรับ Safe Area Inset  
**Scale/Scope**: UI Components (`AppHeader`, `AppBottomNav`) และ Page Controller (`src/app/(main)/pos/page.tsx`)  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: ข้อความปุ่มและคำแนะนำทั้งหมดใช้ภาษาไทยชัดเจน ("สแกนสินค้า", "สแกน")
- [x] **3.3 รักษาความสามารถเดิมของระบบ**: นำทางและเชื่อมต่อกับ `PosCameraScannerModal` เดิม ไม่แก้ไขตรรกะตะกร้าสินค้า
- [x] **5.1 ห้ามจำลองข้อมูลขึ้นเอง**: ใช้ข้อมูลสินค้าและกะการขายจริงผ่าน API ตามเดิม
- [x] **6.3 การรองรับหน้าจอและแพลตฟอร์ม**: ออกแบบปุ่มแยกตามบริบทหน้าจอ (BottomNav บนมือถือ, Header บนเดสก์ท็อป)
- [x] **6.5 การออกแบบที่เหมาะสมกับผู้สูงอายุและการสัมผัส**: พื้นที่สัมผัสปุ่ม >= 48x48px คอนทราสต์สีเด่นชัด
- [x] **6.6 Loading Overlay**: กระบวนการเชื่อมโยง API ยังอยู่ภายใต้กลไก Loading Overlay ตามเดิม

## Project Structure

### Documentation (this feature)

```text
specs/012-navbar-camera-scan/
├── spec.md              # Feature specification & clarified decisions
├── checklists/
│   ├── requirements.md  # Requirements quality checklist (16/16 passed)
│   └── ux.md            # Custom UX requirements checklist
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 technical decisions
├── data-model.md        # Phase 1 UI state model & event contract
├── contracts/
│   └── ui-contracts.md  # Phase 1 component contracts
├── quickstart.md        # Phase 1 verification guide
└── tasks.md             # Phase 2 implementation tasks
```

### Source Code Changes

```text
src/
├── app/
│   └── (main)/
│       └── pos/
│           └── page.tsx                        # รองรับ Query Param ?scan=camera และ Custom Event
├── components/
│   └── layout/
│       ├── AppHeader.tsx                       # เพิ่มปุ่มสแกนกล้องสำหรับหน้าจอ Desktop (>= 1024px)
│       └── AppBottomNav.tsx                    # เพิ่มปุ่มสแกนกล้องด่วนสำหรับหน้าจอ Mobile/Tablet (< 1024px)
└── utils/
    └── navigation.ts (หรือใน constants)        # Helper function triggerCameraScanner()
```

## Plan Phases

- **Phase 0**: Outline & Research (Completed in `research.md`)
- **Phase 1**: Design & Contracts (Completed in `data-model.md`, `contracts/ui-contracts.md`, `quickstart.md`)
- **Phase 2**: Implementation Tasks (To be generated via `/speckit-tasks`)
