import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { SkeletonCard, SkeletonRow } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { TodayHero } from '@/src/components/today/TodayHero';
import { TodayGlanceGrid } from '@/src/components/today/TodayGlanceGrid';
import { TodayPriorityNotes } from '@/src/components/today/TodayPriorityNotes';
import { TodayFlagsPreview } from '@/src/components/today/TodayFlagsPreview';
import { getCareHomeDashboardStats } from '@/src/services/dashboard.api';
import { getCareHomeReviewFlags } from '@/src/services/review-flags.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/stores/auth-store';
import { isCareHomeManagerRole } from '@/src/lib/care-home-home';
import { useThemeColors } from '@/src/hooks/use-theme-colors';

const POLL_MS = 60_000;

export default function TodayScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const careHome = useAuthStore((s) => s.careHome);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isCareHomeManagerRole(user?.role)) {
      router.replace('/(tabs)/residents');
    }
  }, [router, user?.role]);

  const statsQuery = useQuery({
    queryKey: ['carehome', 'dashboard', 'stats'],
    queryFn: getCareHomeDashboardStats,
    refetchInterval: POLL_MS,
  });

  const flagsQuery = useQuery({
    queryKey: ['carehome', 'review-flags', 'open', 'today-preview'],
    queryFn: () =>
      getCareHomeReviewFlags({ reviewStatus: 'open', period: 'today', limit: 5 }),
    refetchInterval: POLL_MS,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['carehome', 'dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['carehome', 'review-flags'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const data = statsQuery.data;
  const showSkeleton = statsQuery.isLoading || (!data && statsQuery.isFetching);
  const firstName = user?.firstName ?? 'there';
  const careHomeName = careHome?.name ?? 'your care home';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Today" />
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {showSkeleton ? (
          <View style={{ gap: 16 }}>
            <SkeletonCard lines={4} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </View>
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : statsQuery.isError || !data ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn’t load today’s intelligence"
            description={normalizeApiError(statsQuery.error)}
            actionLabel="Retry"
            onAction={() => void statsQuery.refetch()}
          />
        ) : (
          <View style={{ gap: 22, paddingBottom: 8 }}>
            <TodayHero
              firstName={firstName}
              careHomeName={careHomeName}
              stats={data}
            />
            <TodayGlanceGrid cards={data.glance ?? []} />
            <TodayPriorityNotes
              shift={data.summary.shift}
              headline={data.summary.headline}
              bullets={data.summary.bullets ?? []}
              onOpenResident={(residentId) =>
                router.push(`/residents/${residentId}`)
              }
            />
            <TodayFlagsPreview
              flags={flagsQuery.data?.items ?? []}
              onViewAll={() => router.push('/(tabs)/flags')}
              onOpenResident={(residentId) =>
                router.push(`/residents/${residentId}`)
              }
            />
          </View>
        )}
      </ScreenContainer>
    </View>
  );
}
