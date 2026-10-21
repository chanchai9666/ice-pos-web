# Implementation Plan: การแก้ไขข้อมูลสินค้า - ถ่ายภาพโดยตรงและแสดงผลในหน้ารายการทันที (Product Edit: Direct Camera Photo Capture & Instant List Image Display)

**Branch**: `003-edit-product-photo` | **Date**: 2026-10-21 | **Spec**: [specs/003-edit-product-photo/spec.md](spec.md)

**Input**: Feature specification from `/specs/003-edit-product-photo/spec.md`

## Summary

เพิ่มความสามารถในการแก้ไขข้อมูลสินค้า โดยเพิ่มปุ่มสำหรับเปิดกล้องของอุปกรณ์ (Webcam/Tablet/Mobile Camera) เพื่อถ่ายภาพสินค้าได้โดยตรง มีช่องมองภาพสด (Live Viewfinder), ปุ่มชัตเตอร์ขนาดใหญ่ตามมาตรฐาน Elderly-Friendly, ระบบตรวจสอบและถ่ายใหม่ และเมื่อกดบันทึกสินค้า ข้อมูลรูปภาพที่อัปโหลดเสร็จสมบูรณ์จะสะท้อนและแสดงผลในตารางรายการสินค้า (Product Catalog Table) ทันทีแบบ Real-time โดยไม่ต้องกดรีเฟรชหน้าเบราว์เซอร์ พร้อมระบบป้องกัน Cache รูปภาพเดิมของเบราว์เซอร์

## Technical Context

**Language/Version**: TypeScript 5+ (Strict Mode)

**Primary Dependencies**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React (Icons)

**Storage**: Local Browser Memory (Blob/ObjectURL), Backend Image Server (`/api/v1/products/{id}/image`)

**Testing**: Manual E2E Validation via Quickstart Scenarios, ESLint, TypeScript Typecheck

**Target Platform**: POS Touchscreen Terminals, Tablets (iPad, Android), Desktop Browsers (Chrome, Safari, Edge)

**Project Type**: Point of Sale (POS) Web Application (Frontend)

**Performance Goals**:
- เปิดกล้องและเริ่ม Live Viewfinder ได้ภายใน < 1.5 วินาที
- บันทึกและแสดงภาพใหม่ในตารางรายการสินค้าภายใน < 1 วินาทีหลังปิดฟอร์ม (Instant Local State Update)

**Constraints**:
- ขนาด Touch Target ขั้นต่ำ $\ge 48\times 48$px (ปุ่มชัตเตอร์ $\ge 64\times 64$px) ตามมาตรฐาน Elderly-Friendly ในธรรมนูญระบบ
- ปิด MediaStream Tracks ทันทีหลังปิดกล้องเพื่อไม่ให้กล้องทำงานค้าง
- ไม่เพิ่ม External Library ใหม่สำหรับกล้อง ให้ใช้ Native WebRTC `navigator.mediaDevices.getUserMedia`
- ป้องกัน Browser Image Caching โดยใช้ Timestamp Query Parameter

**Scale/Scope**:
- จัดการในขอบเขตโมดูล Catalog (`src/components/catalog/` และ `src/app/(main)/catalog/`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: ข้อความบน UI, การแจ้งเตือน และเอกสารทั้งหมดเป็นภาษาไทย
- [x] **3.1 ความถูกต้องต้องมาก่อนความรวดเร็ว**: เชื่อมต่อผ่าน API `/api/v1/products/{id}/image` จริง ไม่จำลองข้อมูลเอง
- [x] **3.3 รักษาความสามารถเดิมของระบบ**: ยังคงรองรับการเลือกไฟล์รูปภาพและลากวางรูปเดิมไว้ 100%
- [x] **6.5 การออกแบบที่เหมาะสมกับผู้สูงอายุและการสัมผัส (Elderly-Friendly)**: ปุ่มชัตเตอร์ขนาดใหญ่ $\ge 64$px, ปุ่มกดยืนยัน $\ge 48$px, คอนทราสต์ชัดเจน
- [x] **10.0 การจัดการ Dependency**: ไม่เพิ่ม Library แปลกปลอม ใช้ Native HTML5 / WebRTC APIs

## Project Structure

### Documentation (this feature)

```text
specs/003-edit-product-photo/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── product-image-upload.md
├── checklists/          # Checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Architecture

```text
src/
├── app/(main)/catalog/
│   └── page.tsx                         # หน้าแคตตาล็อก: จัดการ State สินค้าและการอัปเดตแบบ Real-time
├── components/catalog/
│   ├── CameraCaptureModal.tsx           # คอมโพเนนต์ใหม่: หน้าต่างเปิดกล้องถ่ายภาพสินค้าสด
│   ├── ImageUploader.tsx                # เพิ่มปุ่มถ่ายภาพด้วยกล้อง เชื่อมต่อกับ CameraCaptureModal
│   ├── ProductFormModal.tsx             # ปรับปรุงโฟลว์การอัปโหลดรูปภาพและการส่งข้อมูลสินค้าที่อัปเดตกลับ
│   ├── ProductTable.tsx                 # เพิ่มการแสดงรูปภาพพร้อม Cache-Busting ป้องกันภาพเก่าค้าง
│   └── ProductFormDrawer.tsx            # รองรับ Drawer ให้สอดคล้องกัน (ถ้ามี)
├── services/
│   └── catalog.service.ts               # เซอร์วิสจัดการข้อมูลสินค้าและอัปโหลดรูปภาพ
└── types/
    └── catalog.ts                       # ไทป์ข้อมูล Product และ Image
```

## Phases

- **Phase 0 (Research)**: สรุปแนวทาง Native WebRTC vs File Capture, สถาปัตยกรรม Reactive State Update และ Cache-Busting -> `research.md`
- **Phase 1 (Design & Contracts)**: ออกแบบโครงสร้างข้อมูล, สัญญา Interface API/UI, และคู่มือทดสอบ Quickstart -> `data-model.md`, `contracts/product-image-upload.md`, `quickstart.md`
- **Phase 2 (Implementation Execution - via /speckit-tasks)**:
  1. สร้างคอมโพเนนต์ `CameraCaptureModal.tsx` รองรับ Viewfinder, สลับกล้อง, ชัตเตอร์ $\ge 64$px
  2. ปรับปรุง `ImageUploader.tsx` ให้มีปุ่มเปิดกล้องถ่ายภาพ พร้อมพรีวิวและลบภาพ
  3. ปรับปรุง `ProductFormModal.tsx` ให้จัดลำดับการอัปโหลดภาพและส่งสินค้าพร้อมรูปภาพล่าสุดกลับไป
  4. ปรับปรุง `catalog/page.tsx` และ `ProductTable.tsx` ให้อัปเดต State ตารางสินค้าทันทีพร้อม Cache-Busting
  5. ทดสอบการทำงาน End-to-End ตาม `quickstart.md`
