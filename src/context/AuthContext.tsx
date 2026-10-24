'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import { authService } from '@/services/auth.service';
import {
  AuthResponse,
  Branch,
  LoginRequest,
  PinLoginRequest,
  UserProfile,
} from '@/types/auth';
import {
  clearAuthSession,
  getAccessToken,
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
  logout: () => void;
  setCurrentBranch: (branch: Branch) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // เริ่มต้น State โดยตรงจาก LocalStorage ผ่านฟังก์ชัน Lazy Initializer
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const token = getAccessToken();
      return token ? getUserProfile() : null;
    } catch {
      return null;
    }
  });

  const [branch, setBranch] = useState<Branch | null>(() => {
    try {
      const token = getAccessToken();
      return token ? getCurrentBranch() : null;
    } catch {
      return null;
    }
  });

  const [isLoading] = useState<boolean>(false);

  const loginWithCredentials = useCallback(
    async (credentials: LoginRequest): Promise<AuthResponse> => {
      const auth = await authService.login(credentials);

      // เครดենเชียลล็อกอินไม่มีข้อมูลสาขาแนบมาเหมือน PIN login
      // จึงค้นหาสาขาประจำตัวผู้ใช้เพื่อให้หน้าจอ POS/เปิดกะใช้งานได้
      let branchInfo: Branch | null = null;
      if (auth.user.branchId) {
        try {
          const branches = await authService.getBranches();
          branchInfo =
            branches.find((branch) => branch.id === auth.user.branchId) ?? null;
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

  const logout = useCallback(() => {
    setUser(null);
    setBranch(null);
    clearAuthSession();
  }, []);

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
