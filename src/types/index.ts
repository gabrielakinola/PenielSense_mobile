export type WellnessStatus = 'good' | 'watch' | 'critical';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertStatus = 'active' | 'resolved';

export type DeviceType = 'v5' | 'tuya' | 'withings';

export type DeviceStatus = 'online' | 'offline' | 'low_battery';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  careHome: string;
  shift: string;
  avatarColor: string;
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  room: string;
  age: number;
  status: WellnessStatus;
  avatarColor: string;
  lastSeen: string;
  heartRate?: number;
  sleepScore?: number;
}

export interface Alert {
  id: string;
  residentId: string;
  residentName: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  timestamp: string;
  room: string;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  residentId?: string;
  residentName?: string;
  room?: string;
  battery?: number;
  lastSync: string;
}

export interface VitalReading {
  timestamp: string;
  value: number;
}

export interface Vital {
  id: string;
  residentId: string;
  type: 'heart_rate' | 'respiratory' | 'spo2' | 'temperature';
  label: string;
  unit: string;
  current: number;
  status: WellnessStatus;
  history: VitalReading[];
}

export interface Sleep {
  id: string;
  residentId: string;
  score: number;
  durationHours: number;
  deepSleepHours: number;
  remHours: number;
  awakenings: number;
  status: WellnessStatus;
  bedtime: string;
  wakeTime: string;
}

export interface Activity {
  id: string;
  residentId: string;
  residentName: string;
  type: 'movement' | 'fall' | 'medication' | 'visit' | 'device';
  title: string;
  description: string;
  timestamp: string;
  status?: WellnessStatus;
}

export interface HomeStats {
  totalResidents: number;
  activeAlerts: number;
  devicesOnline: number;
  wellnessScore: number;
}

export interface HomeData {
  user: User;
  stats: HomeStats;
  activities: Activity[];
  alerts: Alert[];
  devices: Device[];
}

export interface ResidentDetail extends Resident {
  devices: Device[];
  vitals: Vital[];
  sleep: Sleep;
  activities: Activity[];
}
