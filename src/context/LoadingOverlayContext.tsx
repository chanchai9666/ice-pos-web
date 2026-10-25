'use client';

/**
 * React Context สำหรับควบคุมและแสดงผล Global Loading Overlay
 * โครงการ ice-pos-web
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LoadingOverlayContextValue, OverlayState } from '@/types/overlay';
import { overlayCoordinator } from '@/services/overlay-coordinator';

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | undefined>(
  undefined
);

export interface LoadingOverlayProviderProps {
  children: React.ReactNode;
}

export function LoadingOverlayProvider({
  children,
}: LoadingOverlayProviderProps) {
  const [state, setState] = useState<OverlayState>(overlayCoordinator.getState());

  useEffect(() => {
    // ลงทะเบียนรับฟังสถานะจาก overlayCoordinator
    const unsubscribe = overlayCoordinator.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const showOverlay = useCallback((message?: string) => {
    overlayCoordinator.startRequest(message);
  }, []);

  const hideOverlay = useCallback(() => {
    overlayCoordinator.endRequest();
  }, []);

  const withOverlay = useCallback(
    async <T,>(
      action: () => Promise<T>,
      message?: string,
      timeoutMs?: number
    ): Promise<T> => {
      overlayCoordinator.startRequest(message);
      let timeoutId: NodeJS.Timeout | null = null;

      try {
        if (timeoutMs && timeoutMs > 0) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(
                new Error(
                  'การดำเนินการใช้เวลานานเกินกำหนด กรุณาตรวจสอบและลองใหม่อีกครั้ง'
                )
              );
            }, timeoutMs);
          });
          return await Promise.race([action(), timeoutPromise]);
        }
        return await action();
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        overlayCoordinator.endRequest();
      }
    },
    []
  );

  const contextValue = useMemo<LoadingOverlayContextValue>(
    () => ({
      isLoading: state.isVisible,
      message: state.message,
      showOverlay,
      hideOverlay,
      withOverlay,
    }),
    [state.isVisible, state.message, showOverlay, hideOverlay, withOverlay]
  );

  return (
    <LoadingOverlayContext.Provider value={contextValue}>
      {children}
    </LoadingOverlayContext.Provider>
  );
}

/**
 * Hook สำหรับเข้าถึงฟังก์ชันควบคุม Loading Overlay ภายใน Component
 */
export function useLoadingOverlay(): LoadingOverlayContextValue {
  const context = useContext(LoadingOverlayContext);
  if (!context) {
    throw new Error(
      'useLoadingOverlay ต้องใช้งานอยู่ภายใต้ LoadingOverlayProvider'
    );
  }
  return context;
}
