# Contract: Hybrid Authentication API

**Branch**: `009-hybrid-auth-support`  
**Feature**: `specs/009-hybrid-auth-support/spec.md`  

เอกสารสัญญานี้อธิบายการแลกเปลี่ยนข้อมูลระหว่าง Frontend (`ice-pos-web`) และ Backend (`ice-pos-api`) ในรูปแบบ Hybrid Support

---

## 1. การส่งคำขอทั่วไป (Protected Endpoints)

ใช้สำหรับทุก Endpoint ภายใต้ `/api/v1/*` (เช่น `/api/v1/auth/me`, `/api/v1/sales`, `/api/v1/pos/products`)

### Request
```http
GET /api/v1/auth/me HTTP/1.1
Host: 127.0.0.1:8080
Accept: application/json
Content-Type: application/json
Authorization: Bearer <access_token> (ส่งควบคู่หากมีใน Storage)
Cookie: access_token=<access_token> (เบราว์เซอร์แนบอัตโนมัติเมื่อใช้ credentials: 'include')
```

### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

---

## 2. การต่ออายุเซสชัน (Token Refresh)

### Endpoint
`POST /api/v1/auth/refresh`

### Request
- ตัวเลือกคำขอ: `credentials: 'include'` (ส่งคุกกี้ `refresh_token` ไปด้วย)
- ส่วนหัว: `Content-Type: application/json`
- บอดี้ (ไม่บังคับ/แบบผสมผสาน):
```json
{
  "refreshToken": "<refresh_token>"
}
```
*(หากไม่มี Token ใน Storage สามารถส่ง `{}` หรือ Body เปล่าได้ เนื่องจากเซิร์ฟเวอร์จะตรวจสอบจากคุกกี้)*

### Response
```http
HTTP/1.1 200 OK
Set-Cookie: access_token=<new_token>; Path=/; HttpOnly; SameSite=Lax; MaxAge=900
Content-Type: application/json

{
  "code": 0,
  "message": "token refreshed successfully",
  "data": {
    "accessToken": "<new_token>",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

---

## 3. การออกจากระบบ (Server Logout)

### Endpoint
`POST /api/v1/auth/logout`

### Request
- ตัวเลือกคำขอ: `credentials: 'include'`
- ส่วนหัว: `Accept: application/json`

### Response
```http
HTTP/1.1 200 OK
Set-Cookie: access_token=; Path=/; HttpOnly; MaxAge=-1
Set-Cookie: refresh_token=; Path=/; HttpOnly; MaxAge=-1
Content-Type: application/json

{
  "code": 0,
  "message": "logged out successfully",
  "data": null
}
```
