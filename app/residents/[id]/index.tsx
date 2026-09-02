import { Platform, KeyboardAvoidingView, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ResidentCareBriefPanel } from '@/src/components/residents/ResidentCareBriefPanel';
import { CareEntryPanel } from '@/src/components/residents/CareEntryPanel';
import { getResidentCareBrief } from '@/src/services/intelligence.api';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';

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
