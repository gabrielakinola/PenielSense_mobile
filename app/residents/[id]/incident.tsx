import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { createIncident } from '@/src/services/incidents.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

const TYPES = ['FALL', 'INJURY', 'MEDICATION', 'BEHAVIOUR', 'MISSING_PERSON', 'SAFEGUARDING', 'OTHER'];
const SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

export default function IncidentScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const [type, setType] = useState('OTHER');
  const [severity, setSeverity] = useState('MODERATE');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [safeguarding, setSafeguarding] = useState(false);
  const [safeguardingRationale, setSafeguardingRationale] = useState('');
  const [saving, setSaving] = useState(false);
  const inputStyle = { ...typography.body, color: colors.text, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginTop: 6 };
  const valid = location.trim() && description.trim().length >= 3 && immediateAction.trim().length >= 3 && (!safeguarding || safeguardingRationale.trim().length >= 3);
  const submit = async () => {
    setSaving(true);
    try {
      const result = await createIncident({
        residentId: id, type, severity, occurredAt: new Date().toISOString(),
        location: location.trim(), description: description.trim(),
        immediateAction: immediateAction.trim(), familyNotified: false,
        managerNotified: true, safeguardingConcern: safeguarding,
        safeguardingRationale: safeguardingRationale.trim(),
      });
      Alert.alert(
        result.queued ? 'Saved offline' : 'Incident reported',
        result.queued ? 'This report is secured on this device and will sync automatically.' : 'The manager review inbox has been updated.',
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (error) {
      Alert.alert('Could not report incident', normalizeApiError(error));
    } finally { setSaving(false); }
  };
  return (
    <>
      <Stack.Screen options={{ title: 'Report concern' }} />
      <ScreenContainer keyboardShouldPersistTaps="handled">
        <Card style={{ borderLeftWidth: 3, borderLeftColor: colors.status.critical, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}><AlertTriangle size={21} color={colors.status.critical} /><Text style={{ ...typography.caption, color: colors.text, flex: 1 }}>Record what happened and the immediate action taken. For immediate danger, follow the home’s emergency procedure first.</Text></View>
        </Card>
        <Text style={{ ...typography.label, color: colors.secondary }}>Incident type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7, marginBottom: 16 }}>
          {TYPES.map((value) => <Pressable key={value} onPress={() => { setType(value); if (value === 'SAFEGUARDING') setSafeguarding(true); }} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: type === value ? colors.primary : colors.border, backgroundColor: type === value ? `${colors.primary}22` : colors.surface }}><Text style={{ ...typography.label, color: type === value ? colors.primary : colors.secondary }}>{value.replace('_', ' ')}</Text></Pressable>)}
        </View>
        <Text style={{ ...typography.label, color: colors.secondary }}>Severity</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7, marginBottom: 16 }}>
          {SEVERITIES.map((value) => <Pressable key={value} onPress={() => setSeverity(value)} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.full, borderWidth: 1, borderColor: severity === value ? colors.status.critical : colors.border }}><Text style={{ ...typography.label, color: severity === value ? colors.status.critical : colors.secondary }}>{value}</Text></Pressable>)}
        </View>
        {[['Location', location, setLocation], ['What happened?', description, setDescription], ['Immediate action taken', immediateAction, setImmediateAction]].map(([label, value, setter]) => <View key={label as string} style={{ marginBottom: 14 }}><Text style={{ ...typography.label, color: colors.secondary }}>{label as string}</Text><TextInput multiline={label !== 'Location'} value={value as string} onChangeText={setter as (text: string) => void} style={inputStyle} placeholder={label as string} placeholderTextColor={colors.secondary} /></View>)}
        <Pressable onPress={() => setSafeguarding((value) => !value)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: safeguarding ? colors.status.critical : colors.border, backgroundColor: safeguarding ? colors.status.critical : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{safeguarding ? <Check size={16} color={colors.background} /> : null}</View><Text style={{ ...typography.bodyMedium, color: colors.text }}>This may be a safeguarding concern</Text></Pressable>
        {safeguarding ? <View style={{ marginTop: 8 }}><Text style={{ ...typography.label, color: colors.status.critical }}>Why is safeguarding being considered?</Text><TextInput multiline value={safeguardingRationale} onChangeText={setSafeguardingRationale} style={inputStyle} placeholder="Record the concern and immediate protection action" placeholderTextColor={colors.secondary} /></View> : null}
        <Pressable disabled={!valid || saving} onPress={submit} style={{ minHeight: 50, borderRadius: radius.md, backgroundColor: colors.status.critical, opacity: valid && !saving ? 1 : 0.45, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 28 }}><Text style={{ ...typography.bodyMedium, color: colors.background }}>{saving ? 'Saving…' : 'Submit report'}</Text></Pressable>
      </ScreenContainer>
    </>
  );
}
