# Implementation Plan: การปรับปรุงระบบพิสูจน์ตัวตนแบบผสมผสาน (Hybrid Authentication Support)

**Branch**: `009-hybrid-auth-support` | **Date**: 2026-10-25 | **Spec**: [spec.md](file:///Users/chanchai/workshop/CODE/ice-pos-web/specs/009-hybrid-auth-support/spec.md)

**Input**: Feature specification from `specs/009-hybrid-auth-support/spec.md`

## Summary

ปรับปรุงระบบการส่งคำขอและการจัดการสิทธิ์การเข้าใช้งานของ `ice-pos-web` ให้รองรับการยืนยันตัวตนแบบผสมผสาน (Hybrid Authentication Support) ร่วมกับ `ice-pos-api`:
1. เปิดใช้งานการส่งผ่านข้อมูลรับรองความปลอดภัย (`credentials: 'include'`) ในระดับ API Client ส่วนกลาง เพื่อให้เบราว์เซอร์ส่งและรับ Secure HttpOnly Cookie โดยอัตโนมัติ
2. คงความสามารถในการส่งส่วนหัว `Authorization: Bearer <token>` ควบคู่ไปในคำขอ เพื่อรองรับบริการหลังบ้านทุกรูปแบบอย่างราบรื่น (Dual-Credential Dispatch)
3. พัฒนาระบบการต่ออายุสิทธิ์เบื้องหลัง (Silent Token Refresh) ให้รองรับการขอต่ออายุผ่านคุกกี้ หรือข้อมูลในคำขอ (Hybrid Refresh) พร้อมกลไก Single-flight Coordinator
4. เพิ่มกระบวนการออกจากระบบแบบสมบูรณ์ (Dual Logout) โดยส่งคำขอไปยัง `/api/v1/auth/logout` เพื่อให้เซิร์ฟเวอร์ล้าง HttpOnly Cookie และล้างข้อมูลสิทธิ์ในอุปกรณ์ โดยยังคงข้อมูลสาขาและรายการในตะกร้าสินค้าไว้

## Technical Context

**Language/Version**: TypeScript 5.7+, Next.js 15+ (App Router)

**Primary Dependencies**: React 19, Tailwind CSS v4, Lucide React (ไม่มี external HTTP library เพิ่มเติม ใช้ native Fetch)

**Storage**: Browser HttpOnly Cookie (ควบคุมโดยเบราว์เซอร์) + LocalStorage (สำหรับ User Profile, สาขาปัจจุบัน และตะกร้าสินค้า)

**Testing**: Lint & Type Check (`npm run build` / `npm run lint`), Unit/Integration Verification

**Target Platform**: Modern Web Browsers (Chrome, Safari, Edge) บนคอมพิวเตอร์และแท็บเล็ตหน้าจอสัมผัสสำหรับงาน POS

**Project Type**: Web Application (Next.js Frontend)

**Performance Goals**: การต่ออายุสิทธิ์เบื้องหลัง (Silent Refresh) ใช้เวลาไม่เกิน 500ms โดยผู้ใช้ 0% พบการสะดุดบนหน้าจอ

**Constraints**: ปฏิบัติตามมาตรฐานความปลอดภัย XSS/CSRF, คอนทราสต์ WCAG 2.1 AA, Touch Target >= 48px, ไม่สูญเสียข้อมูลสินค้าในตะกร้า

**Scale/Scope**: ปรับปรุงโมดูลการสื่อสาร `api.ts`, บริการ `auth.service.ts`, บริบท `AuthContext.tsx`, ชนิดข้อมูล `auth.ts`, และการจัดการ `storage.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| หลักการตามธรรมนูญ | ผลการประเมิน | รายละเอียดการปฏิบัติตาม |
|---|---|---|
| **2.1 ใช้ภาษาไทยเป็นหลัก** | ผ่าน (Pass) | ข้อความแจ้งเตือนทั้งหมด เช่น "เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง" และเอกสารจัดทำเป็นภาษาไทย 100% |
| **3.1 ความถูกต้องมาก่อนความเร็ว** | ผ่าน (Pass) | การล้างสิทธิ์ทำทั้งสองฝั่ง (Server & Client) เพื่อความปลอดภัยสูงสุด ป้องกัน Token ตกค้าง |
| **3.2 ความเรียบง่ายและความเหมาะสม** | ผ่าน (Pass) | ใช้ native `fetch` และ `credentials: 'include'` ไม่เพิ่มไลบรารีภายนอกที่ซ้ำซ้อน |
| **3.3 รักษาความสามารถเดิมของระบบ** | ผ่าน (Pass) | รองรับ Bearer Header ควบคู่ไปด้วย ไม่กระทบโฟลว์การล็อกอิน PIN หรือการขายหน้าร้านเดิม |
| **6.5 Elderly-Friendly & Touchscreen** | ผ่าน (Pass) | ปุ่มออกจากระบบและปุ่มเข้าสู่ระบบใหม่มีขนาดไม่เล็กกว่า 48x48px และมีตัวอักษรขนาดใหญ่อ่านง่าย |

## Project Structure

### Documentation (this feature)

```text
specs/009-hybrid-auth-support/
├── spec.md              # ข้อกำหนดคุณลักษณะของฟีเจอร์
├── plan.md              # แผนการสถาปัตยกรรมและการปรับปรุง (ไฟล์นี้)
├── research.md          # ผลการวิเคราะห์และการตัดสินใจทางเทคนิค (Phase 0)
├── data-model.md        # แบบจำลองข้อมูลและสถานะเซสชัน (Phase 1)
├── quickstart.md        # คู่มือการทดสอบและตรวจสอบการทำงาน (Phase 1)
├── contracts/           # สัญญาการเชื่อมต่อระหว่างระบบ (Phase 1)
│   └── auth-api.md      # ข้อกำหนด API Endpoint (Refresh, Logout, Protected)
├── checklists/          # รายการตรวจสอบคุณภาพ
│   └── requirements.md  # รายการตรวจสอบคุณภาพของข้อกำหนด
└── tasks.md             # รายการงานสำหรับการลงมือพัฒนา (/speckit-tasks)
```

### Source Code Layout

```text
src/
├── types/
│   └── auth.ts          # เพิ่มเติม Session Event และ Request Options
├── utils/
│   └── storage.ts       # ฟังก์ชันจัดการ Storage และคงข้อมูลสาขา/ตะกร้า
├── services/
│   ├── api.ts           # เพิ่ม credentials: 'include', Bearer Header, Hybrid Refresh
│   └── auth.service.ts  # เพิ่มฟังก์ชัน logout() ยิงไปยัง /api/v1/auth/logout
├── context/
│   └── AuthContext.tsx  # ปรับปรุงโฟลว์ logout และ session expiry ให้เรียก API
└── components/
    ├── auth/            # หน้าจอ Login และ PIN Login
    └── layout/          # RouteGuard และ Header สำหรับการออกจากระบบ
```

**Structure Decision**: ปรับปรุงโครงสร้าง Source Code เดิมที่มีอยู่แล้วโดยไม่สร้างโฟลเดอร์หรือสถาปัตยกรรมใหม่ที่ไม่จำเป็น รักษา Single Source of Truth สำหรับการเรียก API ไว้ที่ `src/services/api.ts`

## Complexity Tracking

> *ไม่มีรายการที่ละเมิดธรรมนูญการพัฒนา (Zero Violations)*
