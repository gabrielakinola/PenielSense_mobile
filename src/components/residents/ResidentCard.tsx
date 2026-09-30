import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
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

const CARE_TAG_COLORS: Record<string, { background: string; text: string }> = {
  DNACPR: { background: '#334155', text: '#FFFFFF' },
  DIET: { background: '#7C6CC4', text: '#FFFFFF' },
  ALLERGY: { background: '#F59E0B', text: '#3B2500' },
  ALLERGIES: { background: '#F59E0B', text: '#3B2500' },
  ABILITY: { background: '#65B975', text: '#102A16' },
  ABILITIES: { background: '#65B975', text: '#102A16' },
  MEDICAL: { background: '#EF6B73', text: '#FFFFFF' },
  DOLS: { background: '#64748B', text: '#FFFFFF' },
  RESPECT: { background: '#E2E8F0', text: '#334155' },
};

function careTagColors(tag: string) {
  return (
    CARE_TAG_COLORS[tag.trim().toUpperCase()] ?? {
      background: '#E8EEF8',
      text: '#3C5274',
    }
  );
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
  const [photoFailed, setPhotoFailed] = useState(false);
  const photoUrl = resident.photoUrl?.trim();
  const displayName = resident.preferredName?.trim() || resident.fullName;
  const profileTags = resident.profileTags ?? [];

  useEffect(() => setPhotoFailed(false), [photoUrl]);

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
                gap: 14,
                padding: 16,
              }}
            >
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  backgroundColor: avatarColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: colors.surface,
                }}
              >
                {photoUrl && !photoFailed ? (
                  <Image
                    source={{ uri: photoUrl }}
                    accessibilityLabel={`${displayName} profile photo`}
                    onError={() => setPhotoFailed(true)}
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <Text style={{ ...typography.bodyMedium, color: '#FFFFFF' }}>
                    {getInitials(firstName, lastName || firstName)}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                {profileTags.length > 0 ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 4,
                      marginBottom: 5,
                    }}
                  >
                    {profileTags.slice(0, 4).map((tag, tagIndex) => {
                      const tagColors = careTagColors(tag);
                      return (
                        <View
                          key={`${tag}-${tagIndex}`}
                          style={{
                            borderRadius: 4,
                            backgroundColor: tagColors.background,
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={{
                              color: tagColors.text,
                              fontSize: 9,
                              lineHeight: 11,
                              fontWeight: '700',
                              textTransform: 'uppercase',
                            }}
                          >
                            {tag}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
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
                    {displayName}
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
                {resident.supportSummary ? (
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.text,
                      marginTop: 5,
                    }}
                    numberOfLines={2}
                  >
                    {resident.supportSummary}
                  </Text>
                ) : null}
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
