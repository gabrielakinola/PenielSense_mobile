import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { Card } from './Card';
import { typography } from '@/src/theme/typography';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'primary' | 'good' | 'watch' | 'critical';
  accessibilityLabel?: string;
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', accessibilityLabel }: StatCardProps) {
  const colors = useThemeColors();

  const toneColor =
    tone === 'good'
      ? colors.status.good
      : tone === 'watch'
        ? colors.status.watch
        : tone === 'critical'
          ? colors.status.critical
          : colors.primary;

  return (
    <Card
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
      style={{ flex: 1, minWidth: '45%' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${toneColor}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={toneColor} />
        </View>
      </View>
      <Text style={{ ...typography.stat, color: colors.text }}>{value}</Text>
      <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4 }}>{label}</Text>
    </Card>
  );
}
