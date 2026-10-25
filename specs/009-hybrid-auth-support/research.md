# Research: การปรับปรุงระบบพิสูจน์ตัวตนแบบผสมผสาน (Hybrid Authentication Support)

**Branch**: `009-hybrid-auth-support`  
**Feature**: `specs/009-hybrid-auth-support/spec.md`  

## Technical Decisions

### Decision 1: การเปิดใช้งาน `credentials: 'include'` ในทุกคำขอของระบบ (Global Credentials Transport)

- **Decision**: กำหนดให้ `fetch` ใน `src/services/api.ts` และการเรียก HTTP ทุกจุดส่งออปชัน `credentials: 'include'` เป็นค่าเริ่มต้น
- **Rationale**:
  - เมื่อระบบเปลี่ยนมาใช้งานคุกกี้นิรภัย (HttpOnly Cookie) เบราว์เซอร์จะไม่ส่งคุกกี้ไปด้วยหากไม่มีการกำหนด `credentials: 'include'` โดยเฉพาะอย่างยิ่งในการเชื่อมต่อข้าม Origin (เช่น หน้าร้านรันบน `http://localhost:3000` และ API รันบน `http://127.0.0.1:8080`)
  - การกำหนดเป็นค่าเริ่มต้นในระดับ API Client ส่วนกลางทำให้ทุก Service (Auth, Sales, Catalog, Inventory ฯลฯ) ส่งและรับคุกกี้อย่างอัตโนมัติ โดยไม่ต้องแก้ไข Service ย่อยทีละตัว
- **Alternatives Considered**:
  - *กำหนด `credentials: 'same-origin'`*: จะใช้งานไม่ได้ในสภาพแวดล้อม Development หรือ Production ที่แยกโดเมน/พอร์ตระหว่าง Frontend และ Backend
  - *ติดตั้งไลบรารี Axios*: สิ้นเปลืองและขัดต่อหลักการ Simplicity ในรัฐธรรมนูญ เนื่องจาก Next.js มี native `fetch` ที่รองรับ `credentials` ได้อย่างสมบูรณ์อยู่แล้ว

---

### Decision 2: กลยุทธ์การยืนยันตัวตนแบบผสมผสาน (Hybrid Dual-Credential Strategy)

- **Decision**: 
  1. ในการส่งคำขอ: ส่งทั้งคุกกี้ (ผ่าน `credentials: 'include'`) และแนบ `Authorization: Bearer <token>` ไปด้วยหากมี Token อยู่ในระบบ
  2. ในการรับผลลัพธ์การเข้าสู่ระบบ: หากเซิร์ฟเวอร์ส่ง Token กลับมาใน JSON Body ระบบยังคงบันทึกข้อมูลและโปรไฟล์ผู้ใช้ลงใน Storage พร้อมคงข้อมูลสาขาไว้ ขณะเดียวกันเบราว์เซอร์จะบันทึก HttpOnly Cookie ตามที่เซิร์ฟเวอร์ส่ง `Set-Cookie` มา
- **Rationale**:
  - ช่วยให้ระบบทำงานร่วมกับ API ได้ทั้งแบบดั้งเดิม (Header-based) และแบบใหม่ (HttpOnly Cookie-based) ได้ 100% โดยไม่ทำให้การทำงานเดิมเสียหาย (Preserve Existing Functionality)
  - ตอบสนองนโยบายความเข้ากันได้แบบ Backward-Compatible และพร้อมปรับใช้ในทุกสภาพแวดล้อม
- **Alternatives Considered**:
  - *ตัด Header Bearer ทิ้งทันที*: หากระบบเชื่อมต่อกับบริการภายนอกหรือ Gateway ที่ยังคงตรวจ Header จะทำให้เกิดข้อผิดพลาด 401 ทันที การทำ Hybrid ให้ความยืดหยุ่นและปลอดภัยสูงสุด

---

### Decision 3: การต่ออายุเซสชันแบบผสมผสาน (Hybrid Session Renewal & Token Refresh)

- **Decision**:
  - ในฟังก์ชัน `performTokenRefresh()` ใน `src/services/api.ts`: ส่งคำขอไปยัง `/api/v1/auth/refresh` ด้วย `credentials: 'include'`
  - หากมี `refreshToken` ใน Storage จะส่งไปใน JSON Body `{ refreshToken }` ด้วย แต่หากไม่มี `refreshToken` (โหมดคุกกี้ล้วน) จะส่ง Body เปล่าหรือไม่แนบ Body เพื่อให้เซิร์ฟเวอร์อ่านจากคุกกี้ `refresh_token` แทน
  - ยังคงใช้ระบบ `Single Refresh Promise` และคิวรอคำขอเดิม เพื่อป้องกันการยิง Refresh ซ้ำซ้อน (Single-flight Pattern)
- **Rationale**:
  - ป้องกันข้อผิดพลาดกรณีที่หน้าบ้านไม่มี Token ใน LocalStorage แต่มีคุกกี้อยู่ในเบราว์เซอร์ ซึ่งเดิมจะถูก throw error ว่า "ไม่พบ Refresh Token"
  - รองรับการทำงานร่วมกับ Endpoint Refresh ของ `ice-pos-api` ที่อ่านคุกกี้ก่อนและ fallback ไปยัง Body
- **Alternatives Considered**:
  - *บังคับต้องมี Refresh Token ใน LocalStorage เสมอ*: ทำให้การใช้งานในโหมด Secure Cookie ล้มเหลว

---

### Decision 4: การออกจากระบบแบบครอบคลุมทั้งเซิร์ฟเวอร์และอุปกรณ์ (Comprehensive Dual Logout)

- **Decision**:
  - เพิ่มเมธอด `authService.logout(): Promise<void>` ซึ่งส่งคำขอ `POST /api/v1/auth/logout` โดยเปิด `credentials: 'include'`
  - ใน `AuthContext.logout()`: เรียก `authService.logout()` เพื่อให้เซิร์ฟเวอร์ส่ง `Set-Cookie: access_token=; MaxAge=-1` สั่งให้เบราว์เซอร์ล้างคุกกี้
  - ครอบด้วย `try...finally` เพื่อให้แน่ใจว่าไม่ว่าเซิร์ฟเวอร์จะตอบกลับอย่างไร หรือเครือข่ายจะขัดข้อง ข้อมูลสิทธิ์และโปรไฟล์ผู้ใช้ในเครื่องจะถูกล้างออกเสมอ (Local Clean Slate) และนำทางกลับไปยังหน้า `/login` พร้อมคงสาขาเดิมไว้
- **Rationale**:
  - เนื่องจาก JavaScript ไม่สามารถเข้าถึงหรือลบ `HttpOnly Cookie` ได้ด้วยตนเอง จึงจำเป็นต้องแจ้งเซิร์ฟเวอร์ให้เป็นผู้ออกคำสั่งลบคุกกี้
  - การรับประกันว่าข้อมูลในเครื่องถูกล้างเสมอแม้เซิร์ฟเวอร์ออฟไลน์ ช่วยป้องกันสิทธิ์ค้างบนหน้าจอ POS หน้าร้าน
- **Alternatives Considered**:
  - *ล้างเฉพาะ LocalStorage โดยไม่เรียก API*: ส่งผลให้ HttpOnly Cookie ยังคงค้างอยู่ในเบราว์เซอร์ ทำให้ความปลอดภัยไม่สมบูรณ์
