import { Text, View } from 'react-native';
import { Flag, Users } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { getShadow } from '@/src/theme/shadows';
import { radius } from '@/src/theme/radius';
import { typography } from '@/src/theme/typography';
import { getGreeting } from '@/src/utils/greeting';
import type { ApiDashboardStatsDto, DashboardShift } from '@/src/types/carehome.types';

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function shiftIntro(shift: DashboardShift, homeName: string) {
  if (shift === 'morning') return `Here's how ${homeName} is looking this morning.`;
  if (shift === 'afternoon') return `Here's how ${homeName} is looking this afternoon.`;
  return `Here's how ${homeName} is looking tonight.`;
}

function formatStat(value: number | null | undefined) {
  if (value == null) return '—';
  return String(value);
}

interface TodayHeroProps {
  firstName: string;
  careHomeName: string;
  stats: ApiDashboardStatsDto;
}

export function TodayHero({ firstName, careHomeName, stats }: TodayHeroProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();

  return (
    <Animated.View entering={FadeInDown.duration(450).springify().damping(18)}>
      <View
        style={[
          {
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 20,
            overflow: 'hidden',
          },
          getShadow(theme, 'elevated'),
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -48,
            right: -36,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor:
              theme === 'dark' ? 'rgba(135,165,248,0.16)' : 'rgba(37,99,235,0.12)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -56,
            left: 48,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor:
              theme === 'dark' ? 'rgba(34,211,238,0.08)' : 'rgba(6,182,212,0.08)',
          }}
        />

        <Text
          style={{
            ...typography.label,
            color: colors.secondary,
            textTransform: 'uppercase',
            letterSpacing: 1.4,
          }}
        >
          {formatToday()}
        </Text>
        <Text style={{ ...typography.display, color: colors.text, marginTop: 8 }}>
          {getGreeting()}, {firstName}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: colors.secondary,
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          {shiftIntro(stats.summary.shift, careHomeName)}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor:
                theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,252,0.9)',
              paddingHorizontal: 12,
              paddingVertical: 10,
              minWidth: 140,
              flexGrow: 1,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  theme === 'dark' ? 'rgba(135,165,248,0.16)' : 'rgba(37,99,235,0.1)',
              }}
            >
              <Users size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={{ ...typography.heading, color: colors.text }}>
                {formatStat(stats.hero.residentsMonitored.value)}
              </Text>
              <Text style={{ ...typography.label, color: colors.secondary }}>
                Monitored
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor:
                theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,252,0.9)',
              paddingHorizontal: 12,
              paddingVertical: 10,
              minWidth: 140,
              flexGrow: 1,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.statusBg.watch,
              }}
            >
              <Flag size={16} color={colors.status.watch} />
            </View>
            <View>
              <Text style={{ ...typography.heading, color: colors.text }}>
                {formatStat(stats.hero.openReviewFlags.value)}
              </Text>
              <Text style={{ ...typography.label, color: colors.secondary }}>
                Open flags
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
