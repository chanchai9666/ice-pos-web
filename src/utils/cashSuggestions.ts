/**
 * ยูทิลิตี้สำหรับคำนวณจำนวนเงินสดแนะนำ (Smart Cash Suggestions)
 * สำหรับหน้าจอชำระเงิน POS เมื่อลูกค้าชำระด้วยเงินสดแต่ไม่พอดี
 * โครงการ ice-pos-web
 */

import { toBaht } from '@/utils/currencyHelper';

/**
 * รายการธนบัตรหลักของไทยสำหรับปุ่มบวกเงินสดสะสม (+Banknotes)
 */
export const THAI_ADDITIVE_BANKNOTES = [20, 50, 100, 500] as const;

/**
 * คำนวณยอดเงินสดแนะนำ (Smart Cash Suggestions) อิงจากยอดรวมสุทธิ
 * เพื่อให้แคชเชียร์สามารถแตะ 1 ครั้งเมื่อลูกค้ายื่นธนบัตรทั่วไปในไทย
 * 
 * ตัวอย่าง: ยอด 135 บาท
 * -> 140 (ปัดเศษ 20)
 * -> 150 (ปัดเศษ 50)
 * -> 200 (ปัดเศษ 100 ถัดไป / 2x100)
 * -> 500 (ธนบัตร 500)
 * -> 1,000 (ธนบัตร 1,000)
 * 
 * @param grandTotalSatang ยอดรวมสุทธิในหน่วยสตางค์
 * @returns รายการตัวเลขยอดเงิน (บาท) ที่แนะนำ เรียงจากน้อยไปมาก โดยทุกค่า > ยอดรวมจริง
 */
export function getSmartCashSuggestions(grandTotalSatang: number): number[] {
  if (grandTotalSatang <= 0) {
    return [100, 500, 1000];
  }

  const totalBaht = toBaht(grandTotalSatang);
  const suggestionsSet = new Set<number>();

  // 1. ปัดเศษขึ้นตามหน่วย 10 หรือ 20 (สำหรับยอดเงินย่อย)
  if (totalBaht < 100) {
    const next10 = Math.ceil(totalBaht / 10) * 10;
    if (next10 > totalBaht) suggestionsSet.add(next10);

    const next20 = Math.ceil(totalBaht / 20) * 20;
    if (next20 > totalBaht) suggestionsSet.add(next20);
  } else if (totalBaht < 500) {
    const next20 = Math.ceil(totalBaht / 20) * 20;
    if (next20 > totalBaht) suggestionsSet.add(next20);
  }

  // 2. ปัดเศษขึ้นตามหน่วย 50
  const next50 = Math.ceil(totalBaht / 50) * 50;
  if (next50 > totalBaht) {
    suggestionsSet.add(next50);
  }

  // 3. ปัดเศษขึ้นตามหน่วย 100 (ธนบัตร 100 ใบถัดไป)
  const next100 = Math.ceil(totalBaht / 100) * 100;
  if (next100 > totalBaht) {
    suggestionsSet.add(next100);
  }

  // 4. แนะนำธนบัตร 500 หากยอดรวม < 500 หรือปัดเศษ 500 ถัดไป
  if (totalBaht < 500) {
    suggestionsSet.add(500);
  } else {
    const next500 = Math.ceil(totalBaht / 500) * 500;
    if (next500 > totalBaht) {
      suggestionsSet.add(next500);
    }
  }

  // 5. แนะนำธนบัตร 1,000 หากยอดรวม < 1000 หรือปัดเศษ 1,000 ถัดไป
  if (totalBaht < 1000) {
    suggestionsSet.add(1000);
  } else {
    const next1000 = Math.ceil(totalBaht / 1000) * 1000;
    if (next1000 > totalBaht) {
      suggestionsSet.add(next1000);
    }
  }

  // เรียงลำดับจากน้อยไปมาก และจำกัดจำนวนไม่เกิน 6 ปุ่มเพื่อไม่ให้รกหน้าจอ
  const sorted = Array.from(suggestionsSet).sort((a, b) => a - b);
  return sorted.slice(0, 5);
}

