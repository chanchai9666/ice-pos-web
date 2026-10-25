# Implementation Plan: ระบบแสดง Loading Overlay บล็อกการทำงานขณะมี Action เรียกใช้งาน API (API Action Loading Overlay & Interaction Blocking)

**Branch**: `010-api-action-overlay` | **Date**: 2026-10-25 | **Spec**: [spec.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/010-api-action-overlay/spec.md)

**Input**: Feature specification from `/specs/010-api-action-overlay/spec.md`

## Summary

พัฒนาระบบ Global Action Loading Overlay กลางเพื่อควบคุมการปฏิสัมพันธ์ของผู้ใช้และป้องกันการกดส่งข้อมูลซ้ำซ้อน (Double Submit / Duplicate API Actions) ทุกครั้งที่มีการกระทำที่เรียกใช้ API ตามข้อกำหนดในธรรมนูญการพัฒนาระบบ v1.5.1 หมวด 6.6, 5.2 และ 13 (ข้อ 11) โดยระบบจะแสดง Backdrop และ Loading Spinner พร้อมข้อความภาษาไทยเพื่อบล็อก Pointer Events ทั้งหมดจนกว่า API จะประมวลผลเสร็จสิ้น พร้อมทั้งรองรับ Multiple Concurrent Requests ผ่านตัวนับ (Counter), มีกลไกตัดการทำงานฉุกเฉิน (Timeout Auto-Dismiss 15s/30s), และยกเว้นคำขอประมวลผลเบื้องหลังแบบเงียบ (Silent Background Tasks เช่น Silent Token Refresh)

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+

**Primary Dependencies**: Next.js 16+ (App Router), React 19, Tailwind CSS v4, Lucide React (Icons)

**Storage**: In-memory React Context & Event Emitter State (Client-side Lifecycle)

**Testing**: Manual & Scenario Validation via Test Scripts / Browser QA

**Target Platform**: Web Browsers (Chrome/Safari/Edge on Desktop, Tablets & POS Touchscreen Terminals)

**Project Type**: Point of Sale (POS) Web Application (Frontend)

**Performance Goals**: Overlay ปรากฏขึ้นภายใน 100ms หลังเกิด Action, ปลดล็อกหน้าจอภายใน 100ms หลัง API เสร็จสิ้น, ป้องกัน Duplicate Request 100%

**Constraints**: ปฏิบัติตามมาตรฐาน Elderly-Friendly Design (High Contrast WCAG 2.1 AA, Large Text >= 16px), รองรับ Touchscreen เต็มรูปแบบ, ไม่บล็อก Silent Refresh เบื้องหลัง

**Scale/Scope**: ทุกจุดการเชื่อมต่อ API ของระบบ POS (Checkout, Payment, Cart Actions, Product Catalog, Auth)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: ข้อความสถานะบน Overlay และการแจ้งเตือนข้อผิดพลาดใช้ภาษาไทย 100% (ผ่าน)
- [x] **5.1 & 5.2 แหล่งข้อมูลและสถานะ**: เชื่อมต่อ API จริงผ่าน `src/services/api.ts` และจัดการสถานะ Loading กลาง (ผ่าน)
- [x] **6.5 Elderly-Friendly & Touchscreen**: Overlay มี Contrast สูง ขนาดตัวอักษรใหญ่ชัดเจน ไม่ใช้สีจาง และบล็อกการกดพลาด (ผ่าน)
- [x] **6.6 API Action Loading Overlay**: แสดง Overlay คลุมหน้าจอ บล็อกการกดซ้ำ แสดงจนกว่าจะแล้วเสร็จ ยกเว้นคำของานเบื้องหลัง (ผ่าน)
- [x] **13. AI Coding Agent ข้อ 11**: กำหนด Loading Overlay บล็อกการกดซ้ำในทุก Action เชื่อมต่อ API และยกเว้น Silent Tasks (ผ่าน)

## Project Structure

### Documentation (this feature)

```text
specs/010-api-action-overlay/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── overlay-api.md   # Contracts for Overlay Context & API Client Hook
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── auth.ts                   # Extended RequestOptions with silent, loadingMessage, timeoutMs
│   └── overlay.ts                # OverlayState, OverlayContextType, OverlayListener types
├── services/
│   ├── api.ts                    # Integrated Loading Coordinator with Request Counter & Timeout
│   └── overlay-coordinator.ts    # Standalone Event Coordinator for non-React API calls
├── context/
│   └── LoadingOverlayContext.tsx # React Context & Provider for Global Overlay State
├── components/
│   ├── ui/
│   │   └── LoadingOverlay.tsx    # Presentation Component (Elderly-Friendly Backdrop, Spinner & Text)
│   └── layout/
│       └── RootLayoutWrapper.tsx # Mounting LoadingOverlay in Next.js Root Layout
└── app/
    └── layout.tsx                # Integrating LoadingOverlayProvider
```
