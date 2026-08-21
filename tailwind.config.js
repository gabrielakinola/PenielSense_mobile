/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F8FAFC',
          dark: '#070B14',
        },
        surface: {
          light: '#FFFFFF',
          dark: 'rgba(255,255,255,0.035)',
        },
        'surface-elevated': {
          dark: '#0B1120',
        },
        foreground: {
          light: '#0F172A',
          dark: '#FFFFFF',
        },
        secondary: {
          light: '#64748B',
          dark: '#94A3B8',
        },
        primary: {
          light: '#2563EB',
          dark: '#87A5F8',
        },
        status: {
          good: { light: '#10B981', dark: '#6EE7B7' },
          watch: { light: '#F59E0B', dark: '#FCD34D' },
          critical: { light: '#F43F5E', dark: '#FDA4AF' },
        },
      },
      borderRadius: {
        card: '20px',
        button: '12px',
      },
      spacing: {
        4.5: '18px',
      },
    },
  },
  plugins: [],
};
