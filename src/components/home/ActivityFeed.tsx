import { Text, View } from 'react-native';
import type { Activity } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { Card } from '@/src/components/ui/Card';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { TimelineCard } from '@/src/components/timeline/TimelineCard';
import { typography } from '@/src/theme/typography';

interface ActivityFeedProps {
  activities: Activity[];
  onViewAll?: () => void;
}

export function ActivityFeed({ activities, onViewAll }: ActivityFeedProps) {
  const colors = useThemeColors();

  if (activities.length === 0) {
    return (
      <View>
        <SectionHeader title="Recent Activity" />
        <Card>
          <Text style={{ ...typography.caption, color: colors.secondary, textAlign: 'center' }}>
            No recent activity
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View>
      <SectionHeader title="Recent Activity" actionLabel="View all" onAction={onViewAll} />
      <Card>
        {activities.map((activity, index) => (
          <TimelineCard
            key={activity.id}
            activity={activity}
            index={index}
            isLast={index === activities.length - 1}
          />
        ))}
      </Card>
    </View>
  );
}
