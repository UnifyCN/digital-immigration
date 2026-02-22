import type { AssessmentData } from "./types"

const STORAGE_KEY = "clarity-assessment-draft"
const STEP_KEY = "clarity-assessment-step"

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
  // Step 0
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  citizenshipCountry: "",
  email: "",
  consentAcknowledged: false,
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

export const demoAssessmentData: AssessmentData = {
  // Step 0: Basic Info
  firstName: "Alex",
  middleName: "",
  lastName: "Demo",
  dateOfBirth: "1990-05-15",
  citizenshipCountry: "India",
  email: "alex.demo@example.com",
  consentAcknowledged: true,
  // Step 1: Goal & Timeline
  primaryGoal: "pr",
  timeUrgency: "6-to-12",
  currentLocation: "inside-canada",
  geographicFlexibility: "yes-anywhere",
  preferredProvince: "",
  deadlineTrigger: "no-hard-deadline",
  deadlineDate: "",
  studyPermitHasLOA: "",
  workPermitHasJobOffer: "",
  sponsorshipRelation: "",
  // Step 2: Current Status
  currentStatus: "worker",
  statusExpiryDate: "2026-12-31",
  hasAppliedToExtendStatus: "no",
  refusalHistory: "no",
  mostRecentRefusalType: "",
  priorCanadaApplicationType: "",
  countryOfResidence: "Canada",
  nationality: "Indian",
  priorApplications: "no",
  // Step 3: Work History
  currentJobTitle: "Software Engineer",
  countryOfWork: "Canada",
  totalExperience: "5+",
  industryCategory: "Information Technology",
  employmentGaps: "no",
  mostRecentJobStart: "2021-03",
  mostRecentJobEnd: "",
  mostRecentJobPresent: true,
  hoursPerWeekRange: "30plus",
  paidWorkStatus: "yes",
  employmentType: "employee",
  canObtainEmployerLetter: "yes",
  employerLetterChallenge: "",
  hasOverlappingPeriods: "no",
  jobs: [
    {
      title: "Software Engineer",
      country: "Canada",
      yearsRange: "2021 – Present",
      startMonth: "2021-03",
      endMonth: "",
      present: true,
    },
    {
      title: "Junior Developer",
      country: "India",
      yearsRange: "2018 – 2021",
      startMonth: "2018-06",
      endMonth: "2021-02",
      present: false,
    },
  ],
  // Step 4: Education
  educationLevel: "masters",
  educationCountry: "India",
  graduationYear: "2018",
  ecaStatus: "yes",
  canadaEducationStatus: "no",
  programLength: "2-years",
  hasMultipleCredentials: "no",
  additionalCredentials: [],
  ecaValid: "yes",
  // Step 5: Language & CRS
  languageTestStatus: "yes",
  languageScores: { listening: "8.5", reading: "8.0", writing: "7.5", speaking: "8.0" },
  addScoresLater: false,
  plannedTestDate: "",
  languageApproxCLB: "clb-9-plus",
  languageTestValid: "yes",
  languagePlannedTiming: "",
  ageRange: "30-34",
  canadianEducation: "no",
  canadianWorkExperience: "yes",
  canadianWorkDuration: "2-plus-years",
  secondOfficialLanguageIntent: "no",
  // Step 6: Family
  maritalStatus: "married",
  dependents: 1,
  spouseAccompanying: "yes-accompanying",
  spouseLocation: "in-canada",
  closeRelativeInCanada: "no",
  closeRelativeRelationship: "",
  hasDependentsUnder18: "yes",
  hasDependents18Plus: "no",
  sponsorshipTarget: "",
  sponsorStatus: "",
  partnerEducation: true,
  partnerLanguageScores: true,
  partnerWorkExperience: false,
  // Step 7: Red Flags
  priorRefusals: "no",
  criminalCharges: "no",
  medicalIssues: "no",
  misrepresentation: "no",
  multipleCountries: "no",
  nonTraditionalEmployment: "no",
  missingDocuments: "no",
  statusExpiringSoon: "no",
  overstayHistory: "no",
  removalOrDeportationHistory: "no",
  hasActiveApplication: "no",
  employerLetterUnwilling: "no",
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
    const parsed = JSON.parse(raw) as Partial<AssessmentData> & { fullName?: string }
    const normalizedEcaStatus = normalizeLegacyUnsure(parsed.ecaStatus)
    const normalizedEcaValid = normalizeLegacyUnsure(parsed.ecaValid)
    const normalizedMultipleCredentials = normalizeLegacyUnsure(parsed.hasMultipleCredentials)
    const normalizedLanguageTestValid = normalizeLegacyUnsure(parsed.languageTestValid)
    const normalizedSecondLanguageIntent = normalizeLegacyUnsure(parsed.secondOfficialLanguageIntent)
    const normalizedCloseRelativeInCanada = normalizeLegacyUnsure(parsed.closeRelativeInCanada)
    const normalizedHasDependentsUnder18 = normalizeLegacyUnsure(parsed.hasDependentsUnder18)
    const normalizedHasDependents18Plus = normalizeLegacyUnsure(parsed.hasDependents18Plus)
    const normalizedCanadianEducation = normalizeLegacyUnsure(parsed.canadianEducation)

    const legacyFullName = typeof parsed.fullName === "string" ? parsed.fullName.trim() : ""
    const legacyNameParts = legacyFullName ? legacyFullName.split(/\s+/).filter(Boolean) : []
    const legacyFirstName = legacyNameParts[0] ?? ""
    const legacyLastName = legacyNameParts.length > 1 ? legacyNameParts[legacyNameParts.length - 1] : ""
    const legacyMiddleName =
      legacyNameParts.length > 2 ? legacyNameParts.slice(1, -1).join(" ") : ""

    return {
      ...defaultAssessmentData,
      ...parsed,
      firstName: parsed.firstName ?? legacyFirstName,
      middleName: parsed.middleName ?? legacyMiddleName,
      lastName: parsed.lastName ?? legacyLastName,
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
  return raw ? parseInt(raw, 10) : 0
}
