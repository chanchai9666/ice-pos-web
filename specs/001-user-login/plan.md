# Implementation Plan: ระบบเข้าสู่ระบบสำหรับผู้ใช้งานและแคชเชียร์ (User & Cashier Authentication)

**Branch**: `001-user-login` | **Date**: 2026-10-21 | **Spec**: [spec.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/001-user-login/spec.md)

**Input**: Feature specification from `/specs/001-user-login/spec.md`

## Summary

พัฒนาระบบและหน้าจอเข้าสู่ระบบ (Login) สำหรับระบบขายหน้าร้าน ICE POS รองรับการยืนยันตัวตน 2 รูปแบบ:
1. **เข้าสู่ระบบด้วย Username & Password**: สำหรับผู้ดูแลระบบ ผู้จัดการ และพนักงานทั่วไป
2. **เข้าสู่ระบบด่วนด้วย PIN**: สำหรับพนักงานแคชเชียร์ประจำสาขา พร้อมแผงแป้นตัวเลขเสมือน (Virtual Numpad) รองรับหน้าจอสัมผัส (Touchscreen POS) และการจดจำสาขาล่าสุด

เชื่อมต่อตรงกับ ICE POS Backend API (`/api/v1/auth/login`, `/api/v1/auth/pin-login`, `/api/v1/branches`) ผ่าน Standard Fetch Client พร้อมระบบจัดการ Token และกลไก Cooldown 60 วินาทีเมื่อป้อนผิด 5 ครั้ง

## Technical Context

**Language/Version**: TypeScript 5+ (Strict Mode)

**Primary Dependencies**: Next.js 16+ (App Router), React 19, Tailwind CSS v4

**Storage**: `localStorage` (สำหรับจัดเก็บ JWT Access/Refresh Token, ข้อมูลผู้ใช้, สาขาที่เลือก, และ Device Preferences) และ `sessionStorage` (สำหรับ Cooldown Timestamp)

**Testing**: React Component & Integration Testing / Browser Testing

**Target Platform**: Web Browser บนเครื่องขายหน้าร้าน (Touchscreen POS Terminal, แท็บเล็ต, เดสก์ท็อป) รองรับ Responsive

**Project Type**: Next.js Web Application (`ice-pos-web`)

**Performance Goals**:
- โหลดหน้าจอเข้าสู่ระบบและพร้อมใช้งานภายในเวลาไม่เกิน 1 วินาที
- ป้อน PIN และตอบสนองต่อการสัมผัส (Touch Latency) < 50ms
- การยืนยันตัวตนสำเร็จภายในเวลาไม่เกิน 5 วินาทีสำหรับ PIN และ 15 วินาทีสำหรับ Username/Password

**Constraints**:
- ใช้ภาษาไทยเป็นหลักในส่วนติดต่อผู้ใช้ (UI) และข้อความแจ้งเตือน (ตาม Constitution ข้อ 2.1)
- ห้ามจำลอง Mock Data ขึ้นเอง ให้เชื่อมต่อ API ตามสัญญา OpenAPI ใน `docs/api-summary.md` (ตาม Constitution ข้อ 5.1)
- ออกแบบ Numpad ให้มี Touch Target ขนาดใหญ่เหมาะกับนิ้วมือบนจอสัมผัส

**Scale/Scope**:
- 1 หน้าจอหลัก (`/login`)
- 2 โมดูลการยืนยันตัวตน (Username/Password Form และ PIN Numpad Form)
- รองรับการสลับกะและผู้ใช้งานแคชเชียร์หน้าร้านตลอดเวลาเปิดให้บริการ

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| ข้อกำหนดตามธรรมนูญ (Constitution Rule) | การประเมินผล (Evaluation) | สถานะ (Status) |
| :--- | :--- | :---: |
| **2.1 ใช้ภาษาไทยเป็นหลัก** | เอกสารและ UI ทั้งหมดใช้ภาษาไทย คงชื่อทางเทคนิคที่จำเป็น | **ผ่าน (PASS)** |
| **3.1 ความถูกต้องมาก่อนความรวดเร็ว** | อ้างอิง Endpoint และ Data Schema จาก Swagger API จริง | **ผ่าน (PASS)** |
| **3.2 ความเรียบง่ายและความเหมาะสม** | ใช้ Native Fetch Wrapper และ Tailwind CSS v4 ไม่เพิ่ม Library ซ้ำซ้อน | **ผ่าน (PASS)** |
| **5.1 ห้ามจำลอง Mock Data ขึ้นเอง** | อ้างอิงสัญญา `POST /api/v1/auth/login`, `POST /api/v1/auth/pin-login`, `GET /api/v1/branches` | **ผ่าน (PASS)** |
| **7. ความปลอดภัยและความเป็นส่วนตัว** | ซ่อนรหัสผ่าน/PIN (Masking), ไม่บันทึกรหัสผ่านใน Log, มี Cooldown 60 วินาที | **ผ่าน (PASS)** |

## Project Structure

### Documentation (this feature)

```text
specs/001-user-login/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── auth.contract.ts
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository layout)

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx         # หน้าจอหลักสำหรับการเข้าสู่ระบบ (/login)
│   ├── layout.tsx               # Root Layout
│   └── globals.css              # Tailwind CSS v4 theme & global styles
├── components/
│   └── auth/
│       ├── LoginForm.tsx        # ฟอร์มหลักจัดการการสลับโหมดและสถานะ
│       ├── CredentialLogin.tsx  # ส่วนกรอก Username & Password
│       ├── PinLogin.tsx         # ส่วนเลือกสาขาและป้อน PIN
│       ├── VirtualNumpad.tsx    # แผงแป้นตัวเลข 0-9 สำหรับจอสัมผัส
│       └── CooldownTimer.tsx    # การนับถอยหลังระงับการลองเมื่อใส่รหัสผิดครบ 5 ครั้ง
├── services/
│   ├── api.ts                   # Standard API Client (fetch wrapper & envelope handler)
│   └── auth.service.ts          # Authentication service functions (login, pinLogin, branches)
├── types/
│   └── auth.ts                  # Type definitions (UserProfile, Branch, AuthResponse)
└── utils/
    └── storage.ts               # LocalStorage & SessionStorage helper (Tokens, Branch, Mode)
```

**Structure Decision**:
เลือกใช้โครงสร้าง Next.js 16 App Router มาตรฐานภายใต้ `src/` แบ่งแยกความรับผิดชอบชัดเจนระหว่าง UI Component (`components/auth/`), Data Layer & API Service (`services/`), และ Type Definition (`types/`) ตามหลัก Separation of Concerns (Constitution ข้อ 4.1)

## Complexity Tracking

> *ไม่มีรายการละเมิดกฎธรรมนูญ (No violations)*
