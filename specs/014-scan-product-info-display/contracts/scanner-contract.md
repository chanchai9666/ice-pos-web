# Interface Contracts: Scanner & POS Integration

**Feature**: 014-scan-product-info-display
**Target File**: `src/types/scanner.ts`

## 1. Type Contract: `src/types/scanner.ts`

```typescript
/**
 * ผลลัพธ์จากการค้นหาและเพิ่มสินค้าด้วยรหัสบาร์โค้ด
 */
export interface BarcodeScanResult {
  /** ผลการค้นหาและเพิ่มสินค้าลงบิล (true = พบสินค้าในระบบ, false = ไม่พบ) */
  success: boolean;
  /** ชื่อสินค้าที่ค้นพบ (มีค่าเมื่อ success === true) */
  productName?: string;
  /** ราคาขายต่อหน่วยของสินค้า (มีค่าเมื่อ success === true) */
  price?: number;
}

/**
 * ข้อมูลผลลัพธ์การสแกนล่าสุดสำหรับแสดงผลในแถบสถานะ (Recent Scan Banner)
 */
export interface ScanFeedbackResult {
  /** สถานะผลลัพธ์ */
  status: 'SUCCESS' | 'NOT_FOUND';
  /** รหัสบาร์โค้ด */
  barcode: string;
  /** ชื่อสินค้า (กรณีพบ) */
  productName?: string;
  /** ราคาขายต่อหน่วย (กรณีพบ) */
  price?: number;
  /** เวลาที่สแกน (Unix timestamp ms) */
  timestamp: number;
}
```

## 2. Component Contract: `src/components/pos/PosCameraScannerModal.tsx`

### Props Contract
```typescript
export interface PosCameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => Promise<BarcodeScanResult> | void;
}
```

### Visual Output Contract (Render Specifications)

1. **เมื่อ `lastScanFeedback.status === 'SUCCESS'`**:
   ```tsx
   <div className="flex items-center justify-between gap-2">
     <div className="min-w-0 flex-1 truncate">
       <span className="font-bold text-emerald-300">สแกนสำเร็จ: </span>
       <span>{lastScanFeedback.productName}</span>
       <span className="text-emerald-400/70 font-mono text-xs ml-1.5">
         ({lastScanFeedback.barcode})
       </span>
     </div>
     <div className="shrink-0 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold font-mono text-xs sm:text-sm shadow-sm">
       ฿{Number(lastScanFeedback.price ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
     </div>
   </div>
   ```

2. **เมื่อ `lastScanFeedback.status === 'NOT_FOUND'`**:
   ```tsx
   <p className="truncate font-medium">
     <span className="font-bold text-rose-300">ไม่พบสินค้าในระบบ: </span>
     <span className="font-mono text-rose-200">{lastScanFeedback.barcode}</span>
   </p>
   ```

## 3. Toast Contract: `src/app/(main)/pos/page.tsx`

เมื่อสแกนพบสินค้า:
```typescript
addToast({
  type: 'SUCCESS',
  title: 'เพิ่มสินค้าลงบิลแล้ว',
  message: `${product.name} (฿${Number(product.price ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
  code: barcode,
});
```
