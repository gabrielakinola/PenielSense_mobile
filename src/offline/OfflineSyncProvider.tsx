import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
  const colors = useThemeColors();
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [attentionCount, setAttentionCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    const refreshCount = async () => {
      if (!ownerId) {
        setPendingCount(0);
        setAttentionCount(0);
        return;
      }
      const pending = await pendingOfflineMutations(ownerId);
      if (mounted) {
        setPendingCount(pending.length);
        setAttentionCount(pending.filter(mutationNeedsAttention).length);
      }
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
  const needsAttention = online && attentionCount > 0;
  const message = !online
    ? `Offline${pendingCount ? ` · ${pendingCount} update${pendingCount === 1 ? '' : 's'} saved on this device` : ' · showing saved records'}`
    : needsAttention
      ? `${attentionCount} saved update${attentionCount === 1 ? '' : 's'} need${attentionCount === 1 ? 's' : ''} attention · tap to review`
      : `Syncing ${pendingCount} saved update${pendingCount === 1 ? '' : 's'}…`;
  return <View style={{ flex: 1 }}>
    {showStatus ? <Pressable
      accessibilityRole="button"
      accessibilityLabel={needsAttention ? 'Review updates that need attention' : 'View sync status'}
      accessibilityLiveRegion="polite"
      onPress={() => { if (pendingCount > 0) router.push('/sync-status'); }}
      style={{ backgroundColor: !online || needsAttention ? colors.statusBg.critical : colors.statusBg.watch, paddingHorizontal: 16, paddingVertical: 7 }}
    >
      <Text style={{ ...typography.label, textAlign: 'center', color: !online || needsAttention ? colors.status.critical : colors.status.watch }}>
        {message}
      </Text>
    </Pressable> : null}
    <View style={{ flex: 1 }}>{children}</View>
  </View>;
}
