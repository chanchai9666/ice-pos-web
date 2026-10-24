# Phase 0 Research & Technical Decisions: การแสดงจำนวนสินค้าคงเหลือ/ชั่งขาย และปรับปรุงตะกร้าสินค้า POS

**Feature**: `006-pos-stock-and-cart`
**Date**: 2026-10-24
**Status**: Completed

## 1. การดึงข้อมูลและจัดการสถานะสต็อกสินค้า (Inventory Stock Level Management)

### Decision
สร้าง `inventoryService` (`src/services/inventory.service.ts`) เพื่อเชื่อมต่อกับ Endpoint มาตรฐานของระบบ ICE POS API:
- `GET /api/v1/inventory/stocks?branchId={branchId}&pageSize=100`
- แมปข้อมูลผลลัพธ์เป็น `Record<string, number>` (productId -> quantity) ในหน้าจอ `src/app/(main)/pos/page.tsx` หรือ Custom Hook
- ส่งข้อมูลสต็อก `stockMap` เข้าไปยัง `PosProductGrid` เพื่อให้การ์ดสินค้าแสดงจำนวนคงเหลือได้แบบเรียลไทม์

### Rationale
- ICE POS API มี Endpoint `/inventory/stocks` ให้บริการอยู่แล้วตาม Swagger Schema (`StockLevelResponse`)
- การดึงสต็อกรวมตามสาขา (branchId) มาทำ Key-Value Lookup (O(1)) มีประสิทธิภาพสูงสุด ไม่สร้างภาระเรียก API ทีละชิ้น
- สอดคล้องกับธรรมนูญข้อ 5.1 (ห้ามจำลอง Mock Data และใช้ API จริงที่มีอยู่)

### Alternatives Considered
- *รวมฟิลด์ stock เข้ากับ Product API*: ถูกปฏิเสธเนื่องจาก Endpoint `/products` เป็น Master Catalog ข้อมูลสต็อกแยกตามคลังสาขาใน `/inventory/stocks` การแก้ไข Backend จะกระทบสถาปัตยกรรมเดิม
- *ดึงสต็อกเฉพาะตอนกดเลือกสินค้า*: ถูกปฏิเสธเพราะผู้ใช้งานต้องการมองเห็นสต็อกคงเหลือบนการ์ดสินค้าทันที เพื่อตัดสินใจก่อนเลือกขาย

---

## 2. การจำแนกประเภทสินค้าและการแสดงป้าย "ชั่งขาย" (Weight-based vs Unit-based Indicator)

### Decision
- ตรวจสอบจากฟิลด์ `product.productType` ในโมเดล `Product`:
  - หาก `productType === 'BY_WEIGHT'`: แสดงป้ายกำกับ **"ชั่งขาย"** (เช่น Badge สีส้ม/เหลืองเด่นชัด) แทนตัวเลขจำนวนชิ้น
  - หาก `productType === 'PRICE_PER_UNIT'`: แสดงจำนวนสต็อกคงเหลือ เช่น "คงเหลือ: {qty} {uomName}" และหาก `qty <= 0` แสดงป้ายเตือน "สินค้าหมด" (Out of Stock) สีแดง

### Rationale
- `productType` เป็น Enum มาตรฐานที่มีอยู่แล้วในระบบ (`PRICE_PER_UNIT` | `BY_WEIGHT`)
- ป้าย "ชั่งขาย" สื่อความหมายชัดเจน ตรงตามที่ผู้ใช้งานกำหนด และสอดคล้องกับมาตรฐาน Elderly-Friendly (ลดภาระการจดจำและลดความสับสน)

---

## 3. การแสดงรูปภาพขนาดเล็กในตะกร้าสินค้า (Cart Item Thumbnail)

### Decision
- ปรับปรุงคอมโพเนนต์ `PosCartItemRow.tsx` เพื่อแสดง Thumbnail ขนาด 44x44px หรือ 48x48px (Touch Target มาตรฐาน)
- ใช้รูปภาพจาก `item.imageUrl` พร้อม Fallback `<Icons.Package />` กรณีไม่มีรูปภาพหรือโหลดรูปไม่สำเร็จ (`onError`)
- วาง Thumbnail อยู่ทางด้านซ้ายของชื่อสินค้าและราคาต่อหน่วยในแถวบน

### Rationale
- `CartItem` ใน `src/types/pos.ts` มีฟิลด์ `imageUrl` อยู่แล้ว
- ขนาด 44x44px ถึง 48x48px ช่วยให้แคชเชียร์และผู้สูงอายุมองเห็นรูปสินค้าได้ชัดเจนโดยไม่เปลืองพื้นที่แนวตั้งของแถวรายการ

---

## 4. การเลื่อนมุมมองแสดงสินค้าล่าสุดในตะกร้าอัตโนมัติ (Cart Auto-Scroll to Latest Item)

### Decision
- ใน `PosCartContext.tsx`: เพิ่มสถานะ `lastActiveItemId: string | null` ซึ่งจะถูกอัปเดตเมื่อมีการเรียก `addItem` หรือ `updateQuantity`
- ใน `PosCartPanel.tsx`:
  - ใช้ `useRef` ผูกกับ Container ของรายการตะกร้า และใช้ Map ของ `itemRefs`
  - เมื่อ `lastActiveItemId` มีการเปลี่ยนแปลง ให้เรียก `itemRef.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`
  - เพิ่ม visual effect ไฮไลต์ชั่วคราว (เช่น CSS Ring / Highlight Flash 1.5 วินาที) ที่รายการสินค้าล่าสุดเพื่อความชัดเจนทางสายตา

### Rationale
- แก้ปัญหาที่แคชเชียร์ไม่เห็นสินค้าชิ้นล่าสุดเมื่อรายการในบิลมีจำนวนมากจนเกิด Scrollbar
- การใช้ `block: 'nearest'` ร่วมกับ `smooth` ทำให้การเลื่อนนุ่มนวลและไม่กระตุก แม้จะสแกนสินค้าต่อเนื่องอย่างรวดเร็ว
