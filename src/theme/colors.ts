export type ThemeMode = 'light' | 'dark' | 'system';

export type ResolvedTheme = 'light' | 'dark';

export const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#0F172A',
  secondary: '#64748B',
  primary: '#2563EB',
  gradient: ['#2563EB', '#9333EA'] as [string, string],
  border: '#E2E8F0',
  status: {
    good: '#10B981',
    watch: '#F59E0B',
    critical: '#F43F5E',
  },
  statusBg: {
    good: '#ECFDF5',
    watch: '#FFFBEB',
    critical: '#FFF1F2',
  },
} as const;

export const darkColors = {
  background: '#070B14',
  surface: 'rgba(255,255,255,0.035)',
  surfaceElevated: '#0B1120',
  text: '#FFFFFF',
  secondary: '#94A3B8',
  primary: '#87A5F8',
  gradient: ['#87A5F8', '#A78BFA'] as [string, string],
  border: 'rgba(255,255,255,0.08)',
  status: {
    good: '#6EE7B7',
    watch: '#FCD34D',
    critical: '#FDA4AF',
  },
  statusBg: {
    good: 'rgba(16,185,129,0.12)',
    watch: 'rgba(245,158,11,0.12)',
    critical: 'rgba(244,63,94,0.12)',
  },
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;
