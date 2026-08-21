import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Activity, Pill, Users, Wifi, AlertTriangle } from 'lucide-react-native';
import type { Activity as ActivityItem } from '@/src/types';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { listItemEnter } from '@/src/animations/presets';
import { formatRelativeTime } from '@/src/utils/format';
import { typography } from '@/src/theme/typography';

interface TimelineCardProps {
  activity: ActivityItem;
  index: number;
  isLast?: boolean;
}

function getActivityIcon(type: ActivityItem['type']): LucideIcon {
  switch (type) {
    case 'fall':
      return AlertTriangle;
    case 'medication':
      return Pill;
    case 'visit':
      return Users;
    case 'device':
      return Wifi;
    default:
      return Activity;
  }
}

export function TimelineCard({ activity, index, isLast }: TimelineCardProps) {
  const colors = useThemeColors();
  const Icon = getActivityIcon(activity.type);
  const dotColor = activity.status
    ? colors.status[activity.status === 'good' ? 'good' : activity.status === 'watch' ? 'watch' : 'critical']
    : colors.primary;

  return (
    <Animated.View entering={listItemEnter(index)} style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center', width: 24 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: dotColor,
            marginTop: 4,
          }}
        />
        {!isLast ? (
          <View style={{ flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 }} />
        ) : null}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon size={14} color={dotColor} />
          <Text style={{ ...typography.bodyMedium, color: colors.text, flex: 1 }}>{activity.title}</Text>
          <Text style={{ ...typography.label, color: colors.secondary }}>
            {formatRelativeTime(activity.timestamp)}
          </Text>
        </View>
        <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 4 }}>
          {activity.description}
        </Text>
      </View>
    </Animated.View>
  );
}
