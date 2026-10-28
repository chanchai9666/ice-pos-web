/**
 * ยูทิลิตีสำหรับการจัดการหน่วยเงินและการแปลงค่าระหว่าง สตางค์ (Satang) และ บาท (THB)
 * โครงการ ice-pos-web
 */

/**
 * แปลงจำนวนเงินบาทเป็นสตางค์ (Satang) โดยปัดเศษทศนิยมอย่างถูกต้องเพื่อป้องกัน Floating Point Precision
 * เช่น 10.50 บาท -> 1050 สตางค์
 */
export function toSatang(baht: number | string | null | undefined): number {
  if (baht === null || baht === undefined || baht === '') return 0;
  const numBaht = typeof baht === 'string' ? parseFloat(baht) : baht;
  if (isNaN(numBaht)) return 0;
  return Math.round(numBaht * 100);
}

/**
 * แปลงสตางค์ (Satang) กลับเป็นบาท (THB)
 * เช่น 1050 สตางค์ -> 10.50 บาท
 */
export function toBaht(satang: number | null | undefined): number {
  if (satang === null || satang === undefined) return 0;
  return satang / 100;
}

/**
 * ฟอร์แมตสตางค์ (Satang) ให้เป็นสตริงเงินบาทที่อ่านง่ายพร้อมทศนิยม 2 ตำแหน่ง
 * เช่น 100000 -> "1,000.00 บาท" (หรือ "1,000.00" หาก showUnit = false)
 */
export function formatSatangToBaht(
  satang: number | null | undefined,
  options?: { showUnit?: boolean; minimumFractionDigits?: number }
): string {
  const baht = toBaht(satang);
  const formatted = baht.toLocaleString('th-TH', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: 2,
  });
  return options?.showUnit ? `${formatted} ฿` : formatted;
}

/**
 * ฟอร์แมตเงินบาทให้เป็นสตริงทศนิยม 2 ตำแหน่ง
 */
export function formatBaht(
  baht: number | string | null | undefined,
  options?: { showUnit?: boolean; minimumFractionDigits?: number }
): string {
  if (baht === null || baht === undefined || baht === '') return '0.00';
  const numBaht = typeof baht === 'string' ? parseFloat(baht) : baht;
  if (isNaN(numBaht)) return '0.00';
  const formatted = numBaht.toLocaleString('th-TH', {
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: 2,
  });
  return options?.showUnit ? `${formatted} ฿` : formatted;
}
