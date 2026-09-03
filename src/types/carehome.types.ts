export type InsightSeverity = 'info' | 'watch' | 'attention';
export type InsightKind = 'correlation' | 'trend' | 'baseline';
export type RoutineStatus = 'on_routine' | 'delayed' | 'early' | 'unknown';

export type CareBriefStatusTone =
  | 'attention'
  | 'watch'
  | 'stable'
  | 'unmonitored';

export interface ResidentCareBriefGlanceRow {
  area: string;
  summary: string;
}

export interface ResidentBaselineReliability {
  status: 'learning' | 'limited' | 'established' | 'interrupted';
  label: string;
  description: string;
  referenceWindowDays: number;
  lastCalculatedAt: string | null;
}

export interface ResidentCareBriefReason {
  id: string;
  area: string;
  headline: string;
  detail: string;
  source: string;
}

export interface ResidentCareBrief {
  residentId: string;
  residentName: string;
  displayName: string;
  room: string | null;
  statusLabel: string;
  statusTone: CareBriefStatusTone;
  lastUpdatedAt: string;
  currentSummary: string;
  suggestedStaffReview: string;
  glance: ResidentCareBriefGlanceRow[];
  baselineReliability?: ResidentBaselineReliability;
  why?: ResidentCareBriefReason[];
  dataCoverageNote?: string | null;
  usedOpenAI: boolean;
  model: string | null;
}

export interface ResidentIntelligenceBadge {
  residentId: string;
  isMonitored: boolean;
  attentionCount: number;
  watchCount: number;
  infoCount: number;
  latestInsightTitle: string | null;
  latestInsightSeverity: InsightSeverity | null;
  currentRoutineStatus: RoutineStatus;
}

export interface ResidentIntelligenceBadgesResponse {
  generatedAt: string;
  badges: ResidentIntelligenceBadge[];
}

export type ApiResidentGender = 'MALE' | 'FEMALE';
export type ApiDeviceType = 'V5_WRISTBAND' | 'TUYA_RADAR' | 'WITHINGS_MAT';
export type ApiResidentWellnessStatus = 'good' | 'watch' | 'critical';

export type ResidentIntelligenceFilter =
  | 'attention'
  | 'watch'
  | 'delayed'
  | 'has_insights'
  | 'clear';

export type ResidentSortOption = 'name' | 'intelligence';

export interface ApiResidentDeviceDto {
  id: string;
  deviceId: string;
  type: ApiDeviceType;
  careHomeLabel: string | null;
}

export interface ApiResidentLatestVitalDto {
  heartRate: number;
  spo2: number;
  skinTemperature: number;
  status: 'stable' | 'watch' | 'critical';
  timestamp: string;
}

export interface ApiResidentDto {
  id: string;
  fullName: string;
  roomNo: string;
  wing: string | null;
  floor: string | null;
  room: string;
  dateOfBirth: string;
  age: number;
  gender: ApiResidentGender;
  notes: string | null;
  medicalHistory: string | null;
  careTags: string[];
  wellnessStatus: ApiResidentWellnessStatus;
  latestVital: ApiResidentLatestVitalDto | null;
  latestSleepScore?: number | null;
  activitySteps?: number | null;
  lastSyncAt?: string | null;
  devices: ApiResidentDeviceDto[];
}

export type ResidentRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ResidentCareProfileDto {
  id: string | null;
  residentId: string;
  preferredName: string;
  photoUrl: string;
  allergies: string[];
  healthConditions: string[];
  communicationNeeds: string;
  mobilitySupport: string;
  nutritionHydration: string;
  continenceSupport: string;
  medicationSupport: string;
  emergencyGuidance: string;
  gpName: string;
  gpPractice: string;
  aboutMe: {
    whatMatters?: string;
    importantPeople?: string;
    communication?: string;
    wellness?: string;
    pleaseDoAndDoNot?: string;
    howToSupportMe?: string;
    alsoWorthKnowing?: string;
  };
  contacts: Array<{
    name: string;
    relationship: string;
    phone?: string;
    email?: string;
    primary?: boolean;
  }>;
  risks: Array<{
    title: string;
    level: ResidentRiskLevel;
    controls: string;
    reviewDueAt?: string | null;
  }>;
  dnacprStatus: 'YES' | 'NO' | 'UNKNOWN';
  capacitySummary: string;
  consentSummary: string;
  dolsSummary: string;
  lastReviewedAt: string | null;
  reviewDueAt: string | null;
  version: number;
  updatedAt: string | null;
}

export interface QueryResidentsParams {
  search?: string;
  status?: ApiResidentWellnessStatus;
  intelligence?: ResidentIntelligenceFilter;
  sort?: ResidentSortOption;
}

export type DashboardShift = 'morning' | 'afternoon' | 'night';

export interface DashboardSummaryBullet {
  residentId: string;
  residentName: string;
  summary: string;
  insightId?: string;
  severity?: InsightSeverity;
}

export interface DashboardSummaryDto {
  shift: DashboardShift;
  headline: string;
  bullets: DashboardSummaryBullet[];
  dataQuality: {
    residentsMonitored: number;
    residentsWithFullCoverage: number;
    residentsPartial: number;
    residentsNoCoverage: number;
  };
  generatedAt: string;
}

export type DashboardGlanceTone =
  | 'attention'
  | 'watch'
  | 'stable'
  | 'coverage';

export interface DashboardGlanceCardDto {
  id: string;
  tone: DashboardGlanceTone;
  title: string;
  detail: string;
  count: number | null;
}

export interface ApiDashboardStatsDto {
  hero: {
    residentsMonitored: { available: boolean; value: number | null; caption?: string };
    attentionCount: { available: boolean; value: number | null; caption?: string };
    openReviewFlags: { available: boolean; value: number | null; caption?: string };
  };
  glance: DashboardGlanceCardDto[];
  summary: DashboardSummaryDto;
  trendsAvailable: boolean;
}

export type ApiReviewFlagSeverity = 'watch' | 'critical';
export type ApiReviewFlagStatus =
  | 'open'
  | 'reviewed'
  | 'false_alarm'
  | 'auto_resolved';
export type ApiManualCloseReviewFlagStatus = 'reviewed' | 'false_alarm';
export type ApiMonitoredVitalType = 'heartRate' | 'spo2' | 'skinTemperature';
export type ApiReviewFlagsPeriod = 'today' | '7d' | '30d';

export interface ApiReviewFlagDto {
  id: string;
  residentId: string;
  residentName: string;
  room: string;
  vitalType: ApiMonitoredVitalType;
  vitalLabel: string;
  severity: ApiReviewFlagSeverity;
  value: number;
  baselineMin: number;
  baselineMax: number;
  message: string;
  reviewStatus: ApiReviewFlagStatus;
  occurrenceCount?: number;
  lastSeenAt?: string;
  reviewedAt?: string | null;
  residentChecked?: boolean;
  actionTaken?: string;
  source: string;
  createdAt: string;
}

export interface ApiReviewFlagsListDto {
  items: ApiReviewFlagDto[];
  total: number;
}

export interface QueryReviewFlagsParams {
  limit?: number;
  reviewStatus?: ApiReviewFlagStatus;
  vitalType?: ApiMonitoredVitalType;
  severity?: ApiReviewFlagSeverity;
  period?: ApiReviewFlagsPeriod;
}

export type HandoverShiftWindow = 'morning' | 'afternoon' | 'night';
export type HandoverRiskLevel = 'normal' | 'watch' | 'attention';

export interface HandoverResidentCard {
  residentId: string;
  residentName: string;
  room: string;
  wing: string | null;
  floor: string | null;
  routineStatus: string;
  currentLocation: string;
  riskLevel: HandoverRiskLevel;
  attentionRequired: boolean;
  filterTags: string[];
  summary: string;
  reviewFlags: Array<{
    id: string;
    vitalType: string;
    severity: string;
    value: number;
    message: string;
    createdAt: string;
  }>;
  handoverNotes: Array<{
    id: string;
    at: string;
    summary: string;
    recordedBy: string;
  }>;
  connectedDevices: string[];
}

export interface HandoverSnapshotDto {
  id: string;
  careHomeId: string;
  shiftWindow: HandoverShiftWindow;
  dateKey: string;
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  careHomeSummary: {
    residentsMonitored: number;
    residentsRequiringAttention: number;
    residentsWithReviewFlags: number;
    residentsWithSleepChanges: number;
    residentsWithIncreasedMovement: number;
    residentsWithReducedActivity: number;
    deviceIssues: number;
    residentsUnmonitored: number;
    narrative: string;
  };
  stats: {
    residentsMonitored: number;
    averageSleepHours: number | null;
    averageActivityEvents: number | null;
    reviewFlagsCreated: number;
    reviewFlagsResolved: number;
    devicesOffline: number;
  };
  residents: HandoverResidentCard[];
  model: string;
  version: number;
  canRefresh: boolean;
  manualRefreshUsed: boolean;
}

export interface QueryHandoverParams {
  search?: string;
  sort?: 'alpha' | 'priority';
  attention?: boolean;
}

export interface ResidentEvidenceReport {
  resident: { id: string; name: string; room: string | null; routineStatus: string };
  period: { dateKey: string; window: HandoverShiftWindow; windowLabel: string; start: string; end: string };
  intelligence: { summary: string; generatedAt: string; model: string };
  supportingEvidence: { V5: string[]; Tuya: string[]; Withings: string[] };
  timelineHighlights: Array<{ label?: string; detail?: string; time?: string }>;
  reviewFlags: { active: ApiReviewFlagDto[]; resolved: ApiReviewFlagDto[] };
  careContext: {
    noteCount: number;
    notes: Array<{ id: string; recordedAt: string; recordedBy: string; items: Array<{ category: string; summary: string }> }>;
    tasks: Array<{ id: string; title: string; category: string; dueAt: string; status: string; outcomeNote: string }>;
    incidents: Array<{ id: string; type: string; severity: string; occurredAt: string; description: string; immediateAction: string; safeguardingConcern: boolean; status: string }>;
    provenance: string;
  };
}
