export type ProgramEligibilityStatus = "eligible" | "ineligible" | "needs_more_info"
export type ExpressEntryReasonProgram = "cec" | "fsw" | "fst" | "shared"
export type ExpressEntryReasonKind = "pass" | "fail" | "missing" | "warning"
export type ExpressEntryReasonActionability = "actionable" | "informational"
export type ExpressEntryReasonCode =
  | "work_history_missing"
  | "work_role_fields_missing"
  | "work_role_authorization_missing"
  | "language_missing_or_invalid"
  | "language_test_expired"
  | "language_wrong_stream"
  | "language_below_threshold"
  | "cec_no_qualifying_work"
  | "cec_hours_below_minimum"
  | "cec_passed"
  | "eca_missing_or_expired"
  | "fsw_required_data_missing"
  | "fsw_continuous_work_requirement_not_met"
  | "fsw_education_requirement_not_met"
  | "fsw_funds_details_missing"
  | "fsw_funds_insufficient"
  | "fsw_spouse_details_missing"
  | "fsw_grid_below_pass_mark"
  | "fsw_passed"
  | "fst_no_skilled_trade_work"
  | "fst_hours_below_minimum"
  | "fst_offer_or_certificate_missing"
  | "fst_job_offer_validity_missing"
  | "fst_required_data_missing"
  | "fst_passed"

export interface ExpressEntryReason {
  code: ExpressEntryReasonCode
  message: string
  program: ExpressEntryReasonProgram
  kind: ExpressEntryReasonKind
  actionability: ExpressEntryReasonActionability
}

export interface MissingFieldRef {
  key: string
  label: string
  step: number
  href: string
}

export interface ProgramEligibilityResult {
  status: ProgramEligibilityStatus
  reasons: string[]
  reasonDetails: ExpressEntryReason[]
  missingFields: MissingFieldRef[]
}

export interface ExpressEntryEligibilityResult {
  rulesVersion: string
  overallStatus: ProgramEligibilityStatus
  programs: {
    cec: ProgramEligibilityResult
    fsw: ProgramEligibilityResult & {
      fsw67Score?: number
      fsw67PassThreshold?: number
      fsw67Breakdown?: {
        language: number
        education: number
        experience: number
        age: number
        arrangedEmployment: number
        adaptability: number
      }
    }
    fst: ProgramEligibilityResult
  }
  missingFields: MissingFieldRef[]
  reasons: string[]
}

export interface ClbByAbility {
  listening: number | null
  reading: number | null
  writing: number | null
  speaking: number | null
}

export interface ClbResult {
  clb: ClbByAbility
  isValid: boolean
  validityReason?: string
}
