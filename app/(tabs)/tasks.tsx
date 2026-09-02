import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, ClipboardCheck, Clock3 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/src/components/ui/ScreenHeader';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { PageIntro } from '@/src/components/ui/PageIntro';
import { getCareTasks, recordCareTaskOutcome } from '@/src/services/care-tasks.api';
import { getCareHomeResidents } from '@/src/services/residents.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import type { CareTaskDto, CareTaskStatus } from '@/src/types/care-task.types';

function todayWindow() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function TasksScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const window = useMemo(todayWindow, []);
  const tasksQuery = useQuery({
    queryKey: ['carehome', 'care-tasks', 'today'],
    queryFn: () => getCareTasks(window),
  });
  const residentsQuery = useQuery({
    queryKey: ['carehome', 'residents', 'task-names'],
    queryFn: () => getCareHomeResidents(),
  });
  const names = useMemo(
    () => new Map((residentsQuery.data ?? []).map((resident) => [resident.id, resident.fullName])),
    [residentsQuery.data],
  );
  const mutation = useMutation({
    mutationFn: ({ task, status }: { task: CareTaskDto; status: Exclude<CareTaskStatus, 'PENDING'> }) =>
      recordCareTaskOutcome(task.id, status),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['carehome', 'care-tasks'] }),
    onError: (error) => Alert.alert('Could not record care', normalizeApiError(error)),
  });
  const tasks = tasksQuery.data ?? [];
  const pending = tasks.filter((task) => task.status === 'PENDING');
  const chooseOutcome = (task: CareTaskDto) => Alert.alert(
    'Record care outcome', task.title,
    [
      { text: 'Completed', onPress: () => mutation.mutate({ task, status: 'COMPLETED' }) },
      { text: 'Partly completed', onPress: () => mutation.mutate({ task, status: 'PARTIAL' }) },
      { text: 'Declined', onPress: () => mutation.mutate({ task, status: 'DECLINED' }) },
      { text: 'Unable / escalate', onPress: () => mutation.mutate({ task, status: 'ESCALATED' }) },
      { text: 'Cancel', style: 'cancel' },
    ],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Today’s care" />
      <ScreenContainer scroll={false} padded={false}>
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await Promise.all([tasksQuery.refetch(), residentsQuery.refetch()]);
                setRefreshing(false);
              }}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <PageIntro
              eyebrow="Shift tasks"
              title={`${pending.length} care task${pending.length === 1 ? '' : 's'} outstanding`}
              subtitle="Record the outcome at the point of care. Declined or unable care remains visible for review."
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardCheck}
              title="No care tasks today"
              description={tasksQuery.isError ? normalizeApiError(tasksQuery.error) : 'Scheduled care will appear here.'}
            />
          }
          renderItem={({ item }) => {
            const overdue = item.status === 'PENDING' && new Date(item.dueAt).getTime() < Date.now();
            const accent = item.priority === 'URGENT' || overdue
              ? colors.status.critical
              : item.priority === 'IMPORTANT'
                ? colors.status.watch
                : colors.primary;
            return (
              <Card style={{ marginBottom: 12, borderLeftWidth: 3, borderLeftColor: accent }}>
                <Pressable
                  onPress={() => router.push(`/residents/${item.residentId}`)}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.label, color: colors.secondary }}>
                      {names.get(item.residentId) ?? 'Resident'} · {new Date(item.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={{ ...typography.bodyMedium, color: colors.text, marginTop: 4 }}>{item.title}</Text>
                    <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4 }}>{item.instructions}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.secondary} />
                </Pressable>
                {item.status === 'PENDING' ? (
                  <Pressable
                    onPress={() => chooseOutcome(item)}
                    disabled={mutation.isPending}
                    style={{ marginTop: 14, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}
                  >
                    <Check size={18} color={colors.background} />
                    <Text style={{ ...typography.bodyMedium, color: colors.background }}>Record outcome</Text>
                  </Pressable>
                ) : (
                  <View style={{ marginTop: 12, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Clock3 size={15} color={colors.status.good} />
                    <Text style={{ ...typography.caption, color: colors.status.good }}>{item.status.replace('_', ' ')}</Text>
                  </View>
                )}
              </Card>
            );
          }}
        />
      </ScreenContainer>
    </View>
  );
}
