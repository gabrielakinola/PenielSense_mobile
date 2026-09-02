import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PenielLogo } from '@/src/components/brand/PenielLogo';
import { useAuthStore, useAuthHydrated } from '@/src/stores/auth-store';
import { careHomeTabsHref } from '@/src/lib/care-home-home';
import { useResolvedTheme } from '@/src/theme/theme-provider';
import { lightColors, darkColors } from '@/src/theme/colors';

const SPLASH_DURATION_MS = 2600;

function GlowOrb({
  size,
  color,
  style,
}: {
  size: number;
  color: string;
  style: object;
}) {
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.55, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const theme = useResolvedTheme();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);
  const palette = theme === 'dark' ? darkColors : lightColors;
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!hydrated) return;

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, SPLASH_DURATION_MS - elapsed);

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace(careHomeTabsHref(role));
      } else {
        router.replace('/login');
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [hydrated, isAuthenticated, role, router]);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <LinearGradient
        colors={
          theme === 'dark'
            ? ['#070B14', '#0B1120', '#111827']
            : ['#F8FAFC', '#EFF6FF', '#F5F3FF']
        }
        style={StyleSheet.absoluteFill}
      />

      <GlowOrb
        size={280}
        color={theme === 'dark' ? 'rgba(135,165,248,0.18)' : 'rgba(37,99,235,0.12)'}
        style={{ top: -40, right: -80 }}
      />
      <GlowOrb
        size={220}
        color={theme === 'dark' ? 'rgba(167,139,250,0.16)' : 'rgba(147,51,234,0.1)'}
        style={{ bottom: 80, left: -60 }}
      />

      <Animated.View entering={FadeIn.duration(700)} style={styles.content}>
        <Animated.View entering={FadeInDown.duration(800).delay(120).springify()}>
          <PenielLogo size="lg" showTagline tagline="HEALTHCARE AI" />
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(600).delay(500)}
          style={[styles.accentBar, { backgroundColor: palette.primary }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 28,
  },
  accentBar: {
    width: 48,
    height: 4,
    borderRadius: 999,
    opacity: 0.85,
  },
});
