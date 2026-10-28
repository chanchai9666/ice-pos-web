/**
 * ประเภทข้อมูลสำหรับใบเสร็จรับเงิน (Receipt Types)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: GET /receipts/{receiptNo}
 * DTO: ice-pos-api_internal_delivery_http_dto.ReceiptResponse
 */

export interface ReceiptResponse {
  id: string;               // รหัสใบเสร็จ (UUID)
  receiptNo: string;        // เลขที่ใบเสร็จ (เช่น RCP-BR-000104)
  refId: string;            // รหัสอ้างอิงบิลขาย (Sale UUID)
  type: string;             // ชนิดใบเสร็จ (เช่น SALE)
  contentJson: string;      // ข้อมูล Snapshot ใบเสร็จในรูปแบบ JSON String
  printCount: number;       // จำนวนครั้งที่สั่งพิมพ์ (เริ่มต้น 1)
  createdAt: string;        // วันเวลาที่ออกใบเสร็จ
}

/**
 * โครงสร้างข้อมูลเมื่อ Parse contentJson ของใบเสร็จรับเงิน
 */
export interface ReceiptItemContent {
  name: string;
  qty: number;
  unitPrice: number;        // สตางค์
  lineDiscount?: number;    // สตางค์
  lineTotal: number;        // สตางค์
  uomName?: string;
}

export interface ReceiptPaymentContent {
  method: string;
  amount: number;           // สตางค์
  tenderedAmount?: number;  // สตางค์
  changeAmount?: number;    // สตางค์
}

export interface ReceiptParsedContent {
  storeName?: string;
  branchName?: string;
  branchAddress?: string;
  taxId?: string;
  receiptNo?: string;
  saleNo?: string;
  cashierName?: string;
  customerName?: string;
  occurredAt?: string;
  items?: ReceiptItemContent[];
  subTotal?: number;        // สตางค์
  vatAmount?: number;       // สตางค์
  discountAmount?: number;  // สตางค์
  grandTotal?: number;      // สตางค์
  payments?: ReceiptPaymentContent[];
  note?: string;
  [key: string]: unknown;
}
