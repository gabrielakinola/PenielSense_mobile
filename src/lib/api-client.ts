import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';
import type { ApiErrorEnvelope } from '@/src/types/auth.types';
import {
  getAccessToken,
  notifyUnauthorized,
} from '@/src/lib/auth-token';

const DEFAULT_BASE_URL = 'http://localhost:3000/api';

function resolveApiBaseUrl() {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_URL ??
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  return fromEnv?.trim() || DEFAULT_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export function normalizeApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | ApiErrorEnvelope
      | { message?: string }
      | undefined;

    if (data && typeof data === 'object') {
      if ('errors' in data && Array.isArray(data.errors) && data.errors.length) {
        return String(data.errors[0]);
      }
      if ('message' in data && typeof data.message === 'string') {
        if (/^Cannot (GET|POST|PUT|PATCH|DELETE) /i.test(data.message)) {
          return 'Not found';
        }
        return data.message;
      }
    }

    if (error.response?.status === 401) return 'Invalid credentials';
    if (error.response?.status === 404) return 'Not found';
    if (error.response?.status && error.response.status >= 500) {
      return `Server error (${error.response.status})`;
    }
    if (!error.response) {
      return 'Server unavailable. Please try again.';
    }
    return 'An unexpected error occurred';
  }

  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

function isAuthLoginRequest(url?: string) {
  if (!url) return false;
  return url.includes('/auth/carehome/login');
}

function createApiClient(options?: {
  withAuth?: boolean;
  withSessionExpiry?: boolean;
}): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60_000,
    headers: { 'Content-Type': 'application/json' },
  });

  if (options?.withAuth) {
    client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  if (options?.withSessionExpiry) {
    client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorEnvelope>) => {
        const status = error.response?.status;
        const url = error.config?.url;
        if (status === 401 && !isAuthLoginRequest(url)) {
          notifyUnauthorized();
        }
        return Promise.reject(error);
      },
    );
  }

  return client;
}

export const authApiClient = createApiClient();

export const careHomeApiClient = createApiClient({
  withAuth: true,
  withSessionExpiry: true,
});
