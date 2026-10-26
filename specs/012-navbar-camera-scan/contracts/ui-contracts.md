# Phase 1: UI Component Contracts

**Feature**: ปุ่มสแกนสินค้าด้วยกล้องบน Navbar (Navbar Camera Product Scanner Button)  
**Branch**: `012-navbar-camera-scan`  
**Date**: 2026-10-26  

---

## 1. AppHeader Component Contract (`src/components/layout/AppHeader.tsx`)

### Props Interface
```typescript
export interface AppHeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}
```

### Visual & Behavioral Requirements
- **ปุ่มสแกนกล้องบน Desktop (`>= 1024px`)**:
  - แสดงผลในฝั่งขวาของแถบ Header ถัดจากกล่องข้อมูลสาขา
  - ขนาดพื้นที่สัมผัส: `min-h-[48px]`, `px-3.5`, `py-2` (Elderly-Friendly standard)
  - สไตล์: พื้นหลัง `bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30`, ขอบ `border border-cyan-500/40`, ข้อความสี `text-cyan-300 font-medium`
  - ไอคอน: `<Icons.Camera className="w-5 h-5 text-cyan-400" />`
  - ข้อความกำกับ: `"สแกนสินค้า"` (ซ่อนบนหน้าจอที่เล็กกว่า `lg`)
  - พฤติกรรมเมื่อคลิก: เรียก `triggerCameraScanner(router, pathname)`
  - บนอุปกรณ์ขนาดเล็ก (`< 1024px`): ซ่อนปุ่มนี้ (`hidden lg:flex`) เพื่อไม่ให้พื้นที่ Header แน่นเกินไป และปล่อยให้เป็นหน้าที่ของ `AppBottomNav`

---

## 2. AppBottomNav Component Contract (`src/components/layout/AppBottomNav.tsx`)

### Props Interface
```typescript
export interface AppBottomNavProps {
  onToggleMenu: () => void;
}
```

### Visual & Behavioral Requirements
- **ปุ่มสแกนกล้องบน Mobile/Tablet (`< 1024px`)**:
  - บรรจุเป็นหนึ่งในปุ่มหลักของแถบด้านล่าง หรือจัดวางตรงกลางเป็นปุ่ม Quick Action เด่นชัด
  - ขนาดพื้นที่สัมผัส: `min-h-[48px]`, `min-w-[48px]`
  - ไอคอน: `<Icons.Camera className="w-6 h-6" />`
  - ป้ายกำกับ: `"สแกน"`
  - สไตล์เด่นชัด: สีพื้นหลังไฮไลต์ Cyan Gradient หรือ Neon Glow ให้สังเกตง่าย
  - พฤติกรรมเมื่อแตะ: เรียก `triggerCameraScanner(router, pathname)`

---

## 3. POS Page Scanner Listener Contract (`src/app/(main)/pos/page.tsx`)

### Listener & Query Param Handling
```typescript
// ตรวจสอบ query param ?scan=camera เมื่อโหลดหรือเปลี่ยนหน้า
useEffect(() => {
  const scanParam = searchParams.get('scan');
  if (scanParam === 'camera') {
    if (activeShift) {
      setIsCameraModalOpen(true);
    } else {
      setIsOpenShiftModalOpen(true);
    }
    // ล้าง query param เพื่อไม่ให้เปิดซ้ำเมื่อ refresh
    router.replace('/pos', { scroll: false });
  }
}, [searchParams, activeShift, router]);

// รับ Custom Event จาก Navbar เมื่ออยู่ในหน้า POS อยู่แล้ว
useEffect(() => {
  const handleOpenScanner = () => {
    if (activeShift) {
      setIsCameraModalOpen(true);
    } else {
      setIsOpenShiftModalOpen(true);
    }
  };

  window.addEventListener('ice-pos:open-camera-scanner', handleOpenScanner);
  return () => {
    window.removeEventListener('ice-pos:open-camera-scanner', handleOpenScanner);
  };
}, [activeShift]);
```
