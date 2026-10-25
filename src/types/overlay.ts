/**
 * ประเภทข้อมูลสำหรับระบบ Global Action Loading Overlay
 * โครงการ ice-pos-web (ตามธรรมนูญการพัฒนาระบบ v1.5.1 ข้อ 6.6)
 */

/**
 * สถานะการแสดงผลของ Global Loading Overlay
 */
export interface OverlayState {
  /**
   * สถานะการเปิด/ปิดการแสดงผลของ Overlay
   */
  isVisible: boolean;

  /**
   * ข้อความภาษาไทยที่แสดงบน Overlay (เช่น "กำลังบันทึกข้อมูล...", "กำลังประมวลผล...")
   */
  message: string;

  /**
   * ตัวนับจำนวนคำขอ API ที่กำลังดำเนินการอยู่และไม่ได้เป็นแบบเงียบ (Reference Counting)
   */
  activeRequestsCount: number;

  /**
   * เวลาที่เริ่มแสดง Overlay (Timestamp ms) สำหรับคำนวณและตรวจสอบ Timeout
   */
  startTime: number | null;
}

/**
 * ฟังก์ชัน Callback สำหรับลงทะเบียนรับฟังการเปลี่ยนแปลงสถานะของ Overlay
 */
export type OverlayListener = (state: OverlayState) => void;

/**
 * โครงสร้างข้อมูลและฟังก์ชันที่ส่งผ่าน React Context
 */
export interface LoadingOverlayContextValue {
  /**
   * สถานะเปิด/ปิดของ Overlay
   */
  isLoading: boolean;

  /**
   * ข้อความที่กำลังแสดงผลบน Overlay
   */
  message: string;

  /**
   * สั่งเปิด Overlay ด้วยตนเอง
   */
  showOverlay: (message?: string) => void;

  /**
   * สั่งปิด Overlay
   */
  hideOverlay: () => void;

  /**
   * ตัวช่วยครอบฟังก์ชัน Async ให้แสดง Overlay อัตโนมัติจนกว่าจะทำงานเสร็จ
   */
  withOverlay: <T>(
    action: () => Promise<T>,
    message?: string,
    timeoutMs?: number
  ) => Promise<T>;
}
