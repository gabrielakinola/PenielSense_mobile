import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AlertTriangle, Info, Bell } from 'lucide-react-native';
import type { Alert } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { Card } from '@/src/components/ui/Card';
import { StatusChip } from '@/src/components/ui/StatusChip';
import { listItemEnter } from '@/src/animations/presets';
import { formatRelativeTime } from '@/src/utils/format';
import { typography } from '@/src/theme/typography';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';

interface AlertCardProps {
  alert: Alert;
  index: number;
  onPress?: () => void;
  compact?: boolean;
}

function getSeverityIcon(severity: Alert['severity']) {
  switch (severity) {
    case 'critical':
      return AlertTriangle;
    case 'warning':
      return Bell;
    default:
      return Info;
  }
}

export function AlertCard({ alert, index, onPress, compact }: AlertCardProps) {
  const colors = useThemeColors();
  const Icon = getSeverityIcon(alert.severity);
  const iconColor =
    alert.severity === 'critical'
      ? colors.status.critical
      : alert.severity === 'warning'
        ? colors.status.watch
        : colors.primary;

  const content = (
    <Card style={{ marginBottom: compact ? 8 : 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: `${iconColor}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ ...typography.bodyMedium, color: colors.text, flex: 1 }} numberOfLines={1}>
              {alert.title}
            </Text>
            <StatusChip status={alert.status === 'resolved' ? 'resolved' : alert.severity} />
          </View>
          {!compact ? (
            <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4 }} numberOfLines={2}>
              {alert.message}
            </Text>
          ) : null}
          <Text style={{ ...typography.label, color: colors.secondary, marginTop: 4 }}>
            {alert.residentName} · Room {alert.room} · {formatRelativeTime(alert.timestamp)}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <Animated.View entering={listItemEnter(index)}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Alert: ${alert.title}`}
          style={{ minHeight: MIN_TOUCH_TARGET }}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </Animated.View>
  );
}
