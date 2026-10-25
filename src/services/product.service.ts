/**
 * เซอร์วิสสินค้า (Product Service)
 * โครงการ ice-pos-web
 *
 * อ้างอิงและเชื่อมโยงกับ catalogService เพื่อรองรับการค้นหาและกรองรายการสินค้า
 */

import { catalogService } from './catalog.service';

export const productService = catalogService;
export default productService;
