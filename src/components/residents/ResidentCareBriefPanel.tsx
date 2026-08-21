import { Share, Text, View } from 'react-native';
import {
  AlertCircle,
  Activity,
  BedDouble,
  Moon,
  Radio,
  Share2,
  Watch,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/src/components/ui/Card';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { SkeletonCard } from '@/src/components/ui/Skeleton';
import { AnimatedButton } from '@/src/components/ui/AnimatedButton';
import { IntelligenceStatusChip } from '@/src/components/residents/IntelligenceStatusChip';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { normalizeApiError } from '@/src/lib/api-client';
import type { CareBriefStatusTone, ResidentCareBrief } from '@/src/types/carehome.types';
import type { IntelligenceStatusTone } from '@/src/utils/resident-status';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { getShadow } from '@/src/theme/shadows';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

function toneToChip(tone: CareBriefStatusTone): IntelligenceStatusTone {
  switch (tone) {
    case 'attention':
      return 'attention';
    case 'watch':
      return 'watch';
    case 'stable':
      return 'stable';
    default:
      return 'unmonitored';
  }
}

function toneAccent(
  tone: CareBriefStatusTone,
  colors: ReturnType<typeof useThemeColors>,
) {
  switch (tone) {
    case 'attention':
      return colors.status.critical;
    case 'watch':
      return colors.status.watch;
    case 'stable':
      return colors.status.good;
    default:
      return colors.secondary;
  }
}

function glanceIcon(area: string) {
  const key = area.toLowerCase();
  if (key.includes('sleep')) return Moon;
  if (key.includes('room') || key.includes('activity')) return Radio;
  if (key.includes('wear') || key.includes('vital')) return Watch;
  if (key.includes('bed')) return BedDouble;
  return Activity;
}

interface ResidentCareBriefPanelProps {
  brief: ResidentCareBrief | undefined;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  error: unknown;
  onRetry?: () => void;
}

export function ResidentCareBriefPanel({
  brief,
  isLoading,
  isFetching = false,
  isError,
  error,
  onRetry,
}: ResidentCareBriefPanelProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const showSkeleton = isLoading || (isFetching && !brief);

  if (showSkeleton) {
    return (
      <View style={{ gap: 12 }}>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={4} />
      </View>
    );
  }

  if (isError || !brief) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn’t load care brief"
        description={normalizeApiError(error)}
        actionLabel={onRetry ? 'Retry' : undefined}
        onAction={onRetry}
      />
    );
  }

  const accent = toneAccent(brief.statusTone, colors);

  const handleShare = async () => {
    const title = brief.room
      ? `${brief.displayName} — ${brief.room}`
      : brief.displayName;
    const message = [
      title,
      `Status: ${brief.statusLabel}`,
      '',
      'Current summary',
      brief.currentSummary,
      '',
      'Suggested staff review',
      brief.suggestedStaffReview,
      '',
      'Today at a glance',
      ...brief.glance.map((row) => `${row.area}: ${row.summary}`),
    ].join('\n');

    await Share.share({ title, message });
  };

  return (
    <View style={{ gap: 16 }}>
      <Animated.View entering={FadeInDown.duration(420).springify().damping(18)}>
        <View
          style={[
            {
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              padding: 0,
              overflow: 'hidden',
            },
            getShadow(theme, 'elevated'),
          ]}
        >
          <View style={{ height: 4, backgroundColor: accent }} />
          <View style={{ padding: 18 }}>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -36,
                right: -24,
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: `${accent}22`,
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.title, color: colors.text }}>
                  {brief.displayName}
                </Text>
                {brief.room ? (
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.secondary,
                      marginTop: 4,
                    }}
                  >
                    {brief.room}
                  </Text>
                ) : null}
              </View>
              <IntelligenceStatusChip
                label={brief.statusLabel}
                tone={toneToChip(brief.statusTone)}
                size="md"
              />
            </View>
            <Text
              style={{
                ...typography.label,
                color: colors.secondary,
                marginTop: 12,
              }}
            >
              Updated{' '}
              {new Date(brief.lastUpdatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <SectionHeader title="Current summary" />
        <Card>
          <Text style={{ ...typography.body, color: colors.text, lineHeight: 23 }}>
            {brief.currentSummary}
          </Text>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <SectionHeader title="Suggested staff review" />
        <Card
          style={{
            borderLeftWidth: 3,
            borderLeftColor: accent,
          }}
        >
          <Text style={{ ...typography.body, color: colors.text, lineHeight: 23 }}>
            {brief.suggestedStaffReview}
          </Text>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(140).duration(400)}>
        <SectionHeader title="Today at a glance" />
        <View style={{ gap: 10 }}>
          {brief.glance.map((row) => {
            const Icon = glanceIcon(row.area);
            return (
              <Card key={row.area} style={{ flexDirection: 'row', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor:
                      theme === 'dark'
                        ? 'rgba(135,165,248,0.14)'
                        : 'rgba(37,99,235,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                    {row.area}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.secondary,
                      marginTop: 4,
                      lineHeight: 18,
                    }}
                  >
                    {row.summary}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      </Animated.View>

      <AnimatedButton
        label="Share care brief"
        onPress={handleShare}
        size="md"
        accessibilityLabel="Share care brief"
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: -4,
        }}
      >
        <Share2 size={12} color={colors.secondary} />
        <Text style={{ ...typography.label, color: colors.secondary }}>
          Share with the next carer on shift
        </Text>
      </View>
    </View>
  );
}
