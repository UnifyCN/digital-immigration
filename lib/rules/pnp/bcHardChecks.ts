import type { CombinedPNPSignals } from "../../pathways/pnpProvinceScope.ts"
import { detectProvinceCode, normalizeProvince } from "../../pathways/pnpProvinceNormalization.ts"
import type { StreamFamilyId } from "./bcFamilies"

export type CheckResult = "PASS" | "FAIL" | "UNKNOWN"
export type BaselineBadge = "pass" | "unclear" | "fail"

export type HardCheck = {
  id: string
  label: string
  signalKeys: string[]
  evaluate: (ctx: { signals: CombinedPNPSignals }) => CheckResult
  blockerText?: string
  missingPrompt?: string
  priority: number
}

export type BaselineEvaluation = {
  familyId: StreamFamilyId
  badge: BaselineBadge
  checkResults: Record<string, CheckResult>
  hardBlockers: string[]
  missingRequired: Array<{ id: string; prompt: string; signalKeys?: string[] }>
}

function isUnknown(value: unknown): boolean {
  return value === null || value === undefined || value === "not_sure" || value === "not-sure" || value === "unsure"
}

function languageCheckResult(languageReady: CombinedPNPSignals["languageReady"]): CheckResult {
  if (languageReady === "valid") return "PASS"
  if (languageReady === "not_ready") return "FAIL"
  return "UNKNOWN"
}

export const BC_EMPLOYER_SKILLED_HARD_CHECKS: HardCheck[] = [
  {
    id: "A1_job_offer_exists",
    label: "Job offer exists",
    signalKeys: ["hasJobOffer"],
    priority: 100,
    evaluate: ({ signals }) => {
      if (signals.hasJobOfferRefined === "yes") return "PASS"
      if (signals.hasJobOfferRefined === "no") return "FAIL"
      return "UNKNOWN"
    },
    blockerText: "No job offer was reported, which can limit employer-driven options.",
    missingPrompt: "Do you currently have a job offer from a BC employer?",
  },
  {
    id: "A2_job_in_bc",
    label: "Job is in BC",
    signalKeys: ["jobProvinceCode", "jobProvinceLabel"],
    priority: 95,
    evaluate: ({ signals }) => {
      if (signals.jobProvinceCode === "BC" || normalizeProvince(signals.jobProvince) === "BC") return "PASS"
      const known = detectProvinceCode(signals.jobProvince)
      if (known && known !== "BC") return "FAIL"
      return "UNKNOWN"
    },
    blockerText: "Your job location does not appear to be in British Columbia.",
    missingPrompt: "Which province is your job located in?",
  },
  {
    id: "A3_full_time",
    label: "Job is full-time",
    signalKeys: ["jobFullTime"],
    priority: 92,
    evaluate: ({ signals }) => {
      if (signals.jobOfferFullTime === "yes") return "PASS"
      if (signals.jobOfferFullTime === "no") return "FAIL"
      return "UNKNOWN"
    },
    blockerText: "The role does not appear to be full-time, which can limit employer-driven options.",
    missingPrompt: "Is your job offer full-time (30+ hours/week)?",
  },
  {
    id: "A4_permanent_or_ongoing",
    label: "Job is permanent/ongoing",
    signalKeys: ["jobPermanent"],
    priority: 90,
    evaluate: ({ signals }) => {
      if (signals.jobOfferPermanent === "yes") return "PASS"
      if (signals.jobOfferPermanent === "no") return "FAIL"
      return "UNKNOWN"
    },
    blockerText: "The job offer appears temporary, which can reduce fit for employer-driven options.",
    missingPrompt: "Is your job offer permanent/ongoing (no end date)?",
  },
  {
    id: "A5_skilled_teer",
    label: "Occupation TEER is skilled",
    signalKeys: ["teer", "nocCode"],
    priority: 93,
    evaluate: ({ signals }) => {
      if (signals.teerSkillBand === "teer_0_3") return "PASS"
      if (signals.teerSkillBand === "teer_4_5") return "FAIL"
      return "UNKNOWN"
    },
    blockerText:
      "Your occupation appears to be in a lower TEER category, which can limit skilled worker options.",
    missingPrompt: "Do you know your NOC code or TEER level?",
  },
  {
    id: "A6_language_ready",
    label: "Language readiness confirmed",
    signalKeys: ["languageTestStatus"],
    priority: 75,
    evaluate: ({ signals }) => languageCheckResult(signals.languageReady),
    blockerText: "Valid language results are not confirmed yet, which can limit readiness.",
    missingPrompt: "Do you have a valid language test result (or a booked test date)?",
  },
]

export const BC_INTL_GRAD_HARD_CHECKS: HardCheck[] = [
  {
    id: "B1_canadian_education",
    label: "Canadian education present",
    signalKeys: ["educationInCanada", "anyEducationInCanada"],
    priority: 100,
    evaluate: ({ signals }) => {
      if (signals.anyEducationInCanada === "yes") return "PASS"
      if (signals.anyEducationInCanada === "no") return "FAIL"
      return "UNKNOWN"
    },
    blockerText: "Canadian education was not reported, which can limit graduate options.",
    missingPrompt: "Did you complete a program in Canada?",
  },
  {
    id: "B2_public_institution",
    label: "Public institution",
    signalKeys: ["institutionType"],
    priority: 96,
    evaluate: ({ signals }) => {
      if (signals.institutionType === "public" || signals.publicInstitutionInCanada === "yes") return "PASS"
      if (signals.institutionType === "private" || signals.publicInstitutionInCanada === "no") return "FAIL"
      return "UNKNOWN"
    },
    blockerText: "Your institution appears private, which can reduce fit for some graduate options.",
    missingPrompt: "Was your institution public or private?",
  },
  {
    id: "B3_program_8_months",
    label: "Program length at least 8 months",
    signalKeys: ["programLength8mo"],
    priority: 94,
    evaluate: ({ signals }) => {
      if (signals.programAtLeast8Months === "yes") return "PASS"
      if (signals.programAtLeast8Months === "no") return "FAIL"
      return "UNKNOWN"
    },
    blockerText: "Program length appears under 8 months, which can limit graduate options.",
    missingPrompt: "Was your program at least 8 months long?",
  },
  {
    id: "B4_grad_within_3_years",
    label: "Graduated within 3 years",
    signalKeys: ["graduatedWithin3Years", "graduationYear", "graduationDate"],
    priority: 90,
    evaluate: ({ signals }) => {
      if (signals.completedWithin3Years === "yes") return "PASS"
      if (signals.completedWithin3Years === "no") return "FAIL"
      return "UNKNOWN"
    },
    blockerText: "Graduation recency is outside 3 years, which can reduce fit for graduate options.",
    missingPrompt: "Did you graduate within the last 3 years?",
  },
  {
    id: "B5_bc_anchor",
    label: "BC study or BC job anchor",
    signalKeys: ["educationProvinceCode", "jobProvinceCode"],
    priority: 92,
    evaluate: ({ signals }) => {
      if (signals.educationProvinceCode === "BC" || signals.jobProvinceCode === "BC") return "PASS"
      const educationKnown = !isUnknown(signals.educationProvinceCode)
      const jobKnown = !isUnknown(signals.jobProvinceCode)
      if (educationKnown && jobKnown && signals.educationProvinceCode !== "BC" && signals.jobProvinceCode !== "BC") {
        return "FAIL"
      }
      return "UNKNOWN"
    },
    blockerText:
      "No clear British Columbia study/work tie was found, which can limit BC-specific graduate options.",
    missingPrompt: "Which province did you study in (or where is your job located)?",
  },
  {
    id: "B6_language_ready",
    label: "Language readiness confirmed",
    signalKeys: ["languageTestStatus"],
    priority: 75,
    evaluate: ({ signals }) => languageCheckResult(signals.languageReady),
    blockerText: "Valid language results are not confirmed yet, which can limit readiness.",
    missingPrompt: "Do you have a valid language test result (or a booked test date)?",
  },
]
