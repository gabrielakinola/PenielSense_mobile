import { Text, View } from 'react-native';
import { Moon, Clock, Zap } from 'lucide-react-native';
import type { Sleep } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { Card } from '@/src/components/ui/Card';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { formatTime } from '@/src/utils/format';
import { typography } from '@/src/theme/typography';

interface SleepCardProps {
  sleep: Sleep;
}

export function SleepCard({ sleep }: SleepCardProps) {
  const colors = useThemeColors();

  const metrics = [
    { icon: Moon, label: 'Duration', value: `${sleep.durationHours}h` },
    { icon: Zap, label: 'Deep', value: `${sleep.deepSleepHours}h` },
    { icon: Clock, label: 'REM', value: `${sleep.remHours}h` },
  ];

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ ...typography.heading, color: colors.text }}>Sleep Overview</Text>
        <StatusChip status={sleep.status} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 12 }}>
        <Text style={{ ...typography.display, color: colors.text, fontSize: 36 }}>{sleep.score}</Text>
        <Text style={{ ...typography.caption, color: colors.secondary }}>/ 100 score</Text>
      </View>
      <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4 }}>
        {formatTime(sleep.bedtime)} – {formatTime(sleep.wakeTime)} · {sleep.awakenings} awakenings
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        {metrics.map(({ icon: Icon, label, value }) => (
          <View
            key={label}
            style={{
              flex: 1,
              backgroundColor: `${colors.primary}10`,
              borderRadius: 12,
              padding: 12,
              alignItems: 'center',
            }}
          >
            <Icon size={16} color={colors.primary} />
            <Text style={{ ...typography.bodyMedium, color: colors.text, marginTop: 6 }}>{value}</Text>
            <Text style={{ ...typography.label, color: colors.secondary }}>{label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
