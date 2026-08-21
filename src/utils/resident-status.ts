import type {
  ApiResidentDto,
  ResidentIntelligenceBadge,
} from '@/src/types/carehome.types';

export type IntelligenceStatusTone =
  | 'attention'
  | 'watch'
  | 'delayed'
  | 'stable'
  | 'unmonitored'
  | 'none';

export function residentIntelligenceStatus(
  badge: ResidentIntelligenceBadge | undefined,
  hasDevices: boolean,
): { label: string; tone: IntelligenceStatusTone } {
  if (!hasDevices) {
    return { label: 'No monitoring', tone: 'unmonitored' };
  }
  if (!badge) {
    return { label: 'No insights yet', tone: 'none' };
  }
  if (badge.attentionCount > 0) {
    return { label: 'Needs a check', tone: 'attention' };
  }
  if (badge.watchCount > 0) {
    return { label: 'Keep an eye on', tone: 'watch' };
  }
  if (badge.currentRoutineStatus === 'delayed') {
    return { label: 'Off routine', tone: 'delayed' };
  }
  return { label: 'Stable', tone: 'stable' };
}

export function splitResidentName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Resident', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '' };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(' '),
  };
}

export function avatarColorForName(name: string) {
  const palette = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DB2777', '#0891B2'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % palette.length;
  }
  return palette[hash] ?? palette[0]!;
}

export function deviceTypeShortLabel(type: ApiResidentDto['devices'][number]['type']) {
  switch (type) {
    case 'V5_WRISTBAND':
      return 'V5';
    case 'TUYA_RADAR':
      return 'Tuya';
    case 'WITHINGS_MAT':
      return 'Withings';
    default:
      return 'Device';
  }
}
