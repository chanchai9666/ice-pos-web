# Phase 0: Technical Research & Decisions

**Feature**: ปุ่มสแกนสินค้าด้วยกล้องบน Navbar (Navbar Camera Product Scanner Button)  
**Branch**: `012-navbar-camera-scan`  
**Date**: 2026-10-26  

---

## 1. Technical Decisions

### Decision 1: การเชื่อมโยงการกดปุ่มบน Navbar (AppHeader / AppBottomNav) กับการเปิด PosCameraScannerModal
- **Chosen**: ใช้การผสมผสานระหว่าง Custom Event (`ice-pos:open-camera-scanner`) เมื่ออยู่หน้า `/pos` ร่วมกับ Navigation Query Parameter (`/pos?scan=camera`) เมื่ออยู่หน้าอื่น
- **Rationale**:
  - `AppHeader` และ `AppBottomNav` อยู่ใน `src/app/(main)/layout.tsx` ซึ่งเป็นระดับ Layout ส่วน `PosCameraScannerModal` อยู่ใน `src/app/(main)/pos/page.tsx`
  - หากผู้ใช้อยู่ในหน้า `/pos` อยู่แล้ว การส่ง Custom Event หรือตรวจสอบ search params จะเปิด modal ทันทีโดยไม่ต้องโหลดหน้าซ้ำ
  - หากผู้ใช้อยู่หน้าอื่น (เช่น แคตตาล็อกสินค้า, จัดการสาขา) การสั่ง `router.push('/pos?scan=camera')` จะนำทางมายังหน้า POS และเปิดหน้าต่างกล้องสแกนอัตโนมัติ ตอบโจทย์ข้อกำหนด FR-003 ได้อย่างราบรื่น
- **Alternatives Considered**:
  - *ย้าย PosCameraScannerModal ไปไว้ใน MainLayout*: ไม่เหมาะสม เพราะ `PosCameraScannerModal` ต้องเรียก `handleBarcodeScanned` ซึ่งผูกกับ State ตะกร้าสินค้า (`addItem`) และข้อมูลกะการขาย (`activeShift`) ในหน้า POS การย้ายไป Layout จะทำให้ขอบเขตความรับผิดชอบบวมและต้องดึง PosCartContext ไปไว้ระดับ Global โดยไม่จำเป็น
  - *ใช้ Global State Store (Zustand/Redux)*: ซับซ้อนเกินจำเป็นสำหรับโปรเจกต์นี้ ซึ่งมี Context API และ CustomEvent/Query Param ที่ทำงานได้ดีเยี่ยมอยู่แล้ว

### Decision 2: ตำแหน่งและการจัดวางปุ่มบน AppBottomNav (Mobile/Tablet)
- **Chosen**: เพิ่มปุ่มสแกนด่วน (Quick Camera Scan) เข้าไปในแถบ `AppBottomNav` โดยจัดวางอย่างสมดุล (เช่น ปุ่มสแกนกล้องเป็นปุ่มไฮไลต์ทรงกลม/สี่เหลี่ยมโค้งมนสี Cyan เด่นชัดตรงกลาง หรือวางข้างเมนู POS)
- **Rationale**:
  - บนอุปกรณ์พกพา ขนาดหน้าจอกว้าง 360px - 768px นิ้วโป้งของแคชเชียร์จะอยู่ที่ขอบล่างของหน้าจอ
  - ปุ่มสแกนต้องมีขนาดสัมผัสไม่ต่ำกว่า 48x48px ตามหลักการ Elderly-Friendly ในธรรมนูญข้อ 6.5
  - สีเด่นชัด (High Contrast Cyan/Blue) มีไอคอนกล้อง (`Icons.Camera`) และป้ายชื่อ "สแกน" ชัดเจน
- **Alternatives Considered**:
  - *ซ่อนปุ่มสแกนในเมนูย่อย "เมนูอื่น ๆ"*: ใช้งานไม่สะดวก แคชเชียร์ต้องกด 2 ครั้งเพื่อเปิดกล้อง ขัดกับวัตถุประสงค์ความรวดเร็ว

### Decision 3: ตำแหน่งและการจัดวางปุ่มบน AppHeader (Desktop)
- **Chosen**: วางปุ่มสแกนกล้อง ("สแกนสินค้า") บริเวณฝั่งขวาของ `AppHeader` ถัดจากข้อมูลสาขา หรือระหว่างข้อมูลสาขากับข้อมูลผู้ใช้
- **Rationale**:
  - ฝั่งขวาของ `AppHeader` มีพื้นที่ว่างบนหน้าจอ Desktop (>= 1024px)
  - มีไอคอนกล้อง พร้อมข้อความ "สแกนสินค้า" ที่มองเห็นได้ชัดเจน ขนาดเป้าหมายสัมผัส >= 48px
  - ซ่อนปุ่มนี้บนหน้าจอขนาดเล็ก (`hidden lg:flex`) เพื่อป้องกันความแออัดบนมือถือ เนื่องจากมือถือมี `AppBottomNav` ด้านล่างอยู่แล้ว
- **Alternatives Considered**:
  - *วางปุ่มใน Sidebar*: Sidebar พับเก็บได้ (Collapsed) ทำให้ต้องเล็งหรือขยายก่อนกด ไม่สะดวกเท่ากับ Header ที่คงอยู่ตลอดเวลา (Sticky Header)

### Decision 4: การจัดการสิทธิ์กล้องและการสแกน (Camera Permission & Error Handling)
- **Chosen**: ใช้กลไกเดิมของ `PosCameraScannerModal` ที่ตรวจจับสิทธิ์ผ่าน WebRTC / MediaDevices API (`navigator.mediaDevices.getUserMedia`)
- **Rationale**:
  - `PosCameraScannerModal` มีระบบตรวจสอบสิทธิ์กล้อง, สลับกล้องหน้า-หลัง, สัญญาณเสียงบี๊บ และแบนเนอร์แจ้งเตือนสินค้าพร้อมใช้งานอยู่แล้ว
  - ผู้ใช้ระบุชัดเจนว่า "ใช้กับของเดิมที่มีอยู่แล้วเพียงแต่เพิ่มทางเข้าเฉยๆ" จึงไม่ต้องแก้ไขตรรกะภายในตัวสแกน
