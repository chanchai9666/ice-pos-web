# Research: กลไกการจัดการ Global API Action Loading Overlay

**Feature**: `010-api-action-overlay` | **Date**: 2026-10-25

## 1. การเชื่อมต่อระหว่าง API Client กับ React State (API Client & Context Integration)

### คำถามทางเทคนิค
เนื่องจาก `api.ts` ทำงานในระดับ Utility / Service ที่อยู่นอก React Component Tree การสื่อสารสถานะการโหลดไปยัง React UI Component ควรใช้รูปแบบสถาปัตยกรรมใดจึงจะมีความเสถียร ไม่เกิด Memory Leak และไม่ขึ้นกับการ Render ของ Component ใด Component หนึ่ง?

### การตัดสินใจ (Decision)
เลือกใช้ **Event Coordinator Pattern (Pub/Sub Listener)**:
- สร้าง `overlay-coordinator.ts` ซึ่งทำหน้าที่เป็น Event Bus / State Coordinator คอยเก็บสถานะจำนวนคำขอที่กำลังดำเนินการอยู่ (`activeRequestsCount`) และข้อความปัจจุบัน (`currentMessage`)
- ใน `src/services/api.ts`: ก่อนที่ฟังก์ชัน `request()` จะส่ง HTTP Request จะเรียก `startOverlayRequest(options)` และเมื่อคำขอเสร็จสิ้น (ในบล็อก `finally`) จะเรียก `endOverlayRequest()`
- ใน `src/context/LoadingOverlayContext.tsx`: React Provider จะทำหน้าที่ Subscribe รับฟังการเปลี่ยนแปลงสถานะจาก Coordinator ผ่าน `subscribeOverlayState()` แล้วนำมาอัปเดต React State เพื่อควบคุมการ Render ของ `<LoadingOverlay />`

### ทางเลือกอื่นที่พิจารณา (Alternatives Considered)
- *Axios Interceptors*: ไม่อยู่ในแผนเนื่องจากโปรเจกต์ใช้ native `fetch` ตามมาตรฐาน Next.js เพื่อความเบาและลด Dependency โดยไม่จำเป็น
- *Global State Library (Zustand / Redux)*: มีความซับซ้อนเกินความจำเป็นสำหรับระบบแสดง Overlay หน้าจอเดียว อีกทั้งธรรมนูญกำหนดให้เน้นความเรียบง่าย (Simplicity & Appropriateness)

---

## 2. การจัดการคำขอที่ทำงานพร้อมกัน (Concurrent Requests & Reference Counting)

### คำถามทางเทคนิค
หากผู้ใช้เปิดหน้าจอที่มีการเรียก API พร้อมกัน 2-3 คำขอ (เช่น โหลดหมวดหมู่ + โหลดข้อมูลสินค้า + โหลดข้อมูลสาขา) Overlay ควรจัดการอย่างไรเพื่อไม่ให้ปิดตัวลงก่อนที่คำขอสุดท้ายจะเสร็จสิ้น?

### การตัดสินใจ (Decision)
เลือกใช้ **Reference Counting (ตัวนับคำขอที่กำลังทำงาน)**:
- เมื่อเริ่มคำขอ (ที่ไม่ได้ตั้ง `silent: true`): เพิ่ม `activeRequestsCount` ขึ้น 1
- เมื่อคำขอเสร็จสิ้น (สำเร็จ, ล้มเหลว, หรือ Timeout): ลด `activeRequestsCount` ลง 1
- Overlay จะแสดงผลตราบเท่าที่ `activeRequestsCount > 0` และจะปิดตัวลงทันทีเมื่อ `activeRequestsCount === 0`
- การเลือกข้อความที่แสดง: หากมีข้อความใหม่ระบุเข้ามา เช่น "กำลังชำระเงิน..." จะให้ความสำคัญกับข้อความที่มีลำดับความสำคัญสูงกว่าหรือข้อความล่าสุดตามลำดับ

### ทางเลือกอื่นที่พิจารณา (Alternatives Considered)
- *Boolean State (isLoading)*: มีข้อผิดพลาดร้ายแรงเมื่อคำขอแรกเสร็จจะทำให้ Overlay ปิดตัวลงทันที ทั้งๆ ที่คำขอที่สองยังไม่เสร็จ (Race Condition) จึงตัดออก

---

## 3. กลไกการตัดการทำงานฉุกเฉิน (Timeout & Emergency Auto-Dismiss)

### คำถามทางเทคนิค
หาก API ค้าง (Hang) หรือสัญญาณอินเทอร์เน็ตหลุดจนคำขอไม่ตอบกลับ จะป้องกันไม่ให้หน้าจอ POS ค้างถาวรได้อย่างไร?

### การตัดสินใจ (Decision)
เลือกใช้ **AbortController ร่วมกับ Dual Timeout Thresholds**:
- กำหนดระยะเวลา Timeout ตามข้อสรุปจากการชี้แจงความต้องการ (Clarification):
  - **คำขอทั่วไป (General Requests)**: 15 วินาที (15,000ms)
  - **ธุรกรรมการชำระเงิน/ออกบิล (Payment & Checkout)**: 30 วินาที (30,000ms)
- หากคำขอเกินระยะเวลาดังกล่าว:
  - สั่ง `controller.abort()` และลด `activeRequestsCount` ใน Coordinator
  - Overlay จะปลดล็อกทันที
  - ส่งผ่านข้อผิดพลาด `ApiError` ที่ระบุข้อความภาษาไทย "การเชื่อมต่อขัดข้องหรือหมดเวลา กรุณาลองใหม่อีกครั้ง"
  - แจ้งเตือนข้อผิดพลาดผ่าน Notification Modal เพื่อให้แคชเชียร์ตรวจสอบและกดลองใหม่ได้

---

## 4. การจัดการคำขอประมวลผลเบื้องหลังแบบเงียบ (Silent Background Tasks Exemption)

### คำถามทางเทคนิค
จะแยกแยะคำขอที่ต้องแสดง Overlay กับคำขอแบบเงียบ เช่น การต่ออายุโทเค็นอัตโนมัติ (Silent Token Refresh) ได้อย่างไรตามธรรมนูญ v1.5.1?

### การตัดสินใจ (Decision)
เพิ่มคุณสมบัติ `silent?: boolean` ใน `RequestOptions`:
- เมื่อฟังก์ชัน `performTokenRefresh()` ใน `src/services/api.ts` ส่งคำขอ `/api/v1/auth/refresh` จะส่ง `{ silent: true }` ไปด้วยเสมอ
- ใน `request()`: หากพบว่า `options.silent === true` จะข้ามกระบวนการเรียก `startOverlayRequest()` และ `endOverlayRequest()` โดยสิ้นเชิง ทำให้ระบบเครือข่ายทำงานเบื้องหลังได้อย่างเงียบสนิท ไม่มีการกวน UI ของหน้าจอขาย

---

## 5. การออกแบบ UI ตามเกณฑ์ Elderly-Friendly & Touchscreen

### การตัดสินใจ (Decision)
- **Backdrop**: ใช้พื้นหลังสีมืดทึบแสง 80% พร้อม Blur เล็กน้อย (`bg-slate-950/80 backdrop-blur-sm z-[9999] fixed inset-0 flex flex-col items-center justify-center pointer-events-auto select-none`) บล็อกการคลิกและการสัมผัสอย่างเด็ดขาด
- **Spinner**: ใช้ไอคอนหมุนวนขนาดใหญ่ 56x56px พร้อมสีคู่ตรงข้ามที่เด่นชัด (High Contrast Cyan `#22d3ee` / Emerald `#34d399`)
- **Typography**: ตัวอักษรขนาด 18px (text-lg) น้ำหนักตัวอักษร Bold สีขาวสว่าง `#f8fafc` มี Contrast Ratio เกิน 7:1 (สูงกว่าเกณฑ์ WCAG 2.1 AA ที่กำหนด 4.5:1)
- **Card Container**: จัดข้อความและ Spinner ให้อยู่ในกรอบการ์ดโค้งมนที่มีขอบชัดเจน (`bg-slate-900/90 border border-slate-700/80 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center`)
