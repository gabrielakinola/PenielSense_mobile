import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/src/components/ui/Card';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import type {
  DashboardShift,
  DashboardSummaryBullet,
  InsightSeverity,
} from '@/src/types/carehome.types';

const SHIFT_LABELS: Record<DashboardShift, string> = {
  morning: "This morning's overview",
  afternoon: "This afternoon's overview",
  night: "Tonight's overview",
};

function severityColor(
  severity: InsightSeverity | undefined,
  colors: ReturnType<typeof useThemeColors>,
) {
  if (severity === 'attention') return colors.status.critical;
  if (severity === 'watch') return colors.status.watch;
  return colors.primary;
}

interface TodayPriorityNotesProps {
  shift: DashboardShift;
  headline: string;
  bullets: DashboardSummaryBullet[];
  onOpenResident: (residentId: string) => void;
}

export function TodayPriorityNotes({
  shift,
  headline,
  bullets,
  onOpenResident,
}: TodayPriorityNotesProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();

  return (
    <Animated.View entering={FadeInDown.delay(120).duration(450)}>
      <SectionHeader title="Care intelligence" />
      <Card>
        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: radius.full,
            backgroundColor:
              theme === 'dark' ? 'rgba(135,165,248,0.14)' : 'rgba(37,99,235,0.08)',
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{
              ...typography.label,
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              fontWeight: '700',
            }}
          >
            {SHIFT_LABELS[shift]}
          </Text>
        </View>

        <Text
          style={{
            ...typography.body,
            color: colors.text,
            marginTop: 12,
            lineHeight: 22,
          }}
        >
          {headline}
        </Text>

        {bullets.length === 0 ? (
          <Text
            style={{
              ...typography.caption,
              color: colors.secondary,
              marginTop: 14,
            }}
          >
            No priority resident notes right now.
          </Text>
        ) : (
          <View style={{ marginTop: 14, gap: 4 }}>
            {bullets.map((bullet) => (
              <Pressable
                key={`${bullet.residentId}-${bullet.insightId ?? bullet.summary}`}
                onPress={() => onOpenResident(bullet.residentId)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${bullet.residentName}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
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
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginTop: 6,
                    backgroundColor: severityColor(bullet.severity, colors),
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.bodyMedium, color: colors.text }}>
                    {bullet.residentName}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.secondary,
                      marginTop: 2,
                      lineHeight: 18,
                    }}
                  >
                    {bullet.summary}
                  </Text>
                </View>
                <ChevronRight
                  size={16}
                  color={colors.secondary}
                  style={{ marginTop: 4 }}
                />
              </Pressable>
            ))}
          </View>
        )}
      </Card>
    </Animated.View>
  );
}
