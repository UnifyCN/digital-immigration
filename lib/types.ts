// ── Assessment form types ──

export type PrimaryGoal = "pr" | "study-permit" | "work-permit" | "sponsorship" | "not-sure"
export type TimeUrgency = "less-than-3" | "3-to-6" | "6-to-12" | "flexible"
export type CurrentLocation = "inside-canada" | "outside-canada"
export type YesNo = "yes" | "no"
export type GeographicFlexibility = "yes-anywhere" | "prefer-specific" | "only-specific"
export type DeadlineTrigger =
  | "status-expiring"
  | "job-offer-start"
  | "school-intake"
  | "family-situation"
  | "no-hard-deadline"
export type SponsorshipRelation = "spouse-partner" | "child" | "parent-grandparent" | "other"
export type TemporaryStatusType =
  | "study-permit"
  | "work-permit-open"
  | "work-permit-employer-specific"
  | "visitor-record"
export type CurrentStatus = "citizen" | "pr" | "visitor" | "student" | "worker" | "other"
// Red-flag flows still store "unsure" and are intentionally normalized separately from "not-sure" fields.
export type YesNoUnsure = "yes" | "no" | "unsure"
export type RefusalHistory = "no" | "canada" | "another-country" | "both" | "unsure"
export type ApplicationType = "visitor" | "study" | "work" | "pr" | "sponsorship" | "other" | "not-sure"
export type WorkExperience = "0-1" | "1-3" | "3-5" | "5+" | "not-sure"
export type HoursPerWeekRange = "lt15" | "15-29" | "30plus" | "varies-not-sure"
export type PaidWorkStatus = "yes" | "no" | "mix-not-sure"
export type EmploymentType = "employee" | "self-employed-contractor" | "mix" | "unsure"
export type EmployerLetterFeasibility = "yes" | "no" | "unsure"
export type EmployerLetterChallenge =
  | "employer-wont-include-duties"
  | "employer-closed-cant-contact"
  | "self-employed"
  | "informal-work-no-records"
  | "other-not-sure"
export type JobOfferCompensationType = "hourly" | "annual"
export type JobOfferTenure = "lt-6-months" | "6-12-months" | "1-2-years" | "2-plus-years"
export type OccupationCategory =
  | "business-management"
  | "it-software-data"
  | "engineering"
  | "healthcare"
  | "trades"
  | "hospitality-tourism"
  | "sales-marketing"
  | "education"
  | "other"
export type LanguageTestPlan = "english-only" | "french-only" | "both-languages" | "not-sure"
export type LanguagePerLangStatus = "completed" | "booked" | "not-taken"
export type EnglishLanguageTestType = "ielts-general-training" | "celpip-general"
export type FrenchLanguageTestType = "tef-canada" | "tcf-canada"
export type HasValidLanguageTest = "yes" | "no" | "booked"
export type HardGateLanguageTestStatus = "valid" | "not_valid" | "booked"
export type LanguageApproxCLB = "clb-4-6" | "clb-7" | "clb-8" | "clb-9-plus" | "not-sure"
export type LanguagePlannedTiming = "within-1-month" | "1-3-months" | "3-plus-months" | "not-scheduled"
export type CanadianWorkDuration = "none" | "less-than-1-year" | "1-year" | "2-plus-years" | "not-sure"
export type SecondOfficialLanguageIntent = "yes" | "no" | "not-sure"
export type YesNoNotSure = "yes" | "no" | "not-sure"
// Keep EcaStatus ECA-specific so non-ECA fields can evolve independently without hidden coupling.
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
export type FieldOfStudy =
  | "business"
  | "it-computer-science"
  | "engineering"
  | "health"
  | "trades"
  | "arts-social-sciences"
  | "other"
export type MaritalStatus = "single" | "married" | "common-law" | "separated" | "divorced" | "widowed"
export type AgeRange = "17-or-less" | "18-24" | "25-29" | "30-34" | "35-39" | "40-44" | "45+"

export interface JobEntry {
  title: string
  country: string
  yearsRange: string
  startMonth: string
  endMonth: string
  present: boolean
}

export interface AdditionalCredential {
  educationLevel: EducationLevel | ""
  country: string
  graduationYear: string
  programLength: ProgramLength | ""
}

export interface AssessmentData {
  // Step 0: Basic Information
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  citizenshipCountry: string
  currentProvinceTerritory: string
  intendedProvinceTerritory: string
  hasValidTemporaryStatus: YesNo | ""
  temporaryStatusType: TemporaryStatusType | ""
  temporaryStatusExpiryDate: string
  exactAge: number | null
  email?: string
  consentAcknowledged: boolean

  // Step 1: Goal & Timeline
  primaryGoal: PrimaryGoal | ""
  timeUrgency: TimeUrgency | ""
  currentLocation: CurrentLocation | ""
  geographicFlexibility: GeographicFlexibility | ""
  preferredProvince: string
  pnpTargetProvince: string
  deadlineTrigger: DeadlineTrigger | ""
  deadlineDate: string
  studyPermitHasLOA: YesNoUnsure | ""
  workPermitHasJobOffer: YesNoUnsure | ""
  sponsorshipRelation: SponsorshipRelation | ""
  openToPNP: YesNoNotSure | ""

  // Step 2: Current Status
  currentStatus: CurrentStatus | ""
  statusExpiryDate: string
  hasAppliedToExtendStatus: YesNoUnsure | ""
  refusalHistory: RefusalHistory | ""
  mostRecentRefusalType: ApplicationType | ""
  mostRecentRefusalDate: string
  priorCanadaApplicationType: ApplicationType | ""
  currentlyWorkingInCanada: YesNo | ""
  currentJobProvinceTerritory: string
  sameEmployerForPermanentOffer: YesNoNotSure | ""
  countryOfResidence: string
  nationality: string
  priorApplications: YesNoUnsure | ""

  // Step 3: Work History
  currentJobTitle: string
  countryOfWork: string
  industryCategory: string
  employmentGaps: YesNoUnsure | ""
  mostRecentJobStart: string
  mostRecentJobEnd: string
  mostRecentJobPresent: boolean
  hoursPerWeekRange: HoursPerWeekRange | ""
  paidWorkStatus: PaidWorkStatus | ""
  employmentType: EmploymentType | ""
  canObtainEmployerLetter: EmployerLetterFeasibility | ""
  employerLetterChallenge: EmployerLetterChallenge | ""
  hasOverlappingPeriods: YesNoUnsure | ""
  hasCanadianJobOffer: YesNoUnsure | ""
  jobOfferProvinceTerritory: string
  jobOfferTitle: string
  jobOfferEmployerName: string
  jobOfferCity: string
  jobOfferFullTime: YesNo | ""
  jobOfferPermanent: YesNo | ""
  jobOfferCompensation: string
  jobOfferCompensationType: JobOfferCompensationType | ""
  jobOfferTenure: JobOfferTenure | ""
  employerWillSupportPNP: YesNoUnsure | ""
  occupationCategory: OccupationCategory | ""
  occupationCategoryOtherRole: string
  jobDuties: string
  foreignSkilledYears: "0" | "1" | "2" | "3" | "4" | "5+" | ""
  hasContinuous12MonthsSkilled: YesNoUnsure | ""
  has12MonthsCanadaSkilled: "yes" | "no" | "not_sure" | ""
  canadianWorkAuthorizedAll: "yes" | "no" | "not_sure" | ""
  derivedCanadianSkilledYearsBand: "0" | "1" | "2" | "3" | "4" | "5+" | ""
  jobs: JobEntry[]

  // Step 4: Education
  educationLevel: EducationLevel | ""
  fieldOfStudy: FieldOfStudy | ""
  educationCountry: string
  graduationYear: string
  ecaStatus: EcaStatus | ""
  canadaEducationStatus: CanadaEducationStatus | ""
  educationCompletedInCanada: YesNo | ""
  canadianEducationProvinceTerritory: string
  canadianEducationPublicInstitution: YesNoNotSure | ""
  programLength: ProgramLength | ""
  hasMultipleCredentials: YesNoNotSure | ""
  additionalCredentials: AdditionalCredential[]
  ecaValid: EcaStatus | ""

  // Step 5: Language & CRS
  languageTestStatus: HardGateLanguageTestStatus | ""
  languageTestPlan: LanguageTestPlan | ""
  englishTestStatus: LanguagePerLangStatus | ""
  englishTestType: EnglishLanguageTestType | ""
  englishPlannedTestDate: string
  frenchTestStatus: LanguagePerLangStatus | ""
  frenchTestType: FrenchLanguageTestType | ""
  frenchPlannedTestDate: string
  languageScores: {
    listening: string
    reading: string
    writing: string
    speaking: string
  }
  addScoresLater: boolean
  ageRange: AgeRange | ""
  canadianEducation: YesNoNotSure | ""
  canadianWorkExperience: YesNoUnsure | ""
  canadianWorkDuration: CanadianWorkDuration | ""
  secondOfficialLanguageIntent: SecondOfficialLanguageIntent | ""

  // Step 6: Family
  maritalStatus: MaritalStatus | ""
  dependents: number
  spouseAccompanying: SpouseAccompanying | ""
  spouseLocation: SpouseLocation | ""
  closeRelativeInCanada: YesNoNotSure | ""
  hasCloseRelativeInCanada: YesNo | ""
  relativeProvinceTerritory: string
  closeRelativeRelationship: CloseRelativeRelationship | ""
  hasDependentsUnder18: YesNoNotSure | ""
  hasDependents18Plus: YesNoNotSure | ""
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
  workedWithoutAuthorizationInCanada: YesNo | ""
  refusedProvincialNomination: YesNo | ""
  isSkilledTrade: YesNoUnsure | ""
}

// ── Results types ──

export type TierLevel = 1 | 2 | 3
export type TierLabel = "Clean" | "Moderate" | "Complex"
export type Severity = "low" | "medium" | "high"
export type ConfidenceLevel = "High" | "Medium" | "Low"
export type LowercaseConfidenceLevel = "high" | "medium" | "low"
export type PathwayRecommendationMode = "recommended" | "explore" | "later"
export type PathwayVisibilityMode = "visible" | "hidden"
export type PathwayReadinessStatus = "complete" | "attention" | "unknown" | "na"
export type PathwayOpenQuestionCategory =
  | "province"
  | "job"
  | "work"
  | "language"
  | "docs"
  | "status"
  | "education"
  | "risk"
export type PathwayDocumentCategory = "typical" | "sometimes" | "later"
export type PathwayDocumentStatus = "ready" | "needs_action" | "conditional" | "later_stage"

export type PathwayReadinessChecklistItem = {
  id: string
  label: string
  status: PathwayReadinessStatus
  shortText: string
  reasonCodes?: string[]
}

export type PathwayOpenQuestion = {
  id: string
  prompt: string
  reason: string
  priority: number
  category: PathwayOpenQuestionCategory
  signalKeys: string[]
  reasonCodes?: string[]
}

export type PathwayDocumentRoadmapItem = {
  id: string
  label: string
  category: PathwayDocumentCategory
  status: PathwayDocumentStatus
  note?: string
  signalKeys?: string[]
  reasonCodes?: string[]
}

export type PathwayDocumentRoadmap = {
  typical: PathwayDocumentRoadmapItem[]
  sometimes: PathwayDocumentRoadmapItem[]
  later: PathwayDocumentRoadmapItem[]
}

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
  pnpScore?: number
  pnpScoreBreakdown?: Record<string, number>
  confidenceLevel?: LowercaseConfidenceLevel
  confidenceLabel?: string
  confidenceReasonCodes?: string[]
  recommendationMode?: PathwayRecommendationMode
  displayPriority?: number
  visibilityMode?: PathwayVisibilityMode
  visibilityReasonCode?: string
  displayRank?: number
  whyBullets?: string[]
  whyBulletIds?: string[]
  whyLimitedBullets?: string[]
  whyLimitedBulletIds?: string[]
  howToImproveBullets?: string[]
  howToImproveBulletIds?: string[]
  readinessChecklist?: PathwayReadinessChecklistItem[]
  readinessChecklistAll?: PathwayReadinessChecklistItem[]
  openQuestions?: PathwayOpenQuestion[]
  openQuestionIds?: string[]
  documentRoadmap?: PathwayDocumentRoadmap
  documentRoadmapAll?: PathwayDocumentRoadmapItem[]
}

export type RiskId =
  | "employment_gaps"
  | "language_test_missing"
  | "prior_refusal"
  | "missing_documents"
  | "status_expiring"
  | "eca_incomplete"
  | "criminal_charges"
  | "medical_issues"
  | "misrepresentation"
  | "multiple_countries"

export interface RiskFlag {
  id: RiskId
  label: string
  severity: Severity
  action: string
}

export type NextStepPriority = "high" | "medium" | "low"

export interface NextStepEvidence {
  inputs: string[]
  pathways: string[]
  risks: string[]
}

export interface NextStep {
  id: string
  title: string
  priority: NextStepPriority
  summary: string
  whatThisStepIs: string
  whyRecommendedForYou: string[]
  howToDoIt: string[]
  documentsNeeded: string[]
  commonMistakes: string[]
  conditionalNotes?: string[]
  checklist: { id: string; text: string }[]
  evidence: NextStepEvidence
}

export interface NextStepAiAssistContext {
  type: "next_step_help"
  nextStepId: string
  nextStepTitle: string
  priority: NextStepPriority
  userProfileSummary: Record<string, string | string[]>
  triggeredBy: NextStepEvidence
  currentRecommendationsShownOnScreen: {
    tier: TierResult
    pathways: PathwayCard[]
    risks: RiskFlag[]
    nextSteps: NextStep[]
  }
}

export interface AssessmentResults {
  tier: TierResult
  pathways: PathwayCard[]
  riskFlags: RiskFlag[]
  nextSteps: NextStep[]
  nextActions: string[]
}
