import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Battery, BatteryLow, Wifi, WifiOff } from 'lucide-react-native';
import type { Device } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { Card } from '@/src/components/ui/Card';
import { listItemEnter } from '@/src/animations/presets';
import { formatRelativeTime, getDeviceStatusLabel } from '@/src/utils/format';
import { typography } from '@/src/theme/typography';

interface DeviceCardProps {
  device: Device;
  index: number;
}

export function DeviceCard({ device, index }: DeviceCardProps) {
  const colors = useThemeColors();

  const statusColor =
    device.status === 'online'
      ? colors.status.good
      : device.status === 'low_battery'
        ? colors.status.watch
        : colors.status.critical;

  const StatusIcon = device.status === 'offline' ? WifiOff : Wifi;
  const BatteryIcon = device.status === 'low_battery' ? BatteryLow : Battery;

  return (
    <Animated.View entering={listItemEnter(index)}>
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.bodyMedium, color: colors.text }}>{device.name}</Text>
            {device.residentName ? (
              <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 2 }}>
                {device.residentName} · Room {device.room}
              </Text>
            ) : (
              <Text style={{ ...typography.caption, color: colors.secondary, marginTop: 2 }}>
                {device.room}
              </Text>
            )}
          </View>
          <View
            style={{
              backgroundColor: `${statusColor}18`,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ ...typography.label, color: statusColor }}>
              {getDeviceStatusLabel(device.status)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <StatusIcon size={14} color={statusColor} />
            <Text style={{ ...typography.label, color: colors.secondary }}>
              {formatRelativeTime(device.lastSync)}
            </Text>
          </View>
          {device.battery !== undefined && device.battery > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <BatteryIcon size={14} color={colors.secondary} />
              <Text style={{ ...typography.label, color: colors.secondary }}>{device.battery}%</Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Animated.View>
  );
}
