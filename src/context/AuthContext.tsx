'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // โหลด Session ที่เคยมีอยู่เมื่อเริ่มต้น
  useEffect(() => {
    try {
      const token = getAccessToken();
      const savedUser = getUserProfile();
      const savedBranch = getCurrentBranch();

      if (token && savedUser) {
        setUser(savedUser);
        if (savedBranch) {
          setBranch(savedBranch);
        }
      }
    } catch {
      clearAuthSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithCredentials = useCallback(
    async (credentials: LoginRequest): Promise<AuthResponse> => {
      const auth = await authService.login(credentials);
      setUser(auth.user);
      setAuthSession(auth);
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
