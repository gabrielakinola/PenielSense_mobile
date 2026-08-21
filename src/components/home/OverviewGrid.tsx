import { View } from 'react-native';
import { Users, Bell, Wifi, Heart } from 'lucide-react-native';
import type { HomeStats } from '@/src/types';
import { StatCard } from '@/src/components/ui/StatCard';

interface OverviewGridProps {
  stats: HomeStats;
}

export function OverviewGrid({ stats }: OverviewGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      <StatCard
        label="Residents"
        value={stats.totalResidents}
        icon={Users}
        tone="primary"
        accessibilityLabel={`${stats.totalResidents} total residents`}
      />
      <StatCard
        label="Active Alerts"
        value={stats.activeAlerts}
        icon={Bell}
        tone={stats.activeAlerts > 0 ? 'critical' : 'good'}
        accessibilityLabel={`${stats.activeAlerts} active alerts`}
      />
      <StatCard
        label="Devices Online"
        value={stats.devicesOnline}
        icon={Wifi}
        tone="good"
        accessibilityLabel={`${stats.devicesOnline} devices online`}
      />
      <StatCard
        label="Wellness Score"
        value={`${stats.wellnessScore}%`}
        icon={Heart}
        tone={stats.wellnessScore >= 80 ? 'good' : stats.wellnessScore >= 60 ? 'watch' : 'critical'}
        accessibilityLabel={`Wellness score ${stats.wellnessScore} percent`}
      />
    </View>
  );
}
