import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SlidersHorizontal, Users } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SearchInput } from '@/src/components/ui/SearchInput';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonRow } from '@/src/components/ui/Skeleton';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { PageIntro } from '@/src/components/ui/PageIntro';
import { ResidentCard } from '@/src/components/residents/ResidentCard';
import {
  FilterSheet,
  RESIDENT_INTELLIGENCE_OPTIONS,
} from '@/src/components/filters/FilterSheet';
import { getCareHomeResidents } from '@/src/services/residents.api';
import { getResidentIntelligenceBadges } from '@/src/services/intelligence.api';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { useUiStore } from '@/src/stores/ui-store';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';
import type { ResidentIntelligenceFilter } from '@/src/types/carehome.types';

const POLL_MS = 60_000;

export default function ResidentsScreen() {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [refreshing, setRefreshing] = useState(false);

  const intelligenceFilter = useUiStore((s) => s.residentIntelligenceFilter);
  const setIntelligenceFilter = useUiStore((s) => s.setResidentIntelligenceFilter);
  const setFilterSheetOpen = useUiStore((s) => s.setFilterSheetOpen);
  const resetResidentFilters = useUiStore((s) => s.resetResidentFilters);

  const residentsQuery = useQuery({
    queryKey: [
      'carehome',
      'residents',
      debouncedSearch,
      intelligenceFilter,
      'intelligence',
    ],
    queryFn: () =>
      getCareHomeResidents({
        search: debouncedSearch || undefined,
        intelligence:
          intelligenceFilter === 'all'
            ? undefined
            : (intelligenceFilter as ResidentIntelligenceFilter),
        sort: 'intelligence',
      }),
    refetchInterval: POLL_MS,
  });

  const badgesQuery = useQuery({
    queryKey: ['carehome', 'intelligence-badges'],
    queryFn: getResidentIntelligenceBadges,
    refetchInterval: POLL_MS,
  });

  const badgeById = useMemo(() => {
    const map = new Map(
      (badgesQuery.data?.badges ?? []).map((badge) => [badge.residentId, badge]),
    );
    return map;
  }, [badgesQuery.data]);

  const triageCounts = useMemo(() => {
    let attention = 0;
    let watch = 0;
    let delayed = 0;
    for (const badge of badgesQuery.data?.badges ?? []) {
      if (!badge.isMonitored) continue;
      if (badge.attentionCount > 0) attention += 1;
      else if (badge.watchCount > 0) watch += 1;
      else if (badge.currentRoutineStatus === 'delayed') delayed += 1;
    }
    return { attention, watch, delayed };
  }, [badgesQuery.data]);

  const residents = residentsQuery.data ?? [];
  const isFetching = residentsQuery.isFetching;
  const hasActiveFilters = !!debouncedSearch || intelligenceFilter !== 'all';

  const filterLabel =
    RESIDENT_INTELLIGENCE_OPTIONS.find((o) => o.value === intelligenceFilter)
      ?.label ?? 'Everyone';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([residentsQuery.refetch(), badgesQuery.refetch()]);
    setRefreshing(false);
  }, [residentsQuery, badgesQuery]);

  const listHeader = (
    <View>
      <PageIntro
        eyebrow="Floor triage"
        title="Residents"
        subtitle="Filter by who needs a check, needs an eye kept on them, or is off routine."
        footer={
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              {
                label: 'Needs a check',
                value: triageCounts.attention,
                color: colors.status.critical,
                bg: colors.statusBg.critical,
              },
              {
                label: 'Keep an eye on',
                value: triageCounts.watch,
                color: colors.status.watch,
                bg: colors.statusBg.watch,
              },
              {
                label: 'Off routine',
                value: triageCounts.delayed,
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
                <Text style={{ ...typography.label, color: pill.color, fontWeight: '700' }}>
                  {pill.value} {pill.label}
                </Text>
              </View>
            ))}
          </View>
        }
      />

      <SearchInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search residents or rooms..."
        accessibilityLabel="Search residents"
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          marginBottom: 8,
        }}
      >
        <Text style={{ ...typography.caption, color: colors.secondary }}>
          {residents.length} resident{residents.length !== 1 ? 's' : ''}
          {intelligenceFilter !== 'all' ? ` · ${filterLabel}` : ''}
        </Text>
        <Pressable
          onPress={() => setFilterSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: MIN_TOUCH_TARGET,
            paddingHorizontal: 12,
            borderRadius: radius.full,
            backgroundColor:
              theme === 'dark' ? 'rgba(135,165,248,0.12)' : 'rgba(37,99,235,0.08)',
          }}
        >
          <SlidersHorizontal size={16} color={colors.primary} />
          <Text
            style={{ ...typography.caption, color: colors.primary, fontWeight: '600' }}
          >
            Filter
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenHeader title="Residents" />
        <ScreenContainer scroll={false} padded={false}>
          <FlatList
            data={isFetching && residents.length === 0 ? [] : residents}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={listHeader}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              isFetching ? (
                <View style={{ gap: 12 }}>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </View>
              ) : (
                <EmptyState
                  icon={Users}
                  title={
                    hasActiveFilters
                      ? 'No results match your filters'
                      : 'No residents yet'
                  }
                  description={
                    hasActiveFilters
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Residents will appear here once added to the care home.'
                  }
                  actionLabel={hasActiveFilters ? 'Clear filters' : undefined}
                  onAction={
                    hasActiveFilters
                      ? () => {
                          setSearch('');
                          resetResidentFilters();
                        }
                      : undefined
                  }
                />
              )
            }
            renderItem={({ item, index }) => (
              <ResidentCard
                resident={item}
                badge={badgeById.get(item.id)}
                index={index}
                onPress={() => router.push(`/residents/${item.id}`)}
              />
            )}
          />
        </ScreenContainer>
      </View>

      <FilterSheet
        title="Filter residents"
        options={RESIDENT_INTELLIGENCE_OPTIONS}
        selected={intelligenceFilter}
        onSelect={(value) =>
          setIntelligenceFilter(value as typeof intelligenceFilter)
        }
        onClear={() => {
          resetResidentFilters();
          setFilterSheetOpen(false);
        }}
      />
    </>
  );
}
