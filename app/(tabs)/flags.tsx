import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AlertTriangle, Flag, ShieldAlert } from 'lucide-react-native';
import { Card } from '@/src/components/ui/Card';
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
import { getManagerReviewInbox } from '@/src/services/manager-review.api';
import { useAuthStore } from '@/src/stores/auth-store';
import { isCareHomeManagerRole } from '@/src/lib/care-home-home';

export default function FlagsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const isManager = isCareHomeManagerRole(useAuthStore((state) => state.user?.role));

  const flagsQuery = useQuery({
    queryKey: ['carehome', 'review-flags', 'open', '7d'],
    queryFn: () =>
      getCareHomeReviewFlags({
        reviewStatus: 'open',
        period: '7d',
        limit: 50,
      }),
  });
  const reviewQuery = useQuery({
    queryKey: ['carehome', 'manager-review-inbox'],
    queryFn: getManagerReviewInbox,
    enabled: isManager,
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
    await Promise.all([flagsQuery.refetch(), isManager ? reviewQuery.refetch() : Promise.resolve()]);
    setRefreshing(false);
  }, [flagsQuery, isManager, reviewQuery]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title={isManager ? 'Review' : 'Alerts'} />
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
            <View>
              <PageIntro
              eyebrow="Care intelligence"
              title={isManager ? 'Manager review inbox' : 'Sensor alerts'}
              subtitle={isManager ? 'Exceptions and concerns requiring management attention.' : 'Check the resident, record what you did, then acknowledge the alert.'}
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
              {isManager && reviewQuery.data ? (
                <View style={{ gap: 10, marginBottom: 18 }}>
                  {reviewQuery.data.counts.safeguarding > 0 ? (
                    <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.status.critical, flexDirection: 'row', gap: 12 }}>
                      <ShieldAlert size={22} color={colors.status.critical} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...typography.bodyMedium, color: colors.text }}>{reviewQuery.data.counts.safeguarding} safeguarding concern{reviewQuery.data.counts.safeguarding === 1 ? '' : 's'}</Text>
                        <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>Open immediately and follow the home’s safeguarding procedure.</Text>
                      </View>
                    </Card>
                  ) : null}
                  {reviewQuery.data.careTasks.slice(0, 3).map((task) => (
                    <Card key={task.id} style={{ borderLeftWidth: 3, borderLeftColor: task.status === 'PENDING' || task.status === 'ESCALATED' ? colors.status.critical : colors.status.watch }}>
                      <Text style={{ ...typography.label, color: colors.secondary }}>CARE EXCEPTION · {task.status}</Text>
                      <Text style={{ ...typography.bodyMedium, color: colors.text, marginTop: 4 }}>{task.title}</Text>
                      <Text onPress={() => router.push(`/residents/${task.residentId}`)} style={{ ...typography.caption, color: colors.primary, marginTop: 8 }}>Open resident record</Text>
                    </Card>
                  ))}
                  {reviewQuery.data.incidents.slice(0, 3).map((incident) => (
                    <Card key={incident.id} style={{ borderLeftWidth: 3, borderLeftColor: incident.safeguardingConcern ? colors.status.critical : colors.status.watch }}>
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <AlertTriangle size={17} color={incident.safeguardingConcern ? colors.status.critical : colors.status.watch} />
                        <Text style={{ ...typography.label, color: colors.secondary }}>{incident.type} · {incident.severity}</Text>
                      </View>
                      <Text style={{ ...typography.caption, color: colors.text, marginTop: 6 }}>{incident.description}</Text>
                      <Text onPress={() => router.push(`/residents/${incident.residentId}`)} style={{ ...typography.caption, color: colors.primary, marginTop: 8 }}>Open resident record</Text>
                    </Card>
                  ))}
                </View>
              ) : null}
              {isManager ? <Text style={{ ...typography.heading, color: colors.text, marginBottom: 10 }}>Sensor review flags</Text> : null}
            </View>
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
              onOpenResident={() => router.push(`/alerts/${item.id}`)}
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
