/**
 * ประเภทข้อมูลสำหรับระบบกะการทำงานและลิ้นชักเก็บเงิน (Shift Types)
 * โครงการ ice-pos-web
 *
 * อ้างอิงสัญญาจริงจาก Swagger: docs/swagger.json
 */

/**
 * ข้อมูลกะการขาย (Shift Info)
 * ตรงกับ ice-pos-api_internal_delivery_http_dto.ShiftResponse
 */
export interface ShiftInfo {
  id: string;                 // รหัสกะ (UUID)
  branchId: string;           // รหัสสาขา
  cashierId: string;          // รหัสแคชเชียร์
  cashierName?: string;       // ชื่อแคชเชียร์ (API อาจไม่ส่งมา)
  openedAt: string;           // วันเวลาเปิดกะ
  closedAt?: string | null;   // วันเวลาปิดกะ
  openingCash: number;        // เงินทอนเริ่มต้น (สตางค์)
  countedCash?: number | null;    // เงินสดที่นับได้จริงตอนปิดกะ (สตางค์)
  expectedCash?: number | null;   // เงินสดที่ระบบคำนวณคาดหวัง (สตางค์)
  difference?: number | null;     // ผลต่างเงินสดขาด/เกิน (สตางค์)
  status: 'OPEN' | 'CLOSED';  // สถานะกะ
  notes?: string;             // บันทึกเพิ่มเติม (API อาจไม่ส่งมา)
}

/**
 * ข้อมูลคำขอเปิดกะการขาย (Open Shift Request)
 * ตรงกับ ice-pos-api_internal_delivery_http_dto.OpenShiftRequest
 */
export interface OpenShiftRequest {
  branchId: string;
  openingCash: number;        // เงินทอนเริ่มต้น (หน่วยสตางค์)
}

/**
 * ข้อมูลคำขอปิดกะการขาย (Close Shift Request)
 * ตรงกับ ice-pos-api_internal_delivery_http_dto.CloseShiftRequest
 */
export interface CloseShiftRequest {
  countedCash: number;        // เงินสดที่นับได้จริงในลิ้นชัก (หน่วยสตางค์)
}
