'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { registerSessionExpiredListener } from '@/services/api';
import {
  AuthResponse,
  Branch,
  LoginRequest,
  PinLoginRequest,
  SessionEventPayload,
  UserProfile,
} from '@/types/auth';
import {
  clearAuthSession,
  getCurrentBranch,
  getUserProfile,
  setAuthSession,
} from '@/utils/storage';

interface AuthContextType {
  user: UserProfile | null;
  branch: Branch | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithCredentials: (credentials: LoginRequest) => Promise<AuthResponse>;
  loginWithPin: (
    credentials: PinLoginRequest,
    branchInfo?: Branch | null
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  setCurrentBranch: (branch: Branch) => void;
  handleSessionExpired: (payload?: SessionEventPayload) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // เริ่มต้น State โดยตรงจาก LocalStorage (รองรับทั้งโหมด Cookie และ Token)
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      return getUserProfile();
    } catch {
      return null;
    }
  });

  const [branch, setBranch] = useState<Branch | null>(() => {
    try {
      return getCurrentBranch();
    } catch {
      return null;
    }
  });

  const [isLoading] = useState<boolean>(false);

  // จัดการเมื่อเซสชันหมดอายุหรือเครือข่ายหมดเวลา: ล้างสิทธิ์ คงสาขา และนำทางไปหน้าเข้าสู่ระบบ
  const handleSessionExpired = useCallback(
    (payload?: SessionEventPayload) => {
      setUser(null);
      clearAuthSession(true); // คงสาขาไว้เพื่อให้ล็อกอิน PIN ต่อได้ทันที
      if (payload?.type === 'SESSION_NETWORK_ERROR') {
        router.push('/login?timeout=1');
      } else {
        router.push('/login?expired=1');
      }
    },
    [router]
  );

  // ลงทะเบียนรับฟังเหตุการณ์เซสชันหมดอายุจาก API Interceptor
  useEffect(() => {
    const unsubscribe = registerSessionExpiredListener((payload) => {
      handleSessionExpired(payload);
    });
    return unsubscribe;
  }, [handleSessionExpired]);

  const loginWithCredentials = useCallback(
    async (credentials: LoginRequest): Promise<AuthResponse> => {
      const auth = await authService.login(credentials);

      // เครเดนเชียลล็อกอินไม่มีข้อมูลสาขาแนบมาเหมือน PIN login
      // จึงค้นหาสาขาประจำตัวผู้ใช้เพื่อให้หน้าจอ POS/เปิดกะใช้งานได้
      let branchInfo: Branch | null = null;
      if (auth.user.branchId) {
        try {
          const branches = await authService.getBranches();
          branchInfo =
            branches.find((b) => b.id === auth.user.branchId) ?? null;
        } catch {
          // ดึงข้อมูลสาขาไม่สำเร็จ ไม่ควรทำให้การเข้าสู่ระบบล้มเหลว
        }
      }

      setUser(auth.user);
      if (branchInfo) {
        setBranch(branchInfo);
      }
      setAuthSession(auth, branchInfo);
      return auth;
    },
    []
  );

  const loginWithPin = useCallback(
    async (
      credentials: PinLoginRequest,
      branchInfo?: Branch | null
    ): Promise<AuthResponse> => {
      const auth = await authService.pinLogin(credentials);
      setUser(auth.user);
      if (branchInfo) {
        setBranch(branchInfo);
      }
      setAuthSession(auth, branchInfo);
      return auth;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Server logout error (proceeding with local cleanup):', err);
    } finally {
      setUser(null);
      clearAuthSession(true); // คงสาขาไว้เพื่อให้แคชเชียร์ล็อกอิน PIN ต่อได้ทันที
      router.push('/login');
    }
  }, [router]);

  const handleSetCurrentBranch = useCallback((newBranch: Branch) => {
    setBranch(newBranch);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        branch,
        isAuthenticated: !!user,
        isLoading,
        loginWithCredentials,
        loginWithPin,
        logout,
        setCurrentBranch: handleSetCurrentBranch,
        handleSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
