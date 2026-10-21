# Research: ระบบเข้าสู่ระบบสำหรับผู้ใช้งานและแคชเชียร์ (User & Cashier Authentication)

**Feature**: `001-user-login`
**Date**: 2026-10-21
**Status**: Completed

## 1. การเชื่อมต่อ API การยืนยันตัวตนและการจัดเก็บ Token (Authentication & Token Storage)

### ข้อสรุปและการตัดสินใจ (Decision)
- ใช้ Custom API Client (`fetch` wrapper) ที่รองรับ Base URL `/api/v1`, จัดการแนบ `Authorization: Bearer <token>` อัตโนมัติ, และแปลง Response Envelope `{ code, message, data, details }` ตามมาตรฐานของ ICE POS API
- จัดเก็บ Access Token, Refresh Token, ข้อมูลโปรไฟล์ผู้ใช้ และข้อมูลสาขาที่เลือก ใน `localStorage` (เพื่อให้รองรับการทำงานของหน้า POS ในการบันทึกข้อมูลออฟไลน์และการคงสถานะการทำงานหน้าร้าน) พร้อมฟังก์ชันล้างข้อมูลเมื่อ Logout หรือ Session หมดอายุ

### เหตุผล (Rationale)
- ตามข้อกำหนดใน Constitution ข้อ 14.4 และ `docs/api-summary.md` ระบบ ICE POS Backend มี Endpoint มาตรฐาน:
  - `POST /api/v1/auth/login` (Username & Password)
  - `POST /api/v1/auth/pin-login` (Quick PIN & Branch ID)
  - `GET /api/v1/auth/me` (ตรวจสอบ Profile และสิทธิ์)
  - `GET /api/v1/branches` (ดึงรายชื่อสาขา)
- การใช้ `fetch` มาตรฐานของ Next.js/Browser ไม่ต้องเพิ่ม Dependency ภายนอก (เช่น Axios) ตรงตามหลักความเรียบง่าย (Simplicity & Appropriateness - Constitution ข้อ 3.2)
- ระบบ POS หน้าร้านจำเป็นต้องเก็บ Token และสถานะสาขาไว้บนอุปกรณ์ เพื่อรองรับการเปิดกะ (Open Shift) และการขายแบบต่อเนื่อง

### ทางเลือกอื่นที่พิจารณา (Alternatives Considered)
- **HttpOnly Cookies**: ปลอดภัยสูงต่อ XSS แต่เนื่องจาก ICE POS Backend ออกแบบมาเป็น REST API ที่ส่ง JWT ใน JSON body และรับผ่าน `Authorization: Bearer <token>` ใน Header โดยตรง การใช้ Local Storage / In-memory Context จึงสอดคล้องกับ API Contract มากที่สุดโดยไม่ต้องสร้าง Proxy Middleware เพิ่มเติม

---

## 2. การออกแบบแผงแป้นตัวเลขเสมือน (Virtual Numpad for Touchscreen POS)

### ข้อสรุปและการตัดสินใจ (Decision)
- พัฒนา Component แผงแป้นตัวเลข `VirtualNumpad` ด้วย Tailwind CSS v4 สำหรับโหมด PIN:
  - ปุ่มตัวเลข 0-9 ขนาดใหญ่ (Touch Target อย่างน้อย 64x64px) เหมาะกับหน้าจอสัมผัส
  - ปุ่ม Backspace (ลบทีละหลัก) และปุ่ม Clear (ล้างทั้งหมด)
  - เชื่อมต่อ Event Listener สำหรับคีย์บอร์ดจริง (`keydown` ดักจับตัวเลข `0-9`, `Backspace`, `Enter`, `Escape`) ให้ทำงานร่วมกันได้อย่างไร้รอยต่อ

### เหตุผล (Rationale)
- หน้าร้าน POS ใช้งานผ่านหน้าจอสัมผัส (Touchscreen Terminal) หรือแท็บเล็ตเป็นหลัก การมี Virtual Numpad ช่วยให้แคชเชียร์กดรหัส PIN 4-8 หลักได้ด้วยมือเดียวอย่างคล่องตัวและรวดเร็ว (บรรลุ Success Criteria SC-001 < 5 วินาที)
- การรองรับคีย์บอร์ดจริงช่วยให้เครื่องคอมพิวเตอร์ทั่วไปที่มี Numpad หรือคีย์บอร์ดทำงานได้ทันทีโดยไม่ต้องใช้เมาส์คลิก

### ทางเลือกอื่นที่พิจารณา (Alternatives Considered)
- **ใช้ HTML Native `<input type="number">` หรือ `<input type="password">` โดยไม่มี Numpad**: บนหน้าจอสัมผัสแบบ Windows/Linux POS Virtual Keyboard ของ OS มักเด้งขึ้นมาบดบังหน้าจอและใช้งานช้ากว่า Numpad ในตัวแอป

---

## 3. การเลือกและจดจำสาขา (Branch Selection & Device Preference)

### ข้อสรุปและการตัดสินใจ (Decision)
- ดึงข้อมูลสาขาจาก `GET /api/v1/branches` เมื่อโหลดหน้าจอเข้าสู่ระบบ
- บันทึก `ice_pos_last_branch_id` และ `ice_pos_last_login_mode` ลงใน `localStorage`
- เมื่อเปิดหน้าจอขึ้นมา:
  - หากมีสาขาที่เคยเลือกไว้ ให้ตั้งเป็นค่าเริ่มต้นอัตโนมัติ
  - หากระบบมีสาขาเดียวในระบบ ให้เลือกสาขานั้นเป็นค่าเริ่มต้นทันที
  - แสดงผลโหมด PIN เป็นค่าเริ่มต้นในครั้งแรกสุด และเปลี่ยนเป็นโหมดที่จดจำไว้หากเคยเข้าใช้งานมาก่อน

### เหตุผล (Rationale)
- ลดขั้นตอนในการทำงานของแคชเชียร์ในแต่ละวัน ไม่ต้องเลือกสาขาซ้ำทุกครั้งที่เปิดเครื่องหรือสลับกะ
- ตรงตามผลการ Clarification (Session 2026-10-21)

---

## 4. กลไกการระงับการลองชั่วคราว (Rate Limiting Cooldown)

### ข้อสรุปและการตัดสินใจ (Decision)
- จัดการ State การนับจำนวนครั้งที่ป้อนผิด (`failedAttempts`) และเวลาสิ้นสุดการระงับ (`lockoutUntil`)
- เมื่อป้อนผิดครบ 5 ครั้ง:
  - ตั้งเวลา `lockoutUntil = Date.now() + 60_000` (60 วินาที)
  - บันทึกลง `sessionStorage` เพื่อป้องกันการรีเฟรชหน้าจอเพื่อล้างเวลารอ
  - แสดงหน้าจอนับถอยหลัง (Countdown) เป็นวินาที และปิดการกดปุ่มส่งข้อมูลชั่วคราว
  - เมื่อครบ 60 วินาที ให้รีเซ็ตสถานะและอนุญาตให้ป้อนข้อมูลใหม่ได้

### เหตุผล (Rationale)
- ป้องกันการสุ่มรหัสผ่านหรือ PIN ที่หน้าจอ และตรงตามข้อตกลงที่ได้รับจากการ Clarification ใน FR-012
