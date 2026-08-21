import { Text, View } from 'react-native';
import { Wifi, WifiOff, BatteryLow } from 'lucide-react-native';
import type { Device } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { Card } from '@/src/components/ui/Card';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { typography } from '@/src/theme/typography';

interface DeviceStatusRowProps {
  devices: Device[];
}

export function DeviceStatusRow({ devices }: DeviceStatusRowProps) {
  const colors = useThemeColors();

  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline').length;
  const lowBattery = devices.filter((d) => d.status === 'low_battery').length;

  const items = [
    { icon: Wifi, label: 'Online', count: online, color: colors.status.good },
    { icon: WifiOff, label: 'Offline', count: offline, color: colors.status.critical },
    { icon: BatteryLow, label: 'Low Battery', count: lowBattery, color: colors.status.watch },
  ];

  return (
    <View>
      <SectionHeader title="Device Status" />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {items.map(({ icon: Icon, label, count, color }) => (
            <View key={label} style={{ alignItems: 'center', flex: 1 }} accessibilityLabel={`${count} ${label}`}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${color}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Icon size={20} color={color} />
              </View>
              <Text style={{ ...typography.stat, color: colors.text, fontSize: 20 }}>{count}</Text>
              <Text style={{ ...typography.label, color: colors.secondary, marginTop: 2 }}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
