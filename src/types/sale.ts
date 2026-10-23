/**
 * ประเภทข้อมูลสำหรับรายการขายและบิลขาย (Sale & Checkout Types)
 * โครงการ ice-pos-web
 */

export type PaymentMethodType =
  | 'CASH'
  | 'CARD'
  | 'QR_PROMPTPAY'
  | 'WALLET'
  | 'CREDIT'
  | 'TRANSFER';

/**
 * รายการสินค้าในคำขอสร้างรายการขาย (Create Sale Line Item)
 */
export interface CreateSaleLineItem {
  productId: string;        // UUID ของสินค้า
  uomId: string;            // UUID ของหน่วยนับ
  qty: number;              // จำนวนสินค้าที่ขาย
  unitPrice: number;        // ราคาต่อหน่วย (หน่วยสตางค์: satang)
  lineDiscount: number;     // ส่วนลดรายแถว (สตางค์, ส่งค่า 0 ในเฟสนี้)
}

/**
 * ข้อมูลการชำระเงินในคำขอสร้างรายการขาย (Create Sale Payment)
 */
export interface CreateSalePayment {
  method: PaymentMethodType; // วิธีการชำระเงิน
  amount: number;            // จำนวนเงินที่ตัดชำระ (หน่วยสตางค์)
  tenderedAmount?: number;   // จำนวนเงินที่รับมา (สตางค์, เฉพาะเงินสด)
  changeAmount?: number;     // จำนวนเงินทอน (สตางค์, เฉพาะเงินสด)
  ref?: string;              // รหัสอ้างอิง (เช่น qrRef หรือหมายเลขสลิป)
}

/**
 * ข้อมูลคำขอสร้างรายการขาย (Create Sale Request Body)
 */
export interface CreateSaleRequest {
  branchId: string;                 // UUID ของสาขา
  idempotencyKey: string;           // UUID ป้องกันการบันทึกซ้ำ
  billDiscount: number;             // ส่วนลดระดับบิล (สตางค์, ส่งค่า 0 ในเฟสนี้)
  customerId?: string;              // UUID ของลูกค้า (เฉพาะเมื่อชำระด้วย CREDIT)
  note?: string;                    // หมายเหตุบิลขาย
  occurredAt?: string;              // วันเวลาที่เกิดรายการ ISO8601
  lines: CreateSaleLineItem[];      // รายการสินค้า
  payments: CreateSalePayment[];    // รายการการชำระเงิน
}

/**
 * รายละเอียดแถวสินค้าในผลลัพธ์บิลขาย (Sale Line Item Response)
 */
export interface SaleLineResponse {
  id: string;
  productId: string;
  productName: string;
  uomId: string;
  uomName: string;
  quantity: number;
  unitPrice: number;        // หน่วยสตางค์
  lineTotal: number;        // หน่วยสตางค์
}

/**
 * รายละเอียดการชำระเงินในผลลัพธ์บิลขาย (Sale Payment Response)
 */
export interface SalePaymentResponse {
  id: string;
  method: PaymentMethodType;
  amount: number;           // หน่วยสตางค์
  tenderedAmount?: number;  // หน่วยสตางค์
  changeAmount?: number;    // หน่วยสตางค์
  ref?: string;
}

/**
 * ข้อมูลผลลัพธ์การบันทึกการขาย (Sale Response)
 */
export interface SaleResponse {
  id: string;                       // รหัสบิลขาย (UUID)
  saleNo: string;                   // เลขที่บิลขาย (เช่น "BR-000104")
  branchId: string;                 // รหัสสาขา
  shiftId?: string;                 // รหัสกะการขาย
  cashierId: string;                // รหัสแคชเชียร์
  customerId?: string;              // รหัสลูกค้า (ถ้ามี)
  status: 'COMPLETED' | 'VOIDED';   // สถานะบิลขาย
  grandTotal: number;               // ยอดสุทธิทั้งบิล (หน่วยสตางค์)
  billDiscount: number;             // ส่วนลดระดับบิล (หน่วยสตางค์)
  creditPart?: number;              // ยอดเงินเชื่อ (หน่วยสตางค์)
  idempotencyKey?: string;
  lines: SaleLineResponse[];        // รายการสินค้า
  payments: SalePaymentResponse[];  // รายการการชำระเงิน
  createdAt: string;                // วันเวลาที่สร้างบิล
}
