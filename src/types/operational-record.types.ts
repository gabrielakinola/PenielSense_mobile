export type OperationalRecordKind =
  | "DOCUMENT"
  | "APPOINTMENT"
  | "PROFESSIONAL_VISIT"
  | "FAMILY_CONTACT"
  | "ADMISSION"
  | "TRANSFER"
  | "HOSPITAL_LEAVE"
  | "RETURN"
  | "DISCHARGE"
  | "DECEASED"
  | "ARCHIVED";

export interface OperationalRecordDto {
  id: string;
  residentId: string;
  kind: OperationalRecordKind;
  title: string;
  summary: string;
  occurredAt: string;
  reviewDueAt: string | null;
  professional: string;
  organisation: string;
  documentType: string;
  storageUrl: string;
  details: Record<string, unknown>;
  recordedBy: string;
  version: number;
}
