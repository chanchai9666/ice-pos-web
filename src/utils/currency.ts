/**
 * เครื่องมือจัดการหน่วยเงิน (Currency Utilities)
 * สำหรับแปลงหน่วยเงินระหว่าง สตางค์ (Backend Integer) และ บาท (UI Decimal)
 * โครงการ ice-pos-web
 */

/**
 * แปลงจำนวนเงินหน่วยสตางค์ (satang) เป็นข้อความบาทพร้อมทศนิยม 2 ตำแหน่ง
 * ตัวอย่าง: 4500 -> "45.00", 2550 -> "25.50"
 */
export function formatSatangToBaht(satang?: number | null): string {
  if (satang === undefined || satang === null || isNaN(satang)) {
    return '0.00';
  }
  const baht = satang / 100;
  return baht.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * แปลงจำนวนเงินหน่วยสตางค์ (satang) เป็นตัวเลขบาท (number)
 */
export function satangToBahtNumber(satang?: number | null): number {
  if (satang === undefined || satang === null || isNaN(satang)) {
    return 0;
  }
  return Math.round(satang) / 100;
}

/**
 * แปลงจำนวนเงินบาท (string หรือ number) เป็นสตางค์ (integer) สำหรับส่งให้ API
 * ป้องกันปัญหา Floating-point precision เช่น 19.99 * 100 = 1998.9999999999998
 * ตัวอย่าง: "45.00" -> 4500, 45 -> 4500, "12.5" -> 1250
 */
export function bahtToSatang(baht?: string | number | null): number {
  if (baht === undefined || baht === null || baht === '') {
    return 0;
  }
  const numBaht = typeof baht === 'string' ? parseFloat(baht.replace(/,/g, '')) : baht;
  if (isNaN(numBaht) || numBaht < 0) {
    return 0;
  }
  return Math.round(numBaht * 100);
}
