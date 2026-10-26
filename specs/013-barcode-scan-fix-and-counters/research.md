# Research: แก้ไขระบบสแกนบาร์โค้ดผ่านกล้องและเพิ่มตัวนับจำนวนสแกนสำเร็จ/ไม่สำเร็จ

**Feature Branch**: `013-barcode-scan-fix-and-counters`  
**Date**: 2026-10-26  

## 1. การแก้ไขปัญหาการสแกนบาร์โค้ดไม่ติดบน Safari / iOS (Cross-Browser Barcode Decoding Engine)

### ปัญหาที่พบ (Root Cause Analysis)
ในโค้ดเดิมของ `PosCameraScannerModal.tsx`:
```typescript
const BarcodeDetectorClass =
  typeof window !== 'undefined' && 'BarcodeDetector' in window
    ? window.BarcodeDetector
    : null;
```
- มาตรฐาน Web API `BarcodeDetector` ยังคงเป็น Experimental Feature และ **ไม่ได้รับการเปิดใช้งานเป็นค่าเริ่มต้นบน iOS Safari, macOS Safari และ Firefox**
- เมื่อเปิดบนเบราว์เซอร์ดังกล่าว ตัวแปร `detector` จะมีค่าเป็น `null` ทำให้คำสั่ง `requestAnimationFrame(detectLoop)` ไม่ถูกเรียก กล้องจึงเปิดภาพค้างไว้แต่ไม่มีกระบวนการถอดรหัสบาร์โค้ดเลย
- ในโปรเจกต์ยังไม่มีการติดตั้ง Fallback Engine ใด ๆ

### ทางเลือกในการแก้ปัญหา (Alternatives Considered)

| ตัวเลือก | ข้อดี | ข้อเสีย | ผลการประเมิน |
|---|---|---|---|
| **1. `@zxing/library` + `@zxing/browser`** | รองรับ EAN-13, EAN-8, Code-128, Code-39, UPC-A, UPC-E, QR Code ครบถ้วน, เสถียรสูง, เป็นมาตรฐานอุตสาหกรรมใน JS, เข้ากันได้กับ React 19 และ Next.js | ขนาด bundle ปานกลาง (~100KB gzipped) | **เลือกใช้ (Recommended)** |
| **2. `@ericblade/quagga2`** | เน้นบาร์โค้ด 1D | ไม่รองรับ QR Code และการตั้งค่าวิดีโอซับซ้อนกว่า | ไม่เลือก |
| **3. `@undecaf/barcode-detector-polyfill` (WASM)** | อิง API BarcodeDetector มาตรฐาน | ต้องโหลดไฟล์ WASM ภายนอก ซึ่งอาจมีปัญหา CSP หรือ latency บนอุปกรณ์ที่เน็ตช้า | ไม่เลือก |
| **4. Native BarcodeDetector Only** | ทำงานเร็วมากบน Android Chrome | ใช้ไม่ได้เลยบน Safari / iOS | ไม่เลือกเป็นทางเลือกเดียว |

### มติการตัดสินใจ (Decision)
- **Hybrid Engine Approach**:
  1. หากเบราว์เซอร์มี Native `window.BarcodeDetector` ให้ใช้ Native Engine ก่อนเพื่อความเร็วสูงสุดและประหยัดแบตเตอรี่ (โดยเฉพาะ Chrome บน Android/PC)
  2. หากเบราว์เซอร์ไม่มี Native `BarcodeDetector` (เช่น Safari บน iOS/macOS หรือ Firefox) ให้สลับมาใช้ `@zxing/browser` (`BrowserMultiFormatReader`) โดยอัตโนมัติ
  3. เพิ่ม dependency `@zxing/library` และ `@zxing/browser` ใน `package.json`

---

## 2. โครงสร้างและการไหลของข้อมูลตัวนับ (Scan Counters & State Flow)

### ปัญหาเดิม
- `onScan: (barcode: string) => void` ส่งรหัสออกไปแบบ Fire-and-forget โดย `PosCameraScannerModal` ไม่ทราบว่าสินค้าที่สแกนมีอยู่ในระบบหรือไม่
- ไม่มีการนับจำนวนสินค้าที่ไม่พบในระบบ (Failed Count)

### รูปแบบการทำงานใหม่
- อัปเดต signature ของ `onScan`:
  ```typescript
  onScan: (barcode: string) => Promise<{ success: boolean; productName?: string }>;
  ```
- ใน `src/app/(main)/pos/page.tsx` ฟังก์ชัน `handleBarcodeScanned`:
  1. ค้นหาใน `products` แคชในหน้า POS:
     - หากพบ → เพิ่มลงบิล และส่งผลลัพธ์กลับเป็น `{ success: true, productName: localFound.name }`
  2. หากไม่พบในแคช → เรียก `catalogService.lookupProduct(barcode)`:
     - หากพบ → เพิ่มลงบิล และส่งผลลัพธ์กลับเป็น `{ success: true, productName: res.data.name }`
     - หากไม่พบหรือเกิดข้อผิดพลาด → ส่งผลลัพธ์กลับเป็น `{ success: false }`
- ใน `PosCameraScannerModal.tsx`:
  - จัดการ State:
    - `successCount: number` (สแกนสำเร็จและมีสินค้าในระบบ)
    - `failedCount: number` (สแกนติดบาร์โค้ดแต่ไม่พบสินค้าในระบบ หรือกรอกมือแล้วไม่พบ)
    - `lastScanFeedback`: `{ status: 'SUCCESS' | 'NOT_FOUND'; barcode: string; productName?: string } | null`
  - เมื่อได้ผลลัพธ์:
    - กรณีสำเร็จ: `successCount + 1`, ส่งเสียง Beep (880Hz), แสดงกล่องสถานะสีเขียวพร้อมชื่อสินค้า
    - กรณีไม่สำเร็จ: `failedCount + 1`, ส่งเสียง Buzzer (150Hz), แสดงกล่องสถานะสีแดงพร้อมข้อความ "ไม่พบสินค้ารหัส [รหัส]"
    - กล้องสแกนต่อเนื่องโดยไม่ต้องปิด Modal

---

## 3. ระบบเสียงตอบรับ (Audio Feedback) ตามมาตรฐาน Elderly-Friendly

### แนวทาง
- ใช้ Web Audio API (`window.AudioContext` หรือ `webkitAudioContext`) สร้างสัญญาณเสียงแบบสังเคราะห์ในเบราว์เซอร์โดยตรง:
  - **Success Beep**: ความถี่ 880Hz (โน้ต A5) คลื่น Sine ระยะเวลา 120ms สั้น คมชัด สื่อถึงความสำเร็จ
  - **Error Buzzer**: ความถี่ต่ำ 160Hz คลื่น Sawtooth หรือ Triangle ระยะเวลา 250ms สื่อถึงการแจ้งเตือนข้อผิดพลาด
- ข้อดี:
  - ไม่ต้องพึ่งพาไฟล์เสียงภายนอก (.mp3/.wav)
  - ทำงานได้ 100% แม้ออฟไลน์หรือเครือข่ายขัดข้อง
  - ไม่มีปัญหา Asset 404 หรือโหลดช้า
