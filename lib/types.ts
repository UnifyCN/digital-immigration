// ── Assessment form types ──

export type PrimaryGoal = "pr" | "study-permit" | "work-permit" | "sponsorship" | "not-sure"
export type TimeUrgency = "less-than-3" | "3-to-6" | "6-to-12" | "flexible"
export type CurrentLocation = "inside-canada" | "outside-canada"
export type CurrentStatus = "citizen" | "pr" | "visitor" | "student" | "worker" | "other"
export type YesNoUnsure = "yes" | "no" | "unsure"
export type WorkExperience = "0-1" | "1-3" | "3-5" | "5+" | "not-sure"
export type LanguageTestStatus = "yes" | "no" | "planning"
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

export interface AssessmentData {
  // Step 1: Goal & Timeline
  primaryGoal: PrimaryGoal | ""
  timeUrgency: TimeUrgency | ""
  currentLocation: CurrentLocation | ""

  // Step 2: Current Status
  currentStatus: CurrentStatus | ""
  statusExpiryDate: string
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
  ecaStatus: YesNoUnsure | ""

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
  ageRange: AgeRange | ""
  canadianEducation: YesNoUnsure | ""
  canadianWorkExperience: YesNoUnsure | ""

  // Step 6: Family
  maritalStatus: MaritalStatus | ""
  dependents: number
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
