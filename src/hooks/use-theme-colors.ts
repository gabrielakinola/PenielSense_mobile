import { useResolvedTheme, getThemeColors } from '@/src/theme/theme-provider';
import type { ThemeColors } from '@/src/theme/colors';

export function useThemeColors(): ThemeColors {
  const resolved = useResolvedTheme();
  return getThemeColors(resolved);
}

export function useIsDarkMode(): boolean {
  const resolved = useResolvedTheme();
  return resolved === 'dark';
}
