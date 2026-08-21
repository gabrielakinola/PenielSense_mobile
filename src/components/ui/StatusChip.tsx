import { Text, View } from 'react-native';
import type { WellnessStatus, AlertSeverity } from '@/src/types';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { getAlertSeverityLabel, getStatusLabel } from '@/src/utils/format';
import { radius } from '@/src/theme/radius';
import { typography } from '@/src/theme/typography';

type ChipVariant = WellnessStatus | AlertSeverity | 'resolved';

interface StatusChipProps {
  status: ChipVariant;
  size?: 'sm' | 'md';
}

function getChipColors(status: ChipVariant, colors: ReturnType<typeof useThemeColors>) {
  switch (status) {
    case 'good':
      return { bg: colors.statusBg.good, text: colors.status.good };
    case 'watch':
    case 'warning':
      return { bg: colors.statusBg.watch, text: colors.status.watch };
    case 'critical':
      return { bg: colors.statusBg.critical, text: colors.status.critical };
    case 'info':
      return { bg: `${colors.primary}18`, text: colors.primary };
    case 'resolved':
      return { bg: colors.statusBg.good, text: colors.status.good };
    default:
      return { bg: `${colors.primary}18`, text: colors.primary };
  }
}

function getChipLabel(status: ChipVariant): string {
  if (status === 'warning' || status === 'info' || status === 'critical') {
    return getAlertSeverityLabel(status);
  }
  if (status === 'resolved') return 'Resolved';
  return getStatusLabel(status);
}

export function StatusChip({ status, size = 'sm' }: StatusChipProps) {
  const colors = useThemeColors();
  const chipColors = getChipColors(status, colors);
  const paddingH = size === 'sm' ? 8 : 12;
  const paddingV = size === 'sm' ? 4 : 6;

  return (
    <View
      accessibilityLabel={`Status: ${getChipLabel(status)}`}
      style={{
        backgroundColor: chipColors.bg,
        borderRadius: radius.full,
        paddingHorizontal: paddingH,
        paddingVertical: paddingV,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          ...typography.label,
          color: chipColors.text,
          fontSize: size === 'sm' ? 11 : 12,
        }}
      >
        {getChipLabel(status)}
      </Text>
    </View>
  );
}
