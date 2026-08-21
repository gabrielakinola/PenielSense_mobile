import type { Activity } from '@/src/types';

export const mockActivities: Activity[] = [
  {
    id: 'act-1',
    residentId: 'r-3',
    residentName: 'Eleanor Davis',
    type: 'fall',
    title: 'Fall Alert Triggered',
    description: 'Motion sensor detected potential fall in room 305.',
    timestamp: '2026-07-05T07:55:00Z',
    status: 'critical',
  },
  {
    id: 'act-2',
    residentId: 'r-1',
    residentName: 'Margaret Thompson',
    type: 'movement',
    title: 'Morning Activity',
    description: 'Resident active in common area.',
    timestamp: '2026-07-05T08:30:00Z',
    status: 'good',
  },
  {
    id: 'act-3',
    residentId: 'r-2',
    residentName: 'James Wilson',
    type: 'medication',
    title: 'Medication Administered',
    description: 'Morning medications confirmed by nurse.',
    timestamp: '2026-07-05T08:00:00Z',
    status: 'good',
  },
  {
    id: 'act-4',
    residentId: 'r-5',
    residentName: 'Dorothy Martinez',
    type: 'visit',
    title: 'Family Visit',
    description: 'Daughter arrived for scheduled visit.',
    timestamp: '2026-07-05T07:45:00Z',
  },
  {
    id: 'act-5',
    residentId: 'r-4',
    residentName: 'Robert Chen',
    type: 'device',
    title: 'Device Calibrated',
    description: 'Withings BP monitor recalibrated successfully.',
    timestamp: '2026-07-05T07:20:00Z',
    status: 'good',
  },
  {
    id: 'act-6',
    residentId: 'r-6',
    residentName: 'William Brown',
    type: 'movement',
    title: 'Physical Therapy',
    description: 'Completed 30-minute PT session.',
    timestamp: '2026-07-05T06:45:00Z',
    status: 'good',
  },
];

export function getActivitiesByResidentId(residentId: string): Activity[] {
  return mockActivities.filter((a) => a.residentId === residentId);
}
