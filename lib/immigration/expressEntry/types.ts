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
  testType: string
  stream: string
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
  paid: boolean
  employmentType: string
  wasAuthorizedInCanada: string
  wasFullTimeStudent: string
  qualifiedToPracticeInCountry: string
  physicallyInCanada: string
  title: string
  employerName: string
}

export interface CandidateFstJobOfferEmployer {
  id: string
  employerName: string
  province: string
  noc2021Code: string
  paid: string
  fullTime: string
  continuous: string
  nonSeasonal: string
  hoursPerWeek: number | null
  durationMonths: number | null
}

export interface CandidateProfile {
  asOfDate: Date
  source: AssessmentData
  intentOutsideQuebec: string
  currentlyAuthorizedToWorkInCanada: string
  fswPrimaryOccupationRoleId: string
  fundsFamilySize: number | null
  settlementFundsCad: number | null
  fundsExemptByValidJobOffer: string
  hasCanadianTradeCertificate: string
  tradeCertificateIssuingAuthority: string
  tradeCertificateTrade: string
  tradeCertificateIssueDate: string
  jobOfferMeetsValidOfferDefinition: string
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
import type { AssessmentData } from "../../types"
