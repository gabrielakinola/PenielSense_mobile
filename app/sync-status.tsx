import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { CloudUpload, RefreshCw, Trash2 } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { AnimatedButton } from '@/src/components/ui/AnimatedButton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  pendingOfflineMutations,
  removeOfflineMutation,
  resetOfflineMutationAttempts,
  type OfflineMutation,
} from '@/src/offline/offline-db';
import {
  describeOfflineMutation,
  flushOfflineQueue,
  mutationNeedsAttention,
} from '@/src/offline/offline-sync';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

function formatSavedAt(timestamp: number) {
  return new Date(timestamp).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SyncStatusScreen() {
  const colors = useThemeColors();
  const ownerId = useAuthStore((state) => state.user?.id);
  const [items, setItems] = useState<OfflineMutation[] | null>(null);
  const [syncing, setSyncing] = useState(false);

  const reload = useCallback(async () => {
    if (!ownerId) {
      setItems([]);
      return;
    }
    setItems(await pendingOfflineMutations(ownerId));
  }, [ownerId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const syncNow = useCallback(async () => {
    if (!ownerId || syncing) return;
    setSyncing(true);
    try {
      await flushOfflineQueue(ownerId);
    } finally {
      setSyncing(false);
      await reload();
    }
  }, [ownerId, syncing, reload]);

  const retryItem = useCallback(
    async (item: OfflineMutation) => {
      await resetOfflineMutationAttempts(item.id);
      await syncNow();
    },
    [syncNow],
  );

  const deleteItem = useCallback(
    (item: OfflineMutation) => {
      Alert.alert(
        'Discard saved update?',
        `"${describeOfflineMutation(item)}" has not been sent to the server. Deleting it permanently removes this record from the device.`,
        [
          { text: 'Keep', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: async () => {
              await removeOfflineMutation(item.id);
              await reload();
            },
          },
        ],
      );
    },
    [reload],
  );

  const attentionCount = (items ?? []).filter(mutationNeedsAttention).length;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Sync status' }} />
      <ScreenContainer>
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ ...typography.bodyMedium, color: colors.text }}>
            Updates saved on this device
          </Text>
          <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 6 }}>
            {items === null
              ? 'Checking…'
              : items.length === 0
                ? 'Everything recorded on this device has been sent to the server.'
                : `${items.length} update${items.length === 1 ? '' : 's'} waiting to send${attentionCount ? ` · ${attentionCount} need${attentionCount === 1 ? 's' : ''} attention` : ''}.`}
          </Text>
          {items && items.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <AnimatedButton
                label={syncing ? 'Syncing…' : 'Sync now'}
                onPress={() => void syncNow()}
                disabled={syncing}
              />
            </View>
          ) : null}
        </Card>

        {items === null ? null : items.length === 0 ? (
          <EmptyState
            icon={CloudUpload}
            title="All synced"
            description="Care records created offline appear here until they reach the server."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {items.map((item) => {
              const needsAttention = mutationNeedsAttention(item);
              return (
                <Card key={item.id} style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                        {describeOfflineMutation(item)}
                      </Text>
                      <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>
                        Saved {formatSavedAt(item.createdAt)}
                        {item.attempts > 0
                          ? ` · ${item.attempts} attempt${item.attempts === 1 ? '' : 's'}`
                          : ''}
                      </Text>
                      {needsAttention && item.lastError ? (
                        <Text
                          style={{ ...typography.caption, color: colors.status.critical, marginTop: 5 }}
                          numberOfLines={3}
                        >
                          {item.lastError}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Retry ${describeOfflineMutation(item)}`}
                      onPress={() => void retryItem(item)}
                      style={{
                        minWidth: 44,
                        minHeight: 44,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.statusBg.watch,
                      }}
                    >
                      <RefreshCw size={19} color={colors.status.watch} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Discard ${describeOfflineMutation(item)}`}
                      onPress={() => deleteItem(item)}
                      style={{
                        minWidth: 44,
                        minHeight: 44,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.statusBg.critical,
                      }}
                    >
                      <Trash2 size={19} color={colors.status.critical} />
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScreenContainer>
    </>
  );
}
