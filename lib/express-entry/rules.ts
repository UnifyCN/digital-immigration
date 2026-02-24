export const EXPRESS_ENTRY_RULES_VERSION = "EE-MILESTONE-ELIGIBILITY-2026-02-23"

export const CEC_MIN_HOURS = 1560
export const FSW_MIN_HOURS = 1560
export const FST_MIN_HOURS = 3120
export const COUNTABLE_HOURS_PER_YEAR = 1560

export const LANGUAGE_VALIDITY_YEARS = 2
export const ECA_VALIDITY_YEARS = 5

export const HOURS_PER_WEEK_CAP = 30

export const WORK_WINDOW_YEARS = {
  cec: 3,
  fst: 5,
  fsw: 10,
} as const

export const FSW_PASS_MARK = 67

export const APPROVED_ENGLISH_TESTS = [
  "ielts-general-training",
  "celpip-general",
  "pte-core",
] as const

export const APPROVED_FRENCH_TESTS = [
  "tef-canada",
  "tcf-canada",
] as const

export const CANADA_ALIASES = ["canada", "ca", "can"] as const
