import { Alert, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { Card } from '@/src/components/ui/Card';
import { AnimatedButton } from '@/src/components/ui/AnimatedButton';
import { listItemEnter } from '@/src/animations/presets';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { formatRelativeTime } from '@/src/utils/format';
import type { ApiReviewFlagDto } from '@/src/types/carehome.types';

interface FlagCardProps {
  flag: ApiReviewFlagDto;
  index: number;
  closing?: boolean;
  onOpenResident: () => void;
  onClose: (reviewStatus: 'reviewed' | 'false_alarm') => void;
}

export function FlagCard({
  flag,
  index,
  closing,
  onOpenResident,
  onClose,
}: FlagCardProps) {
  const colors = useThemeColors();
  const isCritical = flag.severity === 'critical';
  const accent = isCritical ? colors.status.critical : colors.status.watch;
  const accentBg = isCritical ? colors.statusBg.critical : colors.statusBg.watch;

  const confirmClose = (reviewStatus: 'reviewed' | 'false_alarm') => {
    Alert.alert(
      reviewStatus === 'reviewed' ? 'Mark reviewed?' : 'Mark false alarm?',
      'This will close the open review flag.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => onClose(reviewStatus),
        },
      ],
    );
  };

  return (
    <Animated.View entering={listItemEnter(index)} style={{ marginBottom: 12 }}>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 4, backgroundColor: accent }} />
          <View style={{ flex: 1, padding: 14 }}>
            <Pressable onPress={onOpenResident} accessibilityRole="button">
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
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
                    {isCritical ? 'Crit' : 'Watch'}
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
                  >
                    {flag.room} · {flag.vitalLabel}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.secondary} style={{ marginTop: 4 }} />
              </View>
              <Text
                style={{
                  ...typography.body,
                  color: colors.text,
                  marginTop: 12,
                  lineHeight: 21,
                }}
              >
                {flag.message}
              </Text>
              <Text
                style={{
                  ...typography.label,
                  color: colors.secondary,
                  marginTop: 8,
                }}
              >
                {formatRelativeTime(flag.lastSeenAt ?? flag.createdAt)}
                {flag.occurrenceCount && flag.occurrenceCount > 1
                  ? ` · seen ${flag.occurrenceCount}×`
                  : ''}
              </Text>
            </Pressable>

            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                <AnimatedButton
                  label="Reviewed"
                  size="md"
                  onPress={() => confirmClose('reviewed')}
                  disabled={closing}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AnimatedButton
                  label="False alarm"
                  size="md"
                  variant="ghost"
                  onPress={() => confirmClose('false_alarm')}
                  disabled={closing}
                />
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}
