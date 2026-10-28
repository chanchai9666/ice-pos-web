# แผนงานปรับปรุงหน้ารายการสต็อกสินค้า (Inventory) เพื่อรองรับสินค้าประเภทชั่งขาย (BY_WEIGHT)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปรับปรุงหน้ารายการคลังและสต็อกสินค้า (`/inventory`) ให้แสดงผลสินค้าประเภทชั่งขาย (`BY_WEIGHT`) ได้อย่างถูกต้องตามมาตรฐาน POS โดยแสดงป้าย "ชั่งขาย", แสดงค่าจำนวนคงเหลือและเกณฑ์เตือนเป็น `-`, ไม่แจ้งเตือนสต็อกใกล้หมด/หมด และปิดปุ่มปรับสต็อก

**Architecture:** ปรับปรุง `InventoryStockTable.tsx` เพื่อแยกแยะ `product.productType === 'BY_WEIGHT'` ในการแสดงผลป้ายกำกับ, ตัวเลขคงเหลือ, สถานะ และการปิดใช้งานปุ่มปรับสต็อก พร้อมปรับตรรกะใน `src/app/(main)/inventory/page.tsx` ไม่ให้นำสินค้าชั่งขายมานับรวมในตัวเลขสรุปสต็อกต่ำ/สต็อกหมด หรือตัวกรอง Low Stock

**Tech Stack:** Next.js (App Router), React 19, TypeScript, Tailwind CSS

**Spec:** ตามข้อตกลงและผลการวิเคราะห์จากหน้า POS (`src/components/pos/PosProductGrid.tsx`, `src/utils/posStockHelper.ts`) และ `specs/016-inventory-stock-management/spec.md`

---

## Global Constraints
- สินค้าที่มี `productType === 'BY_WEIGHT'` ถือเป็นสินค้าชั่งขาย ไม่จำเป็นต้องนับจำนวนคงเหลือแบบชิ้น
- ต้องไม่แสดงข้อความเตือน "สินค้าหมด" หรือ "สต็อกใกล้หมด" สำหรับสินค้าชั่งขาย
- องค์ประกอบการโต้ตอบต้องเป็นไปตามมาตรฐานการเข้าถึง (Elderly-Friendly min 48x48px และ WCAG 2.1 AA)
- รักษาการทำงานของสินค้าประเภทปกติ (`PRICE_PER_UNIT`) ให้คงเดิมทุกประการ

## Review Focus
1. สินค้าชั่งขายที่มี `stock.quantity === 0` ต้องไม่แสดงป้ายสีแดง "สินค้าหมด" และต้องไม่ถูกนับในการ์ด "สินค้าหมดสต็อก"
2. สินค้าชั่งขายต้องไม่ปรากฏในผลลัพธ์เมื่อกดปุ่มตัวกรอง "สต็อกใกล้หมด"
3. การแสดงผลทั้ง Desktop Table และ Mobile Cards ต้องมีป้าย "ชั่งขาย" พร้อมสัญลักษณ์ตาชั่ง และแสดงจำนวนคงเหลือเป็น `-`
4. ปุ่ม "ปรับสต็อก" สำหรับสินค้าชั่งขายต้องอยู่ในสถานะปิดการใช้งาน (Disabled) และมีคำอธิบายชัดเจน
5. ฟอร์มค้นหาและสแกนบาร์โค้ดยังคงค้นหาสินค้าชั่งขายพบและแสดงผลได้อย่างถูกต้อง

---

## Proposed Changes

### Component 1: `src/components/inventory/InventoryStockTable.tsx`

#### [MODIFY] `src/components/inventory/InventoryStockTable.tsx`
- **การเปลี่ยนแปลง:**
  1. เพิ่มตัวแปร `isWeightBased = product?.productType === 'BY_WEIGHT'`
  2. แสดงป้ายกำกับ "ชั่งขาย" พร้อม `<Icons.Scale className="w-3.5 h-3.5" />` ข้างชื่อสินค้าในคอลัมน์สินค้า (Desktop) และส่วนหัวการ์ด (Mobile)
  3. คอลัมน์ "จำนวนคงเหลือ":
     - ถ้า `isWeightBased`: แสดง `-` (สีเทา slate-400 / font-mono)
     - ถ้าไม่ใช่: แสดง `{stock.quantity.toLocaleString()}` ตามเดิม
  4. คอลัมน์ "เกณฑ์เตือน":
     - ถ้า `isWeightBased`: แสดง `-`
     - ถ้าไม่ใช่: แสดง `{minStock}`
  5. ฟังก์ชัน `getStockBadge`:
     - เพิ่มกรณี `if (isWeightBased)` แสดง Badge สีทอง `bg-amber-500/20 text-amber-300 border border-amber-500/40` พร้อมข้อความ "ชั่งขาย" และไอคอนตาชั่ง
  6. ปุ่ม "ปรับสต็อก":
     - ถ้า `isWeightBased`: กำหนด `disabled={true}`, สไตล์ `opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-800`, ใส่ `title="สินค้าประเภทชั่งขายไม่จำเป็นต้องปรับสต็อก"`
     - ทั้งใน Desktop Table และ Mobile Cards

---

### Component 2: `src/app/(main)/inventory/page.tsx`

#### [MODIFY] `src/app/(main)/inventory/page.tsx`
- **การเปลี่ยนแปลง:**
  1. ในการคำนวณ `summaryStats`:
     - ข้ามสินค้าที่มี `item.product?.productType === 'BY_WEIGHT'` จากการบวกเพิ่ม `outOfStockCount` และ `lowStockCount`
     - ข้ามการคิดมูลค่าคงคลัง `computedValuationSatang` ของสินค้าชั่งขาย (เนื่องจากไม่มียอดคงคลังเป็นชิ้น)
  2. ในการกรอง `filteredStocks`:
     - เมื่อผู้ใช้เปิดตัวกรอง `lowStockOnly === true`: กรองสินค้าชั่งขายออกทั้งหมด (`item.product?.productType !== 'BY_WEIGHT'`)
  3. ในฟังก์ชัน `handleOpenAdjustment`:
     - เพิ่ม Guard clause: `if (stock.product?.productType === 'BY_WEIGHT') return;`

---

## Task Breakdown

### Task 1: ปรับปรุง `InventoryStockTable.tsx` รองรับสินค้าประเภทชั่งขาย
**Files:**
- Modify: `src/components/inventory/InventoryStockTable.tsx`

**Interfaces:**
- Consumes: `StockLevel`, `Product.productType` จาก `@/types/inventory` และ `@/types/catalog`
- Produces: UI ตารางและ Card ที่แสดงป้าย "ชั่งขาย", จำนวนคงเหลือ `-`, สถานะ "ชั่งขาย" และปุ่มปรับสต็อกที่ Disabled สำหรับ `BY_WEIGHT`

- [ ] **Step 1: ปรับฟังก์ชัน `getStockBadge` ให้รับพารามิเตอร์ `isWeightBased?: boolean`**
  ```tsx
  const getStockBadge = (quantity: number, minStock?: number, isWeightBased?: boolean) => {
    if (isWeightBased) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          <Icons.Scale className="w-3.5 h-3.5 text-amber-400" />
          ชั่งขาย
        </span>
      );
    }
    // ... logic เดิมสำหรับ PRICE_PER_UNIT
  }
  ```

- [ ] **Step 2: อัปเดตการแสดงผลใน Desktop Table**
  - ตรวจสอบ `const isWeightBased = product?.productType === 'BY_WEIGHT';`
  - เพิ่ม Badge "ชั่งขาย" ข้างชื่อสินค้า
  - แสดง `-` ในคอลัมน์จำนวนคงเหลือและเกณฑ์เตือน
  - ปิดการใช้งานปุ่ม "ปรับสต็อก" เมื่อ `isWeightBased` เป็นจริง

- [ ] **Step 3: อัปเดตการแสดงผลใน Mobile Card View**
  - แสดง Badge "ชั่งขาย" และสถานะให้สอดคล้องกับ Desktop
  - แสดงยอดคงเหลือเป็น `-` หรือระบุว่า "สินค้าชั่งขาย"
  - ปิดการใช้งานปุ่ม "ปรับสต็อก" ใน Mobile Card

- [ ] **Step 4: ตรวจสอบ Lint และ Build**
  Run: `npm run lint`
  Expected: ผ่านโดยไม่มี error

---

### Task 2: ปรับปรุงตรรกะใน `src/app/(main)/inventory/page.tsx`
**Files:**
- Modify: `src/app/(main)/inventory/page.tsx`

**Interfaces:**
- Consumes: `stocks: StockLevel[]`
- Produces: `summaryStats` และ `filteredStocks` ที่ไม่นำ `BY_WEIGHT` ไปคำนวณเป็น Low Stock / Out of Stock

- [ ] **Step 1: ปรับปรุง `summaryStats` ไม่นับสินค้าชั่งขายในสต็อกต่ำ/สินค้าหมด**
  ```tsx
  for (const item of stocks) {
    const isWeightBased = item.product?.productType === 'BY_WEIGHT';
    if (!isWeightBased) {
      const qty = item.quantity;
      const minStock = item.product?.minStock ?? 5;
      if (qty <= 0) {
        outOfStockCount += 1;
      } else if (qty <= minStock) {
        lowStockCount += 1;
      }
      const unitCost = item.product?.costPerBaseUnit ?? item.product?.price ?? 0;
      computedValuationSatang += Math.max(0, qty) * unitCost;
    }
  }
  ```

- [ ] **Step 2: ปรับปรุง `filteredStocks` ให้แยกสินค้าชั่งขายออกจากตัวกรอง `lowStockOnly`**
  - เมื่อ `lowStockOnly === true` จะแสดงเฉพาะสินค้า `productType !== 'BY_WEIGHT'` ที่สต็อกต่ำ

- [ ] **Step 3: เพิ่ม Guard ใน `handleOpenAdjustment`**
  ```tsx
  const handleOpenAdjustment = (stock: StockLevel) => {
    if (stock.product?.productType === 'BY_WEIGHT') {
      return;
    }
    setAdjustingStock(stock);
    setIsAdjustmentModalOpen(true);
  };
  ```

- [ ] **Step 4: รันการตรวจสอบ Lint**
  Run: `npm run lint`
  Expected: สำเร็จเรียบร้อย

---

## Verification Plan

### Automated Checks
- รันคำสั่งตรวจสอบ Lint:
  ```bash
  npm run lint
  ```
  คาดหวัง: 0 errors

### Manual Verification
1. เปิดหน้าเว็บ `http://localhost:3000/inventory`
2. ตรวจสอบแถวสินค้าที่เป็น `BY_WEIGHT` (เช่น สินค้าน้ำแข็ง หรือสินค้าที่ตั้งเป็นขายตามน้ำหนัก):
   - มีป้าย "ชั่งขาย" สีทองพร้อมไอคอนตาชั่งปรากฏอย่างชัดเจน
   - คอลัมน์ "จำนวนคงเหลือ" และ "เกณฑ์เตือน" แสดงเป็นเครื่องหมาย `-`
   - คอลัมน์ "สถานะ" แสดงป้าย "ชั่งขาย" (ไม่แสดงป้ายแดง "สินค้าหมด" แม้ค่า quantity จะเป็น 0)
   - ปุ่ม "ปรับสต็อก" ท้ายแถวปิดการใช้งาน (Disabled) และไม่สามารถคลิกเปิด Modal ได้
3. ตรวจสอบการ์ดสรุปภาพรวมด้านบน (`InventorySummaryCards`):
   - จำนวนสินค้าหมดสต็อกและสต็อกใกล้หมดไม่ถูกเพิ่มขึ้นจากสินค้าชั่งขาย
4. กดเปิดสวิตช์ "สต็อกใกล้หมด":
   - สินค้าชั่งขายต้องไม่ปรากฏในรายการสต็อกใกล้หมด
5. ตรวจสอบมุมมองจอมือถือ (Responsive View):
   - การ์ดสินค้าแสดงผลถูกต้อง สวยงาม และปุ่มปรับสต็อก Disabled อย่างถูกต้อง
