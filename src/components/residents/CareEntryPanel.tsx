import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/src/components/ui/Card';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useAuthStore } from '@/src/stores/auth-store';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';
import {
  deleteCareEntry,
  getCareEntries,
} from '@/src/services/care-entries.api';
import {
  userCanCreateCareNotes,
  type CareEntryDto,
} from '@/src/types/care-entry.types';
import { CareEntryComposer } from './CareEntryComposer';
import { CareNoteCard } from './CareNoteCard';

interface CareEntryPanelProps {
  residentId: string;
}

export function CareEntryPanel({ residentId }: CareEntryPanelProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canCreate = userCanCreateCareNotes(user?.role, user?.permissions);
  const [editingEntry, setEditingEntry] = useState<CareEntryDto | null>(null);

  const latestQuery = useQuery({
    queryKey: ['carehome', 'care-entries', residentId, { limit: 1, page: 1 }],
    queryFn: () => getCareEntries(residentId, { limit: 1, page: 1 }),
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

  const latest = latestQuery.data?.items[0] ?? null;
  const total = latestQuery.data?.pagination.total ?? 0;
  const isFetching = latestQuery.isFetching;

  return (
    <Card style={{ marginBottom: 16 }}>
      <Text style={{ ...typography.heading, color: colors.text }}>
        {editingEntry ? 'Edit care update' : 'Log a care update'}
      </Text>
      <Text
        style={{
          ...typography.caption,
          color: colors.secondary,
          marginTop: 4,
          marginBottom: 14,
        }}
      >
        {editingEntry
          ? 'Change the wording or categories, then save.'
          : 'Type what happened. We will suggest categories for you to confirm.'}
      </Text>

      <CareEntryComposer
        residentId={residentId}
        editingEntry={editingEntry}
        onCancelEdit={() => setEditingEntry(null)}
      />

      <View
        style={{
          marginTop: 18,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <Text style={{ ...typography.bodyMedium, color: colors.text }}>
            Latest note
          </Text>
          <Pressable
            onPress={() => router.push(`/residents/${residentId}/notes`)}
            accessibilityRole="button"
            accessibilityLabel="See all notes"
            style={{
              minHeight: MIN_TOUCH_TARGET,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Text
              style={{
                ...typography.caption,
                fontWeight: '600',
                color: colors.primary,
              }}
            >
              See all notes
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </Pressable>
        </View>

        {latestQuery.isError ? (
          <View style={{ marginTop: 10, gap: 8 }}>
            <Text style={{ ...typography.caption, color: colors.status.critical }}>
              {normalizeApiError(latestQuery.error)}
            </Text>
            <Pressable
              onPress={() => void latestQuery.refetch()}
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
          <View style={{ marginTop: 12 }}>
            <Skeleton height={88} borderRadius={radius.lg} />
          </View>
        ) : !latest ? (
          <Text
            style={{
              ...typography.caption,
              color: colors.secondary,
              marginTop: 10,
            }}
          >
            No care updates yet for this resident.
          </Text>
        ) : (
          <View style={{ marginTop: 12, gap: 8 }}>
            {total > 1 ? (
              <Text style={{ ...typography.caption, color: colors.secondary }}>
                {total} notes in history
              </Text>
            ) : null}
            <CareNoteCard
              entry={latest}
              canMutate={canCreate}
              isEditing={editingEntry?.id === latest.id}
              onEdit={setEditingEntry}
              onDelete={(entry) => deleteMutation.mutate(entry.id)}
            />
          </View>
        )}
      </View>
    </Card>
  );
}
