export type TriState = "yes" | "no" | "not_sure"

export interface PNPSignals {
  // A) Scope / intent
  primaryGoal: string | null
  pursuingPR: boolean
  openToPNP: TriState | null

  // B) Province direction (tie only)
  settleFlexibility: string | null
  hasProvincePreference: boolean
  preferredProvince: string | null
  currentJobProvince: string | null
  jobOfferProvince: string | null

  // C) Location + status
  currentLocation: string | null
  currentStatus: string | null
  statusExpiryDate: string | null
  statusExpiringSoon: boolean
  appliedToExtendWaiting: TriState | null
  holdsValidTempStatus: TriState | null
  tempStatusType: string | null
  tempStatusExpiry: string | null

  // D) Work + job offer
  currentlyWorkingInCanada: TriState | null
  sameEmployerAsPermanentOffer: TriState | null
  canadianSkilledWork12mo: TriState | null
  canadianWorkAuthorized: TriState | null
  avgHoursPerWeek: string | null
  workPaid: TriState | null
  workType: string | null
  hasJobOffer: TriState | null
  jobOfferFullTime: TriState | null
  jobOfferPermanent: TriState | null
  jobOfferCompAmount: string | null
  jobOfferCompType: string | null
  workedForEmployerDuration: string | null
  employerSupportPNP: TriState | null

  // E) Occupation info
  occupationCategory: string | null
  occupationOtherText: string | null
  jobDutiesProvided: boolean

  // F) Education
  highestEducationLevel: string | null
  educationCountry: string | null
  graduationYear: string | null
  maritalStatus: string | null
  hasDependents: boolean | null
  ecaCompleted: TriState | null
  educationCompletedInCanada: TriState | null
  anyEducationInCanada: TriState | null
  educationProvinceInCanada: string | null
  publicInstitutionInCanada: TriState | null
  programLength: string | null

  // G) Risk / complexity
  hasRefusals: TriState | null
  refusalMostRecentType: string | null
  refusalMostRecentDate: string | null
  priorCanadianApplications: TriState | null
  canGetReferenceLetter: TriState | null
  referenceLetterChallenge: string | null
  hasOverlappingWorkOrWorkStudy: TriState | null
  hasEmploymentGaps: TriState | null

  // H) Deadline
  deadlineDriver: string | null
  deadlineDate: string | null
  languageReady: "valid" | "booked" | "not_ready"
}

export interface PNPBuildMeta {
  unknownCount: number
  keyFieldsTotal: number
  unknownRate: number
}

export const EXPIRING_SOON_DAYS = 90

export const KEY_FIELDS: ReadonlyArray<keyof PNPSignals> = [
  "primaryGoal",
  "openToPNP",
  "currentLocation",
  "currentStatus",
  "statusExpiryDate",
  "currentlyWorkingInCanada",
  "canadianSkilledWork12mo",
  "hasJobOffer",
  "employerSupportPNP",
  "anyEducationInCanada",
  "publicInstitutionInCanada",
  "programLength",
  "hasRefusals",
  "canGetReferenceLetter",
]

const PR_GOAL_VALUES = new Set(["pr", "permanent residence", "permanent residence (pr)"])
const PR_EXPLORING_VALUES = new Set(["not-sure", "not_sure", "not sure yet", "not sure / exploring pr"])
const UNKNOWN_VALUES = new Set(["not-sure", "not_sure", "not sure", "unsure"])

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") return {}
  return input as Record<string, unknown>
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeLower(value: unknown): string | null {
  const text = asString(value)
  return text ? text.toLowerCase() : null
}

function normalizeTriState(value: unknown): TriState | null {
  const normalized = normalizeLower(value)
  if (!normalized) return null
  if (normalized === "yes") return "yes"
  if (normalized === "no") return "no"
  if (UNKNOWN_VALUES.has(normalized)) return "not_sure"
  return null
}

function normalizeHasRefusals(value: unknown): TriState | null {
  const normalized = normalizeLower(value)
  if (!normalized) return null
  if (normalized === "no") return "no"
  if (UNKNOWN_VALUES.has(normalized)) return "not_sure"
  return "yes"
}

function normalizeAnyEducationInCanada(value: unknown): TriState | null {
  const normalized = normalizeLower(value)
  if (!normalized) return null
  if (normalized === "yes" || normalized === "mix-some-in-canada") return "yes"
  if (normalized === "no") return "no"
  if (UNKNOWN_VALUES.has(normalized)) return "not_sure"
  return null
}

function isPursuingPR(primaryGoal: string | null): boolean {
  if (!primaryGoal) return false
  const normalized = primaryGoal.toLowerCase()
  return PR_GOAL_VALUES.has(normalized) || PR_EXPLORING_VALUES.has(normalized)
}

function isUnknown(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value !== "string") return false
  const normalized = value.trim().toLowerCase()
  if (!normalized) return true
  return UNKNOWN_VALUES.has(normalized)
}

function isExpiringSoon(dateInput: string | null, thresholdDays = EXPIRING_SOON_DAYS): boolean {
  if (!dateInput) return false

  const parsed = new Date(dateInput)
  if (Number.isNaN(parsed.getTime())) return false

  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  const deltaDays = Math.floor((target.getTime() - startToday.getTime()) / 86400000)
  return deltaDays >= 0 && deltaDays <= thresholdDays
}

export function buildPNPSignals(answers: unknown): { signals: PNPSignals; meta: PNPBuildMeta } {
  const data = asRecord(answers)
  const primaryGoal = asString(data.primaryGoal)
  const hasJobOffer = normalizeTriState(data.hasCanadianJobOffer)
  const occupationCategory = asString(data.occupationCategory)
  const occupationCategoryNormalized = occupationCategory?.toLowerCase() ?? null

  const signals: PNPSignals = {
    primaryGoal,
    pursuingPR: isPursuingPR(primaryGoal),
    openToPNP: normalizeTriState(data.openToPNP),

    settleFlexibility: asString(data.geographicFlexibility),
    hasProvincePreference: Boolean(asString(data.preferredProvince)),
    preferredProvince: asString(data.preferredProvince),
    currentJobProvince: asString(data.currentJobProvinceTerritory),
    jobOfferProvince: asString(data.jobOfferProvinceTerritory),

    currentLocation: asString(data.currentLocation),
    currentStatus: asString(data.currentStatus),
    statusExpiryDate: asString(data.statusExpiryDate),
    statusExpiringSoon: isExpiringSoon(asString(data.statusExpiryDate)),
    appliedToExtendWaiting: normalizeTriState(data.hasAppliedToExtendStatus),
    holdsValidTempStatus: normalizeTriState(data.hasValidTemporaryStatus),
    tempStatusType: asString(data.temporaryStatusType),
    tempStatusExpiry: asString(data.temporaryStatusExpiryDate),

    currentlyWorkingInCanada: normalizeTriState(data.currentlyWorkingInCanada),
    sameEmployerAsPermanentOffer: normalizeTriState(data.sameEmployerForPermanentOffer),
    canadianSkilledWork12mo: normalizeTriState(data.has12MonthsCanadaSkilled),
    canadianWorkAuthorized: normalizeTriState(data.canadianWorkAuthorizedAll),
    avgHoursPerWeek: asString(data.hoursPerWeekRange),
    workPaid: normalizeTriState(data.paidWorkStatus),
    workType: asString(data.employmentType),
    hasJobOffer,
    jobOfferFullTime: hasJobOffer === "yes" ? normalizeTriState(data.jobOfferFullTime) : null,
    jobOfferPermanent: hasJobOffer === "yes" ? normalizeTriState(data.jobOfferPermanent) : null,
    jobOfferCompAmount: hasJobOffer === "yes" ? asString(data.jobOfferCompensation) : null,
    jobOfferCompType: hasJobOffer === "yes" ? asString(data.jobOfferCompensationType) : null,
    workedForEmployerDuration: hasJobOffer === "yes" ? asString(data.jobOfferTenure) : null,
    employerSupportPNP: hasJobOffer === "yes" ? normalizeTriState(data.employerWillSupportPNP) : null,

    occupationCategory,
    occupationOtherText:
      occupationCategoryNormalized === "other" ? asString(data.occupationCategoryOtherRole) : null,
    jobDutiesProvided: Boolean(asString(data.jobDuties)),

    highestEducationLevel: asString(data.educationLevel),
    educationCountry: asString(data.educationCountry),
    graduationYear: asString(data.graduationYear),
    maritalStatus: asString(data.maritalStatus),
    hasDependents: typeof data.dependents === "number" ? data.dependents > 0 : null,
    ecaCompleted: normalizeTriState(data.ecaStatus),
    educationCompletedInCanada: normalizeTriState(data.educationCompletedInCanada),
    anyEducationInCanada: normalizeAnyEducationInCanada(data.canadaEducationStatus),
    educationProvinceInCanada: asString(data.canadianEducationProvinceTerritory),
    publicInstitutionInCanada: normalizeTriState(data.canadianEducationPublicInstitution),
    programLength: asString(data.programLength),

    hasRefusals: normalizeHasRefusals(data.refusalHistory),
    refusalMostRecentType: asString(data.mostRecentRefusalType),
    refusalMostRecentDate: asString(data.mostRecentRefusalDate),
    priorCanadianApplications: normalizeTriState(data.priorApplications),
    canGetReferenceLetter: normalizeTriState(data.canObtainEmployerLetter),
    referenceLetterChallenge: asString(data.employerLetterChallenge),
    hasOverlappingWorkOrWorkStudy: normalizeTriState(data.hasOverlappingPeriods),
    hasEmploymentGaps: normalizeTriState(data.employmentGaps),

    deadlineDriver: asString(data.deadlineTrigger),
    deadlineDate: asString(data.deadlineDate),
    languageReady:
      data.languageTestStatus === "valid"
        ? "valid"
        : data.languageTestStatus === "booked"
          ? "booked"
          : "not_ready",
  }

  const unknownCount = KEY_FIELDS.reduce((count, field) => {
    return count + (isUnknown(signals[field]) ? 1 : 0)
  }, 0)

  const keyFieldsTotal = KEY_FIELDS.length
  const unknownRate = keyFieldsTotal === 0 ? 0 : unknownCount / keyFieldsTotal

  return {
    signals,
    meta: {
      unknownCount,
      keyFieldsTotal,
      unknownRate,
    },
  }
}
