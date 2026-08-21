import { Text, View } from 'react-native';
import type { IntelligenceStatusTone } from '@/src/utils/resident-status';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { radius } from '@/src/theme/radius';
import { typography } from '@/src/theme/typography';

interface IntelligenceStatusChipProps {
  label: string;
  tone: IntelligenceStatusTone;
  size?: 'sm' | 'md';
}

export function IntelligenceStatusChip({
  label,
  tone,
  size = 'sm',
}: IntelligenceStatusChipProps) {
  const colors = useThemeColors();

  const palette = (() => {
    switch (tone) {
      case 'attention':
        return { bg: colors.statusBg.critical, text: colors.status.critical };
      case 'watch':
        return { bg: colors.statusBg.watch, text: colors.status.watch };
      case 'delayed':
        return { bg: `${colors.primary}18`, text: colors.primary };
      case 'stable':
        return { bg: colors.statusBg.good, text: colors.status.good };
      default:
        return { bg: `${colors.secondary}18`, text: colors.secondary };
    }
  })();

  return (
    <View
      accessibilityLabel={`Status: ${label}`}
      style={{
        backgroundColor: palette.bg,
        borderRadius: radius.full,
        paddingHorizontal: size === 'sm' ? 8 : 12,
        paddingVertical: size === 'sm' ? 4 : 6,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          ...typography.label,
          color: palette.text,
          fontSize: size === 'sm' ? 11 : 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
