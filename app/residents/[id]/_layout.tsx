import { Stack } from 'expo-router';

export default function ResidentLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Resident' }} />
      <Stack.Screen name="notes" options={{ title: 'Care notes' }} />
      <Stack.Screen name="record-note" options={{ title: 'Record care note' }} />
      <Stack.Screen name="create-task" options={{ title: 'Create task' }} />
      <Stack.Screen name="care-plan" options={{ title: 'Care plan' }} />
      <Stack.Screen name="incident" options={{ title: 'Report concern' }} />
      <Stack.Screen name="report" options={{ title: 'Evidence report' }} />
    </Stack>
  );
}
