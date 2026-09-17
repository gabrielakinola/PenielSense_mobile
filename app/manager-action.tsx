import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import {
  updateManagerReviewAction,
  type ManagerReviewStatus,
  type ManagerReviewWorkflow,
} from '@/src/services/manager-review.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

const STATUSES: ManagerReviewStatus[] = ['NEW', 'ACKNOWLEDGED', 'ACTIONED', 'CLOSED'];

const DAY_MS = 24 * 60 * 60 * 1000;

const DUE_OPTIONS: { days: number | null; label: string }[] = [
  { days: null, label: 'No date' },
  { days: 3, label: '+3 days' },
  { days: 7, label: '+7 days' },
  { days: 14, label: '+14 days' },
];

function formatDueDate(days: number) {
  return new Date(Date.now() + days * DAY_MS).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ManagerActionScreen() {
  const params = useLocalSearchParams<{
    sourceType: ManagerReviewWorkflow['sourceType'];
    sourceId: string;
    residentId: string;
    title?: string;
    status?: ManagerReviewStatus;
    assignedTo?: string;
    actionTaken?: string;
  }>();
  const colors = useThemeColors();
  const router = useRouter();
  const qc = useQueryClient();

  const [status, setStatus] = useState<ManagerReviewStatus>(params.status ?? 'NEW');
  const [assignedTo, setAssignedTo] = useState(params.assignedTo ?? '');
  const [actionTaken, setActionTaken] = useState(params.actionTaken ?? '');
  const [dueInDays, setDueInDays] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      updateManagerReviewAction({
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        residentId: params.residentId,
        status,
        assignedTo: assignedTo.trim(),
        actionTaken: actionTaken.trim(),
        dueAt: dueInDays ? new Date(Date.now() + dueInDays * DAY_MS).toISOString() : undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['carehome', 'manager-review-inbox'] });
      router.back();
    },
    onError: (error) => Alert.alert('Could not save action', normalizeApiError(error)),
  });

  const input = {
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 8,
  } as const;

  const saveDisabled = mutation.isPending || (status === 'CLOSED' && actionTaken.trim().length < 3);

  return (
    <>
      <Stack.Screen options={{ title: 'Manager action' }} />
      <ScreenContainer keyboardShouldPersistTaps="handled">
        <Text style={{ ...typography.title, color: colors.text }}>
          {params.title ?? 'Review item'}
        </Text>
        <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 5 }}>
          Record ownership and outcome. The audit trail is shared with the manager web interface.
        </Text>

        <Card style={{ marginTop: 16 }}>
          <Text style={{ ...typography.label, color: colors.secondary }}>WORKFLOW STATUS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {STATUSES.map((item) => {
              const selected = status === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={`Set status to ${item.replace('_', ' ')}`}
                  accessibilityState={{ selected }}
                  onPress={() => setStatus(item)}
                  style={{
                    minHeight: 44,
                    justifyContent: 'center',
                    paddingHorizontal: 14,
                    borderRadius: radius.full,
                    backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                  }}
                >
                  <Text style={{ ...typography.label, color: selected ? '#FFF' : colors.secondary }}>
                    {item.replace('_', ' ')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ ...typography.label, color: colors.secondary, marginTop: 16 }}>
            Assigned to
          </Text>
          <TextInput
            value={assignedTo}
            onChangeText={setAssignedTo}
            placeholder="Staff member or role"
            placeholderTextColor={colors.secondary}
            accessibilityLabel="Assigned to"
            style={input}
          />

          <Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>
            Due date
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {DUE_OPTIONS.map((option) => {
              const selected = dueInDays === option.days;
              return (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  accessibilityLabel={
                    option.days ? `Due in ${option.days} days` : 'No due date'
                  }
                  accessibilityState={{ selected }}
                  onPress={() => setDueInDays(option.days)}
                  style={{
                    minHeight: 44,
                    justifyContent: 'center',
                    paddingHorizontal: 14,
                    borderRadius: radius.full,
                    backgroundColor: selected ? colors.primary : colors.surfaceElevated,
                  }}
                >
                  <Text style={{ ...typography.label, color: selected ? '#FFF' : colors.secondary }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {dueInDays ? (
            <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 8 }}>
              Due {formatDueDate(dueInDays)}
            </Text>
          ) : null}

          <Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>
            Action and outcome
          </Text>
          <TextInput
            multiline
            value={actionTaken}
            onChangeText={setActionTaken}
            placeholder="What was checked, decided or completed?"
            placeholderTextColor={colors.secondary}
            accessibilityLabel="Action and outcome"
            style={[input, { minHeight: 110 }]}
          />
        </Card>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save manager action"
          accessibilityState={{ disabled: saveDisabled, busy: mutation.isPending }}
          disabled={saveDisabled}
          onPress={() => mutation.mutate()}
          style={{
            minHeight: 50,
            borderRadius: radius.md,
            backgroundColor: colors.primary,
            opacity: saveDisabled ? 0.5 : 1,
            marginTop: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 7,
          }}
        >
          <CheckCircle2 size={18} color="#FFF" />
          <Text style={{ ...typography.bodyMedium, color: '#FFF' }}>
            {mutation.isPending ? 'Saving…' : 'Save manager action'}
          </Text>
        </Pressable>
      </ScreenContainer>
    </>
  );
}
