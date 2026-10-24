# Implementation Plan: Continuous Usage Token Refresh & Idle Session Timeout

**Branch**: `008-auth-token-refresh` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-auth-token-refresh/spec.md`

## Summary

ปรับปรุงระบบการจัดการยืนยันตัวตนและวงจรชีวิตของเซสชัน (Session Lifecycle) เพื่อให้:
1. รองรับการต่ออายุสิทธิ์เข้าถึง (Silent Token Refresh) เบื้องหลังโดยอัตโนมัติเมื่อมีการใช้งานระบบ POS อย่างต่อเนื่อง โดยใช้กลไก Interceptor ใน `src/services/api.ts` ในการดักจับ 401 และ Retry คำขอเดิมซ้ำทันที
2. ป้องกันปัญหา Race Condition เมื่อมีคำขอพร้อมกันหลายรายการ (Concurrent Requests) โดยจัดคิวและเรียกขอ Refresh Token เพียงครั้งเดียว
3. นำทางออกจากระบบ (Auto Logout) ทันทีเมื่อ Refresh Token จากเซิร์ฟเวอร์หมดอายุจริง พร้อมแจ้งเตือนผู้ใช้ด้วยข้อความภาษาไทยที่ชัดเจนตามมาตรฐาน Elderly-Friendly
4. จดจำข้อมูลสาขาล่าสุดและคงรายการสินค้าในตะกร้าขายไว้ เพื่อให้แคชเชียร์สามารถใส่รหัส PIN กลับเข้ามาทำงานต่อได้ทันทีโดยไม่ต้องเริ่มต้นใหม่

## Technical Context

**Language/Version**: TypeScript 5+  
**Primary Dependencies**: Next.js 16+ (App Router), React 19, Tailwind CSS v4, Lucide React  
**Storage**: LocalStorage (`ice_pos_access_token`, `ice_pos_refresh_token`, `ice_pos_current_branch`, ตะกร้าสินค้า)  
**Testing**: TypeScript Strict Check (`npx tsc --noEmit`), ESLint (`npm run lint`), Manual Browser Test  
**Target Platform**: Desktop & Tablet POS (Touchscreen 1080p+, Chrome/Safari/Edge)  
**Project Type**: Single Frontend Web Application (`src/`)  
**Performance Goals**: กระบวนการ Silent Refresh และ Retry คำขอเดิมต้องทำได้รวดเร็วภายใน < 500ms โดยไม่ส่งผลกระทบต่อเฟรมเรตหรือบล็อก UI  
**Constraints**: ปฏิบัติตามธรรมนูญ ice-pos-web (Constitution v1.4.0) โดยใช้ภาษาไทย 100% ใน UI, ข้อความแจ้งเตือนชัดเจน, ไม่สร้าง Mock Data แปลกปลอม, และคงความสามารถเดิมของการล็อกอิน  
**Scale/Scope**: ปรับปรุง `src/services/api.ts`, `src/context/AuthContext.tsx`, `src/utils/storage.ts`, และ `src/types/auth.ts`  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: ข้อความแจ้งเตือนเมื่อเซสชันหมดอายุใช้ภาษาไทย 100% อ่านง่าย ชัดเจน
- [x] **3.1 ความถูกต้องมาก่อนความรวดเร็ว**: ตรวจสอบสถานะ Token จริงกับเซิร์ฟเวอร์ ไม่ตัดเซสชันโดยพลการ
- [x] **3.3 รักษาความสามารถเดิมของระบบ**: คงฟังก์ชัน LoginWithCredentials, LoginWithPin, และการจัดการตะกร้าสินค้าเดิมไว้อย่างครบถ้วน
- [x] **5.1 สัญญาการเชื่อมต่อและไม่สร้างข้อมูลสมมุติ**: ใช้ API Endpoint จริง `/api/v1/auth/refresh` และโครงสร้างตาม Swagger Spec
- [x] **6.5 การออกแบบที่เหมาะสมกับผู้สูงอายุ (Elderly-Friendly)**: กล่องแจ้งเตือนขนาดใหญ่ คอนทราสต์สูง ตัวอักษร >= 16px
- [x] **13.0 ข้อกำหนด AI Agent**: ปฏิบัติตามมาตรฐานและขั้นตอนอย่างเคร่งครัด

**Gate Status**: PASSED (ไม่มีข้อขัดแย้งกับธรรมนูญ)

## Project Structure

### Documentation (this feature)

```text
specs/008-auth-token-refresh/
├── spec.md              # Feature specification & clarified requirements
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0 technical research & decision records
├── data-model.md        # Phase 1 data models & presentation resolution logic
├── quickstart.md        # Phase 1 verification scenarios & test commands
├── contracts/           # Phase 1 UI component & interaction contracts
│   └── auth-refresh-session.contract.md
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code Impact

```text
src/
├── types/
│   └── auth.ts                      # เพิ่มประเภทข้อมูลเกี่ยวกับ Session Lifecycle & Events
├── services/
│   ├── api.ts                       # เพิ่ม 401 Interceptor, Queueing & Silent Token Refresh
│   └── auth.service.ts              # ฟังก์ชัน refreshToken เดิมที่พร้อมใช้งาน
├── context/
│   └── AuthContext.tsx              # ลงทะเบียน Event จัดการเซสชันหมดอายุ และ Toast Notification
└── utils/
    └── storage.ts                   # ปรับปรุงนโยบายการล้าง Token โดยยังคงจำสาขาและตะกร้าไว้
```

**Structure Decision**: ทำงานโดยตรงภายในโปรเจกต์เดี่ยว (`src/`) โดยเสริมประสิทธิภาพกลไก API Client และ Context ที่มีอยู่เดิม โดยไม่เพิ่มความซับซ้อนเกินจำเป็น

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| *None* | ไม่มีส่วนใดที่ละเมิดธรรมนูญหรือมีความซับซ้อนเกินความจำเป็น | - |

---

## Phase Execution Summary

- **Phase 0: Outline & Research**: สรุปกลไก Reactive 401 Interceptor, Single Refresh Promise, Request Queueing และ Event-Driven Session Expiration ใน `research.md` สำเร็จ
- **Phase 1: Design & Contracts**: กำหนดแบบจำลองสถานะใน `data-model.md`, สัญญาการเรียกใช้ใน `contracts/auth-refresh-session.contract.md`, และคู่มือการทดสอบใน `quickstart.md` สำเร็จ
- **Next Step**: พร้อมดำเนินการสร้าง Task งานด้วย `/speckit-tasks` เพื่อเตรียมการ Implement ต่อไป
