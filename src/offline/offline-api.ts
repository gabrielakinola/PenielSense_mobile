import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  enqueueOfflineMutation,
  readOfflineCache,
  writeOfflineCache,
  type OfflineMutation,
} from './offline-db';

function ownerId() {
  return useAuthStore.getState().user?.id ?? 'signed-out';
}

export function isOfflineError(error: unknown) {
  return error instanceof AxiosError && !error.response;
}

export async function cachedOnlineFirst<T>(cacheKey: string, fetcher: () => Promise<T>) {
  const owner = ownerId();
  const network = await NetInfo.fetch();
  if (network.isConnected !== false && network.isInternetReachable !== false) {
    try {
      const value = await fetcher();
      await writeOfflineCache(owner, cacheKey, value);
      return value;
    } catch (error) {
      if (!isOfflineError(error)) throw error;
    }
  }
  const cached = await readOfflineCache<T>(owner, cacheKey);
  if (cached !== null) return cached;
  throw new Error('No offline copy is available yet. Connect once to download this record.');
}

export async function queueWhenOffline(
  method: OfflineMutation['method'],
  url: string,
  payload: unknown,
  sender: (payload: unknown, requestId: string) => Promise<void>,
) {
  const requestId = Crypto.randomUUID();
  const requestPayload = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? { ...(payload as Record<string, unknown>), clientRequestId: requestId }
    : payload;
  const network = await NetInfo.fetch();
  if (network.isConnected !== false && network.isInternetReachable !== false) {
    try {
      await sender(requestPayload, requestId);
      return { queued: false, id: requestId };
    } catch (error) {
      if (!isOfflineError(error)) throw error;
    }
  }
  await enqueueOfflineMutation(requestId, ownerId(), method, url, requestPayload);
  return { queued: true, id: requestId };
}
