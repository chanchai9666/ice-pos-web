/**
 * Navigation & Scanner Helper Functions
 * โครงการ ice-pos-web
 */

export const OPEN_CAMERA_SCANNER_EVENT = 'ice-pos:open-camera-scanner';

export interface RouterLike {
  push: (href: string) => void;
  replace?: (href: string) => void;
}

/**
 * สั่งเปิดกล้องสแกนบาร์โค้ดสินค้าจากแถบนำทาง (Navbar) หรือจุดอื่น ๆ ของแอพพลิเคชัน
 * - หากอยู่ในหน้าขาย /pos อยู่แล้ว จะส่ง Custom Event เพื่อเปิด PosCameraScannerModal ทันทีโดยไม่ต้อง reload
 * - หากอยู่หน้าอื่น จะนำทางไปยัง /pos?scan=camera เพื่อให้หน้าขายเปิดกล้องสแกนให้อัตโนมัติ
 */
export function triggerCameraScanner(router: RouterLike, pathname: string): void {
  if (pathname === '/pos') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPEN_CAMERA_SCANNER_EVENT));
    }
  } else {
    router.push('/pos?scan=camera');
  }
}
