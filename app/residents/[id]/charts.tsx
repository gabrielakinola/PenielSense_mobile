import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Droplets, Scale, RefreshCw, Toilet } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { EmptyState } from '@/src/components/ui/EmptyState';
import {
  createCareEntry,
  getCareEntries,
} from '@/src/services/care-entries.api';
import type {
  CareObservationDto,
  CareObservationKind,
  CreateCareEntryPayload,
} from '@/src/types/care-entry.types';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

type ChartTab = 'FLUID' | 'WEIGHT' | 'BOWEL' | 'REPOSITIONING';

const TABS: { key: ChartTab; label: string; icon: typeof Scale }[] = [
  { key: 'FLUID', label: 'Fluid', icon: Droplets },
  { key: 'WEIGHT', label: 'Weight', icon: Scale },
  { key: 'BOWEL', label: 'Bowel', icon: Toilet },
  { key: 'REPOSITIONING', label: 'Repositioning', icon: RefreshCw },
];

const BRISTOL_TYPES: { value: number; label: string; hint: string }[] = [
  { value: 1, label: 'Type 1', hint: 'Separate hard lumps' },
  { value: 2, label: 'Type 2', hint: 'Lumpy, sausage-like' },
  { value: 3, label: 'Type 3', hint: 'Sausage with cracks' },
  { value: 4, label: 'Type 4', hint: 'Smooth, soft sausage' },
  { value: 5, label: 'Type 5', hint: 'Soft blobs' },
  { value: 6, label: 'Type 6', hint: 'Mushy, ragged edges' },
  { value: 7, label: 'Type 7', hint: 'Entirely liquid' },
];

const POSITIONS = [
  'Left side',
  'Right side',
  'Back',
  'Sitting',
  'Standing / walking',
];

const CHART_KINDS: CareObservationKind[] = [
  'WEIGHT',
  'BOWEL_MOVEMENT',
  'REPOSITIONING',
  'FLUID_INTAKE',
];

function observationText(observation: CareObservationDto) {
  if (observation.kind === 'FLUID_INTAKE') return `${observation.value} ml`;
  if (observation.kind === 'WEIGHT') return `${observation.value} kg`;
  if (observation.kind === 'BOWEL_MOVEMENT') return `Bristol type ${observation.value}`;
  return observation.label;
}

export default function ChartsScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ChartTab>('FLUID');
  const [fluid, setFluid] = useState('');
  const [weight, setWeight] = useState('');
  const [bristol, setBristol] = useState<number | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const entries = useQuery({
    queryKey: ['carehome', 'care-entries', id, 'charts'],
    queryFn: () => getCareEntries(id, { limit: 60 }),
    enabled: !!id,
  });

  const recent = useMemo(() => {
    const rows: { id: string; at: string; by: string; observation: CareObservationDto }[] = [];
    entries.data?.items.forEach((entry) => {
      entry.confirmedObservations
        ?.filter((observation) => CHART_KINDS.includes(observation.kind))
        .forEach((observation, index) =>
          rows.push({
            id: `${entry.id}-${index}`,
            at: entry.confirmedAt,
            by: entry.confirmedBy.firstName,
            observation,
          }),
        );
    });
    return rows
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 20);
  }, [entries.data]);

  const submit = useMutation({
    mutationFn: async () => {
      let payload: CreateCareEntryPayload;
      const trimmedNote = note.trim();
      if (tab === 'FLUID') {
        const ml = Number(fluid);
        const summary = `Fluid intake recorded: ${ml} ml`;
        payload = {
          rawText: trimmedNote ? `${summary} — ${trimmedNote}` : summary,
          items: [{ category: 'FLUID', summary }],
          observations: [
            { kind: 'FLUID_INTAKE', value: ml, unit: 'ML', label: 'Fluid taken' },
          ],
        };
      } else if (tab === 'WEIGHT') {
        const kg = Number(weight);
        const summary = `Weight recorded: ${kg} kg`;
        payload = {
          rawText: trimmedNote ? `${summary} — ${trimmedNote}` : summary,
          items: [{ category: 'GENERAL_WELLBEING', summary }],
          observations: [{ kind: 'WEIGHT', value: kg, unit: 'KG', label: 'Weight' }],
        };
      } else if (tab === 'BOWEL') {
        const type = BRISTOL_TYPES.find((t) => t.value === bristol)!;
        const summary = `Bowel movement — ${type.label} (${type.hint})`;
        payload = {
          rawText: trimmedNote ? `${summary} — ${trimmedNote}` : summary,
          items: [{ category: 'CONTINENCE', summary }],
          observations: [
            { kind: 'BOWEL_MOVEMENT', value: type.value, unit: 'BRISTOL', label: type.label },
          ],
        };
      } else {
        const summary = `Repositioned — ${position}`;
        payload = {
          rawText: trimmedNote ? `${summary} — ${trimmedNote}` : summary,
          items: [{ category: 'MOBILITY', summary }],
          observations: [
            { kind: 'REPOSITIONING', value: 1, unit: 'EVENT', label: summary },
          ],
        };
      }
      return createCareEntry(id, payload);
    },
    onSuccess: async (result) => {
      if (result.queued) {
        Alert.alert('Saved on this device', 'The chart record will sync when you are back online.');
      }
      setWeight('');
      setFluid('');
      setBristol(null);
      setPosition(null);
      setNote('');
      await qc.invalidateQueries({ queryKey: ['carehome', 'care-entries', id] });
    },
    onError: (e) => Alert.alert('Could not record', normalizeApiError(e)),
  });

  const weightValue = Number(weight);
  const fluidValue = Number(fluid);
  const canSubmit =
    !submit.isPending &&
    (tab === 'FLUID'
      ? fluid.trim().length > 0 && Number.isFinite(fluidValue) && fluidValue > 0 && fluidValue <= 5000
      : tab === 'WEIGHT'
      ? weight.trim().length > 0 && Number.isFinite(weightValue) && weightValue > 0 && weightValue < 500
      : tab === 'BOWEL'
        ? bristol !== null
        : position !== null);

  const input = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    marginTop: 8,
  } as const;

  return (
    <ScreenContainer keyboardShouldPersistTaps="handled">
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`${label} chart`}
            onPress={() => setTab(key)}
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              backgroundColor: tab === key ? colors.primary : colors.surfaceElevated,
            }}
          >
            <Icon size={17} color={tab === key ? '#fff' : colors.secondary} />
            <Text
              style={{
                ...typography.label,
                color: tab === key ? '#fff' : colors.text,
              }}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card style={{ marginTop: 14 }}>
        {tab === 'FLUID' ? (
          <>
            <Text style={{ ...typography.bodyMedium, color: colors.text }}>
              Record fluid taken
            </Text>
            <TextInput
              value={fluid}
              onChangeText={setFluid}
              keyboardType="number-pad"
              placeholder="Amount in ml (e.g. 250)"
              placeholderTextColor={colors.secondary}
              style={input}
            />
          </>
        ) : null}

        {tab === 'WEIGHT' ? (
          <>
            <Text style={{ ...typography.bodyMedium, color: colors.text }}>
              Record weight
            </Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="Weight in kg (e.g. 72.5)"
              placeholderTextColor={colors.secondary}
              style={input}
            />
          </>
        ) : null}

        {tab === 'BOWEL' ? (
          <>
            <Text style={{ ...typography.bodyMedium, color: colors.text }}>
              Bristol stool type
            </Text>
            <View style={{ gap: 7, marginTop: 10 }}>
              {BRISTOL_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  accessibilityRole="button"
                  accessibilityLabel={`${type.label}, ${type.hint}`}
                  onPress={() => setBristol(type.value)}
                  style={{
                    minHeight: 48,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: bristol === type.value ? colors.primary : colors.border,
                    backgroundColor:
                      bristol === type.value ? `${colors.primary}14` : colors.surface,
                    paddingHorizontal: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      ...typography.bodyMedium,
                      color: bristol === type.value ? colors.primary : colors.text,
                    }}
                  >
                    {type.label}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.secondary, flex: 1 }}>
                    {type.hint}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {tab === 'REPOSITIONING' ? (
          <>
            <Text style={{ ...typography.bodyMedium, color: colors.text }}>
              New position
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {POSITIONS.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  onPress={() => setPosition(option)}
                  style={{
                    paddingHorizontal: 13,
                    paddingVertical: 11,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: position === option ? colors.primary : colors.border,
                    backgroundColor:
                      position === option ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: position === option ? '#fff' : colors.text,
                    }}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>
          NOTE (OPTIONAL)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Anything relevant for the next carer"
          placeholderTextColor={colors.secondary}
          style={[input, { minHeight: 64 }]}
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
            {submit.isPending ? 'Saving…' : 'Save chart record'}
          </Text>
        </Pressable>
      </Card>

      <Text style={{ ...typography.heading, color: colors.text, marginVertical: 12 }}>
        Recent chart records
      </Text>
      {entries.isLoading ? (
        <SkeletonCard lines={4} />
      ) : recent.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No chart records yet"
          description="Fluid, weight, bowel and repositioning records for this resident appear here."
        />
      ) : (
        recent.map((row) => (
          <Card key={row.id} style={{ marginBottom: 8, padding: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                  {row.observation.kind === 'WEIGHT'
                    ? 'Weight'
                    : row.observation.kind === 'FLUID_INTAKE'
                      ? 'Fluid intake'
                    : row.observation.kind === 'BOWEL_MOVEMENT'
                      ? 'Bowel movement'
                      : 'Repositioning'}
                </Text>
                <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 2 }}>
                  {observationText(row.observation)} ·{' '}
                  {new Date(row.at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  · {row.by}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
