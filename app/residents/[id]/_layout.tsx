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
    </Stack>
  );
}
