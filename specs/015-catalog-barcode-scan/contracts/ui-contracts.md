# UI Contracts: Catalog Product Form Barcode Scan

**Feature**: `015-catalog-barcode-scan`  
**Date**: 2026-10-27  
**Type**: Frontend component contracts (ไม่มี REST API ใหม่)

## 1. `BarcodeCaptureModal`

**Path**: `src/components/shared/BarcodeCaptureModal.tsx`

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | yes | เปิด/ปิด Modal และเริ่ม/หยุดกล้อง |
| `onClose` | `() => void` | yes | เรียกเมื่อผู้ใช้ยกเลิก หรือปิดหลัง error; **ต้องไม่** ใส่ค่าบาร์โค้ด |
| `onCapture` | `(barcode: string) => void` | yes | เรียกครั้งเดียวต่อรอบเมื่ออ่านสำเร็จ; `barcode` ผ่าน `cleanBarcode` แล้วและไม่ว่าง |
| `title` | `string` | no | ค่าเริ่มต้นแนะนำ: `"สแกนบาร์โค้ด"` |

### Behavioral contract

1. เมื่อ `isOpen` เปลี่ยนเป็น `true` → ขอกล้องและเริ่ม hybrid decode
2. เมื่ออ่านบาร์โค้ดสำเร็จครั้งแรก → เรียก `onCapture(cleaned)` แล้วหยุดกล้องและถือว่าปิด session (parent ตั้ง `isOpen=false`)
3. ห้ามเรียก lookup สินค้า / ห้ามนำทาง / ห้ามแตะตะกร้า
4. เมื่อ permission ล้มเหลว → แสดงข้อความภาษาไทย; ให้ปิดด้วย `onClose`
5. เมื่อ `isOpen` เป็น `false` → ต้องหยุด tracks/decoder ทั้งหมด (ไม่ค้างกล้อง)

### Out of scope for this component

- ตัวนับสำเร็จ/ไม่พบสินค้าแบบ POS
- Continuous scanning หลังสำเร็จ
- Manual code submit ที่ไปค้นหาสินค้า (ช่องพิมพ์มือในฟอร์มสินค้ามีอยู่แล้วนอก Modal; Modal อาจมีช่องกรอกรหัสทางเลือกเพื่อใส่ค่าแล้ว `onCapture` ได้ แต่ต้องไม่ lookup)

## 2. Product form integration (`ProductFormModal` / `ProductFormDrawer`)

### UI placement

- แถวป้ายกำกับช่อง "บาร์โค้ดสินค้า" ต้องมีปุ่มสองตัว:
  1. **สแกนบาร์โค้ด** (ใหม่)
  2. **สร้างบาร์โค้ดอัตโนมัติ** (เดิม)
- ปุ่มต้องไม่บังกัน; สไตล์ใกล้เคียงปุ่ม cyan เดิม; touch target เหมาะสม (>= 48px ตามแนวทางฟอร์ม

### On capture handler (logical)

```text
onCapture(barcode):
  setBarcode(barcode)
  setIsInternalBarcode(false)
  setIsBarcodeScanOpen(false)
```

### Guarantees

- ใช้ได้ทั้งโหมดสร้างและแก้ไขสินค้า
- พิมพ์มือและสร้างอัตโนมัติยังทำงานตามเดิม
- การบันทึกสินค้าไม่เปลี่ยน contract API เดิม (`barcode` ใน payload ตามเดิม)

## 3. Non-goals (contract exclusions)

- ไม่มี endpoint ใหม่
- ไม่เปลี่ยน `PosCameraScannerModal` props/behavior
- ไม่เปลี่ยน `triggerCameraScanner` / Navbar scan entry points
