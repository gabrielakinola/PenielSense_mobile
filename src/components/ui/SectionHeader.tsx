import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { typography } from '@/src/theme/typography';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 8,
      }}
    >
      <Text style={{ ...typography.heading, color: colors.text }}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={{ minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ ...typography.caption, color: colors.primary, fontWeight: '600' }}>
              {actionLabel}
            </Text>
            <ChevronRight size={16} color={colors.primary} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
