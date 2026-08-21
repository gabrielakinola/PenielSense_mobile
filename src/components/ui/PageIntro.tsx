import { Text, View } from 'react-native';
import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { getShadow } from '@/src/theme/shadows';
import { radius } from '@/src/theme/radius';
import { typography } from '@/src/theme/typography';

interface PageIntroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

/** Soft atmosphere intro used at the top of list/detail screens. */
export function PageIntro({ eyebrow, title, subtitle, footer }: PageIntroProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();

  return (
    <Animated.View entering={FadeInDown.duration(400).springify().damping(18)}>
      <View
        style={[
          {
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 18,
            overflow: 'hidden',
            marginBottom: 16,
          },
          getShadow(theme, 'card'),
        ]}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -40,
            right: -28,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor:
              theme === 'dark' ? 'rgba(135,165,248,0.14)' : 'rgba(37,99,235,0.1)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -48,
            left: 36,
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor:
              theme === 'dark' ? 'rgba(34,211,238,0.07)' : 'rgba(6,182,212,0.07)',
          }}
        />

        {eyebrow ? (
          <Text
            style={{
              ...typography.label,
              color: colors.secondary,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text
          style={{
            ...typography.title,
            color: colors.text,
            marginTop: eyebrow ? 6 : 0,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              ...typography.caption,
              color: colors.secondary,
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
        {footer ? <View style={{ marginTop: 14 }}>{footer}</View> : null}
      </View>
    </Animated.View>
  );
}
