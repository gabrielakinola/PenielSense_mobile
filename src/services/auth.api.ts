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
