# แผนงาน: ทำความเข้าใจ API — ICE POS v1.2.0

## บริบทที่ตรวจแล้ว

**แหล่งข้อมูล**
- Swagger UI: `http://localhost:8080/docs` — "ICE POS API - ระบบจัดการขายหน้าร้านและคลังสินค้า", version 1.2.0, OAS 2.0, host `localhost:8080`, basePath `/api/v1`
- สเปกดิบ: `http://localhost:8080/swagger/doc.json`
- ฝั่งหน้าบ้าน: `src/services/*.ts` (12 ไฟล์) + `src/types/*.ts` (11 ไฟล์)

**สถาปัตยกรรมที่เอกสารประกาศ**
Backend เป็น Go Fiber v3 แบบ Clean Architecture, ระบบ POS + คลัง + ลูกหนี้เงินเชื่อ + รายงาน และรองรับ Offline-First Sync

**โดเมนในสเปก (นับได้ ~55 operations / 12 กลุ่ม)**
| # | กลุ่ม | จำนวน |
|---|---|---|
| 00 | System & Health (`/health`) | 1 |
| 01 | Authentication + Branches | 6 |
| 02 | Product Catalog (categories, products, uploads) | 15 |
| 04 | Customers & Credit (+ AR Aging) | 8 |
| 04.2 | Purchase Orders | 8 |
| 04.3 | Goods Receipts | 5 |
| 05 | Inventory & Stock | 4 |
| 07 | Sales & Checkout | 2+ |
| 08 | Returns & Refunds | 1 |
| 09 | Receipts | 1 |
| 10 | Payments & QR PromptPay | 2 |
| 11 | Reports & Analytics | 3 |

## สิ่งที่เจอแล้วและจะยืนยันให้ครบในแผนนี้

### ก. Endpoint ที่หน้าบ้านเรียก แต่ **ไม่พบในสเปก Swagger**
1. `src/services/shift.service.ts` — `/api/v1/shifts/active`, `/api/v1/shifts/open`, `/api/v1/shifts/{id}/close` (ทั้งไฟล์ comment อ้างว่า "ตรงกับ Swagger" แต่ไม่มีในสารบัญ `/docs`)
2. `src/services/metadata.service.ts` — `/api/v1/taxes`, `/api/v1/uoms`
3. `src/services/procurement.service.ts:39,50` — `/api/v1/suppliers`, `/api/v1/suppliers/{id}`

ผลกระทบ: ถ้า endpoint เหล่านี้ไม่มีจริง หน้าจอเปิดกะ, ฟอร์มสินค้า (dropdown ภาษี/หน่วยนับ) และหน้าจัดซื้อจะพังตอน runtime — ต้องยืนยันด้วยการยิงจริงหรือถามทีม backend

### ข. Endpoint ที่ API มี แต่หน้าบ้านยังไม่ต่อ
- Customers: create / update / delete / `credit-limit` / `pay-credit` / `ar-aging` (หน้าบ้านมีแค่ search + getById)
- Inventory: `transfers` (สร้างใบโอน) และ `transfers/{id}/receive` (รับโอน)
- Returns: `POST /returns`
- Receipts: `GET /receipts/{receiptNo}` (พิมพ์ซ้ำ)
- Reports: `best-sellers`, `sales-summary` (มีแค่ inventory-valuation)
- Products: `barcode/{barcode}`, `sku/{sku}` แบบ path, `uploads/images` (หน้าบ้านใช้ `/products/{id}/image` อย่างเดียว)

### ค. ความไม่สอดคล้องของสัญญา
- `inventory.service.ts:31-45` ส่ง `branchId` ซ้ำทั้งใน body และ query string
- `customer.service.ts:26` ตรึง `pageSize: 20` ไม่เปิดให้ปรับ
- `catalog.service.ts` รับทั้ง `categoryId`/`category_id` และ `isActive`/`is_active` (สองชื่อคู่ขนาน) — ต้องระบุว่าตัวไหนคือของจริง
- `payments.service.ts` ระบุชัดว่าเป็น Mock Service ทั้งคู่ (สร้าง QR / เช็คสถานะ)
- สเปกประกาศ `security: BearerAuth` เฉพาะบาง endpoint (POST/PUT/DELETE) แต่ GET หลายตัวไม่ประกาศ ทั้งที่หน้าบ้านแนบ Bearer ทุกคำขอ — ต้องสรุปว่าอะไรต้อง auth จริง

## ผลลัพธ์ที่จะส่งมอบ

ไฟล์ `docs/api-contract-map.md` ภาษาไทย ประกอบด้วย:

1. **ภาพรวมระบบ** — base URL, version, สถาปัตยกรรม, กติกากลาง
2. **Response Envelope** — `code` / `message` / `data` / `meta{page,pageSize,totalItems,totalPages}` / `details[{field,issue}]` และกติกา error (`code !== 0` = error)
3. **กติกาตัวเลขและวันที่** — เงินทุกฟิลด์เป็น **สตางค์ (integer)**, วันที่เป็น RFC3339, UUID เป็น key หลัก
4. **Auth Flow** — login / pin-login (PIN 4-6 หลัก + branchId) / refresh (Hybrid Cookie + JSON body) / me / logout และกลไก silent refresh ใน `api.ts` (queue + retry ครั้งเดียว, ยกเว้น auth endpoint)
5. **ตาราง Endpoint ทั้งหมด** แยก 12 โดเมน: method, path, query params, body DTO, response DTO, สิทธิ์
6. **State Machine** — Purchase Order: `DRAFT → ORDERED → PARTIALLY_RECEIVED → COMPLETED` + `CANCELLED` (และ force close); Goods Receipt: `DRAFT → COMPLETED` / `CANCELLED` โดย `complete` คือจุดที่ยอดเข้าสต็อกจริง
7. **Gap Analysis 3 ด้าน** (ก/ข/ค ข้างบน) พร้อมระดับความเสี่ยง
8. **ตาราง Mapping** service file ↔ endpoint ↔ บรรทัดอ้างอิง

## ข้อจำกัดที่ต้องยอมรับ

- `swagger/doc.json` ถูกตัดตอนระหว่างดึงข้อมูล — ต้องดึง definitions ให้ครบก่อนสรุปชื่อฟิลด์ของ DTO
- ยังไม่ยืนยันว่า `GET /sales/{id}` มีจริง (สารบัญ `/docs` ถูกตัดที่ `POST /sales`)
- เอกสารบอกว่ามี Offline-First Sync แต่ไม่มี endpoint sync ใด ๆ ในสารบัญ — จะระบุเป็นข้อสังเกต ไม่ใช่ข้อสรุป
- ห้ามสรุปพฤติกรรมที่ไม่ได้ระบุในสเปก (เช่น สูตรคำนวณยอด, ลำดับการตัดสต็อก) — จะทำเครื่องหมายว่าต้องยืนยันกับ backend