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
export interface CarePlanRecommendation {
  id: string;
  residentId: string;
  category: string;
  title: string;
  reason: string;
  evidence: string[];
  nextStep: string;
  currentPlanHasSection: boolean;
}
export interface CarePlanRecommendationsDto {
  generatedAt: string;
  recommendations: CarePlanRecommendation[];
}
export interface GeneratedCarePlanDraftDto {
  residentId: string;
  generatedAt: string;
  status: 'DRAFT';
  sections: CarePlanSectionDto[];
  notice: string;
}
