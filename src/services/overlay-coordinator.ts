/**
 * ตัวประสานงานและจัดการสถานะ Global Loading Overlay (Event-Driven Coordinator)
 * โครงการ ice-pos-web (ตามธรรมนูญการพัฒนาระบบ v1.5.1 ข้อ 6.6)
 */

import { OverlayListener, OverlayState } from '@/types/overlay';

const DEFAULT_MESSAGE = 'กำลังดำเนินการ กรุณารอสักครู่...';

class OverlayCoordinator {
  private state: OverlayState = {
    isVisible: false,
    message: DEFAULT_MESSAGE,
    activeRequestsCount: 0,
    startTime: null,
  };

  private listeners: Set<OverlayListener> = new Set();

  /**
   * แจ้งเตือนผู้รับฟังทั้งหมดเมื่อสถานะเปลี่ยนแปลง
   */
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('Error in overlay listener:', err);
      }
    });
  }

  /**
   * ดึงสำเนาสถานะปัจจุบัน
   */
  public getState(): OverlayState {
    return { ...this.state };
  }

  /**
   * ลงทะเบียนรับฟังการเปลี่ยนแปลงสถานะ
   * @param listener ฟังก์ชัน Callback
   * @returns ฟังก์ชันยกเลิกการลงทะเบียน (Unsubscribe)
   */
  public subscribe(listener: OverlayListener): () => void {
    this.listeners.add(listener);
    // ส่งสถานะเริ่มต้นให้ทันทีที่ลงทะเบียน
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * แจ้งเริ่มคำขอ API ใหม่ (เพิ่มตัวนับและเปิด Overlay)
   * @param message ข้อความภาษาไทยที่ต้องการแสดงผล
   */
  public startRequest(message?: string): void {
    this.state.activeRequestsCount += 1;
    if (message && message.trim() !== '') {
      this.state.message = message;
    } else if (this.state.activeRequestsCount === 1) {
      this.state.message = DEFAULT_MESSAGE;
    }
    this.state.isVisible = true;
    if (!this.state.startTime) {
      this.state.startTime = Date.now();
    }
    this.notifyListeners();
  }

  /**
   * แจ้งสิ้นสุดคำขอ API (ลดตัวนับ และปิด Overlay เมื่อคำขอหมด)
   */
  public endRequest(): void {
    this.state.activeRequestsCount = Math.max(0, this.state.activeRequestsCount - 1);
    if (this.state.activeRequestsCount === 0) {
      this.state.isVisible = false;
      this.state.message = DEFAULT_MESSAGE;
      this.state.startTime = null;
    }
    this.notifyListeners();
  }

  /**
   * บังคับปิด Overlay และล้างตัวนับทันทีในกรณีฉุกเฉินหรือ Timeout
   */
  public reset(): void {
    this.state.activeRequestsCount = 0;
    this.state.isVisible = false;
    this.state.message = DEFAULT_MESSAGE;
    this.state.startTime = null;
    this.notifyListeners();
  }
}

// Singleton Instance สำหรับใช้งานร่วมกันทั่วทั้งแอปพลิเคชัน
export const overlayCoordinator = new OverlayCoordinator();
