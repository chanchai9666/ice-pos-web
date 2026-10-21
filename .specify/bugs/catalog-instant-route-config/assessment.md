# Bug Assessment: Next.js can't recognize exported instant field in Client Component

- **Slug**: catalog-instant-route-config
- **Created**: 2026-10-21T16:10:00+07:00
- **Source**: pasted text (Terminal Buffer PID 27985)
- **Verdict**: valid
- **Severity**: critical

## Report (verbatim or summarized)

```text
Error: Next.js can't recognize the exported `instant` field in route. "instant" is a route segment config and can only be used when the segment is a Server Component module. Remove the "use client" directive to use this API.
  15 | import { Icons } from '@/components/ui/Icons';
  16 |
> 17 | export const instant = false;
     |              ^^^^^^^^^^^^^^^
  18 |
  19 | export default function CatalogPage() {
  20 |   const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

The exported configuration object in a source file needs to have a very specific format from which some properties can be statically parsed at compiled-time.

Import traces:
  Client Component Browser:
    ./src/app/(main)/catalog/page.tsx [Client Component Browser]
    ./src/app/(main)/catalog/page.tsx [Server Component]

  Client Component SSR:
    ./src/app/(main)/catalog/page.tsx [Client Component SSR]
    ./src/app/(main)/catalog/page.tsx [Server Component]

https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config

 GET /catalog 500 in 14ms (next.js: 4ms, application-code: 10ms)
[browser] Uncaught Error: ./src/app/(main)/catalog/page.tsx:17:14
```

## Symptom

เมื่อเปิดหน้าจอ `/catalog` เกิดข้อผิดพลาด HTTP 500 และแสดงหน้าจอข้อผิดพลาดในเบราว์เซอร์: `Next.js can't recognize the exported instant field in route` ส่งผลให้หน้าจัดการแคตตาล็อกสินค้าไม่สามารถแสดงผลได้เลย

## Reproduction

1. รันเซิร์ฟเวอร์ Next.js ในโหมด Development ด้วยคำสั่ง `npm run dev`
2. เปิดเบราว์เซอร์แล้วนำทางไปยัง `http://localhost:3000/catalog`
3. พบข้อผิดพลาด HTTP 500 พร้อม error message ระบุว่าไม่สามารถ export `instant` field ใน Client Component module

## Suspected Code Paths

- `src/app/(main)/catalog/page.tsx:17` — มีการใส่คำสั่ง `export const instant = false;` ในไฟล์ที่มี `'use client'`

## Root Cause Hypothesis

ใน Next.js (App Router) การตั้งค่า Route Segment Config (เช่น `instant`, `dynamic`, `revalidate`) สามารถ export ได้เฉพาะใน Server Component modules เท่านั้น เนื่องจากไฟล์ `src/app/(main)/catalog/page.tsx` มีการระบุ `'use client'` ที่บรรทัดแรก เมื่อ Next.js compiler ตรวจพบการ export `instant` จึงโยนข้อผิดพลาด runtime compilation error ทันที ความมั่นใจในการวิเคราะห์: **High**

## Proposed Remediation

**Preferred**: ลบคำสั่ง `export const instant = false;` ออกจาก `src/app/(main)/catalog/page.tsx` โดยตรง ซึ่งจะทำให้ Next.js ทำงานและคอมไพล์หน้า Client Component ของ `/catalog` ได้อย่างถูกต้องและคืนสถานะ HTTP 200 ปกติ

**Alternatives** (optional):
- แยกไฟล์ออกเป็น Server Component (`page.tsx`) และ Client Component (`CatalogClientView.tsx`) หากจำเป็นต้องกำหนด Route Segment Config ที่ระดับ Server Component

**Files likely to change**:
- `src/app/(main)/catalog/page.tsx`

**Tests to add or update**:
- ทดสอบเข้าหน้า `http://localhost:3000/catalog` คืนค่า HTTP 200 และเรนเดอร์หน้าจอสินค้าสำเร็จ

## Risks & Considerations

- ความเสี่ยงต่ำมาก (Low risk) เนื่องจากเป็นการนำคำสั่งที่ไม่รองรับใน Client Component ออก

## Open Questions

- ไม่มีข้อสงสัยค้างคา (None)
