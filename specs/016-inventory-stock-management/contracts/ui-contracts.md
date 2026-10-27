# UI Component Contracts: Inventory Management

**Feature**: `016-inventory-stock-management` | **Date**: 2026-10-27

ข้อกำหนด Interface และ Props ของคอมโพเนนต์ในโมดูลคลังสินค้า

## 1. `InventorySummaryCards`
แสดงสรุปตัวเลขสถิติภาพรวมด้านบน

### Props
```typescript
export interface InventorySummaryCardsProps {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValuationBaht: number;
  isLoading?: boolean;
}
```

---

## 2. `InventoryToolbar`
แถบเครื่องมือค้นหา สลับสาขา กรองสต็อกต่ำ

### Props
```typescript
export interface InventoryToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenBarcodeScan: () => void;
  lowStockOnly: boolean;
  onToggleLowStock: (val: boolean) => void;
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  branches: Array<{ id: string; name: string }>;
  canSwitchBranch: boolean;
  onRefresh: () => void;
  isLoading?: boolean;
}
```

---

## 3. `InventoryStockTable`
ตารางแสดงรายการสต็อกสินค้าและสถานะ

### Props
```typescript
export interface InventoryStockTableProps {
  items: StockLevel[];
  isLoading: boolean;
  onAdjustStock: (stock: StockLevel) => void;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}
```

---

## 4. `StockAdjustmentModal`
หน้าต่างปรับยอดสต็อกสินค้า (IN, OUT, AUDIT, DAMAGE, EXPIRED)

### Props
```typescript
export interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: StockLevel | null;
  branchId: string;
  onSuccess: () => void;
}
```

### Behavioral Contract
1. เมื่อเปิด Modal: แสดงชื่อสินค้า, รหัส SKU, สาขา, และจำนวนสต็อกปัจจุบันชัดเจน
2. ค่าเริ่มต้นของประเภทการปรับยอด: `AUDIT` (ตรวจนับสต็อก)
3. เมื่อเลือก `AUDIT`: ช่องกรอกคือ "จำนวนที่นับได้จริง" และแสดงผลต่าง `(นับได้ - ปัจจุบัน)` ทันที
4. เมื่อเลือก `IN`: ช่องกรอกคือ "จำนวนที่รับเข้า (+)"
5. เมื่อเลือก `OUT`, `DAMAGE`, `EXPIRED`: ช่องกรอกคือ "จำนวนที่ตัดออก (-)" โดยบล็อกไม่ให้ตัดออกเกินยอดคงเหลือปัจจุบัน
6. บังคับกรอกช่อง "เหตุผลการปรับยอด" (Reason) อย่างน้อย 3 ตัวอักษร
7. ขณะกำลังส่งคำขอ: แสดง Loading Spinner ในปุ่ม และบล็อกการกดซ้ำ
8. เมื่อสำเร็จ: ปิด Modal และเรียก `onSuccess()` เพื่อรีเฟรชตารางยอดสต็อก
