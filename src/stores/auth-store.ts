import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { loginCareHome, refreshCareHomeSession, switchCareHomeLocation } from '@/src/services/auth.api';
import {
  setAccessToken,
  setUnauthorizedHandler,
  setRefreshHandler,
} from '@/src/lib/auth-token';
import type {
  CareHomeSummaryDto,
  CareHomeUserDto,
  CareHomeLocationDto,
} from '@/src/types/auth.types';
import { activeProducts } from '@/src/lib/product-access';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: CareHomeUserDto | null;
  careHome: CareHomeSummaryDto | null;
  locations: CareHomeLocationDto[];
  secureHydrated: boolean;
  hydrateSecureSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchLocation: (careHomeId: string) => Promise<void>;
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
      locations: [],
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
        if (
          activeProducts(data.careHome).length === 0 ||
          ['PAUSED', 'CANCELLED'].includes(data.careHome.subscriptionStatus ?? '')
        ) {
          throw new Error('No Peniel products are active for this organisation. Please contact your manager.');
        }
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
          locations: data.locations ?? [],
        });
      },
      switchLocation: async (careHomeId) => {
        const data = await switchCareHomeLocation(careHomeId);
        await Promise.all([
          SecureStore.setItemAsync(ACCESS_TOKEN_KEY, data.accessToken, secureOptions),
          SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken, secureOptions),
        ]);
        setAccessToken(data.accessToken);
        set((state) => ({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          careHome: state.careHome
            ? {
                ...state.careHome,
                id: data.careHome.id,
                name: data.careHome.name,
                city: data.careHome.city,
                timezone: data.careHome.timezone,
                enabledProducts: data.careHome.enabledProducts,
                suspendedProducts: data.careHome.suspendedProducts,
                subscriptionStatus: data.careHome.subscriptionStatus,
                subscriptionPackage: data.careHome.subscriptionPackage,
                packageName: data.careHome.packageName,
                limits: data.careHome.subscriptionLimits,
                featureOverrides: data.careHome.featureOverrides,
              }
            : null,
          locations: data.locations,
        }));
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
          locations: [],
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
        locations: state.locations,
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
