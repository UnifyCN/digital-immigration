import type { PNPSignals } from "./pnpSignals"

export const JOB_OFFER_YES = 20
export const JOB_OFFER_NOT_SURE = 10
export const EMPLOYER_SUPPORT_YES = 15
export const EMPLOYER_SUPPORT_NOT_SURE = 7
export const JOB_FULLTIME_PERMANENT_BOTH = 5
export const JOB_FULLTIME_PERMANENT_ONE = 3

export const CAN_WORK_12MO_YES = 20
export const CAN_WORK_12MO_NOT_SURE = 10
export const CURRENTLY_WORKING_IN_CANADA_YES = 5
export const CAN_EDUCATION_YES = 10

export const PROVINCE_ONLY = 10
export const PROVINCE_PREFER = 7
export const JOB_OFFER_HAS_PROVINCE = 5

export const LANG_VALID = 5
export const LANG_BOOKED = 3
export const REFERENCE_LETTER_YES = 5
export const REFERENCE_LETTER_NOT_SURE = 2

export const DAMPENER_UNKNOWN_GT_30 = -5
export const DAMPENER_UNKNOWN_GT_50 = -10
export const DAMPENER_NO_CAN_TIES = -10
export const DAMPENER_RECENT_REFUSAL = -5

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function provinceDirectionPoints(settleFlexibility: string | null): number {
  if (!settleFlexibility) return 0

  const normalized = settleFlexibility.trim().toLowerCase()
  if (normalized === "onlyprovince" || normalized === "only-specific") return PROVINCE_ONLY
  if (normalized === "preferprovince" || normalized === "prefer-specific") return PROVINCE_PREFER
  if (normalized === "anywhere" || normalized === "yes-anywhere") return 0
  return 0
}

export function scorePNPRelevance(
  signals: PNPSignals,
  meta: { unknownRate: number },
): { score: number; breakdown: Record<string, number>; dampenersApplied: string[] } {
  let bucketA = 0
  let bucketB = 0
  let bucketC = 0
  let bucketD = 0
  let dampenersTotal = 0
  const dampenersApplied: string[] = []

  // Bucket A — Employer / Job Strength
  if (signals.hasJobOffer === "yes") bucketA += JOB_OFFER_YES
  if (signals.hasJobOffer === "not_sure") bucketA += JOB_OFFER_NOT_SURE

  if (signals.employerSupportPNP === "yes") bucketA += EMPLOYER_SUPPORT_YES
  if (signals.employerSupportPNP === "not_sure") bucketA += EMPLOYER_SUPPORT_NOT_SURE

  if (signals.hasJobOffer === "yes") {
    const fullTimeYes = signals.jobOfferFullTime === "yes"
    const permanentYes = signals.jobOfferPermanent === "yes"
    if (fullTimeYes && permanentYes) {
      bucketA += JOB_FULLTIME_PERMANENT_BOTH
    } else if (fullTimeYes || permanentYes) {
      bucketA += JOB_FULLTIME_PERMANENT_ONE
    }
  }

  // Bucket B — Canadian Work & Education Ties
  if (signals.canadianSkilledWork12mo === "yes") bucketB += CAN_WORK_12MO_YES
  if (signals.canadianSkilledWork12mo === "not_sure") bucketB += CAN_WORK_12MO_NOT_SURE

  if (signals.currentlyWorkingInCanada === "yes") bucketB += CURRENTLY_WORKING_IN_CANADA_YES
  if (signals.anyEducationInCanada === "yes") bucketB += CAN_EDUCATION_YES

  // Bucket C — Province Direction & Strategic Fit
  bucketC += provinceDirectionPoints(signals.settleFlexibility)
  if (typeof signals.jobOfferProvince === "string" && signals.jobOfferProvince.trim().length > 0) {
    bucketC += JOB_OFFER_HAS_PROVINCE
  }

  // Bucket D — Readiness Boost
  if (signals.languageReady === "valid") bucketD += LANG_VALID
  if (signals.languageReady === "booked") bucketD += LANG_BOOKED

  if (signals.canGetReferenceLetter === "yes") bucketD += REFERENCE_LETTER_YES
  if (signals.canGetReferenceLetter === "not_sure") bucketD += REFERENCE_LETTER_NOT_SURE

  // Dampeners
  if (meta.unknownRate > 0.5) {
    dampenersTotal += DAMPENER_UNKNOWN_GT_50
    dampenersApplied.push("high_unknown_rate_gt_50")
  } else if (meta.unknownRate > 0.3) {
    dampenersTotal += DAMPENER_UNKNOWN_GT_30
    dampenersApplied.push("unknown_rate_gt_30")
  }

  const noCanadianTies =
    signals.hasJobOffer === "no" &&
    signals.canadianSkilledWork12mo === "no" &&
    signals.anyEducationInCanada === "no"
  if (noCanadianTies) {
    dampenersTotal += DAMPENER_NO_CAN_TIES
    dampenersApplied.push("no_canadian_ties")
  }

  if (signals.hasRefusals === "yes") {
    dampenersTotal += DAMPENER_RECENT_REFUSAL
    dampenersApplied.push("prior_refusal")
  }

  const totalBeforeClamp = bucketA + bucketB + bucketC + bucketD + dampenersTotal
  const finalScore = clamp(totalBeforeClamp, 0, 100)

  return {
    score: finalScore,
    breakdown: {
      bucketA_employer_job: bucketA,
      bucketB_canadian_ties: bucketB,
      bucketC_province_direction: bucketC,
      bucketD_readiness: bucketD,
      dampeners_total: dampenersTotal,
      total_before_clamp: totalBeforeClamp,
      final_score: finalScore,
    },
    dampenersApplied,
  }
}
