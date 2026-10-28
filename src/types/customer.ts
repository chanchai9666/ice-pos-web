/**
 * ประเภทข้อมูลสำหรับระบบจัดการลูกค้าและบัญชีเงินเชื่อ (Customer & Credit Types)
 * โครงการ ice-pos-web
 */

/**
 * ข้อมูลสรุปลูกค้าสำหรับหน้าจอขายและเลือกชำระเงินเชื่อ (Customer Summary)
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.CustomerResponse
 * หมายเหตุ: availableCredit ไม่มีในสเปก — คำนวณจาก creditLimit - outstandingBalance
 */
export interface CustomerSummary {
  id: string;                       // รหัสลูกค้า (UUID)
  code?: string;                    // รหัสอ้างอิงลูกค้า — สเปกไม่ได้ประกาศฟิลด์นี้ ต้องยืนยันกับ backend
  name: string;                     // ชื่อลูกค้าหรือชื่อร้านค้า
  phone?: string;                   // เบอร์โทรศัพท์
  email?: string;
  branchId?: string;
  isMember?: boolean;
  points?: number;
  creditLimit: number;              // วงเงินเครดิตสูงสุดที่ได้รับ (หน่วยสตางค์)
  outstandingBalance: number;       // ยอดหนี้คงค้างปัจจุบัน (หน่วยสตางค์)
  creditStatus?: string;            // สถานะเครดิตจาก backend
  isActive?: boolean;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * คำนวณวงเงินคงเหลือที่ใช้ได้ (หน่วยสตางค์)
 * สเปกไม่ได้ส่ง availableCredit มาให้ — ต้องคำนวณเองทุกครั้ง
 */
export function getAvailableCredit(customer: CustomerSummary): number {
  return customer.creditLimit - customer.outstandingBalance;
}
