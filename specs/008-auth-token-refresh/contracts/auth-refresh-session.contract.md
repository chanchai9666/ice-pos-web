# Contract: Auth Token Refresh & Session Expiration

**Feature**: `specs/008-auth-token-refresh/spec.md`  
**Artifact**: `contracts/auth-refresh-session.contract.md`  

## 1. Backend API Refresh Endpoint Contract

### Endpoint: `POST /api/v1/auth/refresh`

ใช้สำหรับขอรับ Access Token และ Refresh Token ชุดใหม่

#### Request Headers:
```http
Content-Type: application/json
Accept: application/json
```

#### Request Body:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response Envelope (HTTP 200 OK):
```json
{
  "code": 0,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-123456",
      "username": "cashier01",
      "fullName": "สมศรี ใจดี",
      "role": "CASHIER",
      "branchId": "br-001",
      "isActive": true
    }
  }
}
```

#### Response Envelope (HTTP 401 Unauthorized / Token Expired):
```json
{
  "code": 4010,
  "message": "Refresh token is invalid or expired",
  "data": null
}
```

---

## 2. Internal Client Contracts

### A. API Interceptor & Session Coordinator (`src/services/api.ts`)

```typescript
/**
 * ลงทะเบียนตัวรับฟังเหตุการณ์เซสชันหมดอายุเพื่อนำทางผู้ใช้และแสดงข้อความแจ้งเตือน
 */
export function registerSessionExpiredListener(listener: () => void): () => void;

/**
 * ฟังก์ชันหลักในการยิงคำขอที่จัดการ Silent Token Refresh และ Auto Retry
 */
export async function request<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<ApiResponse<T>>;
```

**พฤติกรรมของ `request<T>`:**
1. หากคำขอได้รับ HTTP status `401` และ endpoint **ไม่ใช่** `/api/v1/auth/login`, `/api/v1/auth/pin-login` หรือ `/api/v1/auth/refresh`:
   - ถ้า `refreshToken` มีอยู่ในระบบ:
     - เข้าร่วมกระบวนการขอ Token ใหม่ (หากมีคำขออื่นกำลังขออยู่ ให้รอผลลัพธ์เดียวกัน)
     - เมื่อได้รับ Token ใหม่ จะอัปเดต Header `Authorization: Bearer <new_token>` และยิงคำขอเดิมซ้ำให้อัตโนมัติ (Retry original request)
   - ถ้าไม่มี `refreshToken` หรือการเรียก `/api/v1/auth/refresh` ตอบกลับ `401`/ล้มเหลว:
     - เรียก `onSessionExpired()` แจ้งเตือนทุก Listener
     - ล้าง Token จาก Storage
     - โยนข้อผิดพลาด `ApiError` พร้อมข้อความแจ้งเตือนเซสชันหมดอายุ

---

### B. AuthContext Session Handler (`src/context/AuthContext.tsx`)

```typescript
interface AuthContextType {
  // เมธอดเดิมที่รักษาไว้ 100%
  user: UserProfile | null;
  branch: Branch | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithCredentials: (credentials: LoginRequest) => Promise<AuthResponse>;
  loginWithPin: (credentials: PinLoginRequest, branchInfo?: Branch | null) => Promise<AuthResponse>;
  logout: () => void;
  setCurrentBranch: (branch: Branch) => void;

  // ส่วนเพิ่มเติมสำหรับรองรับ Session Expiry
  handleSessionExpired: () => void;
}
```

**พฤติกรรมของ `handleSessionExpired`:**
1. เคลียร์ State `user` เป็น `null` (แต่คง `branch` เดิมไว้)
2. เรียก `clearAuthSession()` ซึ่งล้างเฉพาะ Token และ UserProfile
3. แสดง Toast Notification ประเภท `WARNING` ด้วยข้อความภาษาไทย:
   - **หัวข้อ**: "เซสชันหมดอายุ"
   - **ข้อความ**: "เซสชันการใช้งานหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
4. นำทางผู้ใช้ไปยัง `/login` ทันที
