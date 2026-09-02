import { Image, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useThemeColors } from '@/src/hooks/use-theme-colors';

const LOGO = require('../../../assets/images/peniel_logo_p.png');

type PenielAiIconVariant = 'onColor' | 'brand';

interface PenielAiIconProps {
  size?: number;
  color?: string;
  variant?: PenielAiIconVariant;
}

/** Peniel P with a four-point AI sparkle — branded replacement for generic sparkles. */
export function PenielAiIcon({
  size = 18,
  color,
  variant = 'onColor',
}: PenielAiIconProps) {
  const colors = useThemeColors();
  const sparkleColor = color ?? (variant === 'onColor' ? '#FFFFFF' : colors.primary);
  const sparkleSize = Math.max(12, Math.round(size * 1));
  const pHeight = size;
  const pWidth = Math.round(size * 0.68);

  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{
        width: pWidth + sparkleSize * 0.55,
        height: pHeight + 4,
        paddingTop: 4,
        overflow: 'visible',
      }}
    >
      <Image
        source={LOGO}
        accessibilityElementsHidden
        importantForAccessibility="no"
        resizeMode="contain"
        style={{
          width: pWidth,
          height: pHeight,
          tintColor: variant === 'onColor' ? sparkleColor : undefined,
        }}
      />
      <Svg
        width={sparkleSize}
        height={sparkleSize}
        viewBox="0 0 26 26"
        style={{ position: 'absolute', right: -6, top: -4, zIndex: 1 }}
      >
        <Path
          fill={sparkleColor}
          d="M11.2.4 13.6 7.4 21.4 9.8 13.6 12.2 11.2 19.2 8.8 12.2 1 9.8 8.8 7.4Z"
        />
        <Path
          fill={sparkleColor}
          d="M19.2 13.6 20.55 17.5 24.4 18.85 20.55 20.2 19.2 24.1 17.85 20.2 14 18.85 17.85 17.5Z"
        />
      </Svg>
    </View>
  );
}
