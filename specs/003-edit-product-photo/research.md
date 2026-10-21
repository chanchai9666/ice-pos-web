# Research & Technical Decisions: การแก้ไขข้อมูลสินค้า (ถ่ายภาพโดยตรงและแสดงผลในหน้ารายการทันที)

**Feature**: `003-edit-product-photo`
**Date**: 2026-10-21
**Status**: Completed

## 1. การจับภาพจากกล้องของอุปกรณ์โดยตรง (Direct Camera Capture)

### Context & Problem
ผู้ใช้ต้องการถ่ายภาพสินค้าโดยตรงจากกล้อง (แท็บเล็ต POS, สมาร์ตโฟน, เว็บแคม) ภายในหน้าจอแก้ไขสินค้า เพื่อความสะดวกรวดเร็วโดยไม่ต้องออกจากแอปไปถ่ายแล้วค่อยค้นหาไฟล์มาอัปโหลด

### Decision
เลือกใช้ **WebRTC `navigator.mediaDevices.getUserMedia`** ร่วมกับ `<video>` viewfinder และ `<canvas>` ในการจับภาพนิ่ง (Snapshot) โดยสร้างเป็นโมดอลเฉพาะ `CameraCaptureModal`:
- รองรับทั้ง Desktop Webcam, Tablet และ Mobile Camera
- ตรวจสอบ `navigator.mediaDevices && navigator.mediaDevices.getUserMedia`
- รองรับการสลับกล้องหน้า/กล้องหลังผ่าน `facingMode: { ideal: 'environment' }` (กล้องหลังสำหรับถ่ายสินค้าเป็นค่าเริ่มต้น) และปุ่มสลับกล้อง
- บีบอัดและแปลงภาพจาก `<canvas>` เป็น `Blob` / `File` (image/jpeg หรือ image/webp) ก่อนส่งเข้าสู่ state ของฟอร์ม
- มีการคืนทรัพยากรกล้อง (Stop all media tracks) ทันทีที่ปิดหน้าต่างหรือจับภาพสำเร็จ เพื่อป้องกันไฟกล้องค้างและประหยัดแบตเตอรี่

### Alternatives Considered
1. **HTML5 `<input type="file" accept="image/*" capture="environment">`**:
   - *ข้อดี*: เขียนง่าย เบราว์เซอร์มือถือจะเปิดแอปกล้องของเครื่องให้
   - *ข้อเสีย*: บน Desktop หรือ Browser หลายตัวไม่เปิดกล้องสด แต่เปิดตัวเลือกไฟล์แทน และไม่สามารถแสดง Live Viewfinder ในหน้าเว็บแบบมืออาชีพได้
2. **Third-party Camera Library (เช่น react-webcam)**:
   - *ข้อดี*: มีฟังก์ชันสำเร็จรูป
   - *ข้อเสีย*: เพิ่ม External Dependency ไม่จำเป็น ขัดต่อธรรมนูญระบบ (Constitution ข้อ 3.2 และ 10 ที่ให้หลีกเลี่ยงการเพิ่ม Dependency หาก Vanilla/Native Web API ทำงานได้ดีและเบาอยู่แล้ว)

---

## 2. การแสดงผลรูปภาพทันทีในตารางรายการโดยไม่ต้องรีเฟรชหน้าเว็บ (Instant List Display without Reload)

### Context & Problem
เมื่อผู้ใช้กดบันทึกการแก้ไขสินค้าพร้อมรูปภาพใหม่ ตารางสินค้าในหน้าแคตตาล็อก (`catalog/page.tsx`) ต้องอัปเดตและแสดงรูปภาพใหม่ทันที โดยที่ผู้ใช้ไม่ต้องกด F5 หรือรีเฟรชหน้าเว็บ

### Decision
ปรับปรุงสถาปัตยกรรมและโฟลว์การบันทึกสินค้าใน `ProductFormModal.tsx` และ `catalog/page.tsx`:
1. **จัดลำดับการบันทึกและอัปโหลดภาพ**:
   - เมื่อมีการเลือก/ถ่ายภาพใหม่ ให้เรียก `catalogService.uploadProductImage(productId, imageFile)` และดึง `imageUrl` ล่าสุดที่ตอบกลับมาจาก API (หรือ Object URL ชั่วคราว / Updated Product) มาอัปเดตลงในข้อมูลสินค้า
   - ส่งผลลัพธ์สินค้าที่สมบูรณ์พร้อม `imageUrl` ล่าสุดกลับไปยัง `onSuccess(updatedProduct, false)`
2. **อัปเดต Local State ของหน้าเว็บแบบ Reactive**:
   - ใน `catalog/page.tsx`: ฟังก์ชัน `onSuccess` ทำการ `setProducts((prev) => prev.map((p) => p.id === savedProduct.id ? savedProduct : p))`
3. **จัดการ Cache-Busting สำหรับรูปภาพสินค้า**:
   - หาก URL รูปภาพของสินค้าบน Backend เป็น URL เดิม (เช่น `/uploads/products/{id}.webp`) เบราว์เซอร์มักจะแคชภาพเดิมไว้ ทำให้ตารางยังแสดงภาพเก่า
   - แก้ไขโดยการเติม Cache-Busting Query Parameter ใน Thumbnail Component เช่น `${product.imageUrl}?t=${Date.now()}` หรือเก็บ timestamp ของการอัปเดต เพื่อบังคับให้เบราว์เซอร์ดึงภาพล่าสุดมาแสดงทันที 100%

### Alternatives Considered
1. **เรียก `fetchProducts()` ใหม่ทั้งหมดหลังบันทึก**:
   - *ข้อดี*: ได้ข้อมูลตรงกับฐานข้อมูลล่าสุด
   - *ข้อเสีย*: มี Network Roundtrip ช้ากว่า, ถ้าเบราว์เซอร์แคชภาพเดิมไว้ก็ยังแสดงภาพเดิมอยู่ดี, และอาจทำให้ตารางกระตุก
   - *ทางเลือกที่ดีกว่า*: อัปเดต Local State ทันที พร้อม Cache-Busting Query Param ช่วยให้ภาพขึ้นทันที 0ms delay

---

## 3. การออกแบบ UI/UX สอดคล้องกับธรรมนูญระบบ (Elderly-Friendly & Touchscreen Standard)

### Context & Problem
ระบบ POS มีกลุ่มผู้ใช้งานหลากหลายรวมถึงผู้สูงอายุ (Constitution ข้อ 6.5 และ 14.5) ต้องมั่นใจว่าการกดถ่ายภาพและจัดการรูปภาพทำได้ง่าย ชัดเจน ไม่กดพลาด

### Decision
1. **ปุ่มชัตเตอร์ (Capture Button)**:
   - ออกแบบเป็นปุ่มวงกลมขนาดใหญ่ ($\ge 64\times 64$px) มีขอบเด่นชัด มีไอคอนกล้อง และแสดง Animation การกด (Active/Pressed state) ชัดเจน
2. **ปุ่มยืนยันและถ่ายใหม่ (Accept / Retake Buttons)**:
   - ขนาด Touch Target ความสูงอย่างน้อย 48px พร้อมระยะห่างเพียงพอ ($\ge 12$px)
   - ใช้สีที่สื่อความหมายชัดเจน (เขียว/ฟ้าสำหรับใช้ภาพ, ส้ม/เทาสำหรับถ่ายใหม่)
3. **การแสดงผลข้อผิดพลาด**:
   - หากไม่สามารถเปิดกล้องได้ ให้แสดงข้อความแจ้งเตือนภาษาไทยที่สุภาพ เข้าใจง่าย มีปุ่ม "เลือกไฟล์จากเครื่องแทน" รองรับ

---

## สรุปผลการวิจัย (Research Summary)

| หัวข้อ | การตัดสินใจ | ประโยชน์ที่ได้รับ |
| :--- | :--- | :--- |
| **Camera Viewfinder** | Native WebRTC `navigator.mediaDevices.getUserMedia` | ทำงานได้โดยตรง ไม่ต้องลง Library เพิ่ม, ควบคุมกล้องหน้า-หลังได้อิสระ |
| **Instant Display** | Reactive Local State + Cache-Busting Timestamp | แสดงภาพใหม่ทันที 0ms ในตารางรายการสินค้า ไม่ติดแคชเบราว์เซอร์ |
| **Touch Controls** | Shutter $\ge 64$px, Buttons $\ge 48$px, High Contrast | ใช้งานง่ายบนจอสัมผัส POS สอดคล้องกับธรรมนูญระบบทุกประการ |
