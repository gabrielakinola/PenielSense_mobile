import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { loginCareHome } from '@/src/services/auth.api';
import {
  setAccessToken,
  setUnauthorizedHandler,
} from '@/src/lib/auth-token';
import type {
  CareHomeSummaryDto,
  CareHomeUserDto,
} from '@/src/types/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: CareHomeUserDto | null;
  careHome: CareHomeSummaryDto | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      careHome: null,
      login: async (email, password) => {
        const data = await loginCareHome({
          email: email.trim(),
          password,
        });
        setAccessToken(data.accessToken);
        set({
          isAuthenticated: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          careHome: data.careHome,
        });
      },
      logout: () => {
        setAccessToken(null);
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          user: null,
          careHome: null,
        });
      },
    }),
    {
      name: 'penielsense-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        careHome: state.careHome,
      }),
      onRehydrateStorage: () => (state) => {
        setAccessToken(state?.accessToken ?? null);
      },
    },
  ),
);

setUnauthorizedHandler(() => {
  useAuthStore.getState().logout();
});

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return;
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  return hydrated;
}
