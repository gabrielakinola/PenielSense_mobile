import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { updateManagerReviewAction, type ManagerReviewStatus, type ManagerReviewWorkflow } from '@/src/services/manager-review.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

export default function ManagerActionScreen() {
  const p = useLocalSearchParams<{ sourceType: ManagerReviewWorkflow['sourceType']; sourceId: string; residentId: string; title?: string; status?: ManagerReviewStatus; assignedTo?: string; actionTaken?: string }>();
  const colors = useThemeColors(); const router = useRouter(); const qc = useQueryClient();
  const [status, setStatus] = useState<ManagerReviewStatus>(p.status ?? 'NEW');
  const [assignedTo, setAssignedTo] = useState(p.assignedTo ?? ''); const [actionTaken, setActionTaken] = useState(p.actionTaken ?? ''); const [dueAt, setDueAt] = useState('');
  const mutation = useMutation({ mutationFn: () => updateManagerReviewAction({ sourceType: p.sourceType, sourceId: p.sourceId, residentId: p.residentId, status, assignedTo: assignedTo.trim(), actionTaken: actionTaken.trim(), dueAt: dueAt ? new Date(dueAt).toISOString() : undefined }), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['carehome', 'manager-review-inbox'] }); router.back(); }, onError: (e) => Alert.alert('Could not save action', normalizeApiError(e)) });
  const input = { ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginTop: 6 };
  return <><Stack.Screen options={{ title: 'Manager action' }} /><ScreenContainer keyboardShouldPersistTaps="handled"><Text style={{ ...typography.title, color: colors.text }}>{p.title ?? 'Review item'}</Text><Text style={{ ...typography.caption, color: colors.secondary, marginTop: 5 }}>Record ownership and outcome. The audit trail is shared with the manager web interface.</Text><Card style={{ marginTop: 16 }}><Text style={{ ...typography.label, color: colors.secondary }}>WORKFLOW STATUS</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>{(['NEW','ACKNOWLEDGED','ACTIONED','CLOSED'] as const).map((item) => <Pressable key={item} onPress={() => setStatus(item)} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.full, backgroundColor: status === item ? colors.primary : colors.surfaceElevated }}><Text style={{ ...typography.label, color: status === item ? '#FFF' : colors.secondary }}>{item.replace('_',' ')}</Text></Pressable>)}</View><Text style={{ ...typography.label, color: colors.secondary, marginTop: 16 }}>Assigned to</Text><TextInput value={assignedTo} onChangeText={setAssignedTo} placeholder="Staff member or role" placeholderTextColor={colors.secondary} style={input} /><Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>Due date (YYYY-MM-DD)</Text><TextInput value={dueAt} onChangeText={setDueAt} placeholder="2026-09-05" placeholderTextColor={colors.secondary} style={input} /><Text style={{ ...typography.label, color: colors.secondary, marginTop: 14 }}>Action and outcome</Text><TextInput multiline value={actionTaken} onChangeText={setActionTaken} placeholder="What was checked, decided or completed?" placeholderTextColor={colors.secondary} style={[input, { minHeight: 110 }]} /></Card><Pressable disabled={mutation.isPending || (status === 'CLOSED' && actionTaken.trim().length < 3)} onPress={() => mutation.mutate()} style={{ minHeight: 50, borderRadius: radius.md, backgroundColor: colors.primary, opacity: mutation.isPending ? .5 : 1, marginTop: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}><CheckCircle2 size={18} color="#FFF" /><Text style={{ ...typography.bodyMedium, color: '#FFF' }}>{mutation.isPending ? 'Saving…' : 'Save manager action'}</Text></Pressable></ScreenContainer></>;
}
