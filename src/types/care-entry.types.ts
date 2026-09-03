export type CareEntryCategory =
  | 'PERSONAL_CARE'
  | 'CONTINENCE'
  | 'MOBILITY'
  | 'FOOD'
  | 'FLUID'
  | 'MOOD_BEHAVIOUR'
  | 'SLEEP_REST'
  | 'MEDICATION_OBSERVATION'
  | 'INCIDENT_CONCERN'
  | 'GENERAL_WELLBEING';

export const CARE_ENTRY_CATEGORY_OPTIONS: {
  value: CareEntryCategory;
  label: string;
}[] = [
  { value: 'PERSONAL_CARE', label: 'Personal care' },
  { value: 'CONTINENCE', label: 'Continence' },
  { value: 'MOBILITY', label: 'Mobility' },
  { value: 'FOOD', label: 'Food' },
  { value: 'FLUID', label: 'Fluid' },
  { value: 'MOOD_BEHAVIOUR', label: 'Mood / behaviour' },
  { value: 'SLEEP_REST', label: 'Sleep / rest' },
  { value: 'MEDICATION_OBSERVATION', label: 'Medication-related' },
  { value: 'INCIDENT_CONCERN', label: 'Incident / concern' },
  { value: 'GENERAL_WELLBEING', label: 'General wellbeing' },
];

export const CARE_ENTRY_CATEGORY_LABEL: Record<CareEntryCategory, string> =
  Object.fromEntries(
    CARE_ENTRY_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<CareEntryCategory, string>;

export interface CareEntryItemDto {
  category: CareEntryCategory;
  summary: string;
}

export interface CareEntryConfirmedByDto {
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface CareEntryDto {
  id: string;
  residentId: string;
  rawText: string;
  extractedItems: CareEntryItemDto[];
  confirmedItems: CareEntryItemDto[];
  usedOpenAI: boolean;
  model: string | null;
  confirmedBy: CareEntryConfirmedByDto;
  confirmedAt: string;
  lastEditedBy?: CareEntryConfirmedByDto | null;
  lastEditedAt?: string | null;
  createdAt: string | null;
  handoverRequired: boolean;
}

export interface ExtractCareEntryResult {
  rawText: string;
  items: CareEntryItemDto[];
  usedOpenAI: boolean;
  model: string | null;
}

export interface CreateCareEntryPayload {
  rawText: string;
  items: CareEntryItemDto[];
  extractedItems?: CareEntryItemDto[];
  usedOpenAI?: boolean;
  model?: string | null;
  handoverRequired?: boolean;
}

export interface UpdateCareEntryPayload {
  rawText: string;
  items: CareEntryItemDto[];
  changeReason: string;
  handoverRequired?: boolean;
}

export interface QueryCareEntriesParams {
  search?: string;
  category?: CareEntryCategory;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface CareEntryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CareEntryListResult {
  items: CareEntryDto[];
  pagination: CareEntryPagination;
}

export function userCanCreateCareNotes(
  role?: string,
  permissions?: Record<string, boolean>,
): boolean {
  if (permissions?.create_care_notes === true) return true;
  const normalized = (role ?? '').toUpperCase().replace(/-/g, '_');
  return (
    normalized === 'ADMIN' ||
    normalized === 'CARER' ||
    normalized === 'SUPER_ADMIN'
  );
}

export function careEntryCategoryLabel(category: string): string {
  return CARE_ENTRY_CATEGORY_LABEL[category as CareEntryCategory] ?? category;
}
