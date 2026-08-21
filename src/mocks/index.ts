export { mockUser } from './user';
export { mockResidents, getResidentById } from './residents';
export { mockAlerts } from './alerts';
export { mockDevices, getDevicesByResidentId } from './devices';
export { mockVitals, getVitalsByResidentId, getHeartRateVital } from './vitals';
export { mockActivities, getActivitiesByResidentId } from './activity';
export { mockSleepRecords, getSleepByResidentId } from './sleep';

import { mockAlerts } from './alerts';
import { mockActivities } from './activity';
import { mockDevices } from './devices';
import { mockResidents } from './residents';
import { mockUser } from './user';
import type { HomeData, HomeStats, ResidentDetail } from '@/src/types';
import { getDevicesByResidentId } from './devices';
import { getActivitiesByResidentId } from './activity';
import { getSleepByResidentId } from './sleep';
import { getVitalsByResidentId } from './vitals';
import { getResidentById } from './residents';

export function getHomeStats(): HomeStats {
  const activeAlerts = mockAlerts.filter((a) => a.status === 'active').length;
  const devicesOnline = mockDevices.filter((d) => d.status === 'online').length;
  const goodResidents = mockResidents.filter((r) => r.status === 'good').length;
  const wellnessScore = Math.round((goodResidents / mockResidents.length) * 100);

  return {
    totalResidents: mockResidents.length,
    activeAlerts,
    devicesOnline,
    wellnessScore,
  };
}

export function getHomeData(): HomeData {
  return {
    user: mockUser,
    stats: getHomeStats(),
    activities: mockActivities.slice(0, 5),
    alerts: mockAlerts.filter((a) => a.status === 'active').slice(0, 4),
    devices: mockDevices,
  };
}

export function getResidentDetail(id: string): ResidentDetail | null {
  const resident = getResidentById(id);
  if (!resident) return null;

  return {
    ...resident,
    devices: getDevicesByResidentId(id),
    vitals: getVitalsByResidentId(id),
    sleep: getSleepByResidentId(id) ?? {
      id: `s-${id}`,
      residentId: id,
      score: resident.sleepScore ?? 70,
      durationHours: 6.5,
      deepSleepHours: 1.5,
      remHours: 1.2,
      awakenings: 2,
      status: resident.status,
      bedtime: '2026-07-04T22:00:00Z',
      wakeTime: '2026-07-05T05:30:00Z',
    },
    activities: getActivitiesByResidentId(id),
  };
}
