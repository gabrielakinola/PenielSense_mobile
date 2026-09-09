import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { careHomeApiClient, normalizeApiError } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  markOfflineMutationFailed,
  pendingOfflineMutations,
  removeOfflineMutation,
} from './offline-db';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';

let flushing = false;
async function flush(ownerId: string) {
  if (flushing) return 0;
  flushing = true;
  let synced = 0;
  try {
    const pending = await pendingOfflineMutations(ownerId);
    for (const item of pending) {
      try {
        await careHomeApiClient.request({
          method: item.method,
          url: item.url,
          data: item.payload,
          headers: { 'Idempotency-Key': item.id },
        });
        await removeOfflineMutation(item.id);
        synced += 1;
      } catch (error) {
        await markOfflineMutationFailed(item.id, normalizeApiError(error));
        break;
      }
    }
  } finally {
    flushing = false;
  }
  return synced;
}

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const ownerId = useAuthStore((state) => state.user?.id);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const refreshCount = async () => {
      if (!ownerId) return setPendingCount(0);
      const pending = await pendingOfflineMutations(ownerId);
      if (mounted) setPendingCount(pending.length);
    };
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected && state.isInternetReachable !== false;
      setOnline(connected);
      if (authenticated && ownerId && connected) {
        void flush(ownerId)
          .then(async (synced) => {
            if (synced > 0) {
              await queryClient.invalidateQueries({ queryKey: ['carehome'] });
            }
          })
          .finally(refreshCount);
      } else {
        void refreshCount();
      }
    });
    void refreshCount();
    const timer = setInterval(() => void refreshCount(), 3000);
    return () => { mounted = false; unsubscribe(); clearInterval(timer); };
  }, [authenticated, ownerId, queryClient]);
  const showStatus = authenticated && (!online || pendingCount > 0);
  return <View style={{ flex: 1 }}>
    {showStatus ? <View
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: online ? colors.statusBg.watch : colors.statusBg.critical, paddingHorizontal: 16, paddingVertical: 7 }}
    >
      <Text style={{ ...typography.label, textAlign: 'center', color: online ? colors.status.watch : colors.status.critical }}>
        {!online ? `Offline${pendingCount ? ` · ${pendingCount} update${pendingCount === 1 ? '' : 's'} saved on this device` : ' · showing saved records'}` : `Syncing ${pendingCount} saved update${pendingCount === 1 ? '' : 's'}…`}
      </Text>
    </View> : null}
    <View style={{ flex: 1 }}>{children}</View>
  </View>;
}
