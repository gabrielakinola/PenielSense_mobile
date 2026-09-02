import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { loginCareHome, refreshCareHomeSession } from '@/src/services/auth.api';
import {
  setAccessToken,
  setUnauthorizedHandler,
  setRefreshHandler,
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
  secureHydrated: boolean;
  hydrateSecureSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'peniel.access-token';
const REFRESH_TOKEN_KEY = 'peniel.refresh-token';
const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      careHome: null,
      secureHydrated: false,
      hydrateSecureSession: async () => {
        try {
          const [accessToken, refreshToken] = await Promise.all([
            SecureStore.getItemAsync(ACCESS_TOKEN_KEY, secureOptions),
            SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureOptions),
          ]);
          setAccessToken(accessToken);
          set({
            accessToken,
            refreshToken,
            isAuthenticated: !!accessToken,
            secureHydrated: true,
          });
        } catch {
          setAccessToken(null);
          set({
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            secureHydrated: true,
          });
        }
      },
      login: async (email, password) => {
        const data = await loginCareHome({
          email: email.trim(),
          password,
        });
        await Promise.all([
          SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken, secureOptions),
          SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken, secureOptions),
        ]);
        setAccessToken(data.accessToken);
        set({
          isAuthenticated: true,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          careHome: data.careHome,
        });
      },
      logout: async () => {
        setAccessToken(null);
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, secureOptions),
          SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureOptions),
        ]);
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
        user: state.user,
        careHome: state.careHome,
      }),
    },
  ),
);

setUnauthorizedHandler(() => {
  void useAuthStore.getState().logout();
});

setRefreshHandler(async () => {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureOptions);
  if (!refreshToken) return null;
  try {
    const tokens = await refreshCareHomeSession(refreshToken);
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken, secureOptions),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken, secureOptions),
    ]);
    setAccessToken(tokens.accessToken);
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
    return tokens.accessToken;
  } catch {
    return null;
  }
});

export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return;
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  const secureHydrated = useAuthStore((state) => state.secureHydrated);
  const hydrateSecureSession = useAuthStore((state) => state.hydrateSecureSession);

  useEffect(() => {
    if (hydrated && !secureHydrated) void hydrateSecureSession();
  }, [hydrated, secureHydrated, hydrateSecureSession]);

  return hydrated && secureHydrated;
}
