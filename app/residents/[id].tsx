import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ResidentCareBriefPanel } from '@/src/components/residents/ResidentCareBriefPanel';
import { getResidentCareBrief } from '@/src/services/intelligence.api';

export default function ResidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const residentId = id ?? '';

  const briefQuery = useQuery({
    queryKey: ['carehome', 'care-brief', residentId],
    queryFn: () => getResidentCareBrief(residentId),
    enabled: !!residentId,
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: briefQuery.data?.displayName ?? 'Care brief',
        }}
      />
      <ScreenContainer>
        <ResidentCareBriefPanel
          brief={briefQuery.data}
          isLoading={briefQuery.isLoading}
          isFetching={briefQuery.isFetching}
          isError={briefQuery.isError}
          error={briefQuery.error}
          onRetry={() => void briefQuery.refetch()}
        />
      </ScreenContainer>
    </>
  );
}
