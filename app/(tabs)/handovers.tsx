import { useCallback, useState, type ReactNode } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { PageIntro } from '@/src/components/ui/PageIntro';
import { Card } from '@/src/components/ui/Card';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { AnimatedButton } from '@/src/components/ui/AnimatedButton';
import { HandoverResidentRow } from '@/src/components/handovers/HandoverResidentRow';
import {
  generateHandover,
  getActiveHandover,
} from '@/src/services/handover.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

const SHIFT_COPY = {
  morning: 'Morning handover',
  afternoon: 'Afternoon handover',
  night: 'Night handover',
} as const;

export default function HandoversScreen() {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const handoverQuery = useQuery({
    queryKey: ['carehome', 'handovers', 'active'],
    queryFn: () => getActiveHandover({ sort: 'priority' }),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateHandover(true),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['carehome', 'handovers'] });
    },
  });

  const handover = handoverQuery.data;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handoverQuery.refetch();
    setRefreshing(false);
  }, [handoverQuery]);

  const shell = (body: ReactNode) => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Handovers" />
      {body}
    </View>
  );

  if (handoverQuery.isLoading) {
    return shell(
      <ScreenContainer>
        <SkeletonCard lines={4} />
      </ScreenContainer>,
    );
  }

  if (handoverQuery.isError) {
    return shell(
      <ScreenContainer>
        <EmptyState
          icon={ClipboardList}
          title="Couldn’t load handover"
          description={normalizeApiError(handoverQuery.error)}
          actionLabel="Retry"
          onAction={() => void handoverQuery.refetch()}
        />
      </ScreenContainer>,
    );
  }

  if (!handover) {
    return shell(
      <ScreenContainer>
        <PageIntro
          eyebrow="Shift change"
          title="No active handover yet"
          subtitle="Generate this shift’s report so the next carer can pick up quickly."
        />
        <EmptyState
          icon={ClipboardList}
          title="Ready when you are"
          description="Create the current shift handover for your care home."
          actionLabel={
            generateMutation.isPending ? 'Generating…' : 'Generate handover'
          }
          onAction={() => generateMutation.mutate()}
        />
      </ScreenContainer>,
    );
  }

  const residents = [...handover.residents].sort((a, b) => {
    const rank = { attention: 0, watch: 1, normal: 2 } as const;
    return rank[a.riskLevel] - rank[b.riskLevel];
  });

  return shell(
    <ScreenContainer scroll={false} padded={false}>
      <FlatList
        data={residents}
        keyExtractor={(item) => item.residentId}
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
          <View style={{ marginBottom: 8 }}>
            <PageIntro
              eyebrow={handover.dateKey}
              title={SHIFT_COPY[handover.shiftWindow]}
              subtitle={handover.careHomeSummary.narrative}
              footer={
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    {
                      label: 'Attention',
                      value: handover.careHomeSummary.residentsRequiringAttention,
                      color: colors.status.critical,
                      bg: colors.statusBg.critical,
                    },
                    {
                      label: 'Flags',
                      value: handover.careHomeSummary.residentsWithReviewFlags,
                      color: colors.status.watch,
                      bg: colors.statusBg.watch,
                    },
                    {
                      label: 'Monitored',
                      value: handover.careHomeSummary.residentsMonitored,
                      color: colors.primary,
                      bg:
                        theme === 'dark'
                          ? 'rgba(135,165,248,0.14)'
                          : 'rgba(37,99,235,0.08)',
                    },
                  ].map((pill) => (
                    <View
                      key={pill.label}
                      style={{
                        borderRadius: radius.full,
                        backgroundColor: pill.bg,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.label,
                          color: pill.color,
                          fontWeight: '700',
                        }}
                      >
                        {pill.value} {pill.label}
                      </Text>
                    </View>
                  ))}
                </View>
              }
            />

            <Card style={{ marginBottom: 12 }}>
              <Text style={{ ...typography.caption, color: colors.secondary }}>
                Sleep changes {handover.careHomeSummary.residentsWithSleepChanges} ·
                Movement {handover.careHomeSummary.residentsWithIncreasedMovement} ·
                Device issues {handover.careHomeSummary.deviceIssues}
              </Text>
              {handover.canRefresh ? (
                <View style={{ marginTop: 12 }}>
                  <AnimatedButton
                    label={
                      generateMutation.isPending
                        ? 'Refreshing…'
                        : 'Refresh this shift once'
                    }
                    onPress={() => generateMutation.mutate()}
                    disabled={generateMutation.isPending}
                    size="md"
                  />
                </View>
              ) : (
                <Text
                  style={{
                    ...typography.label,
                    color: colors.secondary,
                    marginTop: 10,
                  }}
                >
                  Manual refresh already used for this shift.
                </Text>
              )}
            </Card>

            <SectionHeader title="Priority residents" />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={ClipboardList}
            title="No resident cards"
            description="This handover has no resident summaries yet."
          />
        }
        renderItem={({ item, index }) => (
          <HandoverResidentRow
            resident={item}
            index={index}
            onPress={() => router.push(`/residents/${item.residentId}`)}
          />
        )}
      />
    </ScreenContainer>,
  );
}
