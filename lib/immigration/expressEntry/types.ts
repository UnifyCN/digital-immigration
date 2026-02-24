import type {
  AssessmentData,
  ExpressEntryLanguageTestType,
  LanguageTestStream,
  WorkRoleEmploymentType,
  YesNo,
  YesNoNotSure,
} from "../../types"

export type StreamProgram = "CEC" | "FSW" | "FST"

export type ProgramCheckStatus = "eligible" | "ineligible" | "needs_more_info"

export type FundsRequirementDecision = "required" | "exempt" | "needs_more_info"

export interface ProgramEvidenceItem {
  key: string
  value: unknown
}

export interface ProgramCheckResult {
  status: ProgramCheckStatus
  reasons: string[]
  missingFields: string[]
  evidence: ProgramEvidenceItem[]
}

export type FollowUpControlType = "text" | "number" | "date" | "radio" | "checkbox" | "select"

export interface FollowUpQuestionOption {
  value: string
  label: string
}

export interface FollowUpQuestionSpec {
  id: string
  program: StreamProgram | "shared"
  fieldKey: string
  prompt: string
  controlType: FollowUpControlType
  required: boolean
  roleId?: string
  options?: FollowUpQuestionOption[]
  helpText?: string
}

export interface CandidateLanguageTest {
  testType: ExpressEntryLanguageTestType | ""
  stream: LanguageTestStream | ""
  testDate: string
  scores: {
    listening: string
    reading: string
    writing: string
    speaking: string
  }
}

export interface CandidateWorkRole {
  id: string
  nocCode: string
  teer: string
  nocDutiesMatchConfirmed: boolean
  country: string
  startDate: string
  endDate: string
  present: boolean
  hoursPerWeek: number | null
  paid: boolean | null
  employmentType: WorkRoleEmploymentType | ""
  wasAuthorizedInCanada: YesNoNotSure | ""
  wasFullTimeStudent: YesNoNotSure | ""
  qualifiedToPracticeInCountry: YesNoNotSure | ""
  physicallyInCanada: YesNoNotSure | ""
  title: string
  employerName: string
}

export interface CandidateFstJobOfferEmployer {
  id: string
  employerName: string
  province: string
  noc2021Code: string
  paid: YesNo | ""
  fullTime: YesNo | ""
  continuous: YesNoNotSure | ""
  nonSeasonal: YesNoNotSure | ""
  hoursPerWeek: number | null
  durationMonths: number | null
}

export interface CandidateProfile {
  asOfDate: Date
  source: AssessmentData
  intentOutsideQuebec: YesNoNotSure | ""
  currentlyAuthorizedToWorkInCanada: YesNoNotSure | ""
  fswPrimaryOccupationRoleId: string
  fundsFamilySize: number | null
  settlementFundsCad: number | null
  fundsExemptByValidJobOffer: YesNoNotSure | ""
  hasCanadianTradeCertificate: YesNo | ""
  tradeCertificateIssuingAuthority: string
  tradeCertificateTrade: string
  tradeCertificateIssueDate: string
  jobOfferMeetsValidOfferDefinition: YesNoNotSure | ""
  language: CandidateLanguageTest
  workRoles: CandidateWorkRole[]
  fstJobOfferEmployers: CandidateFstJobOfferEmployer[]
}

export interface ExpressEntryStreamsResult {
  eligiblePrograms: StreamProgram[]
  programResults: {
    CEC: ProgramCheckResult
    FSW: ProgramCheckResult
    FST: ProgramCheckResult
  }
  nextQuestions: FollowUpQuestionSpec[]
  rulesetDate: string
  asOfDate: string
}
