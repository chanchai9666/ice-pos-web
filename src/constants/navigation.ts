/**
 * ค่าคงที่รายการเมนูหลักและสิทธิ์การเข้าถึง (Navigation Menu Configuration)
 * โครงการ ice-pos-web
 */

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  allowedRoles: string[];
  badge?: string;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'แดชบอร์ดภาพรวม',
    path: '/dashboard',
    iconName: 'LayoutDashboard',
    allowedRoles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'pos',
    label: 'ขายหน้าร้าน (POS)',
    path: '/pos',
    iconName: 'ShoppingCart',
    allowedRoles: ['ADMIN', 'MANAGER', 'CASHIER'],
  },
  {
    id: 'catalog',
    label: 'จัดการสินค้าและหมวดหมู่',
    path: '/catalog',
    iconName: 'Package',
    allowedRoles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'inventory',
    label: 'คลังและสต็อกสินค้า',
    path: '/inventory',
    iconName: 'Boxes',
    allowedRoles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'customers',
    label: 'ลูกค้าและเงินเชื่อ',
    path: '/customers',
    iconName: 'Users',
    allowedRoles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'reports',
    label: 'รายงานสรุปยอดขาย',
    path: '/reports',
    iconName: 'BarChart3',
    allowedRoles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'users',
    label: 'จัดการพนักงาน',
    path: '/users',
    iconName: 'UserCog',
    allowedRoles: ['ADMIN'],
  },
];

/**
 * ฟังก์ชันช่วยกรองรายการเมนูตามบทบาทผู้ใช้
 */
export function getNavItemsForRole(role?: string | null): NavItem[] {
  if (!role) return [];
  const normalizedRole = role.toUpperCase();
  return MAIN_NAV_ITEMS.filter((item) =>
    item.allowedRoles.includes(normalizedRole)
  );
}

/**
 * ฟังก์ชันตรวจสอบว่า Role ปัจจุบันได้รับอนุญาตให้เข้าถึง Path นี้หรือไม่
 */
export function isRouteAllowedForRole(path: string, role?: string | null): boolean {
  if (!role) return false;

  // ตัด Query String หรือ Hash หากมีส่งเข้ามา
  const cleanPath = path.split('?')[0].split('#')[0];

  // เส้นทาง Root Path '/' อนุญาตให้ผ่านเสมอ เพื่อให้ตัวนำทาง (Redirect) ใน page.tsx ทำงานต่อไปยังปลายทางที่ถูกต้อง
  if (cleanPath === '/' || cleanPath === '') return true;

  const normalizedRole = role.toUpperCase();

  // ตรวจสอบกับรายการเมนูหลักที่ลงทะเบียนไว้
  const matchedItem = MAIN_NAV_ITEMS.find(
    (item) => cleanPath === item.path || cleanPath.startsWith(item.path + '/')
  );

  if (matchedItem) {
    return matchedItem.allowedRoles.includes(normalizedRole);
  }

  // สำหรับเส้นทางภายในที่ไม่ได้ลงทะเบียนใน MAIN_NAV_ITEMS:
  // แคชเชียร์ (CASHIER) อนุญาตเฉพาะเส้นทางขายหน้าร้าน (/pos) เท่านั้น หากเข้าหน้าอื่นที่ไม่ได้ลงทะเบียนให้ปฏิเสธ
  // อนุญาตเฉพาะผู้ดูแลระบบและผู้จัดการ (ADMIN, MANAGER) ให้เข้าถึงหน้าภายในที่ไม่ได้ลงทะเบียนได้
  return normalizedRole === 'ADMIN' || normalizedRole === 'MANAGER';
}
