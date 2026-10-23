# Technical Research: ระบบชำระเงินหน้าร้านและรวมสถานะกะ (POS Checkout & Payment)

**Feature Branch**: `005-pos-checkout-payment`  
**Date**: 2026-10-23  
**Status**: Completed  
**Spec Reference**: [spec.md](spec.md)

---

## 1. การรวม State กะการขายให้เป็นศูนย์กลางเดียว (Shift State Consolidation)

### Context & Problem
ปัจจุบันใน `src/app/(main)/pos/page.tsx` มีการจัดการ state `activeShift` ด้วยตัวเอง (`useState<ShiftInfo | null>(null)` และ `useEffect` ดึง `shiftService.getActiveShift(effectiveBranchId)`) ในขณะที่ `src/context/PosCartContext.tsx` ก็มี `activeShift`, `refreshActiveShift` และ `setActiveShift` ของตนเองและดึงข้อมูลซ้ำอีกครั้ง ส่งผลให้:
1. API `GET /api/v1/shifts/active` ถูกเรียกซ้ำซ้อน 2 ครั้งในการเปิดหน้าจอ POS 1 ครั้ง
2. เกิดความเสี่ยงเรื่อง State Desynchronization ระหว่างหน้าจอหลักกับแผงตะกร้า
3. ละเมิดหลักการ Single Source of Truth และหลักการความเรียบง่ายตามธรรมนูญข้อ 3.2

### Decision
- **ยุบรวมการจัดการ State กะการขายไว้ที่ `PosCartContext` เพียงแห่งเดียว**:
  - ตัด `const [activeShift, setActiveShift] = useState<ShiftInfo | null>(null)` และ `useEffect` ที่ดึงกะออกจาก `src/app/(main)/pos/page.tsx`
  - ให้ `PosPage.tsx` ใช้งาน `activeShift` และ `setActiveShift` ที่ export มาจาก `usePosCart()`
  - ส่งผ่าน `activeShift` ไปยัง `PosShiftBanner` และ `PosCartPanel` จาก context เดียวกัน
  - เมื่อเปิดกะสำเร็จใน `PosOpenShiftModal` ให้เรียก `setActiveShift(newShift)` หรือ `refreshActiveShift(branchId)` ของ `PosCartContext`

### Rationale
- แก้ไขปัญหา Duplicate State และกำจัด API Call ที่ซ้ำซ้อนได้ 100% ตรงตาม SC-002
- Component ทุกตัวในหน้า `/pos` อ้างอิงข้อมูลกะชุดเดียวกันเสมอแบบ Real-time
- ไม่ต้องสร้าง Context ใหม่ ลดความซับซ้อนตามธรรมนูญข้อ 4.2

### Alternatives Considered
- **ทางเลือก B: ย้าย `activeShift` ออกมาเป็น `ShiftContext` แยกต่างหาก**: ถูกปฏิเสธเนื่องจากปัจจุบัน `PosCartContext` มีความผูกพันกับการคิดเงินและกะอยู่แล้ว การเพิ่ม Context ใหม่เป็นการสร้าง Abstraction เกินความจำเป็นในเฟสนี้

---

## 2. การจัดการข้อมูลหน่วยนับสินค้า (`uomId`) ใน `CartItem`

### Context & Problem
เมื่อทำการบันทึกการขายผ่าน `POST /api/v1/sales` ตัว API กำหนดว่าแต่ละแถวใน `lines` ต้องมี `uomId: string` (UUID ของหน่วยนับ) แต่โครงสร้าง `CartItem` ใน `src/types/pos.ts` ปัจจุบันมีเพียง `uomName: string` ทำให้ขาด `uomId` สำหรับส่ง API

### Decision
- **เพิ่ม field `uomId: string` ใน `CartItem`**:
  - ปรับปรุง interface `CartItem` ใน `src/types/pos.ts` โดยเพิ่ม `uomId: string;`
  - ในฟังก์ชัน `addItem(product: Product, quantity = 1)` ของ `src/context/PosCartContext.tsx` ให้บันทึกค่า `uomId`:
    ```typescript
    const uomId = product.sellUomId || product.baseUomId || product.baseUom?.id || '';
    ```
  - เพิ่มการตรวจสอบความถูกต้อง (Validation): หากสินค้าไม่มีข้อมูล `uomId` ให้แจ้งเตือนข้อผิดพลาดและไม่อนุญาตให้เพิ่มลงตะกร้า หรือบล็อกการ checkout ตามเงื่อนไข Edge Case

### Rationale
- บันทึก `uomId` ตั้งแต่ขั้นตอนเลือกสินค้าลงตะกร้า ทำให้ตอน checkout ไม่ต้องทำการดึงข้อมูลสินค้าหรือหน่วยนับซ้ำอีก (Zero Extra API Calls)
- สอดคล้องกับข้อสรุป Clarification Q1 (Option A)

### Alternatives Considered
- **ทางเลือก B: ค้นหา `uomId` จาก API หรือแคตตาล็อกตอนกดชำระเงิน**: ถูกปฏิเสธเพราะทำให้ขั้นตอน Checkout ล่าช้า และอาจเกิดความล้มเหลวหากระบบเครือข่ายมีปัญหา

---

## 3. สถาปัตยกรรมหน้าต่างชำระเงิน (Checkout Modal Architecture)

### Context & Problem
ปัจจุบันปุ่ม "ชำระเงิน" ใน `PosCartPanel.tsx` ผูกกับ `handleCheckout()` ใน `PosPage.tsx` ซึ่งมีเพียง Toast ข้อความชั่วคราว ยังไม่มี Modal หรือ UI ให้ผู้ใช้ทำรายการขายจริง

### Decision
- **สร้าง Component `PosCheckoutModal` ใน `src/components/pos/PosCheckoutModal.tsx`**:
  - ควบคุมการแสดงผลผ่าน state `isCheckoutOpen: boolean` ใน `PosPage.tsx`
  - รองรับขั้นตอนการทำงานแบบ Multi-Step ภายใน Modal เดียวกัน:
    1. **หน้าสรุปและเลือกวิธีชำระ (Payment Method Selection)**: รองรับ `CASH` (P1), `QR_PROMPTPAY` (P2), `CREDIT` (P3)
    2. **หน้าจอรับเงินสด (Cash Payment Screen)**: แป้นตัวเลขสัมผัสขนาดใหญ่ (`VirtualNumericKeypad`), ปุ่มจำนวนเงินด่วน (Exact, 100, 500, 1000 บาท), และส่วนแสดงเงินทอนคำนวณอัตโนมัติ
    3. **หน้าจอ QR พร้อมเพย์ (PromptPay QR Screen)**: แสดงภาพ QR Code, ยอดเงิน, สถานะการตรวจสอบแบบ Real-time, และปุ่มตรวจสอบอีกครั้ง
    4. **หน้าจอบัญชีเงินเชื่อ (Credit Account Screen)**: ค้นหาลูกค้า, แสดงวงเงินคงเหลือ, และตรวจสอบความพอดีของวงเงิน
    5. **หน้าจอสำเร็จ (Success Overlay)**: แสดงเลขที่บิล ยอดเงินรวม ชื่อแคชเชียร์ พร้อมปุ่ม "เริ่มบิลใหม่" (Clear Cart & Close Modal)

### Rationale
- รวมกระบวนการคิดเงินไว้ใน Modal เดียว ช่วยให้แคชเชียร์ไม่หลุดจากบริบทของหน้าจอขายหน้าร้าน (Single-Page Experience)
- รองรับการเริ่มบิลใหม่ทันทีโดยไม่ต้อง Refresh หน้าจอ ตามข้อสรุป Clarification Q2

---

## 4. วงจรการทำงานของ QR PromptPay Auto-Polling (Lifecycle & Cleanup)

### Context & Problem
การชำระเงินผ่าน QR พร้อมเพย์ต้องการความสะดวกรวดเร็วโดยไม่ต้องให้แคชเชียร์กดตรวจสอบเอง แต่หากจัดการ Polling Timer ไม่ดี จะเกิดปัญหา Memory Leak หรือการยิง Request ค้างหลังจากปิดหน้าต่างไปแล้ว (ละเมิด SC-006)

### Decision
- **ออกแบบ Auto-polling ด้วย `useEffect` และ `setInterval` ที่มี Cleanup**:
  - เมื่อเข้าสู่โหมด QR พร้อมเพย์ ให้เรียก `POST /api/v1/payments/qr` เพื่อรับ `qrRef` และ `qrImageUrl`
  - เริ่มตั้งเวลา Poll ทุก 3 วินาที (3,000ms) ไปที่ `GET /api/v1/payments/{ref}/status`
  - มี Timeout ป้องกันการยิงไม่สิ้นสุดที่ 5 นาที (300,000ms หรือ 100 รอบ)
  - เมื่อได้รับสถานะ `SUCCESS` หรือ `PAID`: ทำการบันทึกการขายผ่าน `POST /api/v1/sales` และเปลี่ยนไปหน้า Success Overlay ทันที
  - เมื่อครบ 5 นาที: หยุด Polling อัตโนมัติ แสดงข้อความแจ้งเตือนหมดเวลา พร้อมปุ่ม "ตรวจสอบอีกครั้ง" (Manual Retry)
  - **Memory Cleanup**: ใช้ Cleanup Function ของ React `useEffect` เพื่อยกเลิก `clearInterval` ทุกครั้งที่ Component Unmount หรือผู้ใช้เปลี่ยนวิธีชำระเงิน หรือปิด Modal

### Rationale
- บรรลุเป้าหมาย SC-006 (Zero Memory Leak)
- มอบประสบการณ์ใช้งานที่ราบรื่น (Automatic Detection) พร้อม Fallback ที่ปลอดภัยสำหรับแคชเชียร์

---

## 5. การสร้าง `sales.service.ts` และการรองรับ Idempotency-Key

### Context & Problem
ต้องมีการส่งข้อมูลการขายไปยัง API `POST /api/v1/sales` โดยรองรับการป้องกันบิลซ้ำ (Idempotency) และโครงสร้าง Envelope ตามมาตรฐาน

### Decision
- **สร้าง `src/services/sales.service.ts`**:
  - `createSale(request: CreateSaleRequest, idempotencyKey: string): Promise<ApiResponse<SaleResponse>>`
  - ส่ง `Idempotency-Key` ผ่าน Custom Headers ของ `request()` utility
  - ฟังก์ชันเสริม: `generateIdempotencyKey(): string` โดยใช้ `crypto.randomUUID()` ใน Browser
  - สร้าง `src/services/payments.service.ts` สำหรับ `generatePromptPayQR` และ `checkPaymentStatus`

### Rationale
- แยกส่วนเชื่อมต่อ API ออกจาก UI ชัดเจนตามธรรมนูญข้อ 4.1 และ 5.1
- รับประกันว่าจะไม่มีการบันทึกบิลซ้ำซ้อน แม้ผู้ใช้จะกดปุ่มซ้ำหรือเครือข่ายหน่วง

---

## 6. มาตรฐาน UI หน้าจอสัมผัสสำหรับผู้สูงอายุ (Elderly-Friendly Standards)

### Requirements Mapping
- **ขนาดปุ่มสัมผัส (Touch Targets)**: ทุกปุ่มใน `PosCheckoutModal` เช่น ปุ่มเลือกวิธีชำระ ปุ่มตัวเลข Numpad ปุ่มเงินด่วน และปุ่มยืนยัน มีความสูงอย่างน้อย 48px พร้อมระยะห่าง (Gap) อย่างน้อย 8-12px
- **ความคมชัด (High Contrast)**: ใช้สีที่มี Contrast Ratio >= 4.5:1 ตามเกณฑ์ WCAG 2.1 AA (เช่น พื้นหลังขาว ตัวอักษรสีเข้ม หรือพื้นเข้มตัวอักษรขาวสว่าง)
- **แป้นตัวเลขสัมผัส**: ป้อนจำนวนเงินสดผ่าน `VirtualNumericKeypad` ที่มีปุ่มตัวเลขขนาดใหญ่ และปุ่ม Backspace/Clear ที่กดง่าย
- **เสียงตอบรับ (Audio Feedback)**: เมื่อบันทึกการขายสำเร็จ เล่นเสียง Beep ความถี่สูง (Success Sound) ผ่าน Web Audio API เพื่อให้แคชเชียร์มั่นใจว่าการขายเสร็จสมบูรณ์โดยไม่ต้องเพ่งหน้าจอตลอดเวลา
