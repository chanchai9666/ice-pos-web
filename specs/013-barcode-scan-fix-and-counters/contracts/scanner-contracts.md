# Interface Contracts: ระบบสแกนบาร์โค้ดผ่านกล้อง

**Feature Branch**: `013-barcode-scan-fix-and-counters`  
**Date**: 2026-10-26  

## 1. Component Contract: `PosCameraScannerModal`

### Props Interface

```typescript
export interface BarcodeScanResult {
  success: boolean;
  productName?: string;
}

export interface PosCameraScannerModalProps {
  /**
   * สถานะเปิด/ปิดหน้าต่าง Modal สแกน
   */
  isOpen: boolean;

  /**
   * ฟังก์ชันเรียกเมื่อผู้ใช้ปิด Modal
   */
  onClose: () => void;

  /**
   * ฟังก์ชันประมวลผลเมื่อสแกนพบบาร์โค้ดหรือกรอกรหัสด้วยมือ
   * คืนค่า Promise ที่ระบุว่าพบสินค้าในระบบหรือไม่
   */
  onScan: (barcode: string) => Promise<BarcodeScanResult>;
}
```

## 2. Page Contract: `src/app/(main)/pos/page.tsx`

### `handleBarcodeScanned` Callback

```typescript
const handleBarcodeScanned = useCallback(
  async (barcode: string): Promise<BarcodeScanResult> => {
    // 1. ตรวจสอบในแคชสินค้าท้องถิ่น (Local Catalog Cache)
    const localFound = products.find(
      (p) => p.barcode === barcode || p.sku?.toLowerCase() === barcode.toLowerCase()
    );
    if (localFound) {
      addItem(localFound, 1);
      addToast({
        type: 'SUCCESS',
        title: 'เพิ่มสินค้าลงบิลแล้ว',
        message: localFound.name,
        code: barcode,
      });
      return { success: true, productName: localFound.name };
    }

    // 2. ตรวจสอบผ่าน API ค้นหาสินค้า
    try {
      const res = await catalogService.lookupProduct(barcode);
      if (res.data) {
        addItem(res.data, 1);
        addToast({
          type: 'SUCCESS',
          title: 'เพิ่มสินค้าลงบิลแล้ว',
          message: res.data.name,
          code: barcode,
        });
        return { success: true, productName: res.data.name };
      }
    } catch (e) {
      // API lookup failed or not found
    }

    // 3. กรณีไม่พบสินค้า
    addToast({
      type: 'ERROR',
      title: 'ไม่พบบาร์โค้ดในระบบ',
      message: `ไม่พบข้อมูลสินค้าสำหรับรหัส "${barcode}"`,
      code: barcode,
    });
    return { success: false };
  },
  [products, addItem, addToast]
);
```

## 3. UI Display Contract: Counter Cards & Status Banners

### 3.1 Counter Cards Layout
การ์ดสรุป 2 ช่องคู่กัน วางในตำแหน่งที่เห็นชัดเจนบนหน้าต่างสแกน:
- **Card 1: สแกนสำเร็จ (Green Card)**
  - พื้นหลัง: `bg-emerald-500/10` หรือ `bg-emerald-50`, ขอบ `border-emerald-500/30`
  - ป้ายกำกับ: `"สแกนสำเร็จ"` (สีเขียวเข้ม)
  - ตัวเลข: `[successCount]` ชิ้น ขนาดใหญ่พิเศษ (`text-3xl font-black text-emerald-600`)
  - ไอคอน: CheckCircleIcon
- **Card 2: ไม่พบสินค้า (Red/Orange Card)**
  - พื้นหลัง: `bg-rose-500/10` หรือ `bg-rose-50`, ขอบ `border-rose-500/30`
  - ป้ายกำกับ: `"ไม่พบสินค้า"` (สีแดง/ส้มเข้ม)
  - ตัวเลข: `[failedCount]` ครั้ง ขนาดใหญ่พิเศษ (`text-3xl font-black text-rose-600`)
  - ไอคอน: ExclamationTriangleIcon

### 3.2 Feedback Banner Layout
- เมื่อ `lastScanFeedback.status === 'SUCCESS'`:
  - แสดงแถบสีเขียว: `"✓ สแกนสำเร็จ: [productName] ([barcode])"`
- เมื่อ `lastScanFeedback.status === 'NOT_FOUND'`:
  - แสดงแถบสีแดง: `"⚠ ไม่พบข้อมูลสินค้าสำหรับรหัส: [barcode]"`
