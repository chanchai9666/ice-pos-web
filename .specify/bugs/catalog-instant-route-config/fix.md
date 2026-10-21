# Bug Fix: Next.js can't recognize exported instant field in Client Component

- **Slug**: catalog-instant-route-config
- **Fixed**: 2026-10-21T16:11:30+07:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

ลบคำสั่ง `export const instant = false;` ออกจาก `src/app/(main)/catalog/page.tsx` เนื่องจากเป็น Route Segment Config ที่ Next.js อนุญาตให้ใช้ได้เฉพาะใน Server Component modules เท่านั้น จึงทำให้ Client Component กลับมาทำงานได้ตามปกติและไม่เกิดข้อผิดพลาด 500 Compilation Error

## Changes

| File | Change | Notes |
|------|--------|-------|
| `src/app/(main)/catalog/page.tsx` | modified | ลบคำสั่ง `export const instant = false;` ออก |

## Diff Highlights (optional)

```diff
- export const instant = false;
-
  export default function CatalogPage() {
```

## Tests Added or Updated

- ตรวจสอบการคอมไพล์ TypeScript: `npx tsc --noEmit`
- ตรวจสอบการตอบสนองของเซิร์ฟเวอร์ Next.js ที่เส้นทาง `/catalog`

## Local Verification

- Commands run:
  - `npx tsc --noEmit` → สำเร็จ (exit code 0, 0 errors)
  - `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/catalog` → 403 (ตอบสนองตาม RouteGuard ปกติ ไม่ใช่ 500 error)
- Manual checks: ตรวจสอบไม่พบ error เรื่อง `instant` field ใน Next.js compilation trace อีกต่อไป

## Deviations from Assessment

ไม่มี (None — ดำเนินการตาม Preferred remediation ใน assessment.md ทุกประการ)

## Follow-ups

- รันคำสั่ง `/speckit-bug-test slug=catalog-instant-route-config` เพื่อตรวจสอบและยืนยันผลการแก้ไขบั๊ก
