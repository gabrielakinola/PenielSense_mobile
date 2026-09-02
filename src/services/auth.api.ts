import { authApiClient } from '@/src/lib/api-client';
import type {
  ApiSuccessEnvelope,
  CareHomeLoginData,
  CareHomeLoginDto,
} from '@/src/types/auth.types';

export async function loginCareHome(credentials: CareHomeLoginDto) {
  const { data } = await authApiClient.post<
    ApiSuccessEnvelope<CareHomeLoginData>
  >('/auth/carehome/login', {
    email: credentials.email,
    password: credentials.password,
  });
  return data.data;
}

export async function refreshCareHomeSession(refreshToken: string) {
  const { data } = await authApiClient.post<
    ApiSuccessEnvelope<{ accessToken: string; refreshToken: string }>
  >('/auth/carehome/refresh', { refreshToken });
  return data.data;
}
