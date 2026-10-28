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
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.SaleLineResponse
 * หมายเหตุ: สเปกส่ง product เป็น object เต็ม ไม่ได้แบน productName/uomName
 */
export interface SaleLineResponse {
  id: string;
  productId: string;
  product?: {
    id?: string;
    name?: string;
    sku?: string;
    [key: string]: unknown;
  } | null;
  uomId: string;
  qty: number;
  unitPrice: number;        // หน่วยสตางค์
  lineDiscount?: number;    // หน่วยสตางค์
  grossTotal?: number;      // หน่วยสตางค์
  netTotal?: number;        // หน่วยสตางค์
  taxAmount?: number;       // หน่วยสตางค์
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
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.SaleResponse
 */
export interface SaleResponse {
  id: string;                       // รหัสบิลขาย (UUID)
  saleNo: string;                   // เลขที่บิลขาย (เช่น "BR-000104")
  branchId: string;                 // รหัสสาขา
  shiftId?: string;                 // รหัสกะการขาย
  cashierId: string;                // รหัสแคชเชียร์
  customerId?: string;              // รหัสลูกค้า (ถ้ามี)
  status: 'COMPLETED' | 'VOIDED' | string; // สถานะบิลขาย
  subTotal?: number;                // ยอดก่อนภาษี/ส่วนลด (หน่วยสตางค์)
  vatAmount?: number;               // ยอดภาษีมูลค่าเพิ่ม (หน่วยสตางค์)
  grandTotal: number;               // ยอดสุทธิทั้งบิล (หน่วยสตางค์)
  billDiscount: number;             // ส่วนลดระดับบิล (หน่วยสตางค์)
  creditPart?: number;              // ยอดเงินเชื่อ (หน่วยสตางค์)
  note?: string;                    // หมายเหตุบิล
  occurredAt?: string;              // วันเวลาที่เกิดรายการ
  idempotencyKey?: string;
  version?: number;
  lines: SaleLineResponse[];        // รายการสินค้า
  payments: SalePaymentResponse[];  // รายการการชำระเงิน
  createdAt: string;                // วันเวลาที่สร้างบิล
}

/**
 * ข้อมูลคำขอยกเลิกบิลขาย (Void Sale Request Body)
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.VoidSaleRequest
 */
export interface VoidSaleRequest {
  reason: string;                   // เหตุผลในการยกเลิก (3-500 ตัวอักษร)
}

/**
 * ตัวกรองสำหรับการค้นหาประวัติการขาย (Sales Query Parameters)
 * อ้างอิงพารามิเตอร์ Swagger: GET /sales
 */
export interface SalesQueryParams {
  branchId?: string;                // กรองตามสาขา
  cashierId?: string;               // กรองตามแคชเชียร์
  customerId?: string;              // กรองตามลูกค้า
  status?: string;                  // COMPLETED, VOID, CREDIT_PENDING
  startDate?: string;               // วันที่เริ่มต้น ISO8601
  endDate?: string;                 // วันที่สิ้นสุด ISO8601
  page?: number;                    // หน้าเริ่มต้น 1
  pageSize?: number;                // จำนวนรายการต่อหน้า (เริ่มต้น 20, สูงสุด 100)
}

