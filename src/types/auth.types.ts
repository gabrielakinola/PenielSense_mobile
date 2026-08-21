export interface CareHomeLoginDto {
  email: string;
  password: string;
}

export interface CareHomeUserDto {
  id: string;
  careHomeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: Record<string, boolean>;
  status?: string;
}

export interface CareHomeSummaryDto {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  timezone?: string;
}

export interface CareHomeLoginData {
  accessToken: string;
  refreshToken: string;
  user: CareHomeUserDto;
  careHome: CareHomeSummaryDto;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  errors?: string[];
}
