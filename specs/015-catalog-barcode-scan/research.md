# Research: ปุ่มสแกนบาร์โค้ดในฟอร์มเพิ่ม/แก้ไขสินค้า

**Feature Branch**: `015-catalog-barcode-scan`  
**Date**: 2026-10-27

## 1. Reuse `PosCameraScannerModal` vs Modal ใหม่สำหรับฟอร์ม

### Decision
สร้าง **`BarcodeCaptureModal`** ใหม่สำหรับจับบาร์โค้ดแบบ single-capture เพื่อเติมช่องฟอร์ม ไม่ reuse `PosCameraScannerModal` โดยตรง

### Rationale
- `PosCameraScannerModal` ผูกกับ flow ขาย: continuous scan, ตัวนับสำเร็จ/ไม่พบสินค้า, lookup ผ่าน `onScan` ที่คืน `BarcodeScanResult`
- Spec กำหนด: ปิดทันทีหลังอ่านครั้งแรก, ไม่ค้นหาสินค้า, ไม่เพิ่มตะกร้า, ไม่ไป POS
- การใส่ `mode` เข้า POS modal จะเพิ่มความซับซ้อนและเสี่ยง regress การขาย (ขัด 3.2 / 3.3)

### Alternatives considered
| ตัวเลือก | ผล |
|----------|-----|
| A. เรียก `PosCameraScannerModal` แล้ว ignore lookup | UX ผิด (ตัวนับ/ไม่พบสินค้า), ยัง continuous | ไม่เลือก |
| B. เพิ่ม `mode: 'capture'` ใน POS modal | ลด duplication แต่ทำให้ไฟล์ใหญ่และเสี่ยง bug ขาย | ไม่เลือกใน v1 |
| C. Modal ใหม่ single-capture + hybrid engine เดิม | หน้าที่ชัด, ปลอดภัยต่อ POS | **เลือก** |

---

## 2. Engine ถอดรหัสบาร์โค้ด

### Decision
ใช้ **Hybrid Engine** แบบเดียวกับ POS ที่พิสูจน์แล้วใน `013-barcode-scan-fix-and-counters`:
1. Native `BarcodeDetector` เมื่อมี
2. Fallback `@zxing/browser` (`BrowserMultiFormatReader`) เมื่อไม่มี (Safari/iOS/Firefox)
3. ทำความสะอาดค่าด้วย `cleanBarcode` จาก `@/utils/barcode`
4. ไม่เพิ่ม dependency ใหม่

### Rationale
- รองรับข้ามเบราว์เซอร์ตาม constitution 6.3
- dependency มีใน `package.json` แล้ว (ข้อ 10)
- พฤติกรรมอ่านบาร์โค้ดสอดคล้องกับที่ผู้ใช้คุ้นใน POS

### Alternatives considered
- เรียกเฉพาะ Native BarcodeDetector → ใช้ไม่ได้บน Safari
- เพิ่ม library ใหม่ → ไม่จำเป็น

---

## 3. จุดผูกกับฟอร์มสินค้า

### Decision
อัปเดตทั้ง **`ProductFormModal.tsx`** และ **`ProductFormDrawer.tsx`**:
- state `isBarcodeScanOpen`
- ปุ่ม "สแกนบาร์โค้ด" คู่กับ "สร้างบาร์โค้ดอัตโนมัติ" ในแถวป้ายกำกับ
- `onCapture(barcode)` → `setBarcode(cleaned)`, `setIsInternalBarcode(false)`, ปิด scan modal

### Rationale
- Spec ยืนยันครอบคลุมทั้งเพิ่มและแก้ไข; ทั้งสอง UI มีช่องบาร์โค้ดและปุ่มสร้างอัตโนมัติอยู่แล้ว
- การเคลียร์ธงบาร์โค้ดภายในร้านเมื่อสแกนจากฉลาก สอดคล้องกับการพิมพ์มือ (`onChange` ตั้ง `isInternalBarcode` เป็น false)

### Alternatives considered
- แก้เฉพาะ Modal → Drawer บนมือถือขาดฟีเจอร์
- Shared form hook ใหญ่ ๆ → over-abstract สำหรับปุ่มเดียว

---

## 4. พฤติกรรมหลังอ่านสำเร็จ / ยกเลิก / กล้องล้มเหลว

### Decision
| เหตุการณ์ | พฤติกรรม |
|-----------|----------|
| อ่านสำเร็จครั้งแรก | `cleanBarcode` → `onCapture` → หยุดกล้อง → ปิด Modal → ใส่ค่าช่อง |
| ผู้ใช้กดปิด/ยกเลิก | หยุดกล้อง → ปิด Modal → ไม่เปลี่ยนค่าช่อง |
| ไม่มีกล้อง / ปฏิเสธสิทธิ์ | แสดงข้อความไทยใน Modal; ผู้ใช้ปิดแล้วพิมพ์มือได้ |
| บาร์โค้ดซ้ำสินค้าอื่น | ไม่ตรวจตอนสแกน; ปล่อยให้ validation/บันทึกเดิม |

### Rationale
ตรง clarifications ใน spec (single capture, duplicate at save, cancel preserves form)

---

## 5. ตำแหน่งไฟล์ Component

### Decision
วางที่ `src/components/shared/BarcodeCaptureModal.tsx` เพื่อให้ reuse ได้ถ้าฟอร์มอื่นต้องการจับบาร์โค้ดในอนาคต โดยยังไม่ refactor POS ในรอบนี้

### Alternatives considered
- `src/components/catalog/BarcodeCaptureModal.tsx` — ก็ใช้ได้ถ้าต้องการ scope แคบ; shared เลือกเพื่อแยกจาก POS และ catalog-specific forms
