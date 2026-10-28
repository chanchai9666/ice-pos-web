/**
 * ประเภทข้อมูลสำหรับระบบจัดการลูกค้าและบัญชีเงินเชื่อ (Customer & Credit Types)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: /customers
 */

/**
 * ข้อมูลสรุปลูกค้า (Customer Summary)
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.CustomerResponse
 * หมายเหตุ: availableCredit ไม่มีในสเปก — คำนวณจาก creditLimit - outstandingBalance
 */
export interface CustomerSummary {
  id: string;                       // รหัสลูกค้า (UUID)
  code?: string;                    // รหัสอ้างอิงลูกค้า
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

/**
 * ข้อมูลสำหรับลงทะเบียนลูกค้าใหม่
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.CreateCustomerRequest
 */
export interface CreateCustomerRequest {
  name: string;                     // ชื่อลูกค้า (1-150 ตัวอักษร)
  phone?: string;
  email?: string;
  branchId?: string;
  isMember?: boolean;
  creditLimit?: number;             // หน่วยสตางค์
  initialCreditLimit?: number;      // หน่วยสตางค์
}

/**
 * ข้อมูลสำหรับแก้ไขข้อมูลลูกค้า
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.UpdateCustomerRequest
 */
export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  email?: string;
  isMember?: boolean;
  isActive?: boolean;
}

/**
 * ข้อมูลสำหรับกำหนดหรือปรับวงเงินเครดิต
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.SetCreditLimitRequest
 */
export interface SetCreditLimitRequest {
  creditLimit: number;              // หน่วยสตางค์ (จำนวนเต็ม >= 0)
}

/**
 * ข้อมูลสำหรับบันทึกการรับชำระหนี้จากลูกค้า
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.PayCreditRequest
 */
export interface PayCreditRequest {
  amount: number;                   // จำนวนเงินที่ชำระ (หน่วยสตางค์)
  paymentMethod: 'CASH' | 'QR_PROMPTPAY' | 'CARD' | 'WALLET' | string;
  note?: string;
  idempotencyKey?: string;
}

/**
 * รายละเอียดธุรกรรมประวัติเครดิต
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.CreditTransactionResponse
 */
export interface CreditTransactionResponse {
  id: string;
  customerId: string;
  accountId?: string;
  type?: string;
  amount: number;                   // หน่วยสตางค์
  balanceAfter: number;             // หน่วยสตางค์
  paymentMethod?: string;
  refId?: string;
  refType?: string;
  note?: string;
  occurredAt?: string;
  createdAt?: string;
}

/**
 * ข้อมูลรายงานลูกหนี้ค้างชำระตามอายุหนี้
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.ARAgingItemResponse
 */
export interface ARAgingItemResponse {
  customerId: string;
  customerName: string;
  phone?: string;
  creditLimit: number;              // หน่วยสตางค์
  outstandingBalance: number;       // หน่วยสตางค์
  currentDue: number;               // 0-30 วัน (หน่วยสตางค์)
  due30To60: number;                // 31-60 วัน (หน่วยสตางค์)
  due60To90: number;                // 61-90 วัน (หน่วยสตางค์)
  over90: number;                   // 90+ วัน (หน่วยสตางค์)
  status?: string;
}
