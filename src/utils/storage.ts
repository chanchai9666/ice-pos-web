import { AuthResponse, Branch, LoginMode, UserProfile } from '@/types/auth';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ice_pos_access_token',
  REFRESH_TOKEN: 'ice_pos_refresh_token',
  USER_PROFILE: 'ice_pos_user_profile',
  CURRENT_BRANCH: 'ice_pos_current_branch',
  LAST_BRANCH_ID: 'ice_pos_last_branch_id',
  LAST_LOGIN_MODE: 'ice_pos_last_login_mode',
  LOCKOUT_UNTIL: 'ice_pos_lockout_until',
} as const;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// ==========================================
// การจัดการ Token
// ==========================================

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setAuthSession(auth: AuthResponse, branch?: Branch | null): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, auth.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, auth.refreshToken);
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(auth.user));
  if (branch) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_BRANCH, JSON.stringify(branch));
    localStorage.setItem(STORAGE_KEYS.LAST_BRANCH_ID, branch.id);
  }
}

export function clearAuthSession(preserveBranch: boolean = true): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  if (!preserveBranch) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_BRANCH);
  }
}

// ==========================================
// การจัดการข้อมูลผู้ใช้งานและสาขา
// ==========================================

export function getUserProfile(): UserProfile | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function getCurrentBranch(): Branch | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_BRANCH);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Branch;
  } catch {
    return null;
  }
}

// ==========================================
// ข้อมูลตั้งค่าอุปกรณ์ (Device Preferences)
// ==========================================

export function getLastBranchId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(STORAGE_KEYS.LAST_BRANCH_ID);
}

export function setLastBranchId(branchId: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.LAST_BRANCH_ID, branchId);
}

export function getLastLoginMode(): LoginMode {
  if (!isBrowser()) return 'pin';
  const mode = localStorage.getItem(STORAGE_KEYS.LAST_LOGIN_MODE);
  if (mode === 'credentials') return 'credentials';
  return 'pin'; // ค่าเริ่มต้นเป็น pin
}

export function setLastLoginMode(mode: LoginMode): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.LAST_LOGIN_MODE, mode);
}

// ==========================================
// จัดการสถานะ Cooldown (Lockout)
// ==========================================

export function getLockoutExpiry(): number | null {
  if (!isBrowser()) return null;
  const raw = sessionStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
  if (!raw) return null;
  const timestamp = parseInt(raw, 10);
  if (isNaN(timestamp) || timestamp <= Date.now()) {
    sessionStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
    return null;
  }
  return timestamp;
}

export function setLockoutExpiry(seconds: number): number {
  const expiry = Date.now() + seconds * 1000;
  if (isBrowser()) {
    sessionStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, expiry.toString());
  }
  return expiry;
}

export function clearLockoutExpiry(): void {
  if (!isBrowser()) return;
  sessionStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
}
