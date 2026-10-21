# Research & Architecture Decisions: ระบบเมนูหลักและการจัดการสินค้าและหมวดหมู่ (Product Catalog)

**Feature**: `002-product-catalog`  
**Date**: 2026-10-21  

---

## 1. โครงสร้าง App Shell และระบบเมนูหลัก (Navigation Shell & Responsive Layout)

### Decision
สร้าง Route Group `(dashboard)` หรือ `(main)` ใน Next.js App Router พร้อม `layout.tsx` ที่ทำหน้าที่เป็น App Shell:
- มี `Sidebar` ด้านข้างแบบพับเก็บได้ (Collapsible Sidebar)
- มี `Header` แสดงชื่อระบบ, ข้อมูลผู้ใช้งานที่ล็อกอิน (ชื่อ, บทบาท `ADMIN`/`MANAGER`/`CASHIER`), สาขาปัจจุบัน (`branch`), และปุ่มออกจากระบบ (Logout)
- รองรับ Responsive: บนหน้าจอ Desktop แสดง Sidebar ขยายเต็ม (หรือยุบเหลือไอคอนได้), บนหน้าจอ Mobile/Tablet แสดงเป็น Overlay Drawer ที่มีปุ่ม Hamburger Toggle
- ในหน้าขาย POS (`/pos`) มีปุ่ม Toggle เพื่อพับเก็บ Sidebar ให้เหลือพื้นที่ปุ่มกดขายสินค้าสูงสุด

### Rationale
- สอดคล้องกับผลการ Clarification (Q1: Option A) เพื่อให้หน้าจอขายหน้าร้านมีพื้นที่สัมผัสสูงสุด และหน้าจอหลังร้านมีความสะดวกในการสลับเมนู
- ใช้ Next.js App Router Layout ทำให้สถานะเมนูและ Header ไม่ถูก re-mount เมื่อสลับหน้าจอ (Zero Layout Shift)

### Alternatives Considered
- *Top Navigation Bar*: พื้นที่ไม่เพียงพอสำหรับเมนูระบบ POS ที่มีหลายโมดูล และทำให้เสียพื้นที่แนวตั้งของหน้าจอขาย
- *แยก Layout อิสระทุกหน้า*: เกิดโค้ดซ้ำซ้อนและสูญเสียสถานะ UI ระหว่างนำทาง

---

## 2. การควบคุมสิทธิ์ตามบทบาทผู้ใช้ (Role-based Navigation & Route Protection)

### Decision
- **Sidebar Level**: ฟิลเตอร์รายการเมนูตาม `user.role` (ดึงจาก `AuthContext`) โดยหากเป็น `CASHIER` จะซ่อนเมนู "จัดการสินค้าและหมวดหมู่"
- **Route Guard Level**: สร้าง Client Component / Wrapper Guard ตรวจสอบว่าหากผู้ใช้มีบทบาท `CASHIER` แล้วพยายามเข้าหน้า `/catalog` หรือ `/products` ระบบจะ Redirect นำทางกลับไปยังหน้า `/pos` อัตโนมัติ พร้อมแสดงข้อความเตือน

### Rationale
- สอดคล้องกับผลการ Clarification (Q2: Option A) และหลักการความปลอดภัยในธรรมนูญโครงการ (Security & Privacy ข้อ 7: "การซ่อนปุ่มไม่ถือเป็นการควบคุมสิทธิ์ที่เพียงพอ ต้องมี Route Protection กำกับ")

---

## 3. รูปแบบหน้าจอแคตตาล็อกสินค้าและหมวดหมู่ (Tabbed Catalog Layout)

### Decision
สร้างหน้า `/catalog` (หรือ `/products`) ที่มีแท็บสลับ (Tabs Component):
1. **แท็บ "รายการสินค้า" (Products Tab)**:
   - ตารางแสดงสินค้า (รูปภาพ, ชื่อ, SKU, Barcode, หมวดหมู่, หน่วยนับ, ราคาขาย THB, ต้นทุน THB, สต็อกขั้นต่ำ, สถานะ Active/Inactive, ปุ่ม Actions)
   - แถบเครื่องมือ: ค้นหา (Search Input พร้อม Debounce 300ms), กรองหมวดหมู่ (Category Dropdown), กรองสถานะ (Active/Inactive), ปุ่มสร้างสินค้าใหม่ (+ เพิ่มสินค้า)
   - Pagination Bar (เลือกจำนวนต่อหน้า 10, 20, 50 รายการ)
2. **แท็บ "หมวดหมู่สินค้า" (Categories Tab)**:
   - แสดงตารางหรือลำดับชั้นหมวดหมู่สินค้า (ชื่อหมวดหมู่, หมวดหมู่หลัก, ลำดับแสดงผล, สถานะ, จำนวนสินค้า, ปุ่มแก้ไข/ลบ)
   - ปุ่มสร้างหมวดหมู่ใหม่ (+ เพิ่มหมวดหมู่)

### Rationale
- สอดคล้องกับผลการ Clarification (Q3: Option A) ทำให้ผู้จัดการสามารถจัดการทั้งสินค้าและหมวดหมู่ได้อย่างรวดเร็วในที่เดียว ไม่ต้องโหลดหน้าเว็บสลับไปมา

---

## 4. รูปแบบแบบฟอร์มเพิ่ม/แก้ไขข้อมูล (Slide-over Drawer / Modal Dialog)

### Decision
- สำหรับสินค้า: ใช้ **Slide-over Drawer** (แถบเลื่อนด้านข้างขวาความกว้าง 560px-640px)
  - เนื่องจากฟอร์มสินค้ามีหลายฟิลด์ (ข้อมูลพื้นฐาน, ราคา, หน่วยนับ, ภาษี, รูปภาพ, สต็อก) การใช้ Slide-over Drawer ช่วยให้เลื่อนดูฟอร์มได้สะดวกโดยยังเห็นบริบทตารางสินค้าอยู่เบื้องหลัง
- สำหรับหมวดหมู่: ใช้ **Modal Dialog** ขนาดกะทัดรัด
  - หมวดหมู่มีฟิลด์น้อย (ชื่อ, รายละเอียด, หมวดหมู่หลัก, ลำดับแสดงผล) จึงเหมาะกับ Modal Dialog กึ่งกลางหน้าจอ

### Rationale
- สอดคล้องกับผลการ Clarification (Q4: Option A) เพิ่มความคล่องตัวในการทำงานให้ผู้ใช้

---

## 5. การจัดการหน่วยเงิน (Satang ↔ Baht Conversion Pattern)

### Decision
- ระบบ API หลังบ้านจัดเก็บหน่วยเงินเป็น **Satang (จำนวนเต็ม Integer)** (เช่น 45.00 บาท = 4500 สตางค์)
- ฝั่งหน้าบ้านจะสร้าง Utility Helpers:
  - `formatSatangToBaht(satang: number): string` → แปลง 4500 เป็น `"45.00"` สำหรับแสดงผล
  - `bahtToSatang(baht: number | string): number` → แปลงค่าที่กรอกในฟอร์มเป็น satang จำนวนเต็มส่งให้ API ป้องกันปัญหา Floating point precision

### Rationale
- สอดคล้องกับธรรมนูญโครงการ (ข้อ 5.3 Data Integrity: "ความถูกต้องของการคำนวณเงิน") และ Swagger Schema ของระบบ

---

## 6. การจัดการรูปภาพสินค้า (Image Upload & WebP)

### Decision
- ใช้ Endpoint `POST /api/v1/products/{id}/image` (Multipart Form Data `file`) เมื่อแก้ไขสินค้าที่มี ID อยู่แล้ว หรือ `POST /api/v1/uploads/images` เพื่ออัปโหลดไฟล์ภาพและรับ Image URL มาใส่ใน `CreateProductRequest`
- รองรับไฟล์ประเภท JPG, PNG, WebP ขนาดไม่เกิน 5MB
- แสดงตัวอย่างรูปภาพ (Image Preview) ทันทีบนเบราว์เซอร์ด้วย `URL.createObjectURL` ก่อนอัปโหลดสำเร็จ
- แสดง Fallback Icon/Placeholder อย่างสวยงามกรณีสินค้าไม่มีรูปภาพ

---

## 7. พฤติกรรมการลบสินค้าอย่างปลอดภัย (Safe Deletion Policy)

### Decision
- เมื่อคลิกปุ่ม "ลบ" จะมี Confirmation Dialog แสดงขึ้นมา
- หาก API ส่งกลับข้อผิดพลาดว่าสินค้ามีประวัติการขายหรือสต็อกผูกอยู่ (Foreign Key / In-Use Error) ระบบจะดักจับและแสดงคำแนะนำภาษาไทยให้ผู้ใช้เปลี่ยนเป็นการสลับสวิตช์ "ปิดการใช้งาน" (Deactivate) แทน
- สอดคล้องกับผลการ Clarification (Q5: Option A)

---

## 8. การออกแบบสำหรับผู้สูงอายุและจอสัมผัส (Elderly-Friendly & Touchscreen Design)

### Decision
1. **ขนาดพื้นที่สัมผัส (Touch Targets)**:
   - ปุ่มกด, แท็บสลับ, อินพุต และปุ่มการกระทำในตาราง มีขนาดสัมผัสไม่ต่ำกว่า 48x48px (`min-h-[48px]`, `min-w-[48px]`, `p-3`) พร้อมระยะห่าง (gap >= 12px) ป้องกันการกดพลาด
2. **ความชัดเจนของตัวอักษรและสี (Typography & Contrast)**:
   - ข้อความทั่วไปใช้ขนาดไม่ต่ำกว่า 16px (`text-base` / `1rem`), ตัวเลขราคาและหัวข้อสำคัญใช้ขนาดใหญ่และหนาเด่นชัด (`text-xl font-bold` หรือ `text-2xl`)
   - อัตราส่วนความคมชัดผ่านเกณฑ์ WCAG 2.1 AA (ไม่ต่ำกว่า 4.5:1) ห้ามใช้สีเทาจาง (ใช้ Slate-800/900 บนพื้นสว่าง)
3. **แป้นตัวเลขสัมผัสเสมือน (Virtual Numeric Keypad)**:
   - สร้างคอมโพเนนต์ `src/components/ui/VirtualNumericKeypad.tsx` มีปุ่มกดขนาดใหญ่ 60x60px พร้อมปุ่มล้างค่า (Clear) และปุ่มลบ (Backspace) ขนาดใหญ่ ให้ผู้ใช้งานสัมผัสป้อนราคาขายและต้นทุนได้สะดวกบนจอสัมผัส POS โดยไม่ต้องพึ่งพาคีย์บอร์ดภายนอก
4. **การตอบสนองและการป้องกันข้อผิดพลาด (Feedback & Error Prevention)**:
   - เพิ่ม Visual Feedback ทันทีเมื่อสัมผัส (Active State) และใส่กลไก Debounce ป้องกัน Double-tap / Rapid touch
   - กล่องยืนยันความปลอดภัย (Confirmation Dialog) มีขนาดใหญ่ แยกสีปุ่มยืนยันและยกเลิกชัดเจน และใช้ภาษาไทยเข้าใจง่าย ปราศจากศัพท์เทคนิค

### Rationale
- สอดคล้องกับธรรมนูญโครงการ v1.4.0 หมวด 6.5 อย่างเคร่งครัด เพื่อรองรับพนักงานผู้สูงอายุและหน้าจอสัมผัส POS ได้อย่างมีประสิทธิภาพสูงสุด

