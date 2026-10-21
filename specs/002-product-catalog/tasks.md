# Tasks: ระบบเมนูหลักและการจัดการสินค้าและหมวดหมู่ (System Navigation & Product Catalog)

**Feature**: `002-product-catalog`  
**Spec**: [specs/002-product-catalog/spec.md](spec.md) | **Plan**: [specs/002-product-catalog/plan.md](plan.md)

---

## Phase 1: Setup (Shared Types & Utilities)

**Purpose**: สร้าง Type definitions และยูทิลิตีพื้นฐานที่ทุกโมดูลต้องใช้งานร่วมกัน

- [X] T001 [P] Create catalog, category, UOM, and Tax TypeScript interfaces in `src/types/catalog.ts`
- [X] T002 [P] Implement currency formatting and conversion utilities (`formatSatangToBaht`, `bahtToSatang`) in `src/utils/currency.ts`
- [X] T003 [P] Create navigation menu item configuration and role permission constants in `src/constants/navigation.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: โครงสร้างพื้นฐาน API Client และ Services ที่ต้องพร้อมก่อนเริ่มสร้างหน้าจอ User Story

**⚠️ CRITICAL**: ต้องทำ Phase นี้ให้เสร็จก่อนเริ่มพัฒนา User Stories

- [X] T004 Implement Category API client methods (List, Create, Update, Delete) in `src/services/catalog.service.ts`
- [X] T005 Implement Product API client methods (List with filters/pagination, Create, Update, Delete, Internal Barcode, Upload Image) in `src/services/catalog.service.ts`
- [X] T006 [P] Implement Metadata API client methods for Taxes and UOMs in `src/services/metadata.service.ts`
- [X] T007 Create reusable Tab navigation container and Badge primitives in `src/components/ui/Tabs.tsx` and `src/components/ui/Badge.tsx`

**Checkpoint**: โครงสร้าง Type, API Service และ UI Primitives พร้อมเริ่มพัฒนา User Stories

---

## Phase 3: User Story 1 - โครงสร้างเมนูระบบหลักและการนำทาง (Priority: P1) 🎯 MVP

**Goal**: พัฒนา App Shell Layout ที่มีแถบด้านข้างพับเก็บได้ (Collapsible Sidebar), ส่วนหัว (Header), และการป้องกันสิทธิ์ตามบทบาท (Role Guard)

**Independent Test**: ผู้ใช้ล็อกอินแล้วมองเห็น Sidebar นำทาง, สามารถพับเก็บเมนูได้, สลับไปยังหน้าต่างๆ ได้, และหากเป็น Cashier จะไม่เห็นเมนูจัดการสินค้า และถูกบล็อกไม่ให้เข้า `/catalog`

### Implementation for User Story 1

- [X] T008 [P] [US1] Create AppHeader component showing user profile, current branch, and logout button in `src/components/layout/AppHeader.tsx`
- [X] T009 [P] [US1] Create Collapsible AppSidebar component with active state, role-based menu filtering, and touch toggle in `src/components/layout/AppSidebar.tsx`
- [X] T010 [US1] Implement RouteGuard component for protecting `/catalog` from CASHIER role in `src/components/layout/RouteGuard.tsx`
- [X] T011 [US1] Create main authenticated App Shell layout integrating Header, Sidebar, and RouteGuard in `src/app/(main)/layout.tsx`
- [X] T012 [P] [US1] Create initial POS terminal placeholder page with sidebar toggle button in `src/app/(main)/pos/page.tsx`

**Checkpoint**: App Shell สมบูรณ์ สามารถนำทางและทดสอบการพับเก็บเมนูและการกรองสิทธิ์ตามบทบาทได้

---

## Phase 4: User Story 2 - การดูรายการสินค้า การค้นหา และการกรองข้อมูล (Priority: P1)

**Goal**: แสดงตารางรายการสินค้า ค้นหาด้วยชื่อ/SKU/บาร์โค้ด กรองตามหมวดหมู่และสถานะ พร้อมระบบแบ่งหน้า

**Independent Test**: เปิดหน้า `/catalog` แท็บสินค้า แสดงรายการสินค้าถูกต้อง สามารถพิมพ์ค้นหา กรองหมวดหมู่/สถานะ และเปลี่ยนหน้า Pagination ได้

### Implementation for User Story 2

- [X] T013 [P] [US2] Create ProductToolbar component with search input (300ms debounce), category dropdown, and status filter in `src/components/catalog/ProductToolbar.tsx`
- [X] T014 [US2] Create ProductTable component rendering image, name, SKU, barcode, category, price (THB), cost, and active status in `src/components/catalog/ProductTable.tsx`
- [X] T015 [P] [US2] Create Pagination control component supporting page navigation and page size selector in `src/components/ui/Pagination.tsx`
- [X] T016 [US2] Create Catalog main page with tab switcher and product listing integration in `src/app/(main)/catalog/page.tsx`

**Checkpoint**: หน้าจอรายการสินค้า ค้นหา และกรองข้อมูลทำงานได้อย่างสมบูรณ์

---

## Phase 5: User Story 3 - การสร้างและแก้ไขข้อมูลสินค้า (Priority: P1)

**Goal**: แบบฟอร์ม Slide-over Drawer สำหรับเพิ่มและแก้ไขสินค้า พร้อมปุ่มสร้างบาร์โค้ดภายในอัตโนมัติ

**Independent Test**: สามารถคลิก "+ เพิ่มสินค้า" เปิด Drawer กรอกข้อมูล บันทึกสำเร็จ รายการในตารางอัปเดต และสามารถคลิกแก้ไขสินค้าเดิมได้

### Implementation for User Story 3

- [X] T017 [US3] Create Slide-over Drawer container component with backdrop and smooth transition in `src/components/ui/Drawer.tsx`
- [X] T018 [US3] Implement ProductFormDrawer component with form fields (name, SKU, barcode, category, UOM, tax, price in THB, cost, product type, min stock, track expiry) in `src/components/catalog/ProductFormDrawer.tsx`
- [X] T019 [US3] Implement internal barcode generation trigger button and handler in `src/components/catalog/ProductFormDrawer.tsx`
- [X] T020 [US3] Connect ProductFormDrawer create and edit actions with Catalog page state in `src/app/(main)/catalog/page.tsx`

**Checkpoint**: สามารถเพิ่มและแก้ไขสินค้าผ่าน Slide-over Drawer ได้อย่างสมบูรณ์

---

## Phase 6: User Story 4 - การจัดการหมวดหมู่สินค้า (Priority: P2)

**Goal**: แท็บจัดการหมวดหมู่สินค้า แสดงรายการ ลำดับขั้น และ Modal Dialog สำหรับเพิ่ม/แก้ไข/ลบหมวดหมู่

**Independent Test**: สลับไปแท็บ "หมวดหมู่สินค้า" สามารถสร้างหมวดหมู่ใหม่ แก้ไขชื่อ/ลำดับ และลบหมวดหมู่ที่ไม่มีสินค้าผูกอยู่ได้

### Implementation for User Story 4

- [X] T021 [P] [US4] Create CategoryList table and tree-view component in `src/components/catalog/CategoryList.tsx`
- [X] T022 [P] [US4] Create CategoryFormModal dialog component for adding and editing categories in `src/components/catalog/CategoryFormModal.tsx`
- [X] T023 [US4] Integrate Category tab, modal triggers, and API actions in `src/app/(main)/catalog/page.tsx`

**Checkpoint**: จัดการหมวดหมู่สินค้าได้ครบถ้วน ทั้งการแสดงผล เพิ่ม แก้ไข และลบ

---

## Phase 7: User Story 5 - การจัดการรูปภาพสินค้า (Priority: P2)

**Goal**: คอมโพเนนต์อัปโหลดรูปภาพสินค้า แปลงเป็น WebP พร้อมแสดงตัวอย่าง (Preview) และ Placeholder สวยงาม

**Independent Test**: สามารถเลือกไฟล์ภาพในฟอร์มสินค้า แสดงภาพตัวอย่าง อัปโหลดสำเร็จ และแสดงผลบนตารางรายการสินค้า

### Implementation for User Story 5

- [X] T024 [P] [US5] Create ImageUploader component with file drop zone, validation (JPG, PNG, WebP <= 5MB), and instant preview in `src/components/catalog/ImageUploader.tsx`
- [X] T025 [US5] Integrate ImageUploader into ProductFormDrawer with upload API endpoint in `src/components/catalog/ProductFormDrawer.tsx`
- [X] T026 [P] [US5] Implement Default Product Image Placeholder fallback in `src/components/catalog/ProductTable.tsx`

**Checkpoint**: ระบบรูปภาพสินค้าทำงานสมบูรณ์ทั้งการอัปโหลดและแสดงภาพตัวอย่าง

---

## Phase 8: User Story 6 - การเปิด/ปิดสถานะ และการลบสินค้าอย่างปลอดภัย (Priority: P3)

**Goal**: สวิตช์สลับสถานะเปิด/ปิดขาย และกล่องยืนยันการลบที่ปลอดภัยพร้อมคำแนะนำให้ปิดการใช้งานหากมีประวัติขาย

**Independent Test**: สามารถกด Toggle สถานะสินค้าได้ทันที และเมื่อกดลบสินค้าที่มีประวัติ ระบบแจ้งเตือนให้สลับเป็น Deactivate แทน

### Implementation for User Story 6

- [X] T027 [P] [US6] Create DeleteConfirmModal dialog with warning explanation in `src/components/catalog/DeleteConfirmModal.tsx`
- [X] T028 [US6] Implement Active/Inactive status toggle switch in `src/components/catalog/ProductTable.tsx`
- [X] T029 [US6] Connect safe delete handler with backend error interception (suggest deactivation if in-use) in `src/app/(main)/catalog/page.tsx`

**Checkpoint**: ควบคุมสถานะและลบสินค้าได้อย่างปลอดภัยตามหลักการ Data Integrity

---

## Phase 9: User Story 7 - การใช้งานบนหน้าจอสัมผัสและการป้อนข้อมูลสำหรับผู้สูงอายุ (Elderly-Friendly & Touchscreen Experience) (Priority: P1)

**Goal**: ออกแบบและปรับปรุง UX/UI ทั้งระบบให้เหมาะสมกับผู้สูงอายุและหน้าจอสัมผัส POS ตามธรรมนูญโครงการหมวด 6.5 (Touch Targets >= 48px, Typography >= 16px, Contrast WCAG 2.1 AA, Virtual Numeric Keypad, Immediate Feedback)

**Independent Test**: สามารถทดสอบด้วยการใช้นิ้วสัมผัสบนจอสัมผัส ตรวจวัดขนาดพื้นที่สัมผัสของทุกปุ่มและอินพุตไม่ต่ำกว่า 48x48px ตัวอักษรและตัวเลขราคาอ่านง่ายชัดเจน แตะช่องราคา/ต้นทุนเพื่อเปิด Virtual Numeric Keypad และป้อนข้อมูลได้อย่างแม่นยำ

### Implementation for User Story 7

- [ ] T036 [P] [US7] Create VirtualNumericKeypad component with 60x60px buttons, decimal, Clear, Backspace, and immediate visual feedback in `src/components/ui/VirtualNumericKeypad.tsx`
- [ ] T037 [US7] Integrate VirtualNumericKeypad into price and cost inputs in `src/components/catalog/ProductFormDrawer.tsx`
- [ ] T038 [P] [US7] Audit and update touch targets across all buttons, tabs, inputs, and action buttons to meet minimum 48x48px in `src/components/catalog/ProductToolbar.tsx`, `src/components/catalog/ProductTable.tsx`, and `src/components/catalog/CategoryList.tsx`
- [ ] T039 [P] [US7] Verify and enforce typography >= 16px, large bold price numbers, and WCAG 2.1 AA contrast ratio (>= 4.5:1, no faint gray) in `src/components/catalog/ProductTable.tsx` and `src/components/catalog/ProductFormDrawer.tsx`
- [ ] T040 [US7] Enhance DeleteConfirmModal with prominent confirmation and cancellation buttons, high-contrast colors, and clear non-technical Thai wording in `src/components/catalog/DeleteConfirmModal.tsx`
- [ ] T041 [US7] Add debouncing / rapid touch prevention on action buttons to prevent accidental double-tap submission in `src/components/catalog/ProductFormDrawer.tsx` and `src/components/catalog/CategoryFormModal.tsx`

**Checkpoint**: ระบบผ่านเกณฑ์ Elderly-Friendly & Touchscreen Optimized ครบถ้วนตามธรรมนูญโครงการ v1.4.0

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: ปรับแต่งรายละเอียดความสมบูรณ์ ความลื่นไหล และการทดสอบตามคู่มือ Quickstart

- [X] T030 [P] Validate 100% Thai localization and user-friendly error messages across all catalog components
- [X] T031 [P] Verify touch-screen interaction on tablet resolution (minimum 48x48px touch targets) in `src/app/globals.css`
- [X] T032 Run full validation walkthrough per `specs/002-product-catalog/quickstart.md`
- [X] T033 Run ESLint and TypeScript typecheck across all modified files

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: ไม่มี dependencies เริ่มต้นได้ทันที
- **Phase 2 (Foundational)**: ขึ้นกับ Phase 1 - เป็น PREREQUISITE สำหรับทุก User Story
- **Phase 3 (US1 - Navigation & Shell)**: ขึ้นกับ Phase 2 (เปรียบเสมือน MVP แรกของระบบ)
- **Phase 4 (US2 - Product Listing)**: ขึ้นกับ Phase 3 (แสดงผลใน App Shell)
- **Phase 5 (US3 - Product Create/Edit)**: ขึ้นกับ Phase 4 (ต่อยอดจากตารางสินค้า)
- **Phase 6 (US4 - Categories)**: ขึ้นกับ Phase 4 (แท็บที่สองใน Catalog page)
- **Phase 7 (US5 - Image Upload)**: ขึ้นกับ Phase 5 (ผูกในฟอร์มสินค้า)
- **Phase 8 (US6 - Status & Safe Delete)**: ขึ้นกับ Phase 4 และ 5
- **Phase 9 (US7 - Elderly & Touch Experience)**: ขึ้นกับ Phase 4, 5, 6, 8 (ต่อยอดคอมโพเนนต์ Catalog ให้สมบูรณ์ตามหมวด 6.5)
- **Phase 10 (Polish)**: ขึ้นกับทุก User Story

### Parallel Opportunities
- T001, T002, T003 ใน Phase 1 สามารถทำพร้อมกันได้
- T006, T007 ใน Phase 2 สามารถทำพร้อมกันได้
- T008, T009 ใน Phase 3 สามารถทำพร้อมกันได้
- T013, T015 ใน Phase 4 สามารถทำพร้อมกันได้
- T021, T022 ใน Phase 6 สามารถทำพร้อมกันได้
- T024, T026 ใน Phase 7 สามารถทำพร้อมกันได้
- T036, T038, T039 ใน Phase 9 สามารถทำพร้อมกันได้

---

## Phase 11: Convergence

**Purpose**: แก้ไขช่องว่างและจุดบกพร่องจากการประเมินระบบที่ตรวจพบระหว่างการเชื่อมต่อ App Shell และ Login Flow

- [X] T034 [US1] Fix post-login navigation for ADMIN and MANAGER roles to route to valid App Shell page (/pos or /catalog) and add /dashboard redirect per FR-001, US1/AC1 (partial)
- [X] T035 [US1] Resolve SSR hydration mismatch in LoginForm by safely syncing client-side login mode after mount per Constitution I (partial)


