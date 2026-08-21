import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Flag } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { PageIntro } from '@/src/components/ui/PageIntro';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonRow } from '@/src/components/ui/Skeleton';
import { FlagCard } from '@/src/components/flags/FlagCard';
import {
  closeCareHomeReviewFlag,
  getCareHomeReviewFlags,
} from '@/src/services/review-flags.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

export default function FlagsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const flagsQuery = useQuery({
    queryKey: ['carehome', 'review-flags', 'open', '7d'],
    queryFn: () =>
      getCareHomeReviewFlags({
        reviewStatus: 'open',
        period: '7d',
        limit: 50,
      }),
  });

  const closeMutation = useMutation({
    mutationFn: ({
      flagId,
      reviewStatus,
    }: {
      flagId: string;
      reviewStatus: 'reviewed' | 'false_alarm';
    }) => closeCareHomeReviewFlag(flagId, reviewStatus),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['carehome', 'review-flags'] });
    },
  });

  const items = flagsQuery.data?.items ?? [];
  const summary = useMemo(() => {
    const critical = items.filter((f) => f.severity === 'critical').length;
    const watch = items.length - critical;
    return { critical, watch, total: items.length };
  }, [items]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await flagsQuery.refetch();
    setRefreshing(false);
  }, [flagsQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Review Flags" />
      <ScreenContainer scroll={false} padded={false}>
        <FlatList
          data={flagsQuery.isFetching && items.length === 0 ? [] : items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <PageIntro
              eyebrow="Vitals review"
              title="Open review flags"
              subtitle="Close flags once checked — or mark them as false alarms."
              footer={
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <View
                    style={{
                      borderRadius: radius.full,
                      backgroundColor: colors.statusBg.critical,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.status.critical,
                        fontWeight: '700',
                      }}
                    >
                      {summary.critical} critical
                    </Text>
                  </View>
                  <View
                    style={{
                      borderRadius: radius.full,
                      backgroundColor: colors.statusBg.watch,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.status.watch,
                        fontWeight: '700',
                      }}
                    >
                      {summary.watch} watch
                    </Text>
                  </View>
                </View>
              }
            />
          }
          ListEmptyComponent={
            flagsQuery.isFetching ? (
              <View style={{ gap: 12 }}>
                <SkeletonRow />
                <SkeletonRow />
              </View>
            ) : flagsQuery.isError ? (
              <EmptyState
                icon={Flag}
                title="Couldn’t load flags"
                description={normalizeApiError(flagsQuery.error)}
                actionLabel="Retry"
                onAction={() => void flagsQuery.refetch()}
              />
            ) : (
              <EmptyState
                icon={Flag}
                title="No open review flags"
                description="Open vital review flags will appear here for staff action."
              />
            )
          }
          renderItem={({ item, index }) => (
            <FlagCard
              flag={item}
              index={index}
              closing={closeMutation.isPending}
              onOpenResident={() => router.push(`/residents/${item.residentId}`)}
              onClose={(reviewStatus) =>
                closeMutation.mutate({ flagId: item.id, reviewStatus })
              }
            />
          )}
        />
      </ScreenContainer>
    </View>
  );
}
