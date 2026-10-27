# Technical Research & Decisions: ระบบจัดการคลังและสต็อกสินค้า (Inventory & Stock Management)

**Feature**: `016-inventory-stock-management` | **Date**: 2026-10-27

## 1. การเชื่อมต่อ API Backend (Backend API Integration)

### Decision
ใช้บริการ `inventoryService` (`src/services/inventory.service.ts`) ร่วมกับ `api` client (`src/services/api.ts`) ที่มีอยู่เดิม โดยเพิ่มเมธอด:
1. `adjustStock(branchId: string, request: AdjustStockRequest)` เชื่อมต่อกับ `POST /api/v1/inventory/adjust?branchId={branchId}`
2. `getInventoryValuation(branchId?: string)` เชื่อมต่อกับ `GET /api/v1/reports/inventory-valuation?branchId={branchId}`

### Rationale
- Backend API มี Schema และ Endpoint ให้บริการอยู่แล้วตาม `docs/swagger.json` (`AdjustStockRequest`, `StockLevelResponse`, `InventoryValuationResponse`)
- รักษาความสอดคล้องกับธรรมนูญข้อ 5.1 (ห้ามจำลองข้อมูลขึ้นเองเด็ดขาด) และ 10 (ไม่เพิ่ม Dependency ใหม่)

### Alternatives Considered
- *สร้าง Mock Data จำลอง*: ถูกปฏิเสธตามธรรมนูญข้อ 5.1 และ 13 (AI Coding Agent ข้อห้าม)
- *รวมโค้ด API ไว้ใน React Page โดยตรง*: ถูกปฏิเสธตามธรรมนูญข้อ 4.1 (Separation of Concerns)

---

## 2. โครงสร้างคอมโพเนนต์และการจัดวางหน้าจอ (UI Component Architecture)

### Decision
สร้างโฟลเดอร์ `src/components/inventory/` แยกหน้าที่คอมโพเนนต์เป็น 4 ส่วนหลัก:
1. `InventorySummaryCards.tsx`: การ์ดสรุปตัวเลขสถิติบนสุด (สินค้าทั้งหมด, สินค้าสต็อกต่ำ, สินค้าหมด, มูลค่าสต็อกรวม)
2. `InventoryToolbar.tsx`: แถบเครื่องมือค้นหา (ชื่อ/SKU/บาร์โค้ด), ปุ่มสแกนบาร์โค้ดด้วยกล้อง (`BarcodeCaptureModal`), ตัวกรองสต็อกต่ำ (`lowStockOnly`), และ Dropdown สลับสาขา (สำหรับ ADMIN)
3. `InventoryStockTable.tsx`: ตารางแสดงรายการสต็อกสินค้าคงเหลือ รองรับการแบ่งหน้า (Pagination) และ Responsive บนมือถือ/แท็บเล็ต
4. `StockAdjustmentModal.tsx`: หน้าต่าง Modal ปรับยอดสต็อกสินค้า รองรับประเภท IN, OUT, AUDIT, DAMAGE, EXPIRED

### Rationale
- เป็นไปตามธรรมนูญข้อ 4.1 (Separation of Concerns) และ 6.1 (UI Consistency)
- หน้าจอหลัก `src/app/(main)/inventory/page.tsx` ทำหน้าที่เป็น Controller เชื่อมต่อ State และ Service Layer

---

## 3. การคำนวณและป้อนค่ายอดตรวจนับสต็อก (Physical Count vs Delta Calculation)

### Decision
ในกรณีประเภทการปรับยอดเป็น `AUDIT` (ตรวจนับสต็อก):
- ให้ผู้ใช้กรอก **"จำนวนที่นับได้จริง (Physical Count)"**
- หน้าบ้านคำนวณ `delta = physicalCount - currentQuantity` และแสดงให้เห็นทันทีก่อนยืนยัน
- เมื่อส่งไปยัง API: ส่ง `quantityDelta: delta` และ `type: "AUDIT"`

### Rationale
- ตรงตามผลการสรุปใน Clarification Q2 (Option A)
- สอดคล้องกับพฤติกรรมจริงของผู้จัดการร้านที่นับของจริงบนเชลฟ์ ลดภาระการคำนวณในใจ (Low Cognitive Load ตามธรรมนูญ 6.5)

---

## 4. การจัดการสาขา (Branch Selection & Scope)

### Decision
- ค่าเริ่มต้นของสาขา (`selectedBranchId`) ดึงมาจาก `branch?.id ?? user?.branchId`
- หากผู้ใช้เป็นบทบาท `ADMIN` หรือมีสาขามากกว่า 1 แห่ง ระบบจะดึงรายการสาขาจาก `branchService.getBranches()` เพื่อแสดง Dropdown ตัวเลือกสาขา
- หากผู้ใช้เป็น `MANAGER` ทั่วไป จะล็อกแสดงเฉพาะสาขาของตนเอง

### Rationale
- ตรงตามผลการสรุปใน Clarification Q3 (Option A)
- รองรับทั้งร้านเดี่ยวและแฟรนไชส์หลายสาขาอย่างปลอดภัย

---

## 5. การสแกนบาร์โค้ดค้นหาสินค้าด้วยกล้อง (Camera Barcode Scanning in Inventory)

### Decision
ใช้ซ้ำคอมโพเนนต์ `BarcodeCaptureModal` ที่สร้างไว้ใน `src/components/shared/BarcodeCaptureModal.tsx` โดยผูกเข้ากับปุ่มไอคอนกล้องใน `InventoryToolbar` เมื่อสแกนติด รหัสบาร์โค้ดที่ผ่าน `cleanBarcode` จะถูกใส่ลงในช่องค้นหาทันที

### Rationale
- ตรงตามผลการสรุปใน Clarification Q4 (Option A)
- ใช้ซ้ำคอมโพเนนต์เดิม (Code Reusability ตามธรรมนูญ 6.1) ไม่เขียนโค้ดสแกนเนอร์ซ้ำซ้อน
