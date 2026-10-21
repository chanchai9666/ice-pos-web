const fs = require('fs');
const path = require('path');

const swaggerPath = path.join(__dirname, '..', 'docs', 'swagger.json');
const outputPath = path.join(__dirname, '..', 'docs', 'api-summary.md');

const doc = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

let md = `# สรุปข้อมูลระบบ ICE POS API (API Specification Summary)

เอกสารฉบับนี้จัดทำขึ้นเพื่อเป็นข้อมูลอ้างอิงกลางในการพัฒนาส่วนหน้าบ้าน (Frontend) ของโปรเจกต์ \`ice-pos-web\` โดยสรุปโครงสร้างจากเอกสาร Swagger ของระบบ ICE POS Backend API

---

## 1. ข้อมูลทั่วไปของ API (API Overview)

- **ชื่อระบบ**: ${doc.info?.title || 'ICE POS API'}
- **เวอร์ชัน**: ${doc.info?.version || '1.0.0'}
- **คำอธิบาย**: ${doc.info?.description || ''}
- **Host**: \`http://127.0.0.1:8080\`
- **Base Path**: \`${doc.basePath || '/api/v1'}\`
- **Swagger Documentation URL**: \`http://127.0.0.1:8080/docs#/\`
- **Swagger Schema (JSON)**: \`http://127.0.0.1:8080/swagger/doc.json\` (บันทึกสำเนาไว้ที่ [docs/swagger.json](file:///Users/chanchai/workshop/CODE/ice-pos-web/docs/swagger.json))
- **Consumes / Produces**: \`application/json\`

---

## 2. การยืนยันตัวตนและความปลอดภัย (Authentication & Security)

ระบบใช้ **JWT (JSON Web Token)** ในการรักษาความปลอดภัย:
- **Header**: \`Authorization: Bearer <accessToken>\`
- สำหรับ Endpoint สาธารณะ (ไม่ต้องใช้ Token):
  - \`POST /api/v1/auth/login\` (เข้าสู่ระบบด้วย Username/Password)
  - \`POST /api/v1/auth/pin-login\` (เข้าสู่ระบบแคชเชียร์ด่วนด้วย PIN + สาขา)
  - \`POST /api/v1/auth/refresh\` (ขอต่ออายุ Token)
  - \`GET /api/v1/health\` (Health Check)
  - \`GET /api/v1/branches\` (ดึงรายชื่อสาขาสำหรับหน้า Login/PIN)
- Endpoint อื่นๆ ทั้งหมดต้องแนบ \`Authorization: Bearer <accessToken>\` ใน Header เสมอ

---

## 3. รูปแบบ Response กลางของระบบ (Standard API Response Format)

### 3.1 กรณีทำงานสำเร็จ (Success Response)
HTTP Status: \`200 OK\`, \`201 Created\`
\`\`\`json
{
  "code": 0,
  "message": "ok",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPage": 5
  }
}
\`\`\`

### 3.2 กรณีเกิดข้อผิดพลาด (Error Response)
HTTP Status: \`400 Bad Request\`, \`401 Unauthorized\`, \`403 Forbidden\`, \`404 Not Found\`, \`500 Internal Server Error\`
\`\`\`json
{
  "code": 4000,
  "message": "ข้อความอธิบายข้อผิดพลาด",
  "data": null,
  "details": [
    {
      "field": "username",
      "issue": "is required"
    }
  ]
}
\`\`\`

---

## 4. สรุปสาระสำคัญตามโมดูลหลัก (Core Functional Modules)

| ลำดับ | โมดูล (Module) | จำนวน Endpoints | รายละเอียดหน้าที่หลัก |
| :---: | :--- | :---: | :--- |
| 1 | **ระบบยืนยันตัวตน (Authentication)** | 5 | Login ผ่าน Username/Password, Quick PIN Login สำหรับแคชเชียร์, Refresh Token, ดึง Profile และสาขา |
| 2 | **จัดการสมาชิกและผู้ใช้งาน (User Management)** | 8 | จัดการผู้ใช้งานพนักงาน (CRUD), รีเซ็ตรหัสผ่าน, รีเซ็ต PIN ด่วน, ปลดล็อกบัญชี |
| 3 | **จัดการสินค้าและหมวดหมู่ (Product Catalog)** | 15 | จัดการหมวดหมู่สินค้า, รายการสินค้า, สแกน Barcode/SKU lookup, อัปโหลดรูปภาพสินค้าแปลงเป็น WebP, เจนเนอเรตบาร์โค้ดภายใน |
| 4 | **ข้อมูลตั้งค่าพื้นฐานสินค้า (Catalog Metadata)** | 2 | รายการอัตราภาษี (Tax Rates), รายการหน่วยนับ (UOMs) |
| 5 | **ลูกค้าและบัญชีเงินเชื่อ (Customers & Credit)** | 8 | ทะเบียนลูกค้า, ยอดค้างชำระ, ปรับวงเงินเครดิต, บันทึกการรับชำระหนี้, รายงาน AR Aging |
| 6 | **จัดซื้อและซัพพลายเออร์ (Suppliers, PO, Goods Receipt)** | 21 | จัดการคู่ค้า (Suppliers), ใบสั่งซื้อสินค้า (PO), ยืนยัน/ปิด PO, ใบตรวจรับสินค้าเข้าคลัง (Goods Receipts) |
| 7 | **คลังและสต็อกสินค้า (Inventory & Stock)** | 4 | ดูยอดสต็อกคงเหลือ, ปรับยอดสต็อก (Stock Adjustment), โอนย้ายสินค้าระหว่างสาขา (Stock Transfer) |
| 8 | **กะการทำงานและลิ้นชักเงินสด (Shifts & Cash Drawer)** | 3 | ตรวจสอบกะขายปัจจุบัน (Active Shift), เปิดกะพร้อมระบุเงินทอนเริ่มต้น, ปิดกะและกระทบยอดเงินสด |
| 9 | **การขายและชำระเงิน (Sales & Checkout)** | 4 | สร้างบิลขายสินค้า (Checkout) รองรับหลายวิธีชำระ, ประวัติบิลขาย, รายละเอียดบิล, ขอยกเลิกบิล (Void) |
| 10 | **การรับคืนสินค้าและคืนเงิน (Returns & Refunds)** | 1 | รับคืนสินค้าและคืนเงินพร้อมระบุสาเหตุและปรับสต็อก |
| 11 | **ใบเสร็จรับเงิน (Receipts)** | 1 | ดึงข้อมูลใบเสร็จรับเงินสำหรับพิมพ์ซ้ำ (Reprint Receipt) |
| 12 | **การชำระเงินและพร้อมเพย์ (Payments & QR PromptPay)** | 2 | สร้าง QR Code พร้อมเพย์, ตรวจสอบสถานะการชำระเงิน |
| 13 | **รายงานและการวิเคราะห์ (Reports & Analytics)** | 3 | สรุปยอดขาย กำไรขั้นต้น และภาษี, รายงานสินค้าขายดี, รายงานมูลค่าสินค้าคงเหลือ |
| 14 | **การเชื่อมต่อออฟไลน์ (Offline Synchronization)** | 2 | อัปโหลดบิลและสต็อกที่ทำขณะออฟไลน์ (Push Batch), ดึงข้อมูลเปลี่ยนแปลงลงเครื่อง POS (Delta Sync) |

---

## 5. รายการ Endpoint ทั้งหมดแยกตามกลุ่มงาน (Complete Endpoint Directory)

`;

const tagsMap = {};
for (const [pathUrl, methods] of Object.entries(doc.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const tag = (op.tags && op.tags[0]) || "ทั่วไป";
    if (!tagsMap[tag]) tagsMap[tag] = [];
    tagsMap[tag].push({
      path: `${doc.basePath}${pathUrl}`,
      method: method.toUpperCase(),
      summary: op.summary || "",
      description: op.description || "",
      parameters: op.parameters || []
    });
  }
}

const tagKeys = Object.keys(tagsMap).sort();

for (const tag of tagKeys) {
  const eps = tagsMap[tag];
  md += `\n### ${tag} (${eps.length} Endpoints)\n\n`;
  md += `| Method | Endpoint | รายละเอียด / หน้าที่ | พารามิเตอร์สำคัญ |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  for (const ep of eps) {
    const params = ep.parameters.map(p => `${p.name} (${p.in}${p.required ? ', required' : ''})`).join('<br/>') || '-';
    md += `| \`${ep.method}\` | \`${ep.path}\` | ${ep.summary || ep.description || '-'} | ${params} |\n`;
  }
}

md += `\n---

## 6. แนวทางปฏิบัติสำหรับ Frontend ตามธรรมนูญโครงการ (Constitution Compliance)

1. **ห้ามทำการจำลองข้อมูล (Mock Data) ขึ้นเอง**:
   - การเชื่อมต่อส่วนหน้าบ้านต้องอ้างอิงโครงสร้าง Schema และ Endpoint จริงจากเอกสารฉบับนี้
   - หาก Endpoint หรือฟิลด์ข้อมูลที่ต้องการไม่มีในเอกสาร หรือไม่แน่ใจ ต้องหยุดและสอบถามเพื่อขอความชัดเจนก่อนเริ่มเขียนโค้ด
2. **การจัดการข้อผิดพลาด (Error Handling)**:
   - ตรวจสอบฟิลด์ \`code\`, \`message\`, และ \`details\` ของ Error Response เสมอเพื่อนำไปแสดงข้อความแจ้งเตือนที่เข้าใจง่ายเป็นภาษาไทย
3. **การรายงานและสรุปผลกระทบต่อ API (API Change Request)**:
   - หากการออกแบบหรือปรับปรุง UI ส่งผลให้ต้องการฟิลด์เพิ่มเติม หรือ Endpoint ใหม่ ต้องจัดทำเอกสารสรุปเป็นไฟล์ เช่น \`docs/api-change-requests.md\` ระบุสิ่งที่ต้องการอย่างละเอียด เพื่อส่งต่อให้ทีม Backend ดำเนินการ
`;

fs.writeFileSync(outputPath, md, 'utf8');
console.log('Successfully generated ' + outputPath);
