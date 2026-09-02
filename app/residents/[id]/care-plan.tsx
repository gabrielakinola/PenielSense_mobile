import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Save, Trash2 } from 'lucide-react-native';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { Card } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { getCarePlan, saveCarePlan } from '@/src/services/care-plan.api';
import { normalizeApiError } from '@/src/lib/api-client';
import { useAuthStore } from '@/src/stores/auth-store';
import { isCareHomeManagerRole } from '@/src/lib/care-home-home';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import type { CarePlanSectionDto, CarePlanStatus } from '@/src/types/care-plan.types';

const CATEGORIES = [
  'PERSONAL_CARE', 'CONTINENCE', 'MOBILITY', 'NUTRITION_HYDRATION',
  'COMMUNICATION', 'SKIN_INTEGRITY', 'SLEEP', 'COGNITION',
  'EMOTIONAL_WELLBEING', 'SOCIAL_ACTIVITY', 'MEDICATION_SUPPORT', 'OTHER',
];
const emptySection = (): CarePlanSectionDto => ({
  category: 'PERSONAL_CARE', assessedNeed: '', desiredOutcome: '',
  supportInstructions: '', risks: '', preferences: '',
});

export default function CarePlanScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const isManager = isCareHomeManagerRole(useAuthStore((state) => state.user?.role));
  const query = useQuery({ queryKey: ['carehome', 'care-plan', id], queryFn: () => getCarePlan(id), enabled: !!id });
  const [sections, setSections] = useState<CarePlanSectionDto[]>([]);
  const [changeReason, setChangeReason] = useState('');
  useEffect(() => { if (query.data) setSections(query.data.sections.map((section) => ({ ...section }))); }, [query.data]);

  const mutation = useMutation({
    mutationFn: (status: CarePlanStatus) => saveCarePlan(id, {
      changeReason: changeReason.trim(), sections, status,
      effectiveFrom: status === 'ACTIVE' ? new Date().toISOString() : query.data?.effectiveFrom ?? undefined,
      reviewDueAt: query.data?.reviewDueAt ?? undefined,
    }),
    onSuccess: async () => {
      setChangeReason('');
      await queryClient.invalidateQueries({ queryKey: ['carehome', 'care-plan', id] });
      Alert.alert('Care plan saved', 'The new version is now available to authorised staff.');
    },
    onError: (error) => Alert.alert('Could not save care plan', normalizeApiError(error)),
  });
  const inputStyle = { ...typography.body, color: colors.text, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginTop: 6 };
  const update = (index: number, patch: Partial<CarePlanSectionDto>) => setSections((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const valid = sections.length > 0 && changeReason.trim().length >= 3 && sections.every((item) => item.assessedNeed.trim() && item.desiredOutcome.trim() && item.supportInstructions.trim());

  return (
    <>
      <Stack.Screen options={{ title: 'Care plan' }} />
      <ScreenContainer keyboardShouldPersistTaps="handled">
        {!isManager && !query.data ? (
          <EmptyState icon={ClipboardList} title="No care plan available" description="A manager has not published this resident’s care plan yet." />
        ) : null}
        {sections.map((section, index) => (
          <Card key={`${index}-${section.category}`} style={{ marginBottom: 14 }}>
            {isManager ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {CATEGORIES.map((category) => (
                  <Pressable key={category} onPress={() => update(index, { category })} style={{ borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: section.category === category ? `${colors.primary}28` : colors.surfaceElevated, borderWidth: 1, borderColor: section.category === category ? colors.primary : colors.border }}>
                    <Text style={{ ...typography.label, color: section.category === category ? colors.primary : colors.secondary }}>{category.replaceAll('_', ' ')}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={{ ...typography.label, color: colors.primary, fontWeight: '700' }}>{section.category.replaceAll('_', ' ')}</Text>
            )}
            {[['Assessed need', 'assessedNeed'], ['Desired outcome', 'desiredOutcome'], ['How staff should support', 'supportInstructions'], ['Risks', 'risks'], ['Preferences', 'preferences']].map(([label, field]) => (
              <View key={field} style={{ marginTop: 10 }}>
                <Text style={{ ...typography.label, color: colors.secondary }}>{label}</Text>
                {isManager ? (
                  <TextInput multiline value={String(section[field as keyof CarePlanSectionDto] ?? '')} onChangeText={(value) => update(index, { [field]: value })} style={inputStyle} placeholder={label} placeholderTextColor={colors.secondary} />
                ) : (
                  <Text style={{ ...typography.body, color: colors.text, marginTop: 3 }}>{String(section[field as keyof CarePlanSectionDto] || 'Not recorded')}</Text>
                )}
              </View>
            ))}
            {isManager ? (
              <Pressable onPress={() => setSections((items) => items.filter((_, itemIndex) => itemIndex !== index))} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 14 }}><Trash2 size={16} color={colors.status.critical} /><Text style={{ ...typography.caption, color: colors.status.critical }}>Remove section</Text></Pressable>
            ) : null}
          </Card>
        ))}
        {isManager ? (
          <>
            <Pressable onPress={() => setSections((items) => [...items, emptySection()])} style={{ minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}><Plus size={18} color={colors.primary} /><Text style={{ ...typography.bodyMedium, color: colors.primary }}>Add care-plan section</Text></Pressable>
            <Text style={{ ...typography.label, color: colors.secondary, marginTop: 18 }}>Reason for this version</Text>
            <TextInput value={changeReason} onChangeText={setChangeReason} style={inputStyle} placeholder="What changed and why?" placeholderTextColor={colors.secondary} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 24 }}>
              <Pressable disabled={!valid || mutation.isPending} onPress={() => mutation.mutate('DRAFT')} style={{ flex: 1, minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.primary, opacity: valid ? 1 : 0.45, alignItems: 'center', justifyContent: 'center' }}><Text style={{ ...typography.bodyMedium, color: colors.primary }}>Save draft</Text></Pressable>
              <Pressable disabled={!valid || mutation.isPending} onPress={() => mutation.mutate('ACTIVE')} style={{ flex: 1, minHeight: 48, borderRadius: radius.md, backgroundColor: colors.primary, opacity: valid ? 1 : 0.45, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}><Save size={17} color={colors.background} /><Text style={{ ...typography.bodyMedium, color: colors.background }}>Publish</Text></Pressable>
            </View>
          </>
        ) : null}
      </ScreenContainer>
    </>
  );
}
