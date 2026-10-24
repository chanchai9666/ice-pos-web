# Component & Interaction Contracts: POS Product Stock Alert

**Feature**: `007-pos-product-stock-alerts`  
**Date**: 2026-10-24  
**Status**: Draft  

---

## 1. PosProductGrid Props Contract

```typescript
export interface PosProductGridProps {
  /** รายการสินค้าที่ผ่านการกรองและค้นหาแล้ว */
  products: Product[];

  /** แมประดับสต็อกตาม productId (productId -> availableQuantity) */
  stockMap?: StockLevelMap;

  /** ฟังก์ชัน Callback เมื่อแคชเชียร์เลือกการ์ดสินค้า */
  onSelectProduct: (product: Product) => void;

  /** สถานะการโหลดรายการสินค้า */
  isLoading?: boolean;
}
```

---

## 2. Interaction Contract: Out-of-Stock Product Selection

เมื่อผู้ใช้กดเลือกสินค้าบนการ์ดสินค้า:

```typescript
// ใน src/app/(main)/pos/page.tsx
const handleSelectProduct = (product: Product) => {
  // 1. เพิ่มสินค้าลงตะกร้าตามปกติ
  addItem(product, 1);

  // 2. หากเป็นสินค้าที่ไม่ใช่ชั่งขายและสต็อกหมด ให้แจ้งเตือนผู้ใช้
  if (product.productType !== 'BY_WEIGHT') {
    const stock = stockMap[product.id] ?? 0;
    if (stock <= 0) {
      addToast({
        type: 'INFO',
        title: 'สินค้าหมดสต็อก',
        message: `สินค้า "${product.name}" มีสต็อกในระบบเป็น 0 (อนุญาตให้ขายต่อได้)`,
      });
    }
  }
};
```

---

## 3. UI Styling & Accessibility Contracts

| ระดับสถานะ | คลาสขอบ (Border Class) | คลาสป้าย (Badge Class) | คลาสข้อความ (Text Class) | เกณฑ์คอนทราสต์ |
| :--- | :--- | :--- | :--- | :--- |
| **OUT_OF_STOCK** (หมด) | `border-2 border-rose-500 hover:border-rose-400` | `bg-rose-600 text-white font-bold` | `text-rose-400 font-bold` | WCAG 2.1 AA (4.5:1+) |
| **LOW_STOCK** (ใกล้หมด) | `border-2 border-amber-500 hover:border-amber-400` | `bg-amber-500 text-slate-950 font-bold` | `text-amber-400 font-semibold` | WCAG 2.1 AA (4.5:1+) |
| **IN_STOCK** (ปกติ) | `border-2 border-slate-800 hover:border-cyan-500/60` | `bg-slate-950/85 text-emerald-400 border border-emerald-500/40` | `text-slate-400` | WCAG 2.1 AA (4.5:1+) |
| **BY_WEIGHT** (ชั่งขาย) | `border-2 border-slate-800 hover:border-cyan-500/60` | `bg-amber-500 text-slate-950 font-black` | `text-amber-400 font-semibold` | WCAG 2.1 AA (4.5:1+) |
