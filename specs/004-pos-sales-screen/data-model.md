# Data Model: ระบบจุดขายสินค้าหน้าร้าน (POS Sales Screen & Barcode Scanning)

**Feature Branch**: `004-pos-sales-screen`  
**Date**: 2026-10-21  

---

## 1. CartItem (รายการสินค้าในตะกร้าขาย)

แทนข้อมูลของสินค้า 1 บรรทัดที่ถูกเพิ่มลงในตะกร้าขายหน้าร้าน

```typescript
export interface CartItem {
  id: string;              // Unique Cart Item ID (e.g. productId หรือ productId + variant)
  productId: string;       // รหัสสินค้าอ้างอิงจาก Backend (UUID)
  name: string;            // ชื่อสินค้าภาษาไทย
  sku: string;             // รหัส SKU สินค้า
  barcode?: string;        // รหัสบาร์โค้ด
  price: number;           // ราคาขายต่อหน่วย (หน่วยสตางค์ หรือบาทแปลงแล้ว)
  quantity: number;        // จำนวนสินค้าที่สั่งซื้อ (>= 1 สำหรับชิ้น, > 0 ทศนิยมสำหรับชั่งน้ำหนัก)
  uomName: string;         // ชื่อหน่วยนับ (เช่น "ชิ้น", "ถุง", "แพ็ก", "กิโลกรัม")
  imageUrl?: string;       // URL รูปภาพสินค้าสำหรับแสดงผลในตะกร้า
  categoryName?: string;   // ชื่อหมวดหมู่สินค้า
  taxRatePercent: number;  // อัตราภาษีมูลค่าเพิ่ม (เช่น 7.00%)
  pricingType: 'PIECE' | 'WEIGHT'; // ประเภทการคิดราคา (นับชิ้น หรือ ชั่งน้ำหนัก)
  lineTotal: number;       // ราคารวมของแถวรายการ = price * quantity
}
```

### Validation Rules
- `quantity`: ต้องมากกว่า 0 เสมอ หากกดลบจนเหลือ 0 ระบบจะนำสินค้านั้นออกจากตะกร้า
- `price`: ล็อกค่าจากข้อมูลสินค้าในฐานข้อมูล API ห้ามแก้ไขราคาต่อหน่วยโดยตรง
- `lineTotal`: คำนวณแบบปัดเศษทศนิยม 2 ตำแหน่งอย่างแม่นยำ

---

## 2. CartSummary (การคำนวณสรุปยอดเงินทั้งบิล)

```typescript
export interface CartSummary {
  itemCount: number;       // จำนวนชนิดสินค้าในบิล (จำนวนบรรทัด)
  totalQuantity: number;   // จำนวนชิ้นสินค้ารวมทั้งหมด
  subtotal: number;        // ยอดรวมสินค้าก่อนภาษี (บาท)
  taxAmount: number;       // ภาษีมูลค่าเพิ่มรวม (VAT) (บาท)
  discountAmount: number;  // ส่วนลดรวม (บาท, ค่าเริ่มต้น 0)
  grandTotal: number;      // ยอดสุทธิที่ต้องชำระ = subtotal + taxAmount - discountAmount (บาท)
}
```

---

## 3. BarcodeScanResult (ผลลัพธ์การสแกนบาร์โค้ด)

```typescript
export interface BarcodeScanResult {
  code: string;            // รหัสที่สแกนได้ (หลังผ่านการกรองและถอดรหัสแป้นพิมพ์ไทย)
  source: 'HARDWARE' | 'CAMERA' | 'MANUAL'; // ช่องทางที่ได้รับข้อมูล
  timestamp: number;       // เวลาที่ตรวจพบ
  status: 'SUCCESS' | 'NOT_FOUND' | 'ERROR'; // สถานะผลลัพธ์
  message?: string;        // ข้อความประกอบ
}
```

---

## 4. ShiftInfo (ข้อมูลกะการขายปัจจุบัน)

```typescript
export interface ShiftInfo {
  id: string;              // รหัสกะ (UUID)
  branchId: string;        // รหัสสาขา
  cashierId: string;       // รหัสแคชเชียร์ผู้เปิดกะ
  cashierName: string;     // ชื่อแคชเชียร์
  openedAt: string;        // วันเวลาเปิดกะ
  startingCash: number;    // เงินทอนเริ่มต้น (บาท)
  status: 'OPEN' | 'CLOSED'; // สถานะกะ
}
```

---

## 5. PosViewState (สถานะหน้าจอจุดขาย)

```typescript
export interface PosViewState {
  selectedCategoryId: string | 'ALL'; // หมวดหมู่ที่เลือกกรอง ('ALL' คือทั้งหมด)
  searchQuery: string;                // คำค้นหาในกล่องค้นหาด่วน
  isCameraModalOpen: boolean;         // สถานะเปิด/ปิดกล้องสแกนเนอร์
  activeShift: ShiftInfo | null;      // ข้อมูลกะขายปัจจุบัน (null = ยังไม่เปิดกะ)
  isOpenShiftModalOpen: boolean;      // สถานะเปิดหน้าต่างเปิดกะการขาย
  editingQuantityItem: CartItem | null; // รายการที่กำลังเปิด Numpad แก้ไขจำนวน
}
```
