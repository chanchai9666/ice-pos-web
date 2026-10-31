/**
 * เครื่องมือจัดการหน่วยเงิน (Currency Utilities)
 * โครงการ ice-pos-web
 *
 * @deprecated ไฟล์นี้คงไว้เพื่อความเข้ากันได้ย้อนหลัง (Backward Compatibility) เท่านั้น
 * แนะนำให้เปลี่ยนไปใช้ `@/utils/currencyHelper` (`toSatang`, `toBaht`, `formatSatangToBaht`, `formatBaht`) แทน
 */

import {
  toSatang as helperToSatang,
  toBaht as helperToBaht,
  formatSatangToBaht as helperFormatSatangToBaht,
  formatBaht as helperFormatBaht,
  bahtToSatang as helperBahtToSatang,
  satangToBahtNumber as helperSatangToBahtNumber,
} from './currencyHelper';

/**
 * @deprecated แนะนำให้ใช้ `formatSatangToBaht` จาก `@/utils/currencyHelper` แทน
 */
export const formatSatangToBaht = helperFormatSatangToBaht;

/**
 * @deprecated แนะนำให้ใช้ `toBaht` หรือ `satangToBahtNumber` จาก `@/utils/currencyHelper` แทน
 */
export const satangToBahtNumber = helperSatangToBahtNumber;

/**
 * @deprecated แนะนำให้ใช้ `toSatang` หรือ `bahtToSatang` จาก `@/utils/currencyHelper` แทน
 */
export const bahtToSatang = helperBahtToSatang;

/**
 * @deprecated แนะนำให้ใช้ `toSatang` จาก `@/utils/currencyHelper` แทน
 */
export const toSatang = helperToSatang;

/**
 * @deprecated แนะนำให้ใช้ `toBaht` จาก `@/utils/currencyHelper` แทน
 */
export const toBaht = helperToBaht;

/**
 * @deprecated แนะนำให้ใช้ `formatBaht` จาก `@/utils/currencyHelper` แทน
 */
export const formatBaht = helperFormatBaht;
