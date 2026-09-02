import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, SlidersHorizontal } from 'lucide-react-native';
import { Card } from '@/src/components/ui/Card';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { SearchInput } from '@/src/components/ui/SearchInput';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { useAuthStore } from '@/src/stores/auth-store';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';
import {
  CARE_NOTE_DATE_PRESET_OPTIONS,
  careNoteDateRange,
  type CareNoteDatePreset,
} from '@/src/features/care-entry/care-note-filters';
import {
  deleteCareEntry,
  getCareEntries,
} from '@/src/services/care-entries.api';
import {
  CARE_ENTRY_CATEGORY_OPTIONS,
  careEntryCategoryLabel,
  userCanCreateCareNotes,
  type CareEntryCategory,
  type CareEntryDto,
} from '@/src/types/care-entry.types';
import { CareEntryComposer } from './CareEntryComposer';
import { CareNoteCard } from './CareNoteCard';

const PAGE_SIZE = 20;

interface CareNotesHistoryProps {
  residentId: string;
}

export function CareNotesHistory({ residentId }: CareNotesHistoryProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canCreate = userCanCreateCareNotes(user?.role, user?.permissions);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CareEntryCategory>(
    'all',
  );
  const [datePreset, setDatePreset] = useState<CareNoteDatePreset>('all');
  const [page, setPage] = useState(1);
  const [editingEntry, setEditingEntry] = useState<CareEntryDto | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);
  const dateRange = careNoteDateRange(datePreset);

  const listQuery = useQuery({
    queryKey: [
      'carehome',
      'care-entries',
      residentId,
      {
        search: debouncedSearch,
        category: categoryFilter,
        from: dateRange.from,
        to: dateRange.to,
        page,
        limit: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      getCareEntries(residentId, {
        search: debouncedSearch || undefined,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        from: dateRange.from,
        to: dateRange.to,
        page,
        limit: PAGE_SIZE,
      }),
    enabled: !!residentId,
  });

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteCareEntry(residentId, entryId),
    onSuccess: async (_data, entryId) => {
      if (editingEntry?.id === entryId) setEditingEntry(null);
      await queryClient.invalidateQueries({
        queryKey: ['carehome', 'care-entries', residentId],
      });
    },
    onError: (error) => {
      Alert.alert('Could not delete note', normalizeApiError(error));
    },
  });

  const entries = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination;
  const isFetching = listQuery.isFetching;
  const hasActiveFilters =
    !!debouncedSearch || categoryFilter !== 'all' || datePreset !== 'all';
  const activeFilterCount =
    (categoryFilter !== 'all' ? 1 : 0) + (datePreset !== 'all' ? 1 : 0);
  const filterSummary = [
    datePreset !== 'all'
      ? CARE_NOTE_DATE_PRESET_OPTIONS.find((option) => option.value === datePreset)
          ?.label
      : null,
    categoryFilter !== 'all' ? careEntryCategoryLabel(categoryFilter) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setDatePreset('all');
    setPage(1);
  };

  const chip = (selected: boolean) => ({
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: selected ? colors.primary : colors.border,
    backgroundColor: selected ? `${colors.primary}22` : 'transparent',
  });

  return (
    <View style={{ gap: 16 }}>
      {editingEntry ? (
        <Card>
          <Text style={{ ...typography.heading, color: colors.text }}>
            Edit care update
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: colors.secondary,
              marginTop: 4,
              marginBottom: 14,
            }}
          >
            Change the wording or categories, then save.
          </Text>
          <CareEntryComposer
            residentId={residentId}
            editingEntry={editingEntry}
            onCancelEdit={() => setEditingEntry(null)}
          />
        </Card>
      ) : null}

      <Card>
        <Text style={{ ...typography.bodyMedium, color: colors.text }}>
          Care notes
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 12,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <SearchInput
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search notes"
              accessibilityLabel="Search notes"
            />
          </View>
          <Pressable
            onPress={() => setFiltersOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Filters"
            accessibilityState={{ expanded: filtersOpen }}
            style={{
              minHeight: MIN_TOUCH_TARGET,
              paddingHorizontal: 12,
              borderRadius: radius.full,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor:
                filtersOpen || activeFilterCount > 0
                  ? theme === 'dark'
                    ? 'rgba(135,165,248,0.12)'
                    : 'rgba(37,99,235,0.08)'
                  : colors.surface,
              borderWidth: 1,
              borderColor:
                filtersOpen || activeFilterCount > 0
                  ? colors.primary
                  : colors.border,
            }}
          >
            <SlidersHorizontal size={16} color={colors.primary} />
            <Text
              style={{
                ...typography.caption,
                fontWeight: '600',
                color: colors.primary,
              }}
            >
              Filter
            </Text>
            {activeFilterCount > 0 ? (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  paddingHorizontal: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: 11,
                  }}
                >
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
            <ChevronDown
              size={16}
              color={colors.primary}
              style={{ transform: [{ rotate: filtersOpen ? '180deg' : '0deg' }] }}
            />
          </Pressable>
        </View>

        {!filtersOpen && activeFilterCount > 0 ? (
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <Text style={{ ...typography.caption, color: colors.secondary, flex: 1 }}>
              Filtered by {filterSummary}
            </Text>
            <Pressable
              onPress={clearFilters}
              accessibilityRole="button"
              accessibilityLabel="Clear filters"
            >
              <Text
                style={{
                  ...typography.caption,
                  fontWeight: '600',
                  color: colors.primary,
                }}
              >
                Clear
              </Text>
            </Pressable>
          </View>
        ) : null}

        {filtersOpen ? (
          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                ...typography.caption,
                color: colors.secondary,
                marginBottom: 8,
              }}
            >
              Date
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CARE_NOTE_DATE_PRESET_OPTIONS.map((option) => {
                const selected = option.value === datePreset;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setDatePreset(option.value);
                      setPage(1);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    style={chip(selected)}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontWeight: '600',
                        color: selected ? colors.primary : colors.secondary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text
              style={{
                ...typography.caption,
                color: colors.secondary,
                marginTop: 14,
                marginBottom: 8,
              }}
            >
              Category
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { value: 'all' as const, label: 'All' },
                ...CARE_ENTRY_CATEGORY_OPTIONS,
              ].map((option) => {
                const selected = option.value === categoryFilter;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setCategoryFilter(option.value);
                      setPage(1);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    style={chip(selected)}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontWeight: '600',
                        color: selected ? colors.primary : colors.secondary,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeFilterCount > 0 ? (
              <Pressable
                onPress={clearFilters}
                accessibilityRole="button"
                accessibilityLabel="Clear filters"
                style={{ marginTop: 14, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    fontWeight: '600',
                    color: colors.primary,
                  }}
                >
                  Clear filters
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {listQuery.isError ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            <Text style={{ ...typography.caption, color: colors.status.critical }}>
              {normalizeApiError(listQuery.error)}
            </Text>
            <Pressable
              onPress={() => void listQuery.refetch()}
              accessibilityRole="button"
              accessibilityLabel="Retry"
            >
              <Text
                style={{
                  ...typography.caption,
                  fontWeight: '600',
                  color: colors.primary,
                }}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        ) : isFetching ? (
          <View style={{ marginTop: 12, gap: 10 }}>
            <Skeleton height={88} borderRadius={radius.lg} />
            <Skeleton height={88} borderRadius={radius.lg} />
          </View>
        ) : entries.length === 0 ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            <Text style={{ ...typography.caption, color: colors.secondary }}>
              {hasActiveFilters
                ? 'No results match your filters'
                : 'No care updates yet for this resident.'}
            </Text>
            {hasActiveFilters ? (
              <Pressable
                onPress={clearFilters}
                accessibilityRole="button"
                accessibilityLabel="Clear filters"
              >
                <Text
                  style={{
                    ...typography.caption,
                    fontWeight: '600',
                    color: colors.primary,
                  }}
                >
                  Clear filters
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={{ marginTop: 12, gap: 10 }}>
            {entries.map((entry) => (
              <CareNoteCard
                key={entry.id}
                entry={entry}
                canMutate={canCreate}
                isEditing={editingEntry?.id === entry.id}
                onEdit={setEditingEntry}
                onDelete={(next) => deleteMutation.mutate(next.id)}
              />
            ))}
            {pagination && pagination.totalPages > 1 ? (
              <View
                style={{
                  marginTop: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ ...typography.caption, color: colors.secondary }}>
                  Page {pagination.page} of {pagination.totalPages}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Pressable
                    onPress={() => setPage((current) => current - 1)}
                    disabled={page <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Previous page"
                    style={{ opacity: page <= 1 ? 0.4 : 1 }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontWeight: '600',
                        color: colors.primary,
                      }}
                    >
                      Previous
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPage((current) => current + 1)}
                    disabled={page >= pagination.totalPages}
                    accessibilityRole="button"
                    accessibilityLabel="Next page"
                    style={{
                      opacity: page >= pagination.totalPages ? 0.4 : 1,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontWeight: '600',
                        color: colors.primary,
                      }}
                    >
                      Next
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : pagination ? (
              <Text style={{ ...typography.caption, color: colors.secondary }}>
                {pagination.total} {pagination.total === 1 ? 'note' : 'notes'}
              </Text>
            ) : null}
          </View>
        )}
      </Card>
    </View>
  );
}
