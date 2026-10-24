/**
 * ประเภทข้อมูลสำหรับระบบจุดขายสินค้าหน้าร้าน (POS Types)
 * โครงการ ice-pos-web
 */

import { Product } from '@/types/catalog';

/**
 * ข้อมูลรายการสินค้าในตะกร้าขาย (Cart Item)
 */
export interface CartItem {
  id: string;              // รหัสระบุรายการในตะกร้า (UUID หรือ Product ID)
  productId: string;       // รหัสสินค้า
  name: string;            // ชื่อสินค้าภาษาไทย
  sku: string;             // รหัส SKU
  barcode?: string;        // รหัสบาร์โค้ด
  price: number;           // ราคาขายต่อหน่วย (หน่วยสตางค์ หรือบาทตาม API)
  quantity: number;        // จำนวนสินค้า (รองรับทศนิยมสำหรับสินค้าชั่งน้ำหนัก)
  uomId: string;           // รหัสหน่วยนับสินค้า (UUID จาก product.baseUomId หรือ baseUom.id)
  uomName: string;         // ชื่อหน่วยนับ (เช่น "ชิ้น", "ขวด", "กิโลกรัม")
  imageUrl?: string;       // URL รูปภาพสินค้า
  categoryName?: string;   // ชื่อหมวดหมู่
  taxRatePercent: number;  // อัตราภาษี (%)
  pricingType: 'PIECE' | 'WEIGHT'; // ประเภทการคิดราคา
  lineTotal: number;       // ราคารวมของรายการนี้ (price * quantity)
  isHighlighted?: boolean; // สถานะไฮไลต์ชั่วคราวเมื่อเพิ่งเพิ่มหรืออัปเดตรายการ
}

/**
 * สรุปยอดเงินของตะกร้าขาย (Cart Summary)
 */
export interface CartSummary {
  itemCount: number;       // จำนวนชนิดสินค้า (จำนวนรายการ)
  totalQuantity: number;   // จำนวนชิ้นสินค้ารวม
  subtotal: number;        // ยอดรวมก่อนภาษี (บาท)
  taxAmount: number;       // ภาษีมูลค่าเพิ่มรวม (บาท)
  discountAmount: number;  // ส่วนลดรวม (บาท)
  grandTotal: number;      // ยอดสุทธิที่ต้องชำระ (บาท)
}

/**
 * ผลลัพธ์จากการสแกนบาร์โค้ด (Scan Result)
 */
export interface BarcodeScanResult {
  code: string;
  source: 'HARDWARE' | 'CAMERA' | 'MANUAL';
  timestamp: number;
  status: 'SUCCESS' | 'NOT_FOUND' | 'ERROR';
  product?: Product;
  message?: string;
}

/**
 * ข้อมูลแจ้งเตือนการสแกนแบบชั่วคราว (Scan Toast Notification)
 */
export interface ScanToast {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'INFO';
  title: string;
  message: string;
  code?: string;
  timestamp: number;
}
