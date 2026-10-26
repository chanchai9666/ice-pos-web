# Research & Technical Decisions: 014-scan-product-info-display

**Feature**: แสดงข้อมูลสินค้าที่สแกนพบ (เลขบาร์โค้ด ชื่อสินค้า ราคา) และแสดงเฉพาะบาร์โค้ดเมื่อไม่พบสินค้า
**Branch**: `014-scan-product-info-display`
**Date**: 2026-10-26

## 1. การส่งต่อข้อมูลราคาจากกระบวนการค้นหา (Price Data Flow)

### Decision
ขยาย Interface `BarcodeScanResult` และ `ScanFeedbackResult` ใน `src/types/scanner.ts` ให้มีฟิลด์ `price?: number` และปรับปรุง `handleBarcodeScanned` ใน `src/app/(main)/pos/page.tsx` ให้คืนค่าราคาขายของสินค้าทั้งกรณีค้นพบในแคช (`products.find`) และกรณีค้นพบผ่าน API (`catalogService.lookupProduct`)

### Rationale
- `Product` entity มีฟิลด์ `price: number` อยู่แล้วในระบบ
- การส่ง `price` กลับมาใน `BarcodeScanResult` ทำให้ Modal สแกนกล้อง (`PosCameraScannerModal`) ได้รับข้อมูลราคาทันทีโดยไม่ต้อง query ข้อมูลซ้ำซ้อน
- คงความเข้ากันได้ย้อนหลัง (Backward Compatibility) ด้วยการใช้ optional field (`price?: number`)

### Alternatives Considered
- *ให้ Modal เข้าถึงแคชสินค้าหรือเรียก API เพิ่มเติมเอง*: ถูกปฏิเสธ เพราะจะทำให้ Component ผูกติดกับ State ภายนอกมากเกินไป และทำให้การสแกนช้าลง มีความหน่วง
- *รวมราคาไว้ในสตริง productName*: ถูกปฏิเสธ เพราะไม่ยืดหยุ่น ขัดต่อหลัก Data Model ที่สะอาด และยากต่อการจัดสไตล์แยกชิ้น

---

## 2. การจัดวาง UI และการจัดรูปแบบราคา (Elderly-Friendly UI & Styling)

### Decision
- **กรณีสแกนพบ (SUCCESS)**:
  - แสดงข้อความและข้อมูลในแถบสถานะสีเขียวมรกต (`bg-emerald-950/80 border-emerald-500/40`)
  - ชื่อสินค้าแสดงตัวหนา ตัวหนังสือขนาดอ่านง่าย รองรับการตัดคำ (Truncate)
  - เลขบาร์โค้ดแสดงในวงเล็บฟอนต์ Monospace (`text-emerald-400/80 font-mono`)
  - แสดงราคาในรูปแบบ Badge ป้ายราคาเด่นชัด เช่น `฿35.00` โดยใช้พื้นหลังตัดกับกรอบ (`bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-lg font-bold font-mono`) จัดวางต่อจากชื่อสินค้า หรือชิดขวาของแถบเพื่อให้มองเห็นราคาได้ทันที
- **กรณีสแกนไม่พบ (NOT_FOUND)**:
  - แสดงเฉพาะแถบเตือนสีส้ม/แดง (`bg-rose-950/80 border-rose-500/40 text-rose-200`)
  - ข้อความ "ไม่พบสินค้าในระบบ: " และแสดงเฉพาะเลขบาร์โค้ดที่อ่านได้ด้วยฟอนต์ Monospace
  - ไม่แสดงราคาหรือชื่อสินค้าอย่างเด็ดขาดตามข้อกำหนด

### Rationale
- ตรงตามที่ผู้ใช้งานเลือกในขั้นตอน Clarification (Badge ป้ายราคาเด่นชัดข้างชื่อสินค้า)
- ตรงตามหลักการ Elderly-Friendly ในธรรมนูญระบบ (ข้อความชัดเจน, ตัวเลขราคาเด่นชัด, Contrast สีสูง)
- เมื่อหน้าจอเล็ก (Mobile/Tablet) Badge ราคายังคงไม่ตกขอบ และอ่านได้ในพริบตา

### Alternatives Considered
- *แสดงราคาเป็นตัวอักษรธรรมดาต่อท้ายชื่อ*: กลืนไปกับชื่อสินค้า ทำให้อ่านยากเมื่อชื่อสินค้ายาว
- *แยกเป็น 2 บรรทัดบน Modal ทุกขนาดหน้าจอ*: กินพื้นที่หน้าจอแนวตั้งบนโทรศัพท์มือถือ ทำให้พื้นที่ช่องส่องกล้องลดลง

---

## 3. การแสดงผลการแจ้งเตือน Toast บนหน้าจอขาย POS (Hardware Scanner Consistency)

### Decision
ปรับปรุงข้อความใน Toast Notification ของ `handleBarcodeScanned` เมื่อสแกนติด ให้แสดงชื่อสินค้าพร้อมวงเล็บราคา เช่น `น้ำแข็งหลอดเล็ก (฿35.00)`

### Rationale
- ตรงตามข้อกำหนดจากการ Clarification ให้ประสบการณ์การสแกนทั้งแบบฮาร์ดแวร์และกล้องมีข้อมูลตรงกัน
- แคชเชียร์ที่ยิงบาร์โค้ดด้วยเครื่องยิงบนหน้า POS สามารถเหลือบดูราคาที่ยิงเข้าบิลได้ทันทีจาก Toast

### Alternatives Considered
- *แยกแสดงเป็นบรรทัดใหม่ใน Toast*: อาจทำให้ Toast สูงเกินไปและกินพื้นที่บนหน้าจอ POS
