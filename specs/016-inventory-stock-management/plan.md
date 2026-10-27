# Implementation Plan: ระบบจัดการคลังและสต็อกสินค้า (Inventory & Stock Management)

**Branch**: `016-inventory-stock-management` | **Date**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/016-inventory-stock-management/spec.md`

## Summary

สร้างหน้าระบบจัดการคลังและสต็อกสินค้าที่ URL `/inventory` เชื่อมต่อกับ Backend API กลุ่ม `05. คลังและสต็อกสินค้า` อย่างสมบูรณ์ ได้แก่ การแสดงภาพรวมสถิติสต็อก, ตารางยอดสต็อกสินค้าคงเหลือรายสาขาพร้อมสถานะและตัวกรองสต็อกต่ำ (`GET /api/v1/inventory/stocks`), แถบเครื่องมือค้นหาพร้อมปุ่มสแกนบาร์โค้ดด้วยกล้อง (`BarcodeCaptureModal`) และ Dropdown สลับสาขาสำหรับผู้ดูแลระบบ, ตลอดจนหน้าต่าง Modal ปรับยอดสต็อกสินค้า (`POST /api/v1/inventory/adjust`) รองรับการตรวจนับสต็อก (AUDIT) ด้วยยอดนับจริงพร้อมคำนวณผลต่างอัตโนมัติ และการปรับยอดยกเข้า/ยกออก/ชำรุด/หมดอายุ โดยยึดหลัก Elderly-Friendly และ Loading Overlay ตามธรรมนูญระบบ

## Technical Context

**Language/Version**: TypeScript 5, React 19.3.0, Next.js 16.4.2 (App Router)  
**Primary Dependencies**: TailwindCSS v4, Lucide/Icons (มีอยู่แล้ว), WebRTC / `@zxing` (ผ่าน BarcodeCaptureModal ที่มีอยู่แล้ว)  
**Storage**: Web Storage (LocalStorage สำหรับจำลอง/เก็บ lastBranchId), Backend Database ผ่าน REST API  
**Testing**: ESLint, TypeScript Compiler (`tsc --noEmit`), Manual UI scenario verification ตาม `quickstart.md`  
**Target Platform**: Responsive Web (Desktop, Tablet, Mobile POS)  
**Project Type**: Next.js App Router Web Application (Single Project)  
**Performance Goals**: โหลดหน้าและข้อมูลสต็อกภายใน < 2 วินาที, อัปเดตยอดสต็อกหลังปรับยอดทันทีภายใน < 500ms  
**Constraints**: Touch targets >= 48px (Elderly-Friendly), UI ภาษาไทย 100%, แสดง Loading Overlay เมื่อทำธุรกรรม API, ป้องกันสต็อกติดลบ  
**Scale/Scope**: 1 หน้าจอหลัก (`/inventory`), 4 คอมโพเนนต์เฉพาะโมดูล, 1 Service อัปเดต (`inventoryService`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **2.1 ใช้ภาษาไทยเป็นหลัก**: ข้อความทั้งหมด ป้ายกำกับ สถานะสต็อก และกล่องข้อผิดพลาดเป็นภาษาไทย
- [x] **3.1 ความถูกต้องมาก่อนความเร็ว**: ดึงข้อมูลสต็อกจริงจาก API `GET /api/v1/inventory/stocks` ไม่สร้าง Mock Data
- [x] **3.2 ความเรียบง่ายและความเหมาะสม**: แยกคอมโพเนนต์ชัดเจน ไม่สร้าง Abstraction ซับซ้อนเกินจำเป็น
- [x] **3.3 รักษาความสามารถเดิม**: ไม่กระทบระบบการขายหน้าร้าน POS หรือแคตตาล็อกสินค้าเดิม
- [x] **5.1 สัญญาการเชื่อมต่อ API**: อ้างอิง Swagger Schema `StockLevelResponse` และ `AdjustStockRequest`
- [x] **6.1 UI Consistency**: ใช้ธีมสี Slate / Cyan / Emerald / Rose สอดคล้องกับระบบ POS และ Catalog
- [x] **6.5 Elderly-Friendly**: เป้าหมายสัมผัสปุ่มและ Dropdown ขนาดอย่างน้อย 48px, คอนทราสต์สีชัดเจน
- [x] **6.6 API Action Overlay**: แสดง Overlay คลุมหน้าจอขณะเรียก API ปรับยอดสต็อกเพื่อป้องกันการกดซ้ำ
- [x] **10 ไม่เพิ่ม Dependency ใหม่**: ใช้ไลบรารีที่มีอยู่แล้วในโปรเจกต์ทั้งหมด

## Project Structure

### Documentation (this feature)

```text
specs/016-inventory-stock-management/
├── spec.md
├── plan.md                 # This file
├── research.md             # Phase 0 output
├── data-model.md           # Phase 1 output
├── quickstart.md           # Phase 1 output
├── contracts/              # Phase 1 output
│   ├── inventory-api.contract.md
│   └── ui-contracts.md
├── checklists/
│   └── requirements.md
└── tasks.md                # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── (main)/
│       └── inventory/
│           └── page.tsx              # หน้าจอหลักคลังและสต็อกสินค้า (/inventory)
├── components/
│   ├── inventory/
│   │   ├── InventorySummaryCards.tsx # การ์ดสรุปตัวเลขสถิติภาพรวม
│   │   ├── InventoryToolbar.tsx      # แถบค้นหา สลับสาขา กรองสต็อกต่ำ สแกนบาร์โค้ด
│   │   ├── InventoryStockTable.tsx   # ตารางรายการสต็อกและสถานะ
│   │   └── StockAdjustmentModal.tsx  # Modal ปรับยอดสต็อกสินค้า
│   └── shared/
│       └── BarcodeCaptureModal.tsx   # ใช้ซ้ำสำหรับสแกนบาร์โค้ดค้นหา
├── services/
│   └── inventory.service.ts          # เพิ่ม adjustStock และ getInventoryValuation
└── types/
    └── inventory.ts                  # เพิ่ม StockAdjustmentType และ DTOs
```

**Structure Decision**: โปรเจกต์ Next.js เดี่ยวภายใต้ `src/` — จัดโครงสร้างคอมโพเนนต์โมดูลคลังสินค้าไว้ใต้ `src/components/inventory/` และหน้าเพจที่ `src/app/(main)/inventory/page.tsx`

## Complexity Tracking

> ไม่มี constitution violations ที่ต้องชี้แจง
