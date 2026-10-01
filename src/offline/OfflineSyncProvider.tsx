import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/src/stores/auth-store';
import { pendingOfflineMutations } from './offline-db';
import { flushOfflineQueue, mutationNeedsAttention } from './offline-sync';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const ownerId = useAuthStore((state) => state.user?.id);
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [attentionCount, setAttentionCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const refreshCount = async () => {
      if (!ownerId) { setPendingCount(0); setAttentionCount(0); return; }
      const pending = await pendingOfflineMutations(ownerId);
      if (mounted) { setPendingCount(pending.length); setAttentionCount(pending.filter(mutationNeedsAttention).length); }
    };
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = !!state.isConnected && state.isInternetReachable !== false;
      setOnline(connected);
      if (authenticated && ownerId && connected) {
        void flushOfflineQueue(ownerId)
          .then(async ({ synced }) => {
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
    {showStatus ? <Pressable
      onPress={() => pendingCount > 0 && router.push('/sync-status')}
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: online ? colors.statusBg.watch : colors.statusBg.critical, paddingHorizontal: 16, paddingVertical: 7 }}
    >
      <Text style={{ ...typography.label, textAlign: 'center', color: online ? colors.status.watch : colors.status.critical }}>
        {!online ? `Offline${pendingCount ? ` · ${pendingCount} update${pendingCount === 1 ? '' : 's'} saved on this device` : ' · showing saved records'}` : attentionCount ? `${attentionCount} saved update${attentionCount===1?' needs':'s need'} attention · tap to review` : `Syncing ${pendingCount} saved update${pendingCount === 1 ? '' : 's'}…`}
      </Text>
    </Pressable> : null}
    <View style={{ flex: 1 }}>{children}</View>
  </View>;
}
