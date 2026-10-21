# Implementation Plan: ระบบเมนูหลักและการจัดการสินค้าและหมวดหมู่ (System Navigation & Product Catalog)

**Branch**: `002-product-catalog` | **Date**: 2026-10-21 | **Spec**: [specs/002-product-catalog/spec.md](spec.md)

**Input**: Feature specification from `/specs/002-product-catalog/spec.md`

## Summary

พัฒนาระบบเมนูหลัก (App Shell Navigation Layout) และระบบบริหารจัดการสินค้าและหมวดหมู่ (Product Catalog Management) สำหรับระบบขายหน้าร้าน `ice-pos-web`:
1. โครงสร้าง App Shell ประกอบด้วย Sidebar ด้านข้างแบบพับเก็บได้ (Collapsible Sidebar), Header แสดงสถานะผู้ใช้งาน สาขา และปุ่มออกจากระบบ พร้อมการควบคุมสิทธิ์ตามบทบาทผู้ใช้ (Role-based Navigation & Route Protection) โดยซ่อนเมนูสินค้าสำหรับแคชเชียร์
2. หน้าจอจัดการแคตตาล็อกสินค้าแบบ Tabbed Interface (`/catalog`) แบ่งเป็น 2 แท็บ:
   - **แท็บรายการสินค้า (Products)**: ตารางรายการสินค้า, ค้นหา, กรองหมวดหมู่/สถานะ, แบ่งหน้า, Slide-over Drawer ฟอร์มเพิ่ม/แก้ไข, สร้างบาร์โค้ดภายใน, อัปโหลดรูปภาพ WebP, และการลบสินค้าอย่างปลอดภัย
   - **แท็บหมวดหมู่สินค้า (Categories)**: ตารางรายการหมวดหมู่และลำดับชั้น, Modal Dialog เพิ่ม/แก้ไข, และการลบหมวดหมู่ที่ไม่มีสินค้าผูกอยู่

## Technical Context

**Language/Version**: TypeScript 5+ (Strict Mode)  
**Primary Dependencies**: Next.js 16 (App Router), React 19, Lucide React (Icons), Tailwind CSS v4  
**Storage**: Web Storage (LocalStorage / SessionStorage สำหรับ Token & User Profile) และ Backend REST API  
**Testing**: Manual End-to-End Walkthrough via Quickstart scenarios, TypeScript type checking, Next.js ESLint  
**Target Platform**: Web Browser (Chrome, Safari, Edge) บนเดสก์ท็อป แท็บเล็ต (iPad/Android) และเครื่อง POS สัมผัส  
**Project Type**: Next.js Web Application (Single-Page Experience บน App Router)  
**Performance Goals**: เมนูตอบสนองทันที (<100ms), โหลดตารางสินค้าแสดงผล <1.5s, ค้นหาด้วย Debounce 300ms แสดงผล <500ms  
**Constraints**: รองรับหน้าจอสัมผัส (Touchscreen Friendly), ป้องกัน Floating-Point เงินด้วยการแปลง Satang ↔ Baht, ห้าม Mock Data ตามธรรมนูญ  
**Scale/Scope**: จัดการสินค้าได้หลายร้อยรายการต่อสาขา พร้อมระบบแบ่งหน้า (Pagination 20 รายการต่อหน้า)  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| หมวดในธรรมนูญ | ข้อกำหนด | ผลการประเมิน | หมายเหตุ |
| :--- | :--- | :---: | :--- |
| **2. ภาษา** | ใช้ภาษาไทยเป็นหลักในการสื่อสาร UI Text และเอกสาร | **ผ่าน** | ข้อความ ปุ่ม และข้อความแจ้งเตือนทั้งหมดเป็นภาษาไทย |
| **3.1 ความถูกต้อง** | ห้ามสร้าง Mock Data ขึ้นเอง อ้างอิง Swagger API จริง | **ผ่าน** | ดึงข้อมูลจริงจาก `/categories`, `/products`, `/uoms`, `/taxes` |
| **5.1 สัญญา API** | ใช้ Standard Envelope `{ code, message, data, meta }` | **ผ่าน** | ใช้งานผ่าน `src/services/api.ts` และ Interface ที่ตรงกับ Schema |
| **5.3 ความถูกต้องข้อมูล** | แปลงหน่วยเงิน Satang (Integer) ↔ Baht อย่างแม่นยำ | **ผ่าน** | ใช้ยูทิลิตี `formatSatangToBaht` และ `bahtToSatang` |
| **6. มาตรฐาน UI/UX** | รองรับ Responsive & Touchscreen สำหรับเครื่อง POS | **ผ่าน** | ออกแบบ Collapsible Sidebar และ Slide-over Drawer |
| **7. ความปลอดภัย** | ซ่อนเมนูตามสิทธิ์ + มี Route Protection กำกับ | **ผ่าน** | ซ่อนเมนูสำหรับ CASHIER และมี Route Guard ป้องกัน |

## Project Structure

### Documentation (this feature)

```text
specs/002-product-catalog/
├── spec.md              # Feature specification
├── plan.md              # This file (Implementation Plan)
├── research.md          # Architecture decisions & UX patterns
├── data-model.md        # Entities & field constraints
├── contracts/           # API contracts
│   └── product-catalog-api.md
├── quickstart.md        # Validation walkthrough scenarios
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Implementation tasks (/speckit-tasks output)
```

### Source Code (repository layout)

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx               # Existing login page
│   ├── (main)/
│   │   ├── layout.tsx                   # App Shell Layout (Sidebar, Header, Auth Guard)
│   │   ├── catalog/
│   │   │   └── page.tsx                 # Product & Category Catalog Management Page
│   │   └── pos/
│   │       └── page.tsx                 # POS Terminal (Placeholder / Landing for Cashier)
├── components/
│   ├── layout/
│   │   ├── AppHeader.tsx                # Header bar (User, Branch, Logout)
│   │   ├── AppSidebar.tsx               # Collapsible Sidebar with Role Filter
│   │   └── RouteGuard.tsx               # Role-based Route Protection wrapper
│   ├── catalog/
│   │   ├── ProductTable.tsx             # Products table view with status toggle
│   │   ├── ProductToolbar.tsx           # Search input, Category filter, Status filter
│   │   ├── ProductFormDrawer.tsx        # Slide-over Drawer for Create & Edit product
│   │   ├── CategoryList.tsx             # Categories table & hierarchy view
│   │   ├── CategoryFormModal.tsx        # Modal Dialog for Create & Edit category
│   │   ├── ImageUploader.tsx            # Product image upload & preview component
│   │   └── DeleteConfirmModal.tsx       # Safe deletion & deactivation confirmation dialog
│   └── ui/                              # Reusable UI primitives (Tabs, Badge, Button, Modal)
├── services/
│   ├── api.ts                           # Base API client
│   ├── catalog.service.ts               # Product & Category API service functions
│   └── metadata.service.ts              # UOM & Tax metadata service functions
├── types/
│   ├── auth.ts                          # Auth types & UserProfile
│   └── catalog.ts                       # Product, Category, UOM, Tax data types
└── utils/
│   ├── currency.ts                      # Satang ↔ Baht conversion utilities
│   └── storage.ts                       # Token & preference helpers
```

## Phases

### Phase 0: Outline & Research
- วิจัยและสรุปแนวทางการจัดวาง Layout แบบ Collapsible Sidebar สำหรับระบบ POS
- กำหนดรูปแบบการควบคุมสิทธิ์ตามบทบาทผู้ใช้ (Role-based Navigation & Route Protection)
- ออกแบบแนวทางการแปลงหน่วยเงิน Satang ↔ Baht และการอัปโหลดรูปภาพ WebP
- *ผลลัพธ์*: บันทึกใน [research.md](research.md)

### Phase 1: Design & Contracts
- สร้าง Data Model สอดคล้องกับ Swagger Schema: [data-model.md](data-model.md)
- สร้างข้อตกลง API Contract: [contracts/product-catalog-api.md](contracts/product-catalog-api.md)
- สร้างคู่มือการทดสอบความถูกต้องตั้งแต่ต้นจนจบ: [quickstart.md](quickstart.md)
- ตรวจสอบความสอดคล้องกับธรรมนูญโครงการ (Constitution Check) ผ่านทุกข้อ

### Phase 2: Tasks & Implementation
- ดำเนินการสร้าง Task แยกตาม User Story ด้วยคำสั่ง `/speckit-tasks`
