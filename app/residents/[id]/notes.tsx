import { Platform, KeyboardAvoidingView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { CareNotesHistory } from '@/src/components/residents/CareNotesHistory';

export default function ResidentNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const residentId = id ?? '';

  return (
    <>
      <Stack.Screen options={{ title: 'Care notes' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenContainer keyboardShouldPersistTaps="handled">
          {residentId ? <CareNotesHistory residentId={residentId} /> : null}
        </ScreenContainer>
      </KeyboardAvoidingView>
    </>
  );
}
