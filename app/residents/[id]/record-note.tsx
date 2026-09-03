import { KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { CareEntryComposer } from '@/src/components/residents/CareEntryComposer';

export default function RecordCareNoteScreen() {
  const { id = '', handover } = useLocalSearchParams<{ id: string; handover?: string }>();
  const router = useRouter();
  return <><Stack.Screen options={{ title: handover === '1' ? 'Add handover note' : 'Record care note' }} /><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScreenContainer keyboardShouldPersistTaps="handled"><CareEntryComposer residentId={id} initialHandover={handover === '1'} onCancelEdit={() => router.back()} /></ScreenContainer></KeyboardAvoidingView></>;
}
