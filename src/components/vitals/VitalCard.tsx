import { Text, View } from 'react-native';
import type { Vital } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { Card } from '@/src/components/ui/Card';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { typography } from '@/src/theme/typography';

interface VitalCardProps {
  vital: Vital;
}

export function VitalCard({ vital }: VitalCardProps) {
  const colors = useThemeColors();

  return (
    <Card style={{ flex: 1, minWidth: '45%' }}>
      <StatusChip status={vital.status} />
      <Text style={{ ...typography.stat, color: colors.text, marginTop: 8 }}>
        {vital.current}
        <Text style={{ ...typography.caption, color: colors.secondary }}> {vital.unit}</Text>
      </Text>
      <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4 }}>
        {vital.label}
      </Text>
    </Card>
  );
}
