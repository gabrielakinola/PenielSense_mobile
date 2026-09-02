export type CarePlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export interface CarePlanSectionDto {
  category: string;
  assessedNeed: string;
  desiredOutcome: string;
  supportInstructions: string;
  risks?: string;
  preferences?: string;
}
export interface CarePlanDto {
  id: string;
  residentId: string;
  sections: CarePlanSectionDto[];
  status: CarePlanStatus;
  effectiveFrom: string | null;
  reviewDueAt: string | null;
  version: number;
  approvedBy: string | null;
  approvedAt: string | null;
  updatedAt: string | null;
}
