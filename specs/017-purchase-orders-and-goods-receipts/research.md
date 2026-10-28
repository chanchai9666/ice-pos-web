# Research & Architectural Decisions: Purchase Orders & Goods Receipts

**Feature**: `017-purchase-orders-and-goods-receipts`
**Date**: 2026-10-27

---

## 1. UI Navigation & Page Architecture

- **Context**: ฟังก์ชันใบสั่งซื้อสินค้าและตรวจรับสินค้าเข้าคลังเป็นส่วนเสริมสำคัญของระบบคลังสินค้า ผู้ใช้ต้องการเข้าถึงได้ง่ายจากหน้าเดิมโดยไม่ต้องเปิดหลายเมนู
- **Decision**: ใช้รูปแบบ **Segmented Tab Navigation** บนหน้า `/inventory`
  - แท็บ 1: **สต็อกคงเหลือ (Stock Levels)** - แสดงตารางสต็อกและการปรับยอดเดิม
  - แท็บ 2: **ใบสั่งซื้อสินค้า (Purchase Orders)** - รายการ PO, ตัวกรองสถานะ/สาขา/ผู้จัดจำหน่าย, ปุ่มสร้าง PO ใหม่, ดูรายละเอียด และยืนยัน/ยกเลิก
  - แท็บ 3: **ตรวจรับสินค้าเข้าคลัง (Goods Receipts)** - รายการ GR, ปุ่มตรวจรับจาก PO (ดึง Pending Items Preview), ปุ่มตรวจรับตรง, บันทึก Lot/Expiry และยืนยัน Complete
- **Rationale**: สอดคล้องกับผลการ Clarification (Session 2026-10-27) ทำให้หน้าจอเป็นระเบียบ ไม่รกเมนู Sidebar และช่วยให้ผู้จัดการร้านทำงานแบบ One-Stop ในโมดูลคลัง
- **Alternatives Considered**:
  - แยกเป็นเมนูหลักใน Sidebar (`/purchasing`): ถูกปฏิเสธเนื่องจากทำให้ Sidebar มีเมนูมากเกินไปสำหรับหน้าจอ POS/Tablet
  - แยกเป็นคนละ URL (`/inventory/purchase-orders`): สลับไปมาได้ช้ากว่า Client Tab Navigation

---

## 2. API Service Layer & Currency Handling (Satang to THB)

- **Context**: Backend API จัดการราคาและมูลค่าเงินในหน่วย **สตางค์ (Satang)** เป็น Integer (เช่น 100 บาท = 10000 สตางค์) และมีพารามิเตอร์ Idempotency Header สำหรับการทำรายการสำคัญ
- **Decision**:
  - สร้าง `procurementService` (หรือ `purchaseOrderService` และ `goodsReceiptService`) ที่ต่อกับ `/api/v1/purchase-orders`, `/api/v1/goods-receipts` และ `/api/v1/suppliers`
  - ฝั่ง UI รับตัวเลขต้นทุนและยอดเงินเป็น **บาท (THB)** และใช้ยูทิลิตี `toSatang()` แปลงเป็น Satang ก่อนส่งเข้า API
  - ฝั่งแสดงผลแปลงค่าจาก Satang กลับเป็น บาท ด้วย `formatCurrency(amount / 100)`
- **Rationale**: ป้องกันปัญหา Floating Point Precision คลาดเคลื่อนในฐานข้อมูล และตรงตามสัญญาของ Backend Swagger 100%
- **Alternatives Considered**: ส่งเป็นทศนิยมบาทตรงๆ: ขัดกับ Swagger Schema (`minimum: 0, type: integer`).

---

## 3. Goods Receipt Workflow & Barcode Scanning

- **Context**: ในขั้นตอนการตรวจรับสินค้าเข้าคลัง พนักงานอาจตรวจรับจากใบสั่งซื้อ (ดึงรายการค้างรับ `receipt-preview`) หรือตรวจรับตรง และต้องการความรวดเร็วในการนับสินค้า
- **Decision**:
  - เมื่อเลือกสร้างใบตรวจรับจาก PO ระบบจะเรียก `GET /api/v1/purchase-orders/{id}/receipt-preview` มาเติมตารางรายการอัตโนมัติ โดยระบุยอดสั่งซื้อและยอดค้างรับคงเหลือให้เห็นชัดเจน
  - เพิ่มปุ่มไอคอนกล้อง "สแกนบาร์โค้ด" (นำคอมโพเนนต์ `BarcodeCaptureModal` ที่มีอยู่แล้วมาใช้ซ้ำ) เมื่อสแกนตรงกับบาร์โค้ดสินค้าในตาราง ระบบจะบวกเพิ่มจำนวนรับจริง (`receivedQuantity`) ขึ้น +1 ทันที และสามารถพิมพ์แก้ตัวเลขได้ตลอดเวลา
  - กรณีตรวจรับจริงเกินจำนวนที่สั่ง (Over-delivery): แสดงคำเตือนสีส้มและกล่องยืนยันภาษาไทยก่อนอนุญาตให้ส่งคำขอ
- **Rationale**: ตรงตามผลการ Clarification (Session 2026-10-27) และช่วยลด Human Error ในการตรวจนับของหน้างาน
- **Alternatives Considered**: บังคับให้พิมพ์ตัวเลขอย่างเดียว: ไม่สะดวกสำหรับผู้ใช้งานบนแท็บเล็ตตรวจรับสินค้าจริงที่หน้าร้าน/หลังคลัง

---

## 4. API Action Loading Overlay Compliance

- **Context**: ข้อกำหนดธรรมนูญข้อ 6.6 ระบุว่าทุก Action ที่เรียกใช้งาน API ต้องมี Full Loading Overlay บล็อกการคลิกซ้ำ จนกว่าคำขอจะสำเร็จหรือล้มเหลว
- **Decision**:
  - เชื่อมต่อทุก Action (สร้าง PO, ยืนยัน PO, ยกเลิก PO, บังคับปิด PO, สร้าง GR, ยืนยัน Complete GR, ยกเลิก GR) เข้ากับ Loading Overlay กลางของระบบ พร้อมข้อความภาษาไทยที่ชัดเจน เช่น "กำลังบันทึกใบสั่งซื้อ...", "กำลังยืนยันตรวจรับสินค้าเข้าคลัง กรุณารอสักครู่..."
  - ปลดล็อกทันทีเมื่อ API ตอบกลับ และแสดง Toast / Error Modal หากเกิดข้อผิดพลาด
- **Rationale**: ปฏิบัติตามธรรมนูญข้อ 6.6 และป้องกันปัญหาการรับสต็อกเข้าคลังเบิ้ล (Double Submission)
