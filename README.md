# PenielSense Mobile

React Native mobile app for PenielSense care home monitoring. UI-only prototype with dummy data — no API calls, authentication, or websockets.

## Tech Stack

- **Expo SDK 57** with expo-router file-based navigation
- **NativeWind v4** + Tailwind CSS 3.4 for styling
- **Reanimated 4** for animations and custom tab bar
- **TanStack Query** with mock query hooks (architecture ready for real API)
- **Zustand** for theme and UI state
- **lucide-react-native** icons
- **react-native-gifted-charts** for vitals charts

## Getting Started

```bash
cd penielsense_mobile_fe
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

## Project Structure

```
app/                    # Expo Router screens
  (tabs)/               # Bottom tab navigation
  residents/[id].tsx    # Resident detail (stack)
src/
  theme/                # Design tokens (Dashboard 2.0 palette)
  types/                # TypeScript interfaces
  mocks/                # Dummy data
  stores/               # Zustand stores (theme, filters)
  providers/            # QueryClient + ThemeProvider
  hooks/                # useThemeColors, useHaptics, mock queries
  components/           # UI and domain components
  utils/                # Formatting, greetings
  animations/           # Reanimated presets
```

## Screens

| Tab | Screen | Features |
|-----|--------|----------|
| Home | Dashboard overview | Welcome header, stat cards, alerts preview, device status, activity feed, skeleton loading (800ms), pull-to-refresh |
| Residents | Searchable list | Debounced search, status filter sheet, animated list items |
| Alerts | Alert center | Critical/Warning/Info/Resolved sections, severity & status filters |
| Devices | Device inventory | Grouped by V5, Tuya, Withings |
| Profile | User settings | Theme picker (light/dark/system), menu items, logout (no-op) |

**Resident Detail** (`/residents/[id]`): Header, status, devices, vitals, sleep, activity timeline, heart rate chart.

## Design Tokens

Matches Dashboard 2.0:

- **Light**: bg `#F8FAFC`, surface `#FFFFFF`, primary `#2563EB`, gradient blue→purple
- **Dark**: bg `#070B14`, surface elevated `#0B1120`, primary `#87A5F8`, gradient blue→purple
- **Status**: good / watch / critical with light and dark variants

## Configuration

- `tailwind.config.js` — NativeWind preset, content paths for `app/` and `src/`
- `global.css` — Tailwind directives
- `metro.config.js` — `withNativeWind`
- `babel.config.js` — NativeWind + Reanimated plugins
- `nativewind-env.d.ts` — TypeScript support
- Path aliases: `@/*` and `@/src/*`

## Notes

- All data comes from `src/mocks/` via TanStack Query hooks in `src/hooks/use-mock-queries.ts`
- Haptic feedback on tab press and button interactions
- Minimum 44pt touch targets and accessibility labels on interactive elements
- Theme preference persisted via AsyncStorage
