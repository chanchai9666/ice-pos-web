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
  const normalizedRole = role.toUpperCase();
  const matchedItem = MAIN_NAV_ITEMS.find(
    (item) => path === item.path || path.startsWith(item.path + '/')
  );
  if (!matchedItem) return true; // ถ้าไม่ใช่ Path ใน Nav List หลัก ให้ผ่านได้ (เช่น default page)
  return matchedItem.allowedRoles.includes(normalizedRole);
}
