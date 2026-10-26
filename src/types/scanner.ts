/**
 * นิยาม Type สำหรับระบบสแกนบาร์โค้ดผ่านกล้องและตัวนับจำนวน
 * โครงการ ice-pos-web
 */

export interface BarcodeScanResult {
  /** ผลการค้นหาและเพิ่มสินค้าลงบิล (true = พบสินค้าในระบบ, false = ไม่พบ) */
  success: boolean;
  /** ชื่อสินค้าที่ค้นพบ (มีค่าเมื่อ success === true) */
  productName?: string;
  /** ราคาขายต่อหน่วยของสินค้า (มีค่าเมื่อ success === true) */
  price?: number;
}

export interface ScanSessionCounters {
  /** จำนวนสินค้าที่สแกนสำเร็จและมีในระบบ */
  successCount: number;
  /** จำนวนครั้งที่ตรวจพบบาร์โค้ดแต่ไม่พบสินค้าในระบบ หรือค้นหาด้วยมือไม่พบ */
  failedCount: number;
  /** จำนวนครั้งที่ดำเนินการทั้งหมด */
  totalAttempts: number;
}

export interface ScanFeedbackResult {
  /** สถานะผลลัพธ์ */
  status: 'SUCCESS' | 'NOT_FOUND';
  /** รหัสบาร์โค้ด */
  barcode: string;
  /** ชื่อสินค้า (กรณีพบ) */
  productName?: string;
  /** ราคาขายต่อหน่วย (กรณีพบ) */
  price?: number;
  /** เวลาที่สแกน (Unix timestamp ms) */
  timestamp: number;
}
