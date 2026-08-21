import { Image, Text, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { useResolvedTheme } from '@/src/theme/theme-provider';

const LOGO = require('../../../assets/images/peniel_logo_p.png');

type LogoSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<LogoSize, { image: number; wordmark: number; tagline: number }> = {
  sm: { image: 32, wordmark: 16, tagline: 9 },
  md: { image: 44, wordmark: 20, tagline: 10 },
  lg: { image: 56, wordmark: 26, tagline: 11 },
};

interface PenielLogoProps {
  size?: LogoSize;
  variant?: 'default' | 'onDark';
  showTagline?: boolean;
  tagline?: string;
  style?: ViewStyle;
}

export function PenielLogo({
  size = 'md',
  variant = 'default',
  showTagline = false,
  tagline = 'HEALTHCARE AI',
  style,
}: PenielLogoProps) {
  const colors = useThemeColors();
  const theme = useResolvedTheme();
  const dims = SIZE_MAP[size];
  const onDark = variant === 'onDark';

  const enielColor = onDark ? 'rgba(255,255,255,0.95)' : colors.primary;
  const senseColor = onDark ? '#DDD6FE' : theme === 'dark' ? '#A78BFA' : '#9333EA';
  const taglineColor = onDark ? 'rgba(255,255,255,0.6)' : colors.secondary;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4 }, style]}>
      <Image
        source={LOGO}
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          width: dims.image * 0.72,
          height: dims.image,
          tintColor: onDark ? '#FFFFFF' : undefined,
        }}
        resizeMode="contain"
      />
      <View>
        <Text
          style={{
            fontSize: dims.wordmark,
            fontWeight: '700',
            letterSpacing: -0.5,
            lineHeight: dims.wordmark + 2,
          }}
        >
          <Text style={{ color: enielColor }}>eniel</Text>
          <Text style={{ color: senseColor }}>sense</Text>
        </Text>
        {showTagline ? (
          <Text
            style={{
              marginTop: 2,
              fontSize: dims.tagline,
              fontWeight: '600',
              letterSpacing: 1.4,
              color: taglineColor,
            }}
          >
            {tagline}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
