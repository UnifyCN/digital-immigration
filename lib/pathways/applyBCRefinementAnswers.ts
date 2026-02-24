import type { CombinedPNPSignals } from "./pnpProvinceScope"

function isUnknown(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "not_sure" ||
    value === "not-sure" ||
    value === "unsure" ||
    value === "unknown"
  )
}

function hasKnownValue(value: unknown): boolean {
  return !isUnknown(value)
}

function toTriState(value: unknown): "yes" | "no" | "not_sure" | null {
  if (value === "yes" || value === "no") return value
  if (value === "not_sure" || value === "not-sure" || value === "unknown") return "not_sure"
  return null
}

function parseTeerValue(value: unknown): number | null {
  if (typeof value !== "string") return null
  const match = value.match(/^teer_([0-5])$/)
  if (!match) return null
  return Number(match[1])
}

export function applyBCRefinementAnswersToSignals(
  signals: CombinedPNPSignals & Record<string, unknown>,
  refinementAnswers: Record<string, unknown>,
): CombinedPNPSignals & Record<string, unknown> {
  const next: CombinedPNPSignals & Record<string, unknown> = {
    ...signals,
    provinceFinder: {
      ...(signals.provinceFinder ?? {}),
    },
  }

  const teerAnswer = refinementAnswers.teer_or_noc
  const parsedTeer = parseTeerValue(teerAnswer)
  if (parsedTeer !== null) {
    next.teer = parsedTeer
    next.teerSkillBand = parsedTeer <= 3 ? "teer_0_3" : "teer_4_5"
  }

  const jobFullTime = toTriState(refinementAnswers.job_full_time)
  if (jobFullTime && jobFullTime !== "not_sure") {
    next.jobOfferFullTime = jobFullTime
    next.jobFullTime = jobFullTime
  } else if (jobFullTime === "not_sure" && !hasKnownValue(next.jobOfferFullTime)) {
    next.jobOfferFullTime = "not_sure"
    next.jobFullTime = "unknown"
  }

  const jobPermanent = toTriState(refinementAnswers.job_permanent)
  if (jobPermanent && jobPermanent !== "not_sure") {
    next.jobOfferPermanent = jobPermanent
    next.jobPermanent = jobPermanent
  } else if (jobPermanent === "not_sure" && !hasKnownValue(next.jobOfferPermanent)) {
    next.jobOfferPermanent = "not_sure"
    next.jobPermanent = "unknown"
  }

  if (refinementAnswers.institution_type === "public" || refinementAnswers.institution_type === "private") {
    next.institutionType = refinementAnswers.institution_type
    next.publicInstitutionInCanada = refinementAnswers.institution_type === "public" ? "yes" : "no"
  } else if (
    (refinementAnswers.institution_type === "not_sure" || refinementAnswers.institution_type === "unknown") &&
    !hasKnownValue(next.institutionType) &&
    !hasKnownValue(next.publicInstitutionInCanada)
  ) {
    next.institutionType = "unsure"
  }

  if (
    refinementAnswers.language_test_status === "valid" ||
    refinementAnswers.language_test_status === "booked" ||
    refinementAnswers.language_test_status === "not_ready"
  ) {
    next.languageReady = refinementAnswers.language_test_status
    next.languageTestStatus = refinementAnswers.language_test_status
  }

  const hasJobOffer = toTriState(refinementAnswers.job_offer_exists)
  if (hasJobOffer && hasJobOffer !== "not_sure") {
    next.hasJobOfferRefined = hasJobOffer
    next.hasJobOffer = hasJobOffer
  } else if (hasJobOffer === "not_sure" && !hasKnownValue(next.hasJobOfferRefined)) {
    next.hasJobOfferRefined = "not_sure"
    next.hasJobOffer = "not_sure"
  }

  if (refinementAnswers.job_province === "BC") {
    next.jobProvinceCode = "BC"
    next.jobProvince = "British Columbia"
  }

  // Keep a breadcrumb in the nested refinement bucket for future merges/audits.
  next.provinceFinder = {
    ...next.provinceFinder,
    ...Object.fromEntries(
      Object.entries(refinementAnswers).filter(([, value]) => typeof value === "string" || typeof value === "number"),
    ),
  }

  return next
}
