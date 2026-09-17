import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pill, ShieldAlert } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import {
  getMar,
  getMedicationOrders,
  recordMar,
} from '@/src/services/medication.api';
import type {
  MarOutcome,
  MedicationOrderDto,
} from '@/src/types/medication.types';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

/** Builds today's Date at a schedule time ("HH:mm", device-local) as ISO. */
function slotIsoFor(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

const SCHEDULED_OUTCOMES: MarOutcome[] = ['GIVEN', 'REFUSED', 'OMITTED', 'NOT_AVAILABLE'];
const PRN_OUTCOMES: MarOutcome[] = ['PRN_GIVEN', 'REFUSED', 'OMITTED', 'NOT_AVAILABLE'];

export default function MedicationScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const qc = useQueryClient();
  const orders = useQuery({
    queryKey: ['carehome', 'medication-orders', id],
    queryFn: () => getMedicationOrders(id),
    enabled: !!id,
  });
  const mar = useQuery({
    queryKey: ['carehome', 'mar', id],
    queryFn: () => getMar(id),
    enabled: !!id,
  });
  const [selected, setSelected] = useState<MedicationOrderDto | null>(null);
  const [outcome, setOutcome] = useState<MarOutcome>('GIVEN');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [slot, setSlot] = useState('');

  const orderNames = useMemo(() => {
    const map = new Map<string, string>();
    orders.data?.forEach((order) => map.set(order.id, `${order.name} ${order.strength ?? ''}`.trim()));
    return map;
  }, [orders.data]);

  /** Slots of the selected order already signed in the MAR (voided entries do not block re-signing). */
  const signedSlots = useMemo(() => {
    const set = new Set<string>();
    if (!selected) return set;
    mar.data?.forEach((entry) => {
      if (entry.medicationOrderId === selected.id && entry.scheduledFor && !entry.voidedAt) {
        set.add(entry.scheduledFor);
      }
    });
    return set;
  }, [mar.data, selected]);

  const submit = useMutation({
    mutationFn: () =>
      recordMar(selected!.id, {
        outcome,
        doseRecorded: selected!.dose,
        scheduledFor: slot || undefined,
        reason: reason || undefined,
        notes: notes || undefined,
        prnIndicationObserved: outcome === 'PRN_GIVEN' ? reason : undefined,
      }),
    onSuccess: async () => {
      Alert.alert('Recorded', 'Medication outcome signed in the MAR.');
      setSelected(null);
      setReason('');
      setNotes('');
      setSlot('');
      await qc.invalidateQueries({ queryKey: ['carehome', 'mar', id] });
    },
    onError: (e) => Alert.alert('Could not record', normalizeApiError(e)),
  });

  const reasonRequired = outcome !== 'GIVEN';
  const canSubmit =
    !submit.isPending &&
    (!reasonRequired || !!reason.trim()) &&
    (selected?.prn === true || !!slot);

  const input = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    marginTop: 7,
  } as const;

  return (
    <>
      <Stack.Screen options={{ title: 'Medication and MAR' }} />
      <ScreenContainer keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
          <Pill size={23} color={colors.primary} />
          <Text style={{ ...typography.title, color: colors.text }}>
            Medication and MAR
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            marginVertical: 14,
            padding: 12,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceElevated,
          }}
        >
          <ShieldAlert size={18} color={colors.status.watch} />
          <Text style={{ ...typography.caption, color: colors.secondary, flex: 1 }}>
            Online safety record. Check the authorised MAR and medicine before
            signing. Medication entries are not queued offline.
          </Text>
        </View>

        {orders.isLoading ? (
          <SkeletonCard lines={5} />
        ) : orders.data?.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No active medication"
            description="There are no active medication orders for this resident."
          />
        ) : (
          orders.data?.map((order) => (
            <Card key={order.id} style={{ marginBottom: 11 }}>
              <Text style={{ ...typography.heading, color: colors.text }}>
                {order.name} {order.strength}
              </Text>
              <Text style={{ ...typography.body, color: colors.secondary, marginTop: 4 }}>
                {order.dose} · {order.route} ·{' '}
                {order.prn ? 'PRN' : order.scheduleTimes.join(', ')}
              </Text>
              {order.instructions ? (
                <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 7 }}>
                  {order.instructions}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Record outcome for ${order.name}`}
                onPress={() => {
                  setSelected(order);
                  setOutcome(order.prn ? 'PRN_GIVEN' : 'GIVEN');
                  setSlot('');
                  setReason('');
                  setNotes('');
                }}
                style={{
                  marginTop: 12,
                  backgroundColor: colors.primary,
                  borderRadius: radius.md,
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...typography.bodyMedium, color: '#fff' }}>
                  Record outcome
                </Text>
              </Pressable>
            </Card>
          ))
        )}

        {selected ? (
          <Card style={{ marginBottom: 14 }}>
            <Text style={{ ...typography.heading, color: colors.text }}>
              Sign: {selected.name}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
              {(selected.prn ? PRN_OUTCOMES : SCHEDULED_OUTCOMES).map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setOutcome(option)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: outcome === option ? colors.primary : colors.surfaceElevated,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: outcome === option ? '#fff' : colors.text,
                    }}
                  >
                    {option.replaceAll('_', ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>

            {!selected.prn ? (
              <>
                <Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>
                  SCHEDULED SLOT (TODAY)
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {selected.scheduleTimes.map((time) => {
                    const iso = slotIsoFor(time);
                    const signed = signedSlots.has(iso);
                    const active = slot === iso;
                    return (
                      <Pressable
                        key={time}
                        accessibilityRole="button"
                        accessibilityLabel={`Slot ${time}${signed ? ', already signed' : ''}`}
                        disabled={signed}
                        onPress={() => setSlot(iso)}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 11,
                          borderRadius: radius.md,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: signed
                            ? colors.statusBg.good
                            : active
                              ? colors.primary
                              : colors.surface,
                          opacity: signed ? 0.75 : 1,
                        }}
                      >
                        <Text
                          style={{
                            ...typography.bodyMedium,
                            color: signed ? colors.status.good : active ? '#fff' : colors.text,
                          }}
                        >
                          {time}
                          {signed ? ' · signed' : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 7 }}>
                  Each slot can only be signed once. Recording for an earlier
                  day is not possible from the app — speak to your manager.
                </Text>
              </>
            ) : null}

            <Text style={{ ...typography.label, color: colors.secondary, marginTop: 13 }}>
              {outcome === 'PRN_GIVEN'
                ? 'OBSERVED INDICATION'
                : 'REASON (required when not given)'}
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              style={[input, { minHeight: 70 }]}
              placeholderTextColor={colors.secondary}
            />
            <Text style={{ ...typography.label, color: colors.secondary, marginTop: 13 }}>
              NOTES
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[input, { minHeight: 70 }]}
              placeholderTextColor={colors.secondary}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={() => submit.mutate()}
              style={{
                marginTop: 14,
                backgroundColor: colors.primary,
                opacity: canSubmit ? 1 : 0.45,
                borderRadius: radius.md,
                minHeight: 50,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...typography.bodyMedium, color: '#fff' }}>
                {submit.isPending ? 'Saving…' : 'Confirm and sign'}
              </Text>
            </Pressable>
          </Card>
        ) : null}

        <Text style={{ ...typography.heading, color: colors.text, marginVertical: 10 }}>
          Recent MAR
        </Text>
        {mar.data?.slice(0, 20).map((entry) => {
          const voided = !!entry.voidedAt;
          return (
            <Card key={entry.id} style={{ marginBottom: 8, opacity: voided ? 0.6 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <Text
                  style={{
                    ...typography.bodyMedium,
                    color: colors.text,
                    textDecorationLine: voided ? 'line-through' : 'none',
                    flex: 1,
                  }}
                >
                  {orderNames.get(entry.medicationOrderId) ?? 'Medication'} —{' '}
                  {entry.outcome.replaceAll('_', ' ')}
                </Text>
                {voided ? (
                  <Text style={{ ...typography.label, color: colors.status.critical }}>
                    VOIDED
                  </Text>
                ) : null}
              </View>
              <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>
                {entry.doseRecorded}
                {entry.scheduledFor
                  ? ` · slot ${new Date(entry.scheduledFor).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                  : ''}
                {` · signed ${new Date(entry.administeredAt).toLocaleString('en-GB')}`}
              </Text>
              {entry.reason ? (
                <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>
                  Reason: {entry.reason}
                </Text>
              ) : null}
              {voided ? (
                <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 3 }}>
                  Voided by {entry.voidedBy ?? 'a manager'}
                  {entry.voidReason ? ` — ${entry.voidReason}` : ''}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </ScreenContainer>
    </>
  );
}
