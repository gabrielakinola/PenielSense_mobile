import type { WellnessStatus, AlertSeverity, DeviceStatus, DeviceType } from '@/src/types';

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusLabel(status: WellnessStatus): string {
  const labels: Record<WellnessStatus, string> = {
    good: 'Stable',
    watch: 'Watch',
    critical: 'Critical',
  };
  return labels[status];
}

export function getAlertSeverityLabel(severity: AlertSeverity): string {
  const labels: Record<AlertSeverity, string> = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };
  return labels[severity];
}

export function getDeviceStatusLabel(status: DeviceStatus): string {
  const labels: Record<DeviceStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    low_battery: 'Low Battery',
  };
  return labels[status];
}

export function getDeviceTypeLabel(type: DeviceType): string {
  const labels: Record<DeviceType, string> = {
    v5: 'V5 Sensors',
    tuya: 'Tuya Devices',
    withings: 'Withings Devices',
  };
  return labels[type];
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
