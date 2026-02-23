export type ProgramEligibilityStatus = "eligible" | "ineligible" | "needs_more_info"

export interface MissingFieldRef {
  key: string
  label: string
  step: number
  href: string
}

export interface ProgramEligibilityResult {
  status: ProgramEligibilityStatus
  reasons: string[]
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
