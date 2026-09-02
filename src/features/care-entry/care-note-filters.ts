export type CareNoteDatePreset = 'all' | 'today' | '7d' | '30d';

export const CARE_NOTE_DATE_PRESET_OPTIONS: {
  value: CareNoteDatePreset;
  label: string;
}[] = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
];

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function careNoteDateRange(preset: CareNoteDatePreset): {
  from?: string;
  to?: string;
} {
  const today = toIsoDate(new Date());
  if (preset === 'today') return { from: today, to: today };
  if (preset === '7d') {
    return { from: toIsoDate(addDays(new Date(), -6)), to: today };
  }
  if (preset === '30d') {
    return { from: toIsoDate(addDays(new Date(), -29)), to: today };
  }
  return {};
}
