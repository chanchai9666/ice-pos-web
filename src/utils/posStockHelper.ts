/**
 * ตัวช่วยคำนวณและประมวลผลการแสดงผลสต็อกบนการ์ดสินค้า POS (POS Stock Presentation Helper)
 * โครงการ ice-pos-web
 */

import { Product } from '@/types/catalog';
import { ProductStockPresentation, StockLevelMap } from '@/types/inventory';

/**
 * คำนวณรูปแบบการแสดงผลขอบสี ป้ายสถานะ และข้อความคงเหลือสำหรับการ์ดสินค้าในหน้าจอ POS
 *
 * @param product ข้อมูลสินค้า
 * @param stockMap แมประดับสต็อกคงเหลือรายสาขา (productId -> quantity)
 * @returns โครงสร้างข้อมูลการแสดงผล ProductStockPresentation
 */
export function resolveProductStockPresentation(
  product: Product,
  stockMap: StockLevelMap = {}
): ProductStockPresentation {
  const isWeightBased = product.productType === 'BY_WEIGHT';

  // กรณีเป็นสินค้าประเภทชั่งขาย (ขายตามน้ำหนัก)
  if (isWeightBased) {
    return {
      isWeightBased: true,
      stockQuantity: 0,
      threshold: 0,
      status: 'IN_STOCK',
      cardBorderClass: 'border-2 border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 active:border-cyan-400',
      cardShadowClass: 'shadow-md hover:shadow-cyan-500/10',
      badgeText: 'ชั่งขาย',
      badgeClass: 'bg-amber-500 text-slate-950 font-black shadow-md',
      detailStockText: 'สินค้าชั่งขาย',
      detailStockColorClass: 'text-amber-600 dark:text-amber-400 font-semibold',
    };
  }

  // กรณีเป็นสินค้าขายตามหน่วยนับ/ชิ้น (ดึงสต็อกจริง หรือ fallback เป็น 0 เสมอหากไม่มีข้อมูล)
  const stockQuantity = typeof stockMap[product.id] === 'number' ? stockMap[product.id] : 0;
  const threshold =
    typeof product.minStock === 'number' && product.minStock > 0 ? product.minStock : 5;
  const unitName = product.baseUom?.name || 'ชิ้น';

  // 1. สินค้าหมดสต็อก (สต็อก <= 0) -> ขอบสีแดงหนา 2px, ป้ายสีแดง "สินค้าหมด"
  if (stockQuantity <= 0) {
    return {
      isWeightBased: false,
      stockQuantity,
      threshold,
      status: 'OUT_OF_STOCK',
      cardBorderClass: 'border-2 border-rose-500 hover:border-rose-400 active:border-rose-300',
      cardShadowClass: 'shadow-md shadow-rose-950/20 hover:shadow-rose-500/20',
      badgeText: 'สินค้าหมด',
      badgeClass: 'bg-rose-600 text-white font-bold shadow-md',
      detailStockText: `สินค้าหมด (คงเหลือ ${stockQuantity} ${unitName})`,
      detailStockColorClass: 'text-rose-400 font-bold',
    };
  }

  // 2. สินค้าใกล้หมดสต็อก (0 < สต็อก <= เกณฑ์เตือน) -> ขอบสีส้มหนา 2px, ป้ายสีส้ม "ใกล้หมด: X"
  if (stockQuantity <= threshold) {
    return {
      isWeightBased: false,
      stockQuantity,
      threshold,
      status: 'LOW_STOCK',
      cardBorderClass: 'border-2 border-amber-500 hover:border-amber-400 active:border-amber-300',
      cardShadowClass: 'shadow-md shadow-amber-950/20 hover:shadow-amber-500/20',
      badgeText: `ใกล้หมด: ${stockQuantity}`,
      badgeClass: 'bg-amber-500 text-slate-950 font-bold shadow-md',
      detailStockText: `คงเหลือ ${stockQuantity} ${unitName}`,
      detailStockColorClass: 'text-amber-400 font-semibold',
    };
  }

  // 3. สินค้ามีสต็อกปกติ (สต็อก > เกณฑ์เตือน) -> ขอบปกติ, ป้ายเขียว "คงเหลือ: X"
  return {
    isWeightBased: false,
    stockQuantity,
    threshold,
    status: 'IN_STOCK',
    cardBorderClass: 'border-2 border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 active:border-cyan-400',
    cardShadowClass: 'shadow-md hover:shadow-cyan-500/10',
    badgeText: `คงเหลือ: ${stockQuantity}`,
    badgeClass: 'bg-white/95 dark:bg-slate-950/85 backdrop-blur-sm text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/40',
    detailStockText: `คงเหลือ ${stockQuantity} ${unitName}`,
    detailStockColorClass: 'text-slate-600 dark:text-slate-400',
  };
}
