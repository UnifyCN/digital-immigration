import type { AssessmentData } from "./types"

const STORAGE_KEY = "clarity-assessment-draft"
const STEP_KEY = "clarity-assessment-step"
const COMPLETED_STEPS_KEY = "clarity-assessment-completed-steps"

type NormalizedYesNoUnsure = "yes" | "no" | "not-sure" | "" | undefined

const UNSURE_NORMALIZATION_FIELDS = [
  "ecaStatus",
  "ecaValid",
  "hasMultipleCredentials",
  "languageTestValid",
  "secondOfficialLanguageIntent",
  "closeRelativeInCanada",
  "hasDependentsUnder18",
  "hasDependents18Plus",
  "canadianEducation",
] as const

const RED_FLAG_UNSURE_FIELDS = [
  "statusExpiringSoon",
  "overstayHistory",
  "removalOrDeportationHistory",
  "hasActiveApplication",
  "multipleCountries",
  "nonTraditionalEmployment",
  "missingDocuments",
  "employerLetterUnwilling",
] as const

if (process.env.NODE_ENV !== "production") {
  const overlap = UNSURE_NORMALIZATION_FIELDS.filter((field) =>
    RED_FLAG_UNSURE_FIELDS.includes(field as (typeof RED_FLAG_UNSURE_FIELDS)[number]),
  )
  if (overlap.length > 0) {
    console.error(
      `[storage] Invalid unsure normalization mapping. Red-flag fields must keep "unsure": ${overlap.join(", ")}`,
    )
  }
}

/**
 * Legacy migration note:
 * This normalizes historical "unsure" values to "not-sure" for fields whose schemas use "not-sure".
 * Do not add red-flag fields here because Step 7 intentionally uses "unsure".
 */
function normalizeLegacyUnsure(value: unknown): NormalizedYesNoUnsure {
  if (value === "unsure") return "not-sure"
  if (value === "yes" || value === "no" || value === "not-sure" || value === "") return value
  return undefined
}

export const defaultAssessmentData: AssessmentData = {
  // Step 1
  primaryGoal: "",
  timeUrgency: "",
  currentLocation: "",
  geographicFlexibility: "",
  preferredProvince: "",
  deadlineTrigger: "",
  deadlineDate: "",
  studyPermitHasLOA: "",
  workPermitHasJobOffer: "",
  sponsorshipRelation: "",
  // Step 2
  currentStatus: "",
  statusExpiryDate: "",
  hasAppliedToExtendStatus: "",
  refusalHistory: "",
  mostRecentRefusalType: "",
  priorCanadaApplicationType: "",
  countryOfResidence: "",
  nationality: "",
  priorApplications: "",
  // Step 3
  currentJobTitle: "",
  countryOfWork: "",
  totalExperience: "",
  industryCategory: "",
  employmentGaps: "",
  mostRecentJobStart: "",
  mostRecentJobEnd: "",
  mostRecentJobPresent: false,
  hoursPerWeekRange: "",
  paidWorkStatus: "",
  employmentType: "",
  canObtainEmployerLetter: "",
  employerLetterChallenge: "",
  hasOverlappingPeriods: "",
  jobs: [],
  // Step 4
  educationLevel: "",
  educationCountry: "",
  graduationYear: "",
  ecaStatus: "",
  canadaEducationStatus: "",
  programLength: "",
  hasMultipleCredentials: "",
  additionalCredentials: [],
  ecaValid: "",
  // Step 5
  languageTestStatus: "",
  languageScores: { listening: "", reading: "", writing: "", speaking: "" },
  addScoresLater: false,
  plannedTestDate: "",
  languageApproxCLB: "",
  languageTestValid: "",
  languagePlannedTiming: "",
  ageRange: "",
  canadianEducation: "",
  canadianWorkExperience: "",
  canadianWorkDuration: "",
  secondOfficialLanguageIntent: "",
  // Step 6
  maritalStatus: "",
  dependents: 0,
  spouseAccompanying: "",
  spouseLocation: "",
  closeRelativeInCanada: "",
  closeRelativeRelationship: "",
  hasDependentsUnder18: "",
  hasDependents18Plus: "",
  sponsorshipTarget: "",
  sponsorStatus: "",
  partnerEducation: false,
  partnerLanguageScores: false,
  partnerWorkExperience: false,
  // Step 7
  priorRefusals: "",
  criminalCharges: "",
  medicalIssues: "",
  misrepresentation: "",
  multipleCountries: "",
  nonTraditionalEmployment: "",
  missingDocuments: "",
  statusExpiringSoon: "",
  overstayHistory: "",
  removalOrDeportationHistory: "",
  hasActiveApplication: "",
  employerLetterUnwilling: "",
}

export function saveAssessment(data: AssessmentData): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadAssessment(): AssessmentData | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AssessmentData>
    const normalizedEcaStatus = normalizeLegacyUnsure(parsed.ecaStatus)
    const normalizedEcaValid = normalizeLegacyUnsure(parsed.ecaValid)
    const normalizedMultipleCredentials = normalizeLegacyUnsure(parsed.hasMultipleCredentials)
    const normalizedLanguageTestValid = normalizeLegacyUnsure(parsed.languageTestValid)
    const normalizedSecondLanguageIntent = normalizeLegacyUnsure(parsed.secondOfficialLanguageIntent)
    const normalizedCloseRelativeInCanada = normalizeLegacyUnsure(parsed.closeRelativeInCanada)
    const normalizedHasDependentsUnder18 = normalizeLegacyUnsure(parsed.hasDependentsUnder18)
    const normalizedHasDependents18Plus = normalizeLegacyUnsure(parsed.hasDependents18Plus)
    const normalizedCanadianEducation = normalizeLegacyUnsure(parsed.canadianEducation)

    return {
      ...defaultAssessmentData,
      ...parsed,
      ecaStatus: normalizedEcaStatus ?? "",
      canadaEducationStatus: parsed.canadaEducationStatus ?? "",
      programLength: parsed.programLength ?? "",
      hasMultipleCredentials: normalizedMultipleCredentials ?? "",
      additionalCredentials: Array.isArray(parsed.additionalCredentials)
        ? parsed.additionalCredentials
        : [],
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      ecaValid: normalizedEcaValid ?? "",
      languageTestValid: normalizedLanguageTestValid ?? "",
      canadianEducation: normalizedCanadianEducation ?? "",
      secondOfficialLanguageIntent: normalizedSecondLanguageIntent ?? "",
      closeRelativeInCanada: normalizedCloseRelativeInCanada ?? "",
      hasDependentsUnder18: normalizedHasDependentsUnder18 ?? "",
      hasDependents18Plus: normalizedHasDependents18Plus ?? "",
      languageScores: {
        ...defaultAssessmentData.languageScores,
        ...parsed.languageScores,
      },
    }
  } catch {
    return null
  }
}

export function clearAssessment(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STEP_KEY)
  localStorage.removeItem(COMPLETED_STEPS_KEY)
}

export function hasDraft(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function saveStep(step: number): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STEP_KEY, String(step))
}

export function loadStep(): number {
  if (typeof window === "undefined") return 0
  const raw = localStorage.getItem(STEP_KEY)
  const parsed = raw ? parseInt(raw, 10) : 0
  return Number.isNaN(parsed) ? 0 : parsed
}

export function saveCompletedSteps(completedSteps: boolean[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(COMPLETED_STEPS_KEY, JSON.stringify(completedSteps))
}

export function loadCompletedSteps(totalSteps: number): boolean[] {
  if (typeof window === "undefined") return Array(totalSteps).fill(false)
  const raw = localStorage.getItem(COMPLETED_STEPS_KEY)
  if (!raw) return Array(totalSteps).fill(false)

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return Array(totalSteps).fill(false)

    return Array.from({ length: totalSteps }, (_, index) => parsed[index] === true)
  } catch {
    return Array(totalSteps).fill(false)
  }
}
