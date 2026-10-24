# Data Model & UI Contracts: POS Product Stock Level & Border Status Alerts

**Feature**: `007-pos-product-stock-alerts`  
**Date**: 2026-10-24  
**Status**: Draft  

---

## 1. Entities & Data Structures

### 1.1 ProductStockStatus (ชนิดสถานะระดับสต็อก)

Enum/Type ระบุระดับสถานะสต็อกของสินค้าเพื่อใช้ในการกำหนดสไตล์การ์ดและการตอบสนอง:

```typescript
export type ProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
```

- `IN_STOCK`: สินค้าขายตามชิ้นที่มีสต็อกมากกว่าเกณฑ์ใกล้หมด
- `LOW_STOCK`: สินค้าขายตามชิ้นที่มีสต็อกมากกว่า 0 แต่น้อยกว่าหรือเท่ากับเกณฑ์เตือนใกล้หมด
- `OUT_OF_STOCK`: สินค้าขายตามชิ้นที่มีสต็อกเท่ากับ 0 หรือน้อยกว่า 0

---

### 1.2 ProductStockPresentation (โครงสร้างข้อมูลสำหรับการนำเสนอผลบนการ์ด)

ข้อมูลที่ผ่านการประมวลผล (Derived/Computed State) สำหรับนำไปใช้เรนเดอร์การ์ดสินค้าในคอมโพเนนต์ `PosProductGrid`:

```typescript
export interface ProductStockPresentation {
  /** เป็นสินค้าขายตามน้ำหนักหรือไม่ */
  isWeightBased: boolean;

  /** ปริมาณสต็อกคงเหลือจริง (fallback เป็น 0 สำหรับสินค้าชิ้นที่ไม่มีข้อมูล) */
  stockQuantity: number;

  /** เกณฑ์สต็อกใกล้หมดที่ใช้เปรียบเทียบ (จาก product.minStock หรือ 5) */
  threshold: number;

  /** สถานะสต็อกของสินค้า */
  status: ProductStockStatus;

  /** คลาส Tailwind สำหรับเส้นขอบการ์ดสินค้า */
  cardBorderClass: string;

  /** คลาส Tailwind สำหรับเงาเรืองแสง */
  cardShadowClass: string;

  /** ข้อความป้ายสถานะมุมซ้ายบน (Badge) */
  badgeText: string;

  /** คลาส Tailwind สำหรับป้ายมุมซ้ายบน */
  badgeClass: string;

  /** ข้อความระบุจำนวนคงเหลือใต้ชื่อสินค้า */
  detailStockText: string;

  /** คลาสสีตัวอักษรสำหรับข้อความคงเหลือ */
  detailStockColorClass: string;
}
```

---

## 2. Business Rules & Logic Resolution

### 2.1 ตรรกะการประเมินสถานะสต็อก (Stock Status Resolution Logic)

```typescript
export function resolveProductStockPresentation(
  product: Product,
  stockMap: StockLevelMap
): ProductStockPresentation {
  const isWeightBased = product.productType === 'BY_WEIGHT';

  if (isWeightBased) {
    return {
      isWeightBased: true,
      stockQuantity: 0,
      threshold: 0,
      status: 'IN_STOCK',
      cardBorderClass: 'border-slate-800 hover:border-cyan-500/60 active:border-cyan-400',
      cardShadowClass: 'shadow-md hover:shadow-cyan-500/10',
      badgeText: 'ชั่งขาย',
      badgeClass: 'bg-amber-500 text-slate-950 font-black shadow-md',
      detailStockText: 'สินค้าชั่งขาย',
      detailStockColorClass: 'text-amber-400 font-semibold',
    };
  }

  // ดึงยอดสต็อก (fallback เป็น 0 เสมอหากไม่มีข้อมูล)
  const stockQuantity = typeof stockMap[product.id] === 'number' ? stockMap[product.id] : 0;
  const threshold = product.minStock && product.minStock > 0 ? product.minStock : 5;
  const unitName = product.baseUom?.name || 'ชิ้น';

  if (stockQuantity <= 0) {
    return {
      isWeightBased: false,
      stockQuantity,
      threshold,
      status: 'OUT_OF_STOCK',
      cardBorderClass: 'border-rose-500 hover:border-rose-400 active:border-rose-300',
      cardShadowClass: 'shadow-md shadow-rose-950/20 hover:shadow-rose-500/20',
      badgeText: 'สินค้าหมด',
      badgeClass: 'bg-rose-600 text-white font-bold shadow-md',
      detailStockText: `สินค้าหมด (คงเหลือ ${stockQuantity} ${unitName})`,
      detailStockColorClass: 'text-rose-400 font-bold',
    };
  }

  if (stockQuantity <= threshold) {
    return {
      isWeightBased: false,
      stockQuantity,
      threshold,
      status: 'LOW_STOCK',
      cardBorderClass: 'border-amber-500 hover:border-amber-400 active:border-amber-300',
      cardShadowClass: 'shadow-md shadow-amber-950/20 hover:shadow-amber-500/20',
      badgeText: `ใกล้หมด: ${stockQuantity}`,
      badgeClass: 'bg-amber-500 text-slate-950 font-bold shadow-md',
      detailStockText: `คงเหลือ ${stockQuantity} ${unitName}`,
      detailStockColorClass: 'text-amber-400 font-semibold',
    };
  }

  return {
    isWeightBased: false,
    stockQuantity,
    threshold,
    status: 'IN_STOCK',
    cardBorderClass: 'border-slate-800 hover:border-cyan-500/60 active:border-cyan-400',
    cardShadowClass: 'shadow-md hover:shadow-cyan-500/10',
    badgeText: `คงเหลือ: ${stockQuantity}`,
    badgeClass: 'bg-slate-950/85 backdrop-blur-sm text-emerald-400 border border-emerald-500/40',
    detailStockText: `คงเหลือ ${stockQuantity} ${unitName}`,
    detailStockColorClass: 'text-slate-400',
  };
}
```

---

## 3. State Transitions

| เหตุการณ์ (Event) | สต็อกก่อนหน้า | สต็อกใหม่ | สถานะขอบก่อนหน้า | สถานะขอบใหม่ |
| :--- | :--- | :--- | :--- | :--- |
| ขายสินค้าชิ้นสุดท้าย | 1 | 0 | `LOW_STOCK` (ขอบส้ม) | `OUT_OF_STOCK` (ขอบแดง) |
| ขายสินค้าจนถึงเกณฑ์ | 6 (min=5) | 5 | `IN_STOCK` (ขอบปกติ) | `LOW_STOCK` (ขอบส้ม) |
| ปรับยอดรับสินค้าเข้า | 0 | 12 | `OUT_OF_STOCK` (ขอบแดง) | `IN_STOCK` (ขอบปกติ) |
| เปลี่ยนสาขาการขาย | สาขา A (สต็อก 2) | สาขา B (สต็อก 0) | ขอบส้ม | ขอบแดง |
