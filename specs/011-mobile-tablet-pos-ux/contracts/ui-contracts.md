# UI & Component Contracts: Mobile & Tablet POS Usability and Login Alignment

**Feature Branch**: `011-mobile-tablet-pos-ux`
**Date**: 2026-10-25

## 1. `CredentialLogin` Component Interface Contract

```typescript
export interface CredentialLoginProps {
  /** Callback เมื่อเข้าสู่ระบบสำเร็จ */
  onSuccess: (auth: AuthResponse) => void;
  /** Callback เมื่อเกิดข้อผิดพลาดในการเข้าสู่ระบบ */
  onError: (errorMessage: string) => void;
  /** สถานะถูกระงับชั่วคราวจาก Cooldown Lockout หรือไม่ */
  isLockedOut?: boolean;
}
```

### Visual Requirements & Constraints:
- Container must enforce `min-height: 480px` to `500px` (or `min-h-[490px]`) to maintain identical height to `PinLogin`.
- Internal elements centered vertically with `flex flex-col justify-center`.
- Touch target inputs: `input` field height `>= 48px` (`py-3` or `py-3.5`).
- Submit button: `min-h-[48px]` with clear loading spinner and disabled state.

---

## 2. `AppBottomNav` Component Interface Contract

```typescript
export interface AppBottomNavProps {
  /** ฟังก์ชันสลับเปิด Drawer เมนูข้าง */
  onToggleMenu: () => void;
  /** จำนวนสินค้าปัจจุบันในตะกร้า (ถ้ามี) สำหรับแสดง Badge */
  cartItemCount?: number;
}
```

### Visual & Behavior Constraints:
- Visibility: Visible only on viewports `< 1024px` (`lg:hidden`).
- Position: Sticky/Fixed at bottom with `z-40`, background `bg-slate-900/95 backdrop-blur-md border-t border-slate-800`.
- Safe Area Inset: Must apply `pb-[env(safe-area-inset-bottom)]`.
- Touch Targets: All navigation tab buttons must be at least `48x48px`.

---

## 3. `PosCartBottomSheet` Component Interface Contract

```typescript
export interface PosCartBottomSheetProps {
  /** สถานะเปิด/ปิดของ Bottom Sheet */
  isOpen: boolean;
  /** ฟังก์ชันสั่งปิด Bottom Sheet */
  onClose: () => void;
  /** ฟังก์ชันสั่งเริ่มขั้นตอนชำระเงิน */
  onCheckout: () => void;
  /** สถานะว่ากะการขายปัจจุบันเปิดอยู่หรือไม่ */
  isShiftActive: boolean;
}
```

### Visual & Behavior Constraints:
- Backdrop: Dark translucent backdrop (`bg-slate-950/70 backdrop-blur-sm z-50`).
- Container: Rounded top corners (`rounded-t-3xl`), slide-up animation (`translate-y-0` on open, `translate-y-full` on close).
- Height: Occupies `h-[85vh]` maximum with internal scroll for cart items.
- Footer: Fixed at bottom of the sheet with total amount display and checkout button (`min-h-[52px]`).
