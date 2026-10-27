---

description: "Task list for catalog product form barcode scan"
---

# Tasks: ปุ่มสแกนบาร์โค้ดในฟอร์มเพิ่ม/แก้ไขสินค้า

**Input**: Design documents from `specs/015-catalog-barcode-scan/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: ไม่สร้าง automated test tasks (spec ไม่ได้ขอ TDD)

**Organization**: จัดตาม User Stories P1 → P2 → P3

## Format: `[ID] [P?] [Story] Description`

- **[P]**: ทำขนานได้ (คนละไฟล์ ไม่พึ่งงานที่ยังไม่เสร็จ)
- **[Story]**: [US1] / [US2] / [US3]

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: เตรียมโครงสร้างโฟลเดอร์ตาม plan โดยไม่เพิ่ม dependency ใหม่

- [X] T001 สร้างโฟลเดอร์ `src/components/shared/` หากยังไม่มี ตามโครงสร้างใน `specs/015-catalog-barcode-scan/plan.md`
- [X] T002 ยืนยันว่าโปรเจกต์มี `@zxing/browser`, `@zxing/library`, `src/utils/barcode.ts` (`cleanBarcode`), และ `Icons.Barcode` / `Icons.Camera` ใน `src/components/ui/Icons.tsx` พร้อมใช้โดยไม่ติดตั้งแพ็กเกจใหม่

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Modal จับบาร์โค้ดแบบ single-capture ที่ทุก story ใช้ร่วมกัน

**⚠️ CRITICAL**: ต้องเสร็จก่อนเริ่มงาน User Story

- [X] T003 สร้าง `BarcodeCaptureModal` ใน `src/components/shared/BarcodeCaptureModal.tsx` ตาม `specs/015-catalog-barcode-scan/contracts/ui-contracts.md` (props: `isOpen`, `onClose`, `onCapture`, optional `title`)
- [X] T004 ใน `src/components/shared/BarcodeCaptureModal.tsx` ติดตั้ง hybrid decode (Native `BarcodeDetector` ก่อน แล้ว fallback `@zxing/browser`) แบบแนวทางใน `src/components/pos/PosCameraScannerModal.tsx` โดยไม่แก้ไฟล์ POS
- [X] T005 ใน `src/components/shared/BarcodeCaptureModal.tsx` เมื่ออ่านสำเร็จครั้งแรก: เรียก `cleanBarcode` จาก `src/utils/barcode.ts` → เรียก `onCapture(cleaned)` ครั้งเดียว → หยุดกล้อง/decoder → ให้ parent ปิด Modal (single capture ตาม FR-003/FR-011)
- [X] T006 ใน `src/components/shared/BarcodeCaptureModal.tsx` จัดการยกเลิกและหยุดทรัพยากรเมื่อ `isOpen=false` หรือผู้ใช้กดปิด โดยไม่เรียก `onCapture`
- [X] T007 ใน `src/components/shared/BarcodeCaptureModal.tsx` แสดงข้อความภาษาไทยเมื่อไม่มีกล้องหรือถูกปฏิเสธสิทธิ์ แล้วให้ปิดด้วย `onClose` (รองรับ US3)

**Checkpoint**: เปิด `BarcodeCaptureModal` จากหน้าทดสอบชั่วคราวหรือ storybook-less manual mount ได้ และ capture/cancel/permission พฤติกรรมตรง contract

---

## Phase 3: User Story 1 - สแกนบาร์โค้ดใส่ช่องบาร์โค้ดสินค้า (Priority: P1) 🎯 MVP

**Goal**: กดปุ่มสแกนในฟอร์มเพิ่ม/แก้ไข แล้วใส่ค่าบาร์โค้ดลงช่องหลังอ่านสำเร็จครั้งแรก

**Independent Test**: เปิดฟอร์มเพิ่มและแก้ไขบน `/catalog` กดสแกน อ่านบาร์โค้ดสำเร็จ → ช่องมีค่า ถูกต้อง Modal ปิด ฟอร์มไม่หาย ไม่ไป POS

### Implementation for User Story 1

- [X] T008 [US1] ใน `src/components/catalog/ProductFormModal.tsx` เพิ่ม state `isBarcodeScanOpen` และ handler `onCapture` ที่ `setBarcode`, `setIsInternalBarcode(false)`, ปิด scan modal ตาม `data-model.md`
- [X] T009 [US1] ใน `src/components/catalog/ProductFormModal.tsx` เพิ่มปุ่ม "สแกนบาร์โค้ด" คู่กับ "สร้างบาร์โค้ดอัตโนมัติ" ในแถวป้ายกำกับช่องบาร์โค้ด (FR-001, FR-012) พร้อมไอคอนจาก `Icons`
- [X] T010 [US1] ใน `src/components/catalog/ProductFormModal.tsx` เรนเดอร์ `BarcodeCaptureModal` และเชื่อม `isOpen` / `onClose` / `onCapture`
- [X] T011 [P] [US1] ใน `src/components/catalog/ProductFormDrawer.tsx` เพิ่ม state + handler สแกนแบบเดียวกับ Modal (T008)
- [X] T012 [P] [US1] ใน `src/components/catalog/ProductFormDrawer.tsx` เพิ่มปุ่ม "สแกนบาร์โค้ด" คู่กับสร้างอัตโนมัติ (T009)
- [X] T013 [US1] ใน `src/components/catalog/ProductFormDrawer.tsx` เรนเดอร์และเชื่อม `BarcodeCaptureModal` (T010)
- [X] T014 [US1] ตรวจสอบว่าการสแกนสำเร็จแทนที่ค่าในช่องโดยไม่ถามยืนยัน และไม่เรียก lookup/API ตอนสแกน (FR-003, FR-004, FR-005, FR-010) ในทั้ง Modal และ Drawer

**Checkpoint**: S1 และ S2 ใน `quickstart.md` ผ่านบน Modal และ Drawer

---

## Phase 4: User Story 2 - ใช้ร่วมกับพิมพ์มือและสร้างอัตโนมัติ (Priority: P2)

**Goal**: ปุ่มสแกนอยู่คู่สร้างอัตโนมัติ โดยไม่ทำลายวิธีกรอกเดิม

**Independent Test**: พิมพ์มือได้, สร้างอัตโนมัติได้, สแกนทับค่าได้ ในฟอร์มเดิม

### Implementation for User Story 2

- [X] T015 [P] [US2] ใน `src/components/catalog/ProductFormModal.tsx` จัด layout แถวป้ายกำกับให้ปุ่มสแกนและสร้างอัตโนมัติอยู่ด้วยกันโดยไม่บังกัน ระยะห่างสัมผัสเหมาะสม (FR-006, FR-009, FR-012)
- [X] T016 [P] [US2] ใน `src/components/catalog/ProductFormDrawer.tsx` จัด layout ปุ่มคู่แบบเดียวกับ Modal (T015)
- [X] T017 [US2] ยืนยัน regression: `handleGenerateBarcode` และ `onChange` ของช่องบาร์โค้ดในทั้งสองฟอร์มยังทำงานหลังเพิ่มปุ่มสแกน (S3 ใน `quickstart.md`)

**Checkpoint**: S3 ผ่าน; พิมพ์มือ + สร้างอัตโนมัติ + สแกนใช้ร่วมกันได้

---

## Phase 5: User Story 3 - ยกเลิกสแกนและกล้องใช้ไม่ได้ (Priority: P3)

**Goal**: ยกเลิกหรือกล้องล้มเหลวแล้วฟอร์มไม่สูญข้อมูล และพิมพ์มือได้ต่อ

**Independent Test**: กรอกชื่อไว้ → เปิดสแกน → ยกเลิก; และกรณีปฏิเสธกล้อง → ข้อมูลเดิมอยู่ พิมพ์บาร์โค้ดได้

### Implementation for User Story 3

- [X] T018 [US3] ใน `src/components/shared/BarcodeCaptureModal.tsx` ทบทวนข้อความ error ภาษาไทยให้อ่านง่าย และปุ่มปิด/ลองใหม่มีพื้นที่สัมผัสเพียงพอ (FR-008, FR-009)
- [X] T019 [P] [US3] ใน `src/components/catalog/ProductFormModal.tsx` ให้ `onClose` ของ scan modal ปิดแค่ `isBarcodeScanOpen` โดยไม่เคลียร์ฟิลด์ฟอร์มอื่น (FR-007)
- [X] T020 [P] [US3] ใน `src/components/catalog/ProductFormDrawer.tsx` ให้พฤติกรรม `onClose` เหมือน Modal (T019)
- [X] T021 [US3] ตรวจ S4 ใน `quickstart.md`: ยกเลิกและ permission denied ไม่ทำลายฟอร์ม และยังพิมพ์บาร์โค้ดมือได้

**Checkpoint**: S4 ผ่านครบ

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: คุณภาพและความปลอดภัยต่อฟีเจอร์เดิม

- [X] T022 [P] รัน `npm run lint` และแก้ปัญหาที่เกี่ยวกับไฟล์ที่แตะในฟีเจอร์นี้
- [X] T023 รัน `npm run build` หรือ `npx tsc --noEmit` ให้ผ่าน
- [X] T024 ตรวจ S5 ใน `specs/015-catalog-barcode-scan/quickstart.md`: `PosCameraScannerModal` / Navbar scan บน `/pos` ยังทำงานตามเดิม (ไม่แก้พฤติกรรม POS)
- [X] T025 ตรวจว่าไม่ได้เพิ่ม dependency ใหม่ใน `package.json` โดยไม่จำเป็น

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup** → ไม่มี dependency
- **Phase 2 Foundational** → หลัง Setup; **บล็อก** US1–US3
- **Phase 3 US1 (MVP)** → หลัง Foundational
- **Phase 4 US2** → หลัง US1 (ใช้ปุ่ม/ฟอร์มจาก US1)
- **Phase 5 US3** → Foundational เสร็จแล้วทำได้; แนะนำหลัง US1 เพื่อทดสอบกับฟอร์มจริง
- **Phase 6 Polish** → หลัง story ที่ต้องการส่ง

### User Story Dependencies

- **US1**: หลัง T003–T007
- **US2**: หลังปุ่มสแกนของ US1 อยู่ในฟอร์มแล้ว
- **US3**: พึ่ง `BarcodeCaptureModal` + การผูก `onClose` ในฟอร์ม; อิสระจาก US2 ทางตรรกะ

### Parallel Opportunities

- T011–T012 ขนานกับงาน Modal ฝั่ง ProductFormModal ได้หลัง contract ชัด
- T015 // T016
- T019 // T020
- T022 ขนานกับการตรวจ manual อื่นได้

---

## Parallel Example: User Story 1

```bash
# หลัง T008–T010 เสร็จฝั่ง Modal แล้ว ทำ Drawer ขนานได้:
Task: "T011 ProductFormDrawer state + handler"
Task: "T012 ProductFormDrawer scan button next to auto-generate"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001–T007 (Setup + BarcodeCaptureModal)
2. T008–T014 (ผูกฟอร์ม Modal + Drawer)
3. หยุดแล้วตรวจ S1/S2 ใน `quickstart.md`

### Incremental Delivery

1. MVP US1 → สแกนใส่ช่องได้
2. US2 → layout/regression วิธีกรอกเดิม
3. US3 → error/cancel polish
4. Polish → lint/build/POS regression

### Suggested MVP Scope

**US1 เท่านั้น (T001–T014)** พอให้ demo บน `/catalog` ได้ครบเป้าหมายหลัก

---

## Notes

- ห้ามแก้พฤติกรรม `src/components/pos/PosCameraScannerModal.tsx` ในฟีเจอร์นี้
- ไม่มี API ใหม่; ไม่ตรวจซ้ำบาร์โค้ดตอนสแกน
- ทุก task มี checkbox + TaskID + path ตามรูปแบบบังคับ
