/**
 * ประเภทข้อมูลสำหรับระบบชำระเงินและ QR พร้อมเพย์ (Payment & QR Types)
 * โครงการ ice-pos-web
 */

/**
 * คำขอสร้าง Dynamic QR Code พร้อมเพย์
 */
export interface GenerateQRRequest {
  amount: number; // ยอดเงินที่ต้องการรับชำระ (หน่วยสตางค์: satang)
}

/**
 * ผลลัพธ์จากการสร้าง Dynamic QR Code พร้อมเพย์
 */
export interface QRPaymentResponse {
  qrRef: string;                    // รหัสอ้างอิง QR
  qrImageUrl: string;               // URL รูปภาพ QR พร้อมเพย์สำหรับแสดงผล
  amount: number;                   // ยอดเงินใน QR (หน่วยสตางค์)
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
}

/**
 * ข้อมูลการตรวจสอบสถานะการชำระเงินผ่าน QR พร้อมเพย์
 * หมายเหตุ: สเปกประกาศ data ของ /payments/{ref}/status เป็น object ลอย ๆ
 * ไม่มี DTO — ฟิลด์ด้านล่างอิงพฤติกรรมที่คาดหวัง ต้องยืนยันกับ backend
 */
export interface QRStatusResponse {
  qrRef: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'CANCELLED';
  paidAt?: string | null;
}
