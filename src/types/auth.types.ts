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
  enabledProducts?: Array<'PENIEL_CARE' | 'PENIELSENSE' | 'PENIEL_EMAR' | 'EMAR'>;
  subscriptionStatus?: 'TRIAL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  subscriptionPackage?: 'CARE_ESSENTIALS' | 'CARE_INTELLIGENCE' | 'CONNECTED_CARE' | 'COMPLETE' | 'CUSTOM';
  suspendedProducts?: Array<'PENIEL_CARE' | 'PENIELSENSE' | 'PENIEL_EMAR' | 'EMAR'>;
  limits?: { residents: number; staff: number; devices: number };
  featureOverrides?: Record<string, boolean>;
  packageName?: string;
}

export interface CareHomeLocationDto {
  id: string;
  name: string;
  locationCode?: string | null;
  city: string;
  status: string;
  active: boolean;
  timezone?: string;
  enabledProducts?: CareHomeSummaryDto['enabledProducts'];
  suspendedProducts?: CareHomeSummaryDto['suspendedProducts'];
  subscriptionStatus?: CareHomeSummaryDto['subscriptionStatus'];
  subscriptionPackage?: CareHomeSummaryDto['subscriptionPackage'];
  packageName?: string;
  subscriptionLimits?: { residents: number; staff: number; devices: number };
  featureOverrides?: Record<string, boolean>;
}

export interface CareHomeLoginData {
  accessToken: string;
  refreshToken: string;
  user: CareHomeUserDto;
  careHome: CareHomeSummaryDto;
  locations?: CareHomeLocationDto[];
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
