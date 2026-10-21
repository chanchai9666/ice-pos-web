/**
 * ประเภทข้อมูลสำหรับระบบกะการทำงานและลิ้นชักเก็บเงิน (Shift Types)
 * โครงการ ice-pos-web
 */

/**
 * ข้อมูลกะการขาย (Shift Info)
 */
export interface ShiftInfo {
  id: string;              // รหัสกะ (UUID)
  branchId: string;        // รหัสสาขา
  cashierId: string;       // รหัสแคชเชียร์
  cashierName?: string;    // ชื่อแคชเชียร์
  openedAt: string;        // วันเวลาเปิดกะ
  closedAt?: string | null;// วันเวลาปิดกะ
  startingCash: number;    // เงินทอนเริ่มต้น (สตางค์)
  endingCash?: number | null; // เงินสดคงเหลือตอนปิดกะ (สตางค์)
  systemExpectedCash?: number; // เงินสดที่ระบบคำนวณคาดหวัง (สตางค์)
  differenceAmount?: number;   // ผลต่างเงินสดขาด/เกิน (สตางค์)
  status: 'OPEN' | 'CLOSED';  // สถานะกะ
  notes?: string;          // บันทึกเพิ่มเติม
}

/**
 * ข้อมูลคำขอเปิดกะการขาย (Open Shift Request)
 */
export interface OpenShiftRequest {
  branchId: string;
  startingCash: number;    // เงินทอนเริ่มต้น (หน่วยสตางค์ หรือบาทแปลงตามสัญญา API)
  notes?: string;
}

/**
 * ข้อมูลคำขอปิดกะการขาย (Close Shift Request)
 */
export interface CloseShiftRequest {
  endingCash: number;      // เงินสดที่นับได้จริงในลิ้นชัก
  notes?: string;
}
