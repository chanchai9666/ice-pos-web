/**
 * ประเภทข้อมูลสำหรับรายงานและการวิเคราะห์ (Report & Analytics Types)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญา Swagger: /reports
 */

/**
 * ข้อมูลสรุปยอดขาย กำไรขั้นต้น และภาษี
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.SalesSummaryResponse
 */
export interface SalesSummaryResponse {
  totalSales: number;        // ยอดขายรวม (หน่วยสตางค์)
  grossProfit: number;       // กำไรขั้นต้น (หน่วยสตางค์)
  totalCost: number;         // ต้นทุนขายรวม (COGS: หน่วยสตางค์)
  totalVat: number;          // ยอดภาษีมูลค่าเพิ่ม (หน่วยสตางค์)
  totalDiscount: number;     // ยอดส่วนลดรวม (หน่วยสตางค์)
  totalBills: number;        // จำนวนบิลทั้งหมด
  averageBillSize: number;   // ยอดขายเฉลี่ยต่อบิล (หน่วยสตางค์)
}

/**
 * ข้อมูลสินค้าขายดี
 * อ้างอิงสเปก: ice-pos-api_internal_delivery_http_dto.BestSellerResponse
 */
export interface BestSellerResponse {
  productId: string;
  productCode?: string;
  productName: string;
  totalQtySold: number;      // จำนวนที่ขายได้
  totalRevenue: number;      // รายได้รวม (หน่วยสตางค์)
  totalProfit: number;       // กำไรที่ได้ (หน่วยสตางค์)
}

/**
 * ตัวกรองสำหรับดึงรายงาน
 */
export interface ReportQueryParams {
  branchId?: string;
  startDate?: string;        // ISO8601
  endDate?: string;          // ISO8601
  limit?: number;
}
