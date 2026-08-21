import { useQuery } from '@tanstack/react-query';
import {
  getHomeData,
  getResidentDetail,
  mockAlerts,
  mockDevices,
  mockResidents,
} from '@/src/mocks';

const MOCK_DELAY = 800;

function delay<T>(data: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export function useHomeData() {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => delay(getHomeData()),
  });
}

export function useResidents(search?: string, status?: string) {
  return useQuery({
    queryKey: ['residents', search, status],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      let results = [...mockResidents];

      if (status && status !== 'all') {
        results = results.filter((r) => r.status === status);
      }

      if (search?.trim()) {
        const q = search.trim().toLowerCase();
        results = results.filter(
          (r) =>
            r.firstName.toLowerCase().includes(q) ||
            r.lastName.toLowerCase().includes(q) ||
            r.room.toLowerCase().includes(q),
        );
      }

      return results;
    },
  });
}

export function useResidentDetail(id: string) {
  return useQuery({
    queryKey: ['resident', id],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 500));
      return getResidentDetail(id);
    },
    enabled: !!id,
  });
}

export function useAlerts(severity?: string, status?: string) {
  return useQuery({
    queryKey: ['alerts', severity, status],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      let results = [...mockAlerts];

      if (severity && severity !== 'all') {
        results = results.filter((a) => a.severity === severity);
      }

      if (status && status !== 'all') {
        results = results.filter((a) => a.status === status);
      }

      return results;
    },
  });
}

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 400));
      return mockDevices;
    },
  });
}
