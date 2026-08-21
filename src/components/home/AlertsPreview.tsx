import { View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Alert } from '@/src/types';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { AlertCard } from '@/src/components/alerts/AlertCard';

interface AlertsPreviewProps {
  alerts: Alert[];
}

export function AlertsPreview({ alerts }: AlertsPreviewProps) {
  const router = useRouter();

  return (
    <View>
      <SectionHeader
        title="Active Alerts"
        actionLabel="See all"
        onAction={() => router.push('/(tabs)/flags')}
      />
      {alerts.slice(0, 3).map((alert, index) => (
        <AlertCard key={alert.id} alert={alert} index={index} compact />
      ))}
    </View>
  );
}
