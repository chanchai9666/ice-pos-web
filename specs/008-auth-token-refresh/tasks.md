# Tasks: การต่ออายุเซสชันอัตโนมัติขณะใช้งานและการออกจากระบบเมื่อหมดเวลาการใช้งาน (Continuous Usage Token Refresh & Idle Session Timeout)

**Feature**: `008-auth-token-refresh`  
**Input**: Design artifacts from `specs/008-auth-token-refresh/` (`spec.md`, `plan.md`, `data-model.md`, `contracts/`, `quickstart.md`)  
**Status**: Ready for Implementation  

---

## Phase 1: Setup (Types & Storage Policies)

**Purpose**: จัดเตรียมประเภทข้อมูลเกี่ยวกับ Session Lifecycle, Events และปรับปรุงนโยบายการจัดเก็บข้อมูลใน Local Storage

- [ ] T001 [P] เพิ่มประเภทข้อมูล `TokenRefreshCoordinatorState`, `SessionEventType`, `SessionEventPayload` และ `SessionExpiredListener` ใน `src/types/auth.ts`
- [ ] T002 [P] ปรับปรุงฟังก์ชัน `clearAuthSession` ใน `src/utils/storage.ts` ให้ล้างเฉพาะ Access Token, Refresh Token และ UserProfile โดยยังคงรักษา `CURRENT_BRANCH`, `LAST_BRANCH_ID` และตะกร้าสินค้าไว้ตาม FR-008 และ FR-010

---

## Phase 2: Foundational (API Interceptor Infrastructure)

**Purpose**: จัดเตรียมตัวแปรและโครงสร้างสำหรับบริหารจัดการการต่ออายุ Token และการกระจาย Event เซสชันหมดอายุ

- [ ] T003 สร้างตัวแปรจัดการสถานะคิว `TokenRefreshCoordinatorState` พร้อมฟังก์ชัน `registerSessionExpiredListener` และกลไกแจ้งเตือน Session Expired ใน `src/services/api.ts`

---

## Phase 3: User Story 1 - การต่ออายุเซสชันการใช้งานอย่างต่อเนื่องโดยอัตโนมัติ (Priority: P1) 🎯 MVP

**Goal**: คำขอ API ที่ได้รับ 401 ขณะใช้งานต่อเนื่อง จะได้รับการขอ Refresh Token เบื้องหลังและส่งคำขอซ้ำ (Silent Retry) ให้อัตโนมัติ โดยไม่สะดุดและไม่มีการแสดงหน้าต่างบล็อกการทำงาน

**Independent Test**: จำลอง Access Token ไม่ถูกต้องหรือหมดอายุ แล้วแตะเลือกสินค้าหรือค้นหาสินค้าในหน้าจอ POS ตรวจสอบว่าระบบต่ออายุ Token เบื้องหลังสำเร็จ และคำขอเดิมทำงานต่อได้ทันทีโดยที่แคชเชียร์ไม่ถูกตัดออกจากระบบ

### Implementation for User Story 1

- [ ] T004 [US1] ติดตั้งตัวดักจับสถานะ HTTP 401 ในฟังก์ชัน `request<T>` ภายใน `src/services/api.ts` เพื่อเรียก `authService.refreshToken(refreshToken)` โดยอัตโนมัติเมื่อพบ 401
- [ ] T005 [US1] ติดตั้งกลไก Single Promise และ Request Queueing ใน `src/services/api.ts` เพื่อรวมคำขอที่ได้รับ 401 พร้อมกันให้รอผลการต่ออายุเพียงครั้งเดียว และส่งคำขอเดิมซ้ำ (Silent Retry) ทั้งหมดเมื่อได้ Token ใหม่
- [ ] T006 [US1] ปรับปรุง `src/services/api.ts` ให้อัปเดต Access Token และ Refresh Token ชุดใหม่ลงใน Local Storage ด้วย `setAuthSession` ทันทีที่ต่ออายุสำเร็จ

---

## Phase 4: User Story 2 - การนำทางออกจากระบบเมื่อเซสชันหมดอายุเนื่องจากไม่มีการใช้งานนาน (Priority: P1)

**Goal**: เมื่อ Refresh Token จากเซิร์ฟเวอร์หมดอายุจริงหรือไม่สามารถต่ออายุได้ ระบบจะยุติเซสชัน (Auto Logout) ล้าง Token และนำทางกลับสู่หน้าเข้าสู่ระบบทันที

**Independent Test**: จำลอง Refresh Token หมดอายุ แล้วส่งคำขอเรียก API ตรวจสอบว่าระบบล้าง Token ออกจาก Local Storage และนำทางผู้ใช้กลับไปยังหน้าจอเข้าสู่ระบบทันที

### Implementation for User Story 2

- [ ] T007 [US2] เพิ่มตรรกะตรวจจับความล้มเหลวในการต่ออายุ Token ใน `src/services/api.ts` เพื่อเรียกใช้ Listener เซสชันหมดอายุเมื่อเซิร์ฟเวอร์ตอบกลับ 401/403 หรือไม่พบ Refresh Token ในระบบ
- [ ] T008 [US2] เพิ่มฟังก์ชัน `handleSessionExpired` ใน `src/context/AuthContext.tsx` โดยลงทะเบียนผ่าน `registerSessionExpiredListener` เพื่อเคลียร์ State ผู้ใช้ (`user: null`) และนำทางไปยังหน้าจอ `/login`

---

## Phase 5: User Story 3 - การแจ้งเตือนที่เข้าใจง่ายและการนำทางกลับสู่หน้าจอเข้าสู่ระบบ (Priority: P2)

**Goal**: เมื่อเซสชันหมดอายุ ระบบแสดง Toast Notification ภาษาไทยตามมาตรฐาน Elderly-Friendly พร้อมคงสาขาเดิมไว้ในหน้าจอ PIN Login เพื่อให้ล็อกอินกลับเข้ามาทำงานต่อได้ทันที

**Independent Test**: ทำให้เซสชันหมดอายุ ตรวจสอบว่ามี Toast แจ้งเตือนภาษาไทย "เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง" ปรากฏขึ้น และหน้าจอ PIN Login แสดงสาขาล่าสุดให้โดยอัตโนมัติ

### Implementation for User Story 3

- [ ] T009 [US3] เพิ่มการแสดงผล Toast Notification ประเภทเตือน (Warning) ด้วยข้อความภาษาไทย "เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง" ใน `handleSessionExpired` ใน `src/context/AuthContext.tsx`
- [ ] T010 [US3] ตรวจสอบและปรับปรุงหน้าจอเข้าสู่ระบบใน `src/app/(auth)/login/page.tsx` ให้ดึงข้อมูลสาขาล่าสุดที่คงไว้ใน Local Storage มาแสดงเป็นค่าเริ่มต้นในโหมด PIN Login อย่างถูกต้อง

---

## Phase 6: Polish & Verification

**Purpose**: ตรวจสอบคุณภาพโค้ด ความเข้ากันได้ของระบบ และยืนยันความถูกต้องตามเกณฑ์ทั้งหมด

- [ ] T011 [P] ตรวจสอบ TypeScript Strict Types ทั่วทั้งโปรเจกต์ด้วย `npx tsc --noEmit`
- [ ] T012 [P] ตรวจสอบ Linting และมาตรฐานโค้ดด้วย `npm run lint`
- [ ] T013 ดำเนินการทดสอบยืนยันตามสถานการณ์ใน `specs/008-auth-token-refresh/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup) ──► Phase 2 (Foundational) ──► Phase 3 (US1: Silent Refresh) 🎯 MVP
                                            ├──► Phase 4 (US2: Auto Logout)
                                            └──► Phase 5 (US3: Notification & PIN UX)
                                                     │
                                                     ▼
                                              Phase 6 (Polish & Verification)
```

- **Phase 1 (Setup)**: ไม่มี Dependencies สามารถเริ่มได้ทันที
- **Phase 2 (Foundational)**: ขึ้นอยู่กับ Phase 1
- **Phase 3 & 4 (User Stories 1 & 2 - P1)**: ดำเนินการหลัง Phase 2 เสร็จสมบูรณ์
- **Phase 5 (User Story 3 - P2)**: ดำเนินการหลัง Phase 3 & 4
- **Phase 6 (Polish & Verification)**: ดำเนินการหลังทุก User Story เสร็จสมบูรณ์

### Parallel Opportunities

- `T001` และ `T002` ใน Phase 1 สามารถทำพร้อมกันได้ ([P])
- `T011` และ `T012` ใน Phase 6 สามารถรันพร้อมกันได้ ([P])

---

## Implementation Strategy

### MVP Scope (User Story 1 Only)
1. ทำ Phase 1 (Setup: Types & Storage Policy)
2. ทำ Phase 2 (Foundational: Interceptor Infrastructure)
3. ทำ Phase 3 (User Story 1: 401 Interceptor, Queueing & Silent Retry)
4. ทดสอบความสามารถในการต่ออายุ Token อัตโนมัติขณะใช้งานต่อเนื่อง

### Full Feature Delivery
1. ต่อยอดด้วย Phase 4 (User Story 2: Auto Logout เมื่อ Refresh ล้มเหลว)
2. ต่อยอดด้วย Phase 5 (User Story 3: แจ้งเตือนภาษาไทย และคงสาขาเดิมในหน้า PIN)
3. ปิดท้ายด้วย Phase 6 (ตรวจสอบ Type, Lint และ Quickstart Verification)
