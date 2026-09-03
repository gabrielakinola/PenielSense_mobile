import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { getCareHomeReviewFlags, closeCareHomeReviewFlag } from '@/src/services/review-flags.api';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { normalizeApiError } from '@/src/lib/api-client';

export default function AlertDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>(); const colors = useThemeColors(); const router = useRouter(); const qc = useQueryClient();
  const [checked, setChecked] = useState(false); const [action, setAction] = useState('');
  const query = useQuery({ queryKey: ['carehome', 'review-flags', 'alert', id], queryFn: () => getCareHomeReviewFlags({ period: '30d', limit: 100 }) });
  const flag = query.data?.items.find(x => x.id === id);
  const mutation = useMutation({ mutationFn: () => closeCareHomeReviewFlag(id, 'reviewed', { residentChecked: checked, actionTaken: action.trim() }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['carehome', 'review-flags'] }); router.back(); }, onError: e => Alert.alert('Could not acknowledge', normalizeApiError(e)) });
  return <><Stack.Screen options={{ title: flag?.residentName ?? 'Sensor alert' }} /><ScreenContainer>{query.isLoading ? <SkeletonCard lines={5} /> : flag ? <View style={{ gap: 12 }}>
    <View><Text style={{ ...typography.label, color: colors.status.critical }}>NEEDS ACTION</Text><Text style={{ ...typography.title, color: colors.text, marginTop: 5 }}>{flag.message}</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 5 }}>{flag.residentName} · {flag.room}</Text></View>
    <Card><Text style={{ ...typography.bodyMedium, color: colors.text }}>Why this was flagged</Text><View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}><Activity size={21} color={colors.primary} /><View><Text style={{ ...typography.body, color: colors.text }}>{flag.vitalLabel}: {flag.value}</Text><Text style={{ ...typography.caption, color: colors.secondary }}>Usual range {flag.baselineMin}–{flag.baselineMax} · {flag.source}</Text></View></View></Card>
    <Card style={{ backgroundColor: colors.statusBg.watch }}><View style={{ flexDirection: 'row', gap: 10 }}><ShieldAlert size={21} color={colors.status.watch} /><Text style={{ ...typography.caption, color: colors.text, flex: 1 }}>Check the resident and follow the home’s escalation procedure. Peniel Care supports observation; it does not diagnose.</Text></View></Card>
    <Pressable onPress={() => setChecked(v => !v)} style={{ minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: checked ? colors.status.good : colors.border, backgroundColor: checked ? colors.statusBg.good : colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}><CheckCircle2 size={21} color={checked ? colors.status.good : colors.secondary} /><Text style={{ ...typography.bodyMedium, color: colors.text }}>Resident checked</Text></Pressable>
    <TextInput value={action} onChangeText={setAction} multiline placeholder="Record action taken" placeholderTextColor={colors.secondary} style={{ minHeight: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, padding: 14, color: colors.text, ...typography.body }} />
    <Pressable disabled={!checked || action.trim().length < 3 || mutation.isPending} onPress={() => mutation.mutate()} style={{ minHeight: 50, borderRadius: radius.md, backgroundColor: colors.primary, opacity: !checked || action.trim().length < 3 ? .45 : 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ ...typography.bodyMedium, color: '#FFF' }}>Acknowledge & save action</Text></Pressable>
  </View> : <Text style={{ ...typography.body, color: colors.secondary }}>This alert is no longer available.</Text>}</ScreenContainer></>;
}
