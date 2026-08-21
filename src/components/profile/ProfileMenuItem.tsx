import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useHaptics } from '@/src/hooks/use-haptics';
import { typography } from '@/src/theme/typography';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';

interface ProfileMenuItemProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

export function ProfileMenuItem({
  icon: Icon,
  label,
  value,
  onPress,
  destructive,
}: ProfileMenuItemProps) {
  const colors = useThemeColors();
  const { light } = useHaptics();
  const textColor = destructive ? colors.status.critical : colors.text;

  return (
    <Pressable
      onPress={() => {
        light();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        minHeight: MIN_TOUCH_TARGET,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: destructive ? colors.statusBg.critical : `${colors.primary}12`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={destructive ? colors.status.critical : colors.primary} />
      </View>
      <Text style={{ ...typography.body, color: textColor, flex: 1 }}>{label}</Text>
      {value ? (
        <Text style={{ ...typography.caption, color: colors.secondary }}>{value}</Text>
      ) : null}
      {!destructive ? <ChevronRight size={18} color={colors.secondary} /> : null}
    </Pressable>
  );
}
