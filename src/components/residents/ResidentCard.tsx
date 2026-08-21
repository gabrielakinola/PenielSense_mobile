import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ChevronRight, Heart } from 'lucide-react-native';
import type {
  ApiResidentDto,
  ResidentIntelligenceBadge,
} from '@/src/types/carehome.types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { Card } from '@/src/components/ui/Card';
import { IntelligenceStatusChip } from '@/src/components/residents/IntelligenceStatusChip';
import { listItemEnter } from '@/src/animations/presets';
import { getInitials, formatRelativeTime } from '@/src/utils/format';
import {
  avatarColorForName,
  deviceTypeShortLabel,
  residentIntelligenceStatus,
  splitResidentName,
  type IntelligenceStatusTone,
} from '@/src/utils/resident-status';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';

function accentForTone(
  tone: IntelligenceStatusTone,
  colors: ReturnType<typeof useThemeColors>,
) {
  switch (tone) {
    case 'attention':
      return colors.status.critical;
    case 'watch':
    case 'delayed':
      return colors.status.watch;
    case 'stable':
      return colors.status.good;
    default:
      return colors.border;
  }
}

interface ResidentCardProps {
  resident: ApiResidentDto;
  badge?: ResidentIntelligenceBadge;
  index: number;
  onPress: () => void;
}

export function ResidentCard({
  resident,
  badge,
  index,
  onPress,
}: ResidentCardProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const { firstName, lastName } = splitResidentName(resident.fullName);
  const status = residentIntelligenceStatus(badge, resident.devices.length > 0);
  const avatarColor = avatarColorForName(resident.fullName);
  const accent = accentForTone(status.tone, colors);

  return (
    <Animated.View entering={listItemEnter(index)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${resident.fullName}, room ${resident.room}`}
        style={{ minHeight: MIN_TOUCH_TARGET }}
      >
        <Card style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: 4, backgroundColor: accent }} />
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: avatarColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...typography.bodyMedium, color: '#FFFFFF' }}>
                  {getInitials(firstName, lastName || firstName)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      ...typography.bodyMedium,
                      color: colors.text,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {resident.fullName}
                  </Text>
                  <IntelligenceStatusChip label={status.label} tone={status.tone} />
                </View>
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.secondary,
                    marginTop: 2,
                  }}
                >
                  {resident.room}
                  {resident.age ? ` · ${resident.age} yrs` : ''}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {resident.latestVital?.heartRate ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        borderRadius: radius.full,
                        backgroundColor:
                          theme === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(15,23,42,0.04)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Heart size={11} color={colors.status.critical} />
                      <Text style={{ ...typography.label, color: colors.secondary }}>
                        {resident.latestVital.heartRate} bpm
                      </Text>
                    </View>
                  ) : null}
                  {resident.devices.slice(0, 3).map((device) => (
                    <View
                      key={device.id}
                      style={{
                        borderRadius: radius.full,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ ...typography.label, color: colors.secondary }}>
                        {deviceTypeShortLabel(device.type)}
                      </Text>
                    </View>
                  ))}
                  {resident.lastSyncAt ? (
                    <Text style={{ ...typography.label, color: colors.secondary }}>
                      {formatRelativeTime(resident.lastSyncAt)}
                    </Text>
                  ) : null}
                </View>
              </View>
              <ChevronRight size={18} color={colors.secondary} />
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
