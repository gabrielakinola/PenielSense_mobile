import { Platform, KeyboardAvoidingView, Pressable, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ChevronLeft, FileText } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ResidentCareBriefPanel } from '@/src/components/residents/ResidentCareBriefPanel';
import { CareEntryPanel } from '@/src/components/residents/CareEntryPanel';
import { getResidentCareBrief } from '@/src/services/intelligence.api';
import { getResidentCareProfile } from '@/src/services/residents.api';
import { ResidentAtAGlance } from '@/src/components/residents/ResidentAtAGlance';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

export default function ResidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const residentId = id ?? '';
  const router = useRouter();
  const colors = useThemeColors();

  const briefQuery = useQuery({
    queryKey: ['carehome', 'care-brief', residentId],
    queryFn: () => getResidentCareBrief(residentId),
    enabled: !!residentId,
  });

  const profileQuery = useQuery({
    queryKey: ['carehome', 'resident-care-profile', residentId],
    queryFn: () => getResidentCareProfile(residentId),
    enabled: !!residentId,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: briefQuery.data?.displayName ?? 'Resident',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={8}
              style={{
                minHeight: MIN_TOUCH_TARGET,
                minWidth: MIN_TOUCH_TARGET,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={28} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenContainer keyboardShouldPersistTaps="handled">
          <ResidentAtAGlance
            profile={profileQuery.data}
            isLoading={profileQuery.isLoading}
          />
          <Pressable
            onPress={() => router.push(`/residents/${residentId}/report`)}
            accessibilityRole="button"
            accessibilityLabel="Open combined care evidence report"
            style={{
              minHeight: 48, borderRadius: radius.md, borderWidth: 1,
              borderColor: colors.primary, flexDirection: 'row', alignItems: 'center',
              justifyContent: 'center', gap: 8, marginBottom: 10,
            }}
          >
            <FileText size={18} color={colors.primary} />
            <Text style={{ ...typography.bodyMedium, color: colors.primary }}>
              Combined care evidence report
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/residents/${residentId}/incident`)}
            accessibilityRole="button"
            accessibilityLabel="Report an incident or safeguarding concern"
            style={{
              minHeight: 48,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.status.critical,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={18} color={colors.status.critical} />
            <Text style={{ ...typography.bodyMedium, color: colors.status.critical }}>
              Report concern or incident
            </Text>
          </Pressable>
          {residentId ? <CareEntryPanel residentId={residentId} /> : null}
          <ResidentCareBriefPanel
            brief={briefQuery.data}
            isLoading={briefQuery.isLoading}
            isFetching={briefQuery.isFetching}
            isError={briefQuery.isError}
            error={briefQuery.error}
            onRetry={() => void briefQuery.refetch()}
          />
        </ScreenContainer>
      </KeyboardAvoidingView>
    </>
  );
}
