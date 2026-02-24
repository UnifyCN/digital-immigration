import type { AssessmentData } from "./types"
import { deriveCanadianSkilledYearsBand } from "./work-derived.ts"

const STORAGE_KEY = "clarity-assessment-draft"
const STEP_KEY = "clarity-assessment-step"
const COMPLETED_STEPS_KEY = "clarity-assessment-completed-steps"

type NormalizedYesNoUnsure = "yes" | "no" | "not-sure" | "" | undefined

const UNSURE_NORMALIZATION_FIELDS = [
  "ecaStatus",
  "ecaValid",
  "hasMultipleCredentials",
  "secondOfficialLanguageIntent",
  "closeRelativeInCanada",
  "hasDependentsUnder18",
  "hasDependents18Plus",
  "canadianEducation",
] as const

const RED_FLAG_UNSURE_FIELDS = [
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

function normalizeLegacyRemovedUnsure(
  value: unknown,
  allowedValues: readonly string[],
): string {
  if (value === "unsure") return ""
  if (typeof value === "string" && allowedValues.includes(value)) return value
  return ""
}

export const defaultAssessmentData: AssessmentData = {
  // Step 0
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  citizenshipCountry: "",
  currentProvinceTerritory: "",
  intendedProvinceTerritory: "",
  hasValidTemporaryStatus: "",
  temporaryStatusType: "",
  temporaryStatusExpiryDate: "",
  exactAge: null,
  email: "",
  consentAcknowledged: false,
  // Step 1
  primaryGoal: "",
  timeUrgency: "",
  currentLocation: "",
  geographicFlexibility: "",
  preferredProvince: "",
  pnpTargetProvince: "",
  deadlineTrigger: "",
  deadlineDate: "",
  studyPermitHasLOA: "",
  workPermitHasJobOffer: "",
  sponsorshipRelation: "",
  openToPNP: "",
  // Step 2
  currentStatus: "",
  statusExpiryDate: "",
  hasAppliedToExtendStatus: "",
  refusalHistory: "",
  mostRecentRefusalType: "",
  priorCanadaApplicationType: "",
  currentlyWorkingInCanada: "",
  currentJobProvinceTerritory: "",
  sameEmployerForPermanentOffer: "",
  countryOfResidence: "",
  nationality: "",
  priorApplications: "",
  // Step 3
  currentJobTitle: "",
  countryOfWork: "",
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
  hasCanadianJobOffer: "",
  jobOfferProvinceTerritory: "",
  jobOfferTitle: "",
  jobOfferEmployerName: "",
  jobOfferCity: "",
  jobOfferFullTime: "",
  jobOfferPermanent: "",
  jobOfferCompensation: "",
  jobOfferCompensationType: "",
  jobOfferTenure: "",
  employerWillSupportPNP: "",
  jobOfferNonSeasonal: "",
  jobOfferSupportType: "",
  jobOfferSupportBasis: "",
  jobOfferIntendedDurationMonths: null,
  jobOfferMeetsValidOfferDefinition: "",
  occupationCategory: "",
  occupationCategoryOtherRole: "",
  jobDuties: "",
  foreignSkilledYears: "",
  hasContinuous12MonthsSkilled: "",
  has12MonthsCanadaSkilled: "",
  canadianWorkAuthorizedAll: "",
  derivedCanadianSkilledYearsBand: "",
  jobs: [],
  workRoles: [],
  hasCanadianTradeCertificate: "",
  tradeCertificateIssuingAuthority: "",
  tradeCertificateTrade: "",
  tradeCertificateIssueDate: "",
  fstJobOfferEmployers: [],
  fswPrimaryOccupationRoleId: "",
  expressEntryIntentOutsideQuebec: "",
  currentlyAuthorizedToWorkInCanada: "",
  // Step 4
  educationLevel: "",
  fieldOfStudy: "",
  educationCountry: "",
  graduationYear: "",
  ecaStatus: "",
  canadaEducationStatus: "",
  educationCompletedInCanada: "",
  canadianEducationProvinceTerritory: "",
  canadianEducationPublicInstitution: "",
  programLength: "",
  hasMultipleCredentials: "",
  additionalCredentials: [],
  ecaValid: "",
  educationCredentials: [],
  // Step 5
  languageTestStatus: "",
  languageTestPlannedDate: "",
  languageTestPlan: "",
  englishTestStatus: "",
  englishTestType: "",
  englishPlannedTestDate: "",
  frenchTestStatus: "",
  frenchTestType: "",
  frenchPlannedTestDate: "",
  languageScores: { listening: "", reading: "", writing: "", speaking: "" },
  addScoresLater: false,
  ageRange: "",
  canadianEducation: "",
  canadianWorkExperience: "",
  canadianWorkDuration: "",
  secondOfficialLanguageIntent: "",
  languageTests: [],
  // Step 6
  maritalStatus: "",
  dependents: 0,
  spouseAccompanying: "",
  spouseLocation: "",
  closeRelativeInCanada: "",
  hasCloseRelativeInCanada: "",
  relativeProvinceTerritory: "",
  closeRelativeRelationship: "",
  hasDependentsUnder18: "",
  hasDependents18Plus: "",
  sponsorshipTarget: "",
  sponsorStatus: "",
  partnerEducation: false,
  partnerLanguageScores: false,
  partnerWorkExperience: false,
  spouseEducationLevel: "",
  spouseForeignEducationHasEca: "",
  spouseEcaEquivalency: "",
  spouseEcaIssueDate: "",
  spouseLanguageTestType: "",
  spouseLanguageTestDate: "",
  spouseLanguageTestStream: "",
  spouseLanguageScores: { listening: "", reading: "", writing: "", speaking: "" },
  spouseCanadianWorkMonths: null,
  spouseCanadianWorkStartDate: "",
  spouseCanadianWorkEndDate: "",
  hasEligibleSiblingInCanada: "",
  siblingRelationshipType: "",
  siblingProvinceTerritory: "",
  siblingStatus: "",
  siblingAge18OrOlder: "",
  siblingLivesInCanada: "",
  fundsFamilySize: null,
  settlementFundsCad: null,
  fundsExemptByValidJobOffer: "",
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
  workedWithoutAuthorizationInCanada: "",
  refusedProvincialNomination: "",
  isSkilledTrade: "",
}

export const demoAssessmentData: AssessmentData = {
  // Step 0: Basic Info
  firstName: "Alex",
  middleName: "",
  lastName: "Demo",
  dateOfBirth: "1990-05-15",
  citizenshipCountry: "India",
  currentProvinceTerritory: "Ontario",
  intendedProvinceTerritory: "Ontario",
  hasValidTemporaryStatus: "yes",
  temporaryStatusType: "work-permit-open",
  temporaryStatusExpiryDate: "2026-12-31",
  exactAge: 35,
  email: "alex.demo@example.com",
  consentAcknowledged: true,
  // Step 1: Goal & Timeline
  primaryGoal: "pr",
  timeUrgency: "6-to-12",
  currentLocation: "inside-canada",
  geographicFlexibility: "yes-anywhere",
  preferredProvince: "",
  pnpTargetProvince: "",
  deadlineTrigger: "no-hard-deadline",
  deadlineDate: "",
  studyPermitHasLOA: "",
  workPermitHasJobOffer: "",
  sponsorshipRelation: "",
  openToPNP: "yes",
  // Step 2: Current Status
  currentStatus: "worker",
  statusExpiryDate: "2026-12-31",
  hasAppliedToExtendStatus: "no",
  refusalHistory: "no",
  mostRecentRefusalType: "",
  priorCanadaApplicationType: "",
  currentlyWorkingInCanada: "yes",
  currentJobProvinceTerritory: "Ontario",
  sameEmployerForPermanentOffer: "not-sure",
  countryOfResidence: "Canada",
  nationality: "Indian",
  priorApplications: "no",
  // Step 3: Work History
  currentJobTitle: "Software Engineer",
  countryOfWork: "Canada",
  industryCategory: "Information Technology",
  employmentGaps: "yes",
  mostRecentJobStart: "2021-03",
  mostRecentJobEnd: "",
  mostRecentJobPresent: true,
  hoursPerWeekRange: "30plus",
  paidWorkStatus: "yes",
  employmentType: "employee",
  canObtainEmployerLetter: "yes",
  employerLetterChallenge: "",
  hasOverlappingPeriods: "no",
  hasCanadianJobOffer: "yes",
  jobOfferProvinceTerritory: "Ontario",
  jobOfferTitle: "Software Engineer",
  jobOfferEmployerName: "Maple Tech Ltd.",
  jobOfferCity: "Toronto",
  jobOfferFullTime: "yes",
  jobOfferPermanent: "yes",
  jobOfferCompensation: "98000",
  jobOfferCompensationType: "annual",
  jobOfferTenure: "1-2-years",
  employerWillSupportPNP: "unsure",
  jobOfferNonSeasonal: "yes",
  jobOfferSupportType: "lmia-exempt",
  jobOfferSupportBasis: "Existing employer-specific work authorization",
  jobOfferIntendedDurationMonths: 24,
  jobOfferMeetsValidOfferDefinition: "yes",
  occupationCategory: "it-software-data",
  occupationCategoryOtherRole: "",
  jobDuties:
    "Design and maintain backend services, implement APIs, review code, and collaborate on production incident response.",
  foreignSkilledYears: "5+",
  hasContinuous12MonthsSkilled: "yes",
  has12MonthsCanadaSkilled: "yes",
  canadianWorkAuthorizedAll: "yes",
  derivedCanadianSkilledYearsBand: "5+",
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
  workRoles: [
    {
      id: "demo-role-1",
      noc2021Code: "21231",
      teer: "1",
      title: "Software Engineer",
      employerName: "Maple Tech Ltd.",
      country: "Canada",
      province: "Ontario",
      city: "Toronto",
      startDate: "2021-03-01",
      endDate: "",
      present: true,
      hoursPerWeek: 40,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "yes",
      authorizationType: "work-permit-open",
      authorizationValidFrom: "2021-02-01",
      authorizationValidTo: "2026-12-31",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      hasOverlapWithOtherRoles: "no",
    },
    {
      id: "demo-role-2",
      noc2021Code: "21232",
      teer: "1",
      title: "Junior Developer",
      employerName: "Bangalore Tech",
      country: "India",
      province: "",
      city: "Bengaluru",
      startDate: "2018-06-01",
      endDate: "2021-02-15",
      present: false,
      hoursPerWeek: 40,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "",
      authorizationType: "",
      authorizationValidFrom: "",
      authorizationValidTo: "",
      wasFullTimeStudent: "",
      physicallyInCanada: "",
      hasOverlapWithOtherRoles: "no",
    },
  ],
  hasCanadianTradeCertificate: "no",
  tradeCertificateIssuingAuthority: "",
  tradeCertificateTrade: "",
  tradeCertificateIssueDate: "",
  fstJobOfferEmployers: [],
  fswPrimaryOccupationRoleId: "",
  expressEntryIntentOutsideQuebec: "yes",
  currentlyAuthorizedToWorkInCanada: "yes",
  // Step 4: Education
  educationLevel: "masters",
  fieldOfStudy: "it-computer-science",
  educationCountry: "India",
  graduationYear: "2018",
  ecaStatus: "yes",
  canadaEducationStatus: "no",
  educationCompletedInCanada: "no",
  canadianEducationProvinceTerritory: "",
  canadianEducationPublicInstitution: "",
  programLength: "2-years",
  hasMultipleCredentials: "no",
  additionalCredentials: [],
  ecaValid: "yes",
  educationCredentials: [
    {
      id: "demo-edu-1",
      level: "masters",
      country: "India",
      isCanadianCredential: "no",
      issueDate: "2018-06-01",
      institutionName: "Delhi Institute of Technology",
      programLengthMonths: 24,
      studyLoad: "full-time",
      startDate: "2016-06-01",
      endDate: "2018-05-31",
      physicallyInCanada: "no",
      distanceLearningPercent: 0,
      ecaIssuer: "wes",
      ecaOtherIssuer: "",
      ecaReferenceNumber: "WES-1234567",
      ecaIssueDate: "2024-05-01",
      ecaEquivalency: "masters",
    },
  ],
  // Step 5: Language & CRS
  languageTestStatus: "booked",
  languageTestPlannedDate: "2026-05-10",
  languageTestPlan: "both-languages",
  englishTestStatus: "booked",
  englishTestType: "",
  englishPlannedTestDate: "2026-05-10",
  frenchTestStatus: "not-taken",
  frenchTestType: "",
  frenchPlannedTestDate: "",
  languageScores: { listening: "", reading: "", writing: "", speaking: "" },
  addScoresLater: true,
  ageRange: "30-34",
  canadianEducation: "no",
  canadianWorkExperience: "yes",
  canadianWorkDuration: "2-plus-years",
  secondOfficialLanguageIntent: "no",
  languageTests: [
    {
      id: "demo-lang-primary",
      isPrimary: true,
      testType: "ielts-general-training",
      stream: "general",
      testDate: "2026-01-15",
      registrationNumber: "IELTS-ABC123",
      scores: {
        listening: "8.5",
        reading: "7.5",
        writing: "7.0",
        speaking: "7.0",
      },
    },
  ],
  // Step 6: Family
  maritalStatus: "married",
  dependents: 1,
  spouseAccompanying: "yes-accompanying",
  spouseLocation: "in-canada",
  closeRelativeInCanada: "no",
  hasCloseRelativeInCanada: "no",
  relativeProvinceTerritory: "",
  closeRelativeRelationship: "",
  hasDependentsUnder18: "yes",
  hasDependents18Plus: "no",
  sponsorshipTarget: "",
  sponsorStatus: "",
  partnerEducation: true,
  partnerLanguageScores: true,
  partnerWorkExperience: false,
  spouseEducationLevel: "bachelors",
  spouseForeignEducationHasEca: "yes",
  spouseEcaEquivalency: "bachelors",
  spouseEcaIssueDate: "2024-03-10",
  spouseLanguageTestType: "ielts-general-training",
  spouseLanguageTestDate: "2025-12-01",
  spouseLanguageTestStream: "general",
  spouseLanguageScores: {
    listening: "6.0",
    reading: "5.5",
    writing: "5.5",
    speaking: "6.0",
  },
  spouseCanadianWorkMonths: 10,
  spouseCanadianWorkStartDate: "2024-02-01",
  spouseCanadianWorkEndDate: "2025-01-31",
  hasEligibleSiblingInCanada: "no",
  siblingRelationshipType: "",
  siblingProvinceTerritory: "",
  siblingStatus: "",
  siblingAge18OrOlder: "",
  siblingLivesInCanada: "",
  fundsFamilySize: 3,
  settlementFundsCad: 30000,
  fundsExemptByValidJobOffer: "yes",
  // Step 7: Red Flags
  priorRefusals: "no",
  criminalCharges: "no",
  medicalIssues: "no",
  misrepresentation: "no",
  multipleCountries: "no",
  nonTraditionalEmployment: "no",
  missingDocuments: "yes",
  statusExpiringSoon: "no",
  overstayHistory: "no",
  removalOrDeportationHistory: "no",
  hasActiveApplication: "no",
  employerLetterUnwilling: "no",
  workedWithoutAuthorizationInCanada: "no",
  refusedProvincialNomination: "no",
  isSkilledTrade: "no",
}

export function getStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function setStoredJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota and serialization errors.
  }
}

export function saveAssessment(data: AssessmentData): void {
  if (typeof window === "undefined") return
  const normalized: AssessmentData = {
    ...data,
    derivedCanadianSkilledYearsBand: deriveCanadianSkilledYearsBand(data),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
}

export function loadAssessment(): AssessmentData | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AssessmentData> & {
      fullName?: string
      mainJobDuties?: string
      canadianWork?: {
        authorized?: boolean
      }
    }
    const {
      totalExperience: _legacyTotalExperience,
      canadianWork: _legacyCanadianWork,
      ...parsedWithoutLegacy
    } = parsed as (Partial<AssessmentData> & {
      totalExperience?: unknown
      canadianWork?: { authorized?: boolean }
    })
    const normalizedEcaStatus = normalizeLegacyUnsure(parsed.ecaStatus)
    const normalizedEcaValid = normalizeLegacyUnsure(parsed.ecaValid)
    const normalizedMultipleCredentials = normalizeLegacyUnsure(parsed.hasMultipleCredentials)
    const normalizedSecondLanguageIntent = normalizeLegacyUnsure(parsed.secondOfficialLanguageIntent)
    const normalizedCloseRelativeInCanada = normalizeLegacyUnsure(parsed.closeRelativeInCanada)
    const normalizedHasDependentsUnder18 = normalizeLegacyUnsure(parsed.hasDependentsUnder18)
    const normalizedHasDependents18Plus = normalizeLegacyUnsure(parsed.hasDependents18Plus)
    const normalizedCanadianEducation = normalizeLegacyUnsure(parsed.canadianEducation)
    const legacyCanadianAuthorized =
      parsedWithoutLegacy.canadianWorkAuthorizedAll ??
      (parsed.canadianWork?.authorized === true
        ? "yes"
        : parsed.canadianWork?.authorized === false
          ? "no"
          : "")

    const legacyFullName = typeof parsed.fullName === "string" ? parsed.fullName.trim() : ""
    const legacyNameParts = legacyFullName ? legacyFullName.split(/\s+/).filter(Boolean) : []
    const legacyFirstName = legacyNameParts[0] ?? ""
    const legacyLastName = legacyNameParts.length > 1 ? legacyNameParts[legacyNameParts.length - 1] : ""
    const legacyMiddleName =
      legacyNameParts.length > 2 ? legacyNameParts.slice(1, -1).join(" ") : ""

    const merged = {
      ...defaultAssessmentData,
      ...parsedWithoutLegacy,
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
      workRoles: Array.isArray(parsed.workRoles) ? parsed.workRoles : [],
      fstJobOfferEmployers: Array.isArray(parsed.fstJobOfferEmployers) ? parsed.fstJobOfferEmployers : [],
      educationCredentials: Array.isArray(parsed.educationCredentials) ? parsed.educationCredentials : [],
      languageTests: Array.isArray(parsed.languageTests) ? parsed.languageTests : [],
      ecaValid: normalizedEcaValid ?? "",
      canadianEducation: normalizedCanadianEducation ?? "",
      secondOfficialLanguageIntent: normalizedSecondLanguageIntent ?? "",
      closeRelativeInCanada: normalizedCloseRelativeInCanada ?? "",
      hasDependentsUnder18: normalizedHasDependentsUnder18 ?? "",
      hasDependents18Plus: normalizedHasDependents18Plus ?? "",
      priorRefusals: normalizeLegacyRemovedUnsure(parsedWithoutLegacy.priorRefusals, ["yes", "no"]),
      criminalCharges: normalizeLegacyRemovedUnsure(parsedWithoutLegacy.criminalCharges, ["yes", "no"]),
      overstayHistory: normalizeLegacyRemovedUnsure(parsedWithoutLegacy.overstayHistory, ["yes", "no"]),
      removalOrDeportationHistory: normalizeLegacyRemovedUnsure(
        parsedWithoutLegacy.removalOrDeportationHistory,
        ["yes", "no"],
      ),
      hasActiveApplication: normalizeLegacyRemovedUnsure(parsedWithoutLegacy.hasActiveApplication, ["yes", "no"]),
      statusExpiringSoon: normalizeLegacyRemovedUnsure(parsedWithoutLegacy.statusExpiringSoon, [
        "yes",
        "no",
        "na",
      ]),
      workedWithoutAuthorizationInCanada: normalizeLegacyRemovedUnsure(
        parsedWithoutLegacy.workedWithoutAuthorizationInCanada,
        ["yes", "no"],
      ),
      refusedProvincialNomination: normalizeLegacyRemovedUnsure(
        parsedWithoutLegacy.refusedProvincialNomination,
        ["yes", "no"],
      ),
      canadianWorkAuthorizedAll:
        legacyCanadianAuthorized === "yes" || legacyCanadianAuthorized === "no" || legacyCanadianAuthorized === "not_sure"
          ? legacyCanadianAuthorized
          : "",
      jobDuties:
        typeof parsed.jobDuties === "string"
          ? parsed.jobDuties
          : typeof parsed.mainJobDuties === "string"
            ? parsed.mainJobDuties
            : "",
      languageScores: {
        ...defaultAssessmentData.languageScores,
        ...parsed.languageScores,
      },
      spouseLanguageScores: {
        ...defaultAssessmentData.spouseLanguageScores,
        ...(parsed.spouseLanguageScores ?? {}),
      },
    }
    return {
      ...merged,
      derivedCanadianSkilledYearsBand: deriveCanadianSkilledYearsBand(merged),
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
