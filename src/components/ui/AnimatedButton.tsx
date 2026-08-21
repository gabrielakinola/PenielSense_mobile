import { Pressable, Text, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useHaptics } from '@/src/hooks/use-haptics';
import { radius } from '@/src/theme/radius';
import { typography } from '@/src/theme/typography';
import { MIN_TOUCH_TARGET } from '@/src/constants/app';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
}

export function AnimatedButton({
  label,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled,
  accessibilityLabel,
  ...props
}: AnimatedButtonProps) {
  const colors = useThemeColors();
  const { light } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress: PressableProps['onPress'] = (e) => {
    light();
    onPress?.(e);
  };

  const paddingV = size === 'lg' ? 16 : 12;
  const paddingH = size === 'lg' ? 24 : 16;

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        {...props}
        disabled={disabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={[
          animatedStyle,
          {
            borderRadius: radius.button,
            overflow: 'hidden',
            opacity: disabled ? 0.5 : 1,
            minHeight: MIN_TOUCH_TARGET,
          },
        ]}
      >
        <LinearGradient
          colors={colors.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: paddingV,
            paddingHorizontal: paddingH,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...typography.bodyMedium, color: '#FFFFFF' }}>{label}</Text>
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  const bg =
    variant === 'secondary'
      ? colors.surface
      : variant === 'danger'
        ? colors.statusBg.critical
        : 'transparent';

  const textColor =
    variant === 'danger' ? colors.status.critical : variant === 'ghost' ? colors.primary : colors.text;

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        animatedStyle,
        {
          backgroundColor: bg,
          borderRadius: radius.button,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
          minHeight: MIN_TOUCH_TARGET,
        },
      ]}
    >
      <Text style={{ ...typography.bodyMedium, color: textColor }}>{label}</Text>
    </AnimatedPressable>
  );
}
