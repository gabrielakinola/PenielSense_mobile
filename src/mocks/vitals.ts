import type { Vital } from '@/src/types';

function generateHeartRateHistory(base: number): Vital['history'] {
  const points: Vital['history'] = [];
  for (let i = 23; i >= 0; i--) {
    const variance = Math.sin(i * 0.5) * 8 + (Math.random() - 0.5) * 6;
    points.push({
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      value: Math.round(base + variance),
    });
  }
  return points;
}

export const mockVitals: Vital[] = [
  {
    id: 'v-1',
    residentId: 'r-1',
    type: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    current: 72,
    status: 'good',
    history: generateHeartRateHistory(72),
  },
  {
    id: 'v-2',
    residentId: 'r-1',
    type: 'respiratory',
    label: 'Respiratory Rate',
    unit: 'rpm',
    current: 16,
    status: 'good',
    history: generateHeartRateHistory(16),
  },
  {
    id: 'v-3',
    residentId: 'r-1',
    type: 'spo2',
    label: 'SpO₂',
    unit: '%',
    current: 97,
    status: 'good',
    history: generateHeartRateHistory(97),
  },
  {
    id: 'v-4',
    residentId: 'r-3',
    type: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    current: 112,
    status: 'critical',
    history: generateHeartRateHistory(112),
  },
  {
    id: 'v-5',
    residentId: 'r-2',
    type: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    current: 94,
    status: 'watch',
    history: generateHeartRateHistory(94),
  },
];

export function getVitalsByResidentId(residentId: string): Vital[] {
  return mockVitals.filter((v) => v.residentId === residentId);
}

export function getHeartRateVital(residentId: string): Vital | undefined {
  return mockVitals.find((v) => v.residentId === residentId && v.type === 'heart_rate');
}
