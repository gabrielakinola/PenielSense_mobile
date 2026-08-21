import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/src/components/ui/Card';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { formatRelativeTime } from '@/src/utils/format';
import type { ApiReviewFlagDto } from '@/src/types/carehome.types';

interface TodayFlagsPreviewProps {
  flags: ApiReviewFlagDto[];
  onViewAll: () => void;
  onOpenResident: (residentId: string) => void;
}

export function TodayFlagsPreview({
  flags,
  onViewAll,
  onOpenResident,
}: TodayFlagsPreviewProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();

  return (
    <Animated.View entering={FadeInDown.delay(180).duration(450)}>
      <SectionHeader
        title="Open review flags"
        actionLabel="View all"
        onAction={onViewAll}
      />
      <Card style={{ gap: 4, paddingVertical: 10 }}>
        {flags.length === 0 ? (
          <Text
            style={{
              ...typography.caption,
              color: colors.secondary,
              paddingHorizontal: 6,
              paddingVertical: 8,
            }}
          >
            No open flags today.
          </Text>
        ) : (
          flags.map((flag) => {
            const accent =
              flag.severity === 'critical'
                ? colors.status.critical
                : colors.status.watch;
            const accentBg =
              flag.severity === 'critical'
                ? colors.statusBg.critical
                : colors.statusBg.watch;

            return (
              <Pressable
                key={flag.id}
                onPress={() => onOpenResident(flag.residentId)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${flag.residentName}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: radius.md,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  backgroundColor: pressed
                    ? theme === 'dark'
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(15,23,42,0.03)'
                    : 'transparent',
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor: accentBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      ...typography.label,
                      color: accent,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}
                  >
                    {flag.severity === 'critical' ? 'Crit' : 'Watch'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                    {flag.residentName}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.secondary,
                      marginTop: 2,
                    }}
                    numberOfLines={2}
                  >
                    {flag.vitalLabel} · {flag.message}
                  </Text>
                  <Text
                    style={{
                      ...typography.label,
                      color: colors.secondary,
                      marginTop: 4,
                    }}
                  >
                    {formatRelativeTime(flag.lastSeenAt ?? flag.createdAt)}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.secondary} />
              </Pressable>
            );
          })
        )}
      </Card>
    </Animated.View>
  );
}
