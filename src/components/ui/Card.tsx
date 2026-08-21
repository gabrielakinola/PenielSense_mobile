import { View, type ViewProps } from 'react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { getShadow } from '@/src/theme/shadows';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { radius } from '@/src/theme/radius';

interface CardProps extends ViewProps {
  elevated?: boolean;
  className?: string;
}

export function Card({ elevated, className, style, children, ...props }: CardProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();

  return (
    <View
      {...props}
      className={className}
      style={[
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
        },
        getShadow(theme, elevated ? 'elevated' : 'card'),
        style,
      ]}
    >
      {children}
    </View>
  );
}
