# Research: Continuous Usage Token Refresh & Idle Session Timeout

**Branch**: `008-auth-token-refresh`  
**Feature**: `specs/008-auth-token-refresh/spec.md`  

## Technical Decisions

### Decision 1: Interceptor-Based Reactive Token Refresh (การต่ออายุ Token แบบ Reactive ผ่าน API Interceptor)

- **Decision**: ใช้กลไก Interceptor ภายใน `src/services/api.ts` ตรวจจับสถานะ 401 (Unauthorized) จาก API โดยอัตโนมัติ หากพบว่า Access Token หมดอายุและมี Refresh Token อยู่ จะทำการเรียก `/api/v1/auth/refresh` เบื้องหลัง และส่งคำขอเดิมซ้ำ (Silent Retry)
- **Rationale**:
  - การทำ Reactive Interceptor ไม่สร้าง Network Overhead เพิ่มเติมโดยไม่จำเป็น (ไม่ต้อง Polling ตลอดเวลา)
  - รองรับการใช้งานต่อเนื่องได้อย่างสมบูรณ์แบบ แม้ Token จะหมดอายุขณะแคชเชียร์กำลังยิงบาร์โค้ดหรือเรียก API ข้อมูลจะได้รับการ Retry ทันทีโดยที่ผู้ใช้ไม่รู้สึกว่ามีจังหวะสะดุด
  - ปฏิบัติตามมาตรฐาน RFC 6749 (OAuth 2.0 Token Refresh Pattern)
- **Alternatives Considered**:
  - *Proactive Polling Timer*: ตั้ง `setInterval` ต่ออายุ Token ทุกๆ 5-10 นาที
    - *ข้อเสีย*: สิ้นเปลืองแบนด์วิดท์ และหากเครื่องออฟไลน์ชั่วคราวจะเกิด Error ซ้ำๆ โดยไม่จำเป็น
  - *Frontend Idle Timer*: ใช้ตัวนับเวลาเมาส์/ทัชสกรีน 15-30 นาทีในหน้าเว็บ
    - *ข้อเสีย*: ขัดแย้งกับข้อสรุป Clarification Session 2026-10-24 ที่ผู้ใช้ระบุชัดเจนว่าไม่อิงเวลาในหน้าเว็บ แต่ให้อิงตามอายุจริงของ Refresh Token จากเซิร์ฟเวอร์

---

### Decision 2: Single Refresh Promise & Request Queueing (การรวมคำขอต่ออายุ Token พร้อมกันเป็นหนึ่งเดียว)

- **Decision**: เมื่อมี API Calls หลายคำขอส่งออกไปพร้อมกัน (Concurrent Requests) แล้วได้รับ 401 พร้อมกัน ระบบจะใช้ตัวแปร `refreshPromise` เพียงหนึ่งเดียว และเก็บคำขออื่นๆ ไว้ในคิว (Subscriber Queue) เพื่อรอผลลัพธ์ของ `refreshPromise` เดียวกัน
- **Rationale**:
  - ป้องกันปัญหา Race Condition และการเรียก Refresh Token ซ้ำซ้อนที่อาจทำให้ Refresh Token เดิมถูกทำลาย (Token Invalidation)
  - เมื่อ Refresh สำเร็จ ทุกคำขอในคิวจะดึง Token ใหม่แล้ว Retry ทันที
- **Alternatives Considered**:
  - *ปล่อยให้ทุกคำขอเรียก Refresh Token แยกกัน*: นำไปสู่ปัญหา Token Reuse Detection ของ Backend และทำให้ Session หลุดโดยไม่ตั้งใจ

---

### Decision 3: Event-Driven Global Session Expiration & Auto Logout (การแจ้งเตือนและนำทางออกจากระบบด้วย Custom Event)

- **Decision**: เมื่อ Refresh Token ล้มเหลว (เช่น Refresh Token หมดอายุจริง หรือเซิร์ฟเวอร์ปฏิเสธ 401/403) `api.ts` จะเรียกฟังก์ชันกลางหรือส่ง Event `auth:session-expired` ไปยัง `AuthContext` เพื่อ:
  1. ล้างข้อมูล `ice_pos_access_token` และ `ice_pos_refresh_token` ออกจาก storage (แต่คง `ice_pos_current_branch` และ `ice_pos_last_branch_id` ไว้)
  2. คงข้อมูลสินค้าในตะกร้า (`cart`) ไว้ใน localStorage ตามข้อสรุป Clarification
  3. แสดง Toast Notification แจ้งเตือนภาษาไทย ("เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง")
  4. นำทางผู้ใช้กลับไปยังหน้า `/login`
- **Rationale**:
  - สอดคล้องตามธรรมนูญ (Constitution v1.4.0) ด้าน Elderly-Friendly และการใช้ภาษาไทย
  - การคงสาขาและตะกร้าช่วยลด Cognitive Load และลดเวลาในการเข้าทำงานต่อของแคชเชียร์
- **Alternatives Considered**:
  - *Hard Window Reload (`window.location.href = '/login'`)*: ขาดความนุ่มนวลและอาจทำให้ State สำคัญหายไป การใช้ Next.js router หรือ AuthContext ควบคุมร่วมกับ Toast ให้ประสบการณ์ที่ดีกว่า

---

### Decision 4: Fallback Error Handling & Offline Network Resilience

- **Decision**: หากคำขอล้มเหลวจากข้อผิดพลาดเครือข่าย (Network Error / Offline 503) จะไม่ถือว่าเซสชันหมดอายุ แต่จะแสดงข้อความข้อผิดพลาดทางเครือข่ายตามปกติ และจะยุติเซสชันเฉพาะเมื่อได้รับ HTTP 401 จากการเรียก Refresh Token โดยตรงเท่านั้น
- **Rationale**: ป้องกันการเด้งแคชเชียร์ออกจากระบบเมื่อสัญญาณ Wi-Fi หรืออินเทอร์เน็ตสะดุดชั่วขณะหน้าร้าน
