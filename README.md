# Peniel Care Mobile

React Native carer app for Peniel Care — the digital social care record (DSCR) companion for care-home staff. Connected to the PenielSense backend API with offline-first record keeping.

## Tech Stack

- **Expo SDK 54** with expo-router v6 file-based navigation
- **React Native 0.81 / React 19**
- **TanStack Query 5** for server state
- **Zustand 5** for auth, theme and UI state (tokens in expo-secure-store)
- **expo-sqlite (SQLCipher)** encrypted offline cache + mutation outbox
- **Inline styles** driven by design tokens in `src/theme/` (NativeWind is installed but effectively unused)
- **lucide-react-native** icons, **Reanimated** animations, **react-native-svg** body maps

## Getting Started

```bash
npm ci
npm start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

The API base URL resolves from `EXPO_PUBLIC_API_URL` → `app.json extra.apiUrl` → `http://localhost:3000/api`.

## Project Structure

```
app/                      # Expo Router screens
  (tabs)/                 # Bottom tab navigation (role-based)
  residents/[id]/         # Resident workspace (stack): notes, record-note,
                          # create-task, care-plan, incident, report, assessments,
                          # record, medication, records, charts
  alerts/[id].tsx         # Sensor/vital alert detail + acknowledge
  manager-action.tsx      # Manager review-action workflow
  sync-status.tsx         # Offline outbox: pending, retry, discard
src/
  theme/                  # Design tokens (colors, typography, spacing, radius, shadows)
  types/                  # TypeScript API contracts (mirror backend DTOs)
  services/               # API layer (careHomeApiClient, ApiSuccessEnvelope)
  offline/                # offline-db (SQLite), offline-api (cache/queue), offline-sync (flush)
  stores/                 # Zustand stores (auth, theme, ui)
  providers/              # AppProviders (QueryClient + Theme + OfflineSync)
  hooks/                  # useThemeColors, useHaptics
  components/             # ui kit + domain components (residents, handovers, today, flags, incidents)
  lib/                    # api-client, auth-token, care-home-home
  utils/                  # Formatting helpers
  animations/             # Reanimated presets
```

## Roles and screens

- **Carer tabs**: Residents, Tasks, Alerts, Handover, Profile
- **Manager tabs**: Today, Residents, Review, Handover, Profile

Resident workspace: at-a-glance brief, profile & About Me, assessments, care plan, medication & MAR, care charts (weight/bowel/repositioning), documents & visits, care notes, incidents with body maps.

## Offline-first behaviour

- Reads use a cached-online-first strategy backed by an encrypted SQLite cache (per-user).
- Care notes, task outcomes and incident reports created offline are queued in an encrypted outbox with `Idempotency-Key` deduplication and replayed FIFO when connectivity returns.
- Transient failures pause the flush; permanent (4xx) failures are surfaced in **Profile → Sync status** for manual retry or explicit discard. Records are never discarded automatically.
- Logging out warns about unsynced records and clears on-device data for the user.
- Medication (MAR) signing is intentionally online-only.

## Notes

- Minimum 44pt touch targets and accessibility labels on interactive elements.
- Haptic feedback on key interactions.
- Theme preference (light/dark/system) persisted per device.
