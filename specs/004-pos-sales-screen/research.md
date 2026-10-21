# Research & Technical Decisions: ระบบจุดขายสินค้าหน้าร้าน (POS Sales Screen & Barcode Scanning)

**Feature Branch**: `004-pos-sales-screen`  
**Date**: 2026-10-21  

---

## 1. การดักจับบาร์โค้ดจากเครื่องสแกนฮาร์ดแวร์ (Hardware Barcode Scanner Integration)

### Decision
ใช้ **Global Window Keydown Listener** ร่วมกับ **Keystroke Buffer & Timing Threshold** และ **Thai-to-English Keyboard Mapping Fallback**

### Rationale
- เครื่องสแกนบาร์โค้ดแบบ USB/Bluetooth Handheld ส่วนใหญ่ทำงานในโหมด Keyboard Wedge (HID) โดยจะส่งคีย์บอร์ดเข้ามาด้วยความเร็วสูงมาก (ช่วงเวลาระหว่างคีย์ < 30ms - 50ms) และปิดท้ายด้วยปุ่ม `Enter`
- หากแคชเชียร์ไม่ได้คลิกโฟกัสที่ช่อง Input ใดๆ ระบบต้องยังสามารถจับสัญญาณบาร์โค้ดและเพิ่มสินค้าลงในบิลได้อัตโนมัติ
- ในกรณีที่คีย์บอร์ดของเครื่องถูกเปลี่ยนเป็นภาษาไทย (เช่น สแกน 885 แต่ได้เป็น ๘๘๕ หรือตัวอักษรไทยเช่น `ฟหกด`) ตัวแปลงจะแปลงผังแป้นพิมพ์เกษมณีกลับมาเป็นตัวเลขอารบิก/ละตินดั้งเดิม ทำให้การยิงบาร์โค้ดไม่ผิดพลาด 100%

### Alternatives Considered
- *บังคับให้คลิกช่องค้นหาก่อนสแกน*: ทำให้แคชเชียร์ทำงานช้าลงมากและไม่สะดวกบนเครื่อง POS หน้าร้าน
- *ใช้ WebHID API โดยตรง*: WebHID ต้องขอ Permission พิเศษและไม่รองรับอุปกรณ์สแกนเนอร์ทั่วไปที่ทำงานเป็น Generic HID Keyboard

---

## 2. การสแกนบาร์โค้ดด้วยกล้องอุปกรณ์ (Camera Barcode Scanning)

### Decision
ใช้ **HTML5 MediaDevices (`navigator.mediaDevices.getUserMedia`)** ร่วมกับ **`BarcodeDetector` Web API** (รองรับ EAN-13, EAN-8, CODE-128, CODE-39, QR_CODE) พร้อม fallback การวาด Canvas ตรวจจับแบบเรียลไทม์ และโหมดสแกนต่อเนื่อง (Continuous Scan)

### Rationale
- `BarcodeDetector` เป็นมาตรฐานเว็บสมัยใหม่ที่รวดเร็ว ใช้ฮาร์ดแวร์เร่งการตรวจจับภาพ (Hardware Acceleration) ทำให้ได้ 30-60 FPS โดยกินพลังงานต่ำ
- จัดทำเป็น Center Modal Dialog ขนาดใหญ่ พร้อม Viewfinder Reticle, ปุ่มสลับกล้องหน้า/หลัง, ปุ่มเปิดไฟฉาย (Torch) หากเบราว์เซอร์รองรับ และปุ่มเสร็จสิ้นขนาดใหญ่ (>= 48px)
- มีระบบ Debounce ป้องกันการสแกนรหัสซ้ำเดิมภายใน 1.5 วินาทีขณะที่กล้องยังเปิดอยู่

### Alternatives Considered
- *ติดตั้ง Library ภายนอกขนาดใหญ่*: จะเพิ่ม Bundle Size และอาจเกิดปัญหาความเข้ากันได้กับ Next.js 16 / React 19 Turbopack การใช้มาตรฐาน Browser API ทำให้เบา รวดเร็ว และทำงานได้ทันที

---

## 3. ระบบเสียงตอบรับ (Audio Feedback Synthesis)

### Decision
ใช้ **Web Audio API (`AudioContext`)** สร้างโทนเสียงสังเคราะห์ (Pure Tone Beep / Buzzer) ในเบราว์เซอร์โดยตรง ไม่ต้องโหลดไฟล์ MP3 ภายนอก

### Rationale
- **เสียงดำเนินการสำเร็จ (Success Beep)**: คลื่นเสียง Sine Wave ความถี่ 880Hz (โน้ต A5) ความยาว 120ms ให้เสียงสดใสชัดเจนเหมือนเครื่อง POS มาตรฐาน
- **เสียงดำเนินการไม่สำเร็จ (Error Buzzer)**: คลื่นเสียง Sawtooth/Square Wave ความถี่ 200Hz-150Hz ความยาว 300ms ให้เสียงทุ้มเตือนชัดเจน แตกต่างจากเสียงสำเร็จอย่างสิ้นเชิง
- ทำงานได้แบบ Zero-Latency, Zero-Network, 100% Offline และไม่ต้องกังวลเรื่องไฟล์เสียง 404

### Alternatives Considered
- *ใช้แท็ก `<audio src="/sounds/beep.mp3">`*: เสี่ยงโหลดไฟล์ช้า มีหน่วงเวลาในการเล่น และเกิดปัญหา CORS หรือ 404

---

## 4. สถาปัตยกรรมการจัดการข้อมูลตะกร้าสินค้า (POS Cart & State Management)

### Decision
ใช้ **POS Cart React Context / Hook (`PosCartContext`)** ควบคุมสถานะในระดับหน้าจอ POS พร้อมคำนวณราคายอดรวม (Subtotal, VAT, Grand Total) แบบเรียลไทม์ และเก็บสำรองใน LocalStorage ป้องกันข้อมูลบิลหายหากเผลอรีเฟรชหน้าจอ

### Rationale
- แยกส่วนระหว่างการเลือกสินค้า/สแกน (Input) กับการคำนวณบิล (Calculation Engine)
- ล็อกราคาต่อหน่วยตามข้อมูลสินค้าที่ได้รับจาก API เพื่อความปลอดภัยและป้องกันการโกงราคา
- รองรับทั้งสินค้าขายเป็นชิ้น (จำนวนเต็ม) และสินค้าชั่งน้ำหนัก (ทศนิยม)

---

## 5. การออกแบบ UI/UX สอดคล้องตามธรรมนูญการออกแบบผู้สูงอายุและจอสัมผัส (Elderly-Friendly)

### Decision
- เลย์เอาต์ 2 คอลัมน์ (ซ้าย 60-65% แคตตาล็อกสินค้า, ขวา 35-40% ตะกร้าและคิดเงิน)
- ขนาดการ์ดสินค้าอย่างน้อย 160x160px ตัวหนังสือชื่อสินค้า 16-18px และราคาตัวเลขขนาดใหญ่ 20-24px หนาชัดเจน
- ปุ่มบวก/ลบในตะกร้าขนาด 48x48px
- รองรับแป้นพิมพ์ตัวเลขสัมผัส (Virtual Numeric Keypad) เมื่อแตะที่ช่องจำนวน
- ปุ่มล้างตะกร้ามี Modal Dialog ยืนยันขนาดใหญ่ ป้องกันการแตะพลาด

---

## 6. การตรวจสอบสถานะกะขาย (Shift Prerequisite Gate)

### Decision
- เรียก `GET /api/v1/shifts/active?branchId={branchId}` เมื่อเปิดหน้า POS
- หากไม่มี Active Shift: แสดงแบนเนอร์สีส้มชัดเจนที่ด้านบน อนุญาตให้สแกน/เลือกสินค้าได้ แต่เมื่อกดปุ่ม "ดำเนินการชำระเงิน" (Checkout) จะเปิด Modal บังคับให้เปิดกะและบันทึกเงินทอนเริ่มต้นก่อน
