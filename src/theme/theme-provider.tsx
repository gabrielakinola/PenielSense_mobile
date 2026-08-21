import { useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useThemeStore } from '@/src/stores/theme-store';
import { darkColors, lightColors, type ResolvedTheme } from './colors';

export function useResolvedTheme(): ResolvedTheme {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useSystemColorScheme();

  if (mode === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const hydrate = useThemeStore((s) => s.hydrate);
  const resolved = useResolvedTheme();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    // NativeWind dark mode class is toggled via color scheme
    // The resolved theme drives component-level tokens
  }, [mode, resolved]);

  return <>{children}</>;
}

export function getThemeColors(resolved: ResolvedTheme) {
  return resolved === 'dark' ? darkColors : lightColors;
}
