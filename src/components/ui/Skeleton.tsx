import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks/use-theme-colors';
import { radius } from '@/src/theme/radius';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBone({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  const colors = useThemeColors();

  return (
    <View
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 10,
      }}
    >
      <SkeletonBone width="60%" height={20} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBone key={i} width={i === lines - 1 ? '40%' : '100%'} height={14} />
      ))}
    </View>
  );
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  return <SkeletonBone width={width} height={height} borderRadius={borderRadius} style={style} />;
}

export function SkeletonRow() {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}
