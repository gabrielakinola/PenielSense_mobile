import type { Sleep } from '@/src/types';

export const mockSleepRecords: Sleep[] = [
  {
    id: 's-1',
    residentId: 'r-1',
    score: 88,
    durationHours: 7.5,
    deepSleepHours: 2.1,
    remHours: 1.8,
    awakenings: 1,
    status: 'good',
    bedtime: '2026-07-04T21:30:00Z',
    wakeTime: '2026-07-05T05:00:00Z',
  },
  {
    id: 's-2',
    residentId: 'r-2',
    score: 62,
    durationHours: 5.2,
    deepSleepHours: 0.8,
    remHours: 1.0,
    awakenings: 4,
    status: 'watch',
    bedtime: '2026-07-04T23:00:00Z',
    wakeTime: '2026-07-05T04:12:00Z',
  },
  {
    id: 's-3',
    residentId: 'r-3',
    score: 45,
    durationHours: 4.0,
    deepSleepHours: 0.5,
    remHours: 0.6,
    awakenings: 6,
    status: 'critical',
    bedtime: '2026-07-04T22:00:00Z',
    wakeTime: '2026-07-05T02:00:00Z',
  },
];

export function getSleepByResidentId(residentId: string): Sleep | undefined {
  return mockSleepRecords.find((s) => s.residentId === residentId);
}
