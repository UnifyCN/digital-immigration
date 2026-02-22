// ── Assessment form types ──

export type PrimaryGoal = "pr" | "study-permit" | "work-permit" | "sponsorship" | "not-sure"
export type TimeUrgency = "less-than-3" | "3-to-6" | "6-to-12" | "flexible"
export type CurrentLocation = "inside-canada" | "outside-canada"
export type GeographicFlexibility = "yes-anywhere" | "prefer-specific" | "only-specific"
export type DeadlineTrigger =
  | "status-expiring"
  | "job-offer-start"
  | "school-intake"
  | "family-situation"
  | "no-hard-deadline"
export type SponsorshipRelation = "spouse-partner" | "child" | "parent-grandparent" | "other"
export type CurrentStatus = "citizen" | "pr" | "visitor" | "student" | "worker" | "other"
export type YesNoUnsure = "yes" | "no" | "unsure"
export type RefusalHistory = "no" | "canada" | "another-country" | "both" | "unsure"
export type ApplicationType = "visitor" | "study" | "work" | "pr" | "sponsorship" | "other" | "not-sure"
export type WorkExperience = "0-1" | "1-3" | "3-5" | "5+" | "not-sure"
export type LanguageTestStatus = "yes" | "no" | "planning"
export type LanguageApproxCLB = "clb-4-6" | "clb-7" | "clb-8" | "clb-9-plus" | "not-sure"
export type LanguagePlannedTiming = "within-1-month" | "1-3-months" | "3-plus-months" | "not-scheduled"
export type CanadianWorkDuration = "none" | "less-than-1-year" | "1-year" | "2-plus-years" | "not-sure"
export type SecondOfficialLanguageIntent = "yes" | "no" | "not-sure"
export type EcaStatus = "yes" | "no" | "not-sure"
export type CanadaEducationStatus = "yes" | "no" | "mix-some-in-canada" | "not-sure"
export type ProgramLength = "less-than-1-year" | "1-year" | "2-years" | "3-plus-years" | "not-sure"
export type SpouseAccompanying = "yes-accompanying" | "no-non-accompanying" | "not-sure"
export type SpouseLocation = "in-canada" | "outside-canada" | "not-sure"
export type CloseRelativeRelationship = "parent" | "sibling" | "child" | "other-close-relative" | "not-sure"
export type SponsorshipTarget = "spouse-partner" | "child" | "parent-grandparent" | "other" | "not-sure"
export type SponsorStatus = "citizen" | "permanent-resident" | "not-sure"
export type YesNoNaUnsure = "yes" | "no" | "na" | "unsure"
export type EducationLevel =
  | "none"
  | "high-school"
  | "one-year-diploma"
  | "two-year-diploma"
  | "bachelors"
  | "two-or-more-degrees"
  | "masters"
  | "phd"
export type MaritalStatus = "single" | "married" | "common-law" | "separated" | "divorced" | "widowed"
export type AgeRange = "17-or-less" | "18-24" | "25-29" | "30-34" | "35-39" | "40-44" | "45+"

export interface JobEntry {
  title: string
  country: string
  yearsRange: string
}

export interface AdditionalCredential {
  educationLevel: EducationLevel | ""
  country: string
  graduationYear: string
  programLength: ProgramLength | ""
}

export interface AssessmentData {
  // Step 1: Goal & Timeline
  primaryGoal: PrimaryGoal | ""
  timeUrgency: TimeUrgency | ""
  currentLocation: CurrentLocation | ""
  geographicFlexibility: GeographicFlexibility | ""
  preferredProvince: string
  deadlineTrigger: DeadlineTrigger | ""
  deadlineDate: string
  studyPermitHasLOA: YesNoUnsure | ""
  workPermitHasJobOffer: YesNoUnsure | ""
  sponsorshipRelation: SponsorshipRelation | ""

  // Step 2: Current Status
  currentStatus: CurrentStatus | ""
  statusExpiryDate: string
  hasAppliedToExtendStatus: YesNoUnsure | ""
  refusalHistory: RefusalHistory | ""
  mostRecentRefusalType: ApplicationType | ""
  priorCanadaApplicationType: ApplicationType | ""
  countryOfResidence: string
  nationality: string
  priorApplications: YesNoUnsure | ""

  // Step 3: Work History
  currentJobTitle: string
  countryOfWork: string
  totalExperience: WorkExperience | ""
  industryCategory: string
  employmentGaps: YesNoUnsure | ""
  jobs: JobEntry[]

  // Step 4: Education
  educationLevel: EducationLevel | ""
  educationCountry: string
  graduationYear: string
  ecaStatus: EcaStatus | ""
  canadaEducationStatus: CanadaEducationStatus | ""
  programLength: ProgramLength | ""
  hasMultipleCredentials: EcaStatus | ""
  additionalCredentials: AdditionalCredential[]
  ecaValid: EcaStatus | ""

  // Step 5: Language & CRS
  languageTestStatus: LanguageTestStatus | ""
  languageScores: {
    listening: string
    reading: string
    writing: string
    speaking: string
  }
  addScoresLater: boolean
  plannedTestDate: string
  languageApproxCLB: LanguageApproxCLB | ""
  languageTestValid: EcaStatus | ""
  languagePlannedTiming: LanguagePlannedTiming | ""
  ageRange: AgeRange | ""
  canadianEducation: YesNoUnsure | ""
  canadianWorkExperience: YesNoUnsure | ""
  canadianWorkDuration: CanadianWorkDuration | ""
  secondOfficialLanguageIntent: SecondOfficialLanguageIntent | ""

  // Step 6: Family
  maritalStatus: MaritalStatus | ""
  dependents: number
  spouseAccompanying: SpouseAccompanying | ""
  spouseLocation: SpouseLocation | ""
  closeRelativeInCanada: EcaStatus | ""
  closeRelativeRelationship: CloseRelativeRelationship | ""
  hasDependentsUnder18: EcaStatus | ""
  hasDependents18Plus: EcaStatus | ""
  sponsorshipTarget: SponsorshipTarget | ""
  sponsorStatus: SponsorStatus | ""
  partnerEducation: boolean
  partnerLanguageScores: boolean
  partnerWorkExperience: boolean

  // Step 7: Red Flags
  priorRefusals: YesNoUnsure | ""
  criminalCharges: YesNoUnsure | ""
  medicalIssues: YesNoUnsure | ""
  misrepresentation: YesNoUnsure | ""
  multipleCountries: YesNoUnsure | ""
  nonTraditionalEmployment: YesNoUnsure | ""
  missingDocuments: YesNoUnsure | ""
  statusExpiringSoon: YesNoNaUnsure | ""
  overstayHistory: YesNoUnsure | ""
  removalOrDeportationHistory: YesNoUnsure | ""
  hasActiveApplication: YesNoUnsure | ""
  employerLetterUnwilling: YesNoUnsure | ""
}

// ── Results types ──

export type TierLevel = 1 | 2 | 3
export type TierLabel = "Clean" | "Moderate" | "Complex"
export type Severity = "low" | "medium" | "high"
export type ConfidenceLevel = "High" | "Medium" | "Low"

export interface TierResult {
  level: TierLevel
  label: TierLabel
  reasons: string[]
}

export interface PathwayCard {
  id: string
  name: string
  whyRelevant: string[]
  whatNext: string[]
  confidence: ConfidenceLevel
}

export interface RiskFlag {
  label: string
  severity: Severity
  action: string
}

export interface AssessmentResults {
  tier: TierResult
  pathways: PathwayCard[]
  riskFlags: RiskFlag[]
  nextActions: string[]
}
