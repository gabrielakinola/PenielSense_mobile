import { Text, View } from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Radio,
  type LucideIcon,
} from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { Card } from '@/src/components/ui/Card';
import { listItemEnter } from '@/src/animations/presets';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import type {
  DashboardGlanceCardDto,
  DashboardGlanceTone,
} from '@/src/types/carehome.types';

const TONE_META: Record<
  DashboardGlanceTone,
  { icon: LucideIcon; label: string }
> = {
  attention: { icon: AlertTriangle, label: 'attention' },
  watch: { icon: Eye, label: 'watch' },
  stable: { icon: CheckCircle2, label: 'stable' },
  coverage: { icon: Radio, label: 'coverage' },
};

function toneColors(
  tone: DashboardGlanceTone,
  colors: ReturnType<typeof useThemeColors>,
) {
  switch (tone) {
    case 'attention':
      return {
        wrap: colors.statusBg.critical,
        icon: colors.status.critical,
        count: colors.status.critical,
      };
    case 'watch':
      return {
        wrap: colors.statusBg.watch,
        icon: colors.status.watch,
        count: colors.status.watch,
      };
    case 'stable':
      return {
        wrap: colors.statusBg.good,
        icon: colors.status.good,
        count: colors.status.good,
      };
    default:
      return {
        wrap: `${colors.primary}18`,
        icon: colors.primary,
        count: colors.primary,
      };
  }
}

interface TodayGlanceGridProps {
  cards: DashboardGlanceCardDto[];
}

export function TodayGlanceGrid({ cards }: TodayGlanceGridProps) {
  const colors = useThemeColors();

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {cards.map((card, index) => {
        const meta = TONE_META[card.tone];
        const tone = toneColors(card.tone, colors);
        const Icon = meta.icon;

        return (
          <Animated.View
            key={card.id}
            entering={listItemEnter(index)}
            style={{ width: '47%', flexGrow: 1, minWidth: 150 }}
          >
            <Card style={{ minHeight: 132 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    backgroundColor: tone.wrap,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={tone.icon} />
                </View>
                {card.count != null ? (
                  <Text
                    style={{
                      ...typography.stat,
                      color: tone.count,
                      letterSpacing: -0.5,
                    }}
                  >
                    {card.count}
                  </Text>
                ) : null}
              </View>
              <Text
                style={{
                  ...typography.bodyMedium,
                  color: colors.text,
                  marginTop: 14,
                }}
                numberOfLines={1}
              >
                {card.title}
              </Text>
              <Text
                style={{
                  ...typography.caption,
                  color: colors.secondary,
                  marginTop: 4,
                  lineHeight: 18,
                }}
                numberOfLines={2}
              >
                {card.detail}
              </Text>
            </Card>
          </Animated.View>
        );
      })}
    </View>
  );
}
