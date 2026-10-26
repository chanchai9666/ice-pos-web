# Research & Technical Decisions: Mobile & Tablet POS Usability and Login Alignment

**Feature Branch**: `011-mobile-tablet-pos-ux`
**Date**: 2026-10-25

## Summary of Decisions

### Decision 1: Height Alignment Strategy for Credential Login & PIN Mode
- **Decision**: กำหนดขนาดความสูงขั้นต่ำ `min-h-[500px]` (สอดคล้องกับความสูงของ `PinLogin` รวม BranchSelector, Masked Dots, Virtual Numpad และปุ่มยืนยัน) ให้กับ `CredentialLogin` พร้อมจัดวางองค์ประกอบด้วย Flexbox กึ่งกลางแนวตั้ง (`flex flex-col justify-center`) และปรับความสูงของช่อง Input/ปุ่มกดเป็นอย่างน้อย 48-52px ตามเกณฑ์ Elderly-Friendly
- **Rationale**: ความสูงรวมของ `PinLogin` อยู่ที่ประมาณ 490-510px การตั้ง `min-h-[500px]` ให้ `CredentialLogin` ช่วยให้คอนเทนเนอร์การ์ด Login ไม่เกิดการยุบตัวหรือกระตุก (Layout Shift) เมื่อผู้ใช้สลับแท็บไปมา
- **Alternatives Considered**:
  - *ลดขนาด Numpad ของ PIN ลง*: ไม่เหมาะสม เนื่องจากจะทำให้ปุ่มกดตัวเลขเล็กลงต่ำกว่า 48px ขัดต่อมาตรฐาน Elderly-Friendly
  - *กำหนดความสูงแบบ Fixed พิกเซลตายตัว*: เสี่ยงต่อการล้น (Overflow) เมื่อมีข้อความแจ้งเตือนข้อผิดพลาด จึงเลือกใช้ `min-height` ที่ยืดหยุ่นได้ดีกว่า

### Decision 2: Responsive POS Screen Layout for Touch Devices (< 1024px)
- **Decision**: ปรับหน้า POS Terminal บนหน้าจอขนาดต่ำกว่า `lg` (`< 1024px` ซึ่งครอบคลุมสมาร์ตโฟน และ iPad/Tablet แนวตั้ง) ให้เปลี่ยนจากเลย์เอาต์ 2 คอลัมน์ด้านข้าง มาเป็นการแสดงผลแคตตาล็อกสินค้าแบบเต็มความกว้าง (Full Width) และซ่อนพาเนลตะกร้าฝั่งขวา (`PosCartPanel`) โดยนำเสนอข้อมูลตะกร้าผ่านแถบสรุปยอดและลิ้นชัก `PosCartBottomSheet` แทน
- **Rationale**: เลย์เอาต์ 2 คอลัมน์เดิมบนหน้าจอเล็กกว่า 1024px ทำให้เกิดการบีบอัดจนการ์ดสินค้าและตะกร้าซ้อนทับกัน หรือตะกร้าเลื่อนหลุดลงไปด้านล่างสุดของหน้าจอ การแสดงแคตตาล็อกเต็มพื้นที่ช่วยให้อ่านและสัมผัสเลือกสินค้าได้ง่ายที่สุด
- **Alternatives Considered**:
  - *วางแคตตาล็อกไว้บน ตะกร้าไว้ล่างในหน้าเดียว*: แคชเชียร์ต้องเลื่อนหน้าจอยาวมากเพื่อลงไปดูยอดเงินและกดปุ่มชำระเงิน ทำให้การคิดเงินล่าช้า

### Decision 3: Global App Bottom Navigation (`AppBottomNav`)
- **Decision**: สร้างคอมโพเนนต์ `AppBottomNav` ในเลย์เอาต์หลัก `src/app/(main)/layout.tsx` ที่จะแสดงผลเฉพาะบนหน้าจอขนาดพกพา (`lg:hidden`) โดยมีเมนูหลัก:
  1. จุดขายสินค้า (POS)
  2. แคตตาล็อกสินค้า (Catalog)
  3. เมนูเพิ่มเติม/จัดการกะ (Menu Drawer)
  และเมื่อผู้ใช้อยู่ที่หน้า `/pos` แถบด้านล่างจะเชื่อมต่อกับส่วนสรุปตะกร้าสินค้า (Cart Floating Bar) อย่างกลมกลืน
- **Rationale**: ตรงตามข้อกำหนดและผลการ Clarify Q3 ของผู้ใช้ ช่วยให้การนำทางระหว่างฟังก์ชันหลักทำได้ด้วยนิ้วหัวแม่มือเพียงมือเดียวขณะถือแท็บเล็ต/มือถือ
- **Alternatives Considered**:
  - *แสดงเฉพาะในหน้า POS*: ขัดต่อผลการ Clarify Q3 ที่ผู้ใช้ต้องการแถบเมนูระดับแอพ

### Decision 4: POS Cart Bottom Sheet (`PosCartBottomSheet`)
- **Decision**: พัฒนาคอมโพเนนต์ `PosCartBottomSheet` ซึ่งทำหน้าที่เป็นลิ้นชักเลื่อนขึ้นจากขอบล่างเมื่อแคชเชียร์แตะที่แถบสรุปตะกร้าสินค้า มีโครงสร้างประกอบด้วย:
  - Header: แถบจับเลื่อน (Drag Handle), จำนวนรายการสินค้า, ปุ่มล้างตะกร้า (Clear Cart), ปุ่มปิด
  - Body: รายการสินค้าในตะกร้าแบบเลื่อนได้ (Scrollable) ใช้คอมโพเนนต์ `PosCartItemRow` ที่มีปุ่มปรับลด/เพิ่มจำนวนสินค้าขนาดใหญ่ (>= 48px)
  - Footer: สรุปยอดเงินรวมสุทธิ และปุ่ม "ดำเนินการชำระเงิน" ขนาดใหญ่เด่นชัด (High-contrast, Min-height 54px) ซึ่งกดแล้วจะเปิด `PosCheckoutModal` ต่อไป
- **Rationale**: เป็นรูปแบบมาตรฐานของ Mobile POS สมัยใหม่ สะดวกและเป็นมิตรกับผู้สูงอายุ ไม่ต้องเปลี่ยนหน้าจอไปมา
