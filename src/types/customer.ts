/**
 * ประเภทข้อมูลสำหรับระบบจัดการลูกค้าและบัญชีเงินเชื่อ (Customer & Credit Types)
 * โครงการ ice-pos-web
 */

/**
 * ข้อมูลสรุปลูกค้าสำหรับหน้าจอขายและเลือกชำระเงินเชื่อ (Customer Summary)
 */
export interface CustomerSummary {
  id: string;                       // รหัสลูกค้า (UUID)
  code: string;                     // รหัสอ้างอิงลูกค้า (เช่น "CUST-0001")
  name: string;                     // ชื่อลูกค้าหรือชื่อร้านค้า
  phone?: string;                   // เบอร์โทรศัพท์
  creditLimit: number;              // วงเงินเครดิตสูงสุดที่ได้รับ (หน่วยสตางค์)
  outstandingBalance: number;       // ยอดหนี้คงค้างปัจจุบัน (หน่วยสตางค์)
  availableCredit: number;          // วงเงินคงเหลือที่ใช้ได้ (หน่วยสตางค์: creditLimit - outstandingBalance)
  isActive: boolean;
}
