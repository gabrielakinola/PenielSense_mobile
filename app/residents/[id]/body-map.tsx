import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { BodyMap, type BodyMapMarkValue } from '@/src/components/incidents/BodyMap';
import { createBodyMapRecord, getBodyMapRecords, type BodyMapRecordType } from '@/src/services/body-maps.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

const TYPES: [BodyMapRecordType, string][] = [['BRUISE', 'Bruise'], ['WOUND', 'Wound'], ['SKIN_TEAR', 'Skin tear'], ['PRESSURE_AREA', 'Pressure area'], ['RASH', 'Rash'], ['SWELLING', 'Swelling'], ['OTHER', 'Other']];

export default function BodyMapScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>(); const router = useRouter(); const colors = useThemeColors();
  const [showForm, setShowForm] = useState(false); const [type, setType] = useState<BodyMapRecordType>('BRUISE'); const [view, setView] = useState<'FRONT' | 'BACK'>('FRONT'); const [mark, setMark] = useState<BodyMapMarkValue | null>(null); const [description, setDescription] = useState(''); const [action, setAction] = useState(''); const [saving, setSaving] = useState(false);
  const query = useQuery({ queryKey: ['carehome', 'body-map-records', id], queryFn: () => getBodyMapRecords(id), enabled: !!id });
  const input = { ...typography.body, color: colors.text, minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginTop: 6 } as const;

  const submit = async () => {
    if (!mark || description.trim().length < 3) return;
    setSaving(true);
    try {
      const result = await createBodyMapRecord({ residentId: id, type, position: { view: mark.view, x: mark.x, y: mark.y }, observedAt: new Date().toISOString(), description: description.trim(), immediateAction: action.trim() });
      Alert.alert(result.queued ? 'Saved offline' : 'Body-map record saved', result.queued ? 'It will sync automatically when this device reconnects.' : 'The manager can now review this record.', [{ text: 'Done', onPress: () => router.back() }]);
    } catch (error) { Alert.alert('Could not save record', normalizeApiError(error)); } finally { setSaving(false); }
  };

  const records = query.data ?? [];
  return <><Stack.Screen options={{ title: 'Body map' }} /><ScreenContainer keyboardShouldPersistTaps="handled">
    <Card style={{ marginBottom: 14, borderLeftWidth: 3, borderLeftColor: colors.status.watch }}><Text style={{ ...typography.bodyMedium, color: colors.text }}>Skin and wound records</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 5 }}>Record the location once, then managers can follow healing and review history.</Text></Card>
    {!showForm ? <Pressable onPress={() => setShowForm(true)} style={{ minHeight: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Text style={{ ...typography.bodyMedium, color: '#FFF' }}>Add body-map record</Text></Pressable> : <Card style={{ marginBottom: 16 }}>
      <Text style={{ ...typography.label, color: colors.secondary }}>Concern type</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>{TYPES.map(([value, label]) => <Pressable key={value} onPress={() => setType(value)} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: type === value ? colors.status.critical : colors.border, backgroundColor: type === value ? `${colors.status.critical}14` : colors.surface }}><Text style={{ ...typography.label, color: type === value ? colors.status.critical : colors.secondary }}>{label}</Text></Pressable>)}</View>
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>{(['FRONT', 'BACK'] as const).map((item) => <Pressable key={item} onPress={() => { setView(item); setMark(null); }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: view === item ? colors.primary : colors.surfaceElevated }}><Text style={{ ...typography.label, color: view === item ? '#FFF' : colors.secondary }}>{item === 'FRONT' ? 'Front' : 'Back'}</Text></Pressable>)}</View>
      <Text style={{ ...typography.caption, color: colors.secondary, marginBottom: 8 }}>Tap the body where the concern was observed. Tap again to move the marker.</Text><BodyMap view={view} marks={mark ? [mark] : []} onAddMark={(x, y) => setMark({ view, x, y, type })} onRemoveMark={() => setMark(null)} />
      <Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>What did you observe?</Text><TextInput multiline value={description} onChangeText={setDescription} style={[input, { minHeight: 88 }]} placeholder="Describe size, appearance and condition" placeholderTextColor={colors.secondary} />
      <Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>Immediate action</Text><TextInput multiline value={action} onChangeText={setAction} style={[input, { minHeight: 70 }]} placeholder="Care provided or escalation made" placeholderTextColor={colors.secondary} />
      <Pressable disabled={!mark || description.trim().length < 3 || saving} onPress={() => void submit()} style={{ minHeight: 48, borderRadius: radius.md, backgroundColor: colors.primary, opacity: !mark || description.trim().length < 3 || saving ? 0.45 : 1, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}><Text style={{ ...typography.bodyMedium, color: '#FFF' }}>{saving ? 'Saving…' : 'Save body-map record'}</Text></Pressable>
    </Card>}
    <Text style={{ ...typography.title, color: colors.text, marginBottom: 10 }}>Record history</Text>
    {query.isLoading ? <SkeletonCard lines={4} /> : query.isError ? <EmptyState icon={ShieldAlert} title="Couldn’t load body-map records" description={normalizeApiError(query.error)} actionLabel="Retry" onAction={() => void query.refetch()} /> : records.length === 0 ? <EmptyState icon={CheckCircle2} title="No body-map records" description="Skin or wound observations will appear here." /> : records.map((record) => <Card key={record.id} style={{ marginBottom: 10 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={{ ...typography.bodyMedium, color: colors.text }}>{TYPES.find(([value]) => value === record.type)?.[1]}</Text><Text style={{ ...typography.label, color: record.status === 'RESOLVED' ? colors.status.good : colors.status.watch }}>{record.status.replace('_', ' ')}</Text></View><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4 }}>{new Date(record.observedAt).toLocaleString()}</Text><Text style={{ ...typography.body, color: colors.text, marginTop: 8 }}>{record.description}</Text>{record.reviewNote ? <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 7 }}>Review: {record.reviewNote}</Text> : null}</Card>)}
  </ScreenContainer></>;
}
