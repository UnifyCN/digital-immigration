import type { AssessmentData } from "./types"

const STORAGE_KEY = "clarity-assessment-draft"
const STEP_KEY = "clarity-assessment-step"

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
  // Step 5
  languageTestStatus: "",
  languageScores: { listening: "", reading: "", writing: "", speaking: "" },
  addScoresLater: false,
  plannedTestDate: "",
  ageRange: "",
  canadianEducation: "",
  canadianWorkExperience: "",
  // Step 6
  maritalStatus: "",
  dependents: 0,
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
    return JSON.parse(raw) as AssessmentData
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

// ── Sample seed data for demo ──

export const sampleAssessmentData: AssessmentData = {
  primaryGoal: "pr",
  timeUrgency: "3-to-6",
  currentLocation: "outside-canada",
  geographicFlexibility: "yes-anywhere",
  preferredProvince: "",
  deadlineTrigger: "no-hard-deadline",
  deadlineDate: "",
  studyPermitHasLOA: "",
  workPermitHasJobOffer: "",
  sponsorshipRelation: "",
  currentStatus: "worker",
  statusExpiryDate: "",
  hasAppliedToExtendStatus: "",
  refusalHistory: "no",
  mostRecentRefusalType: "",
  priorCanadaApplicationType: "work",
  countryOfResidence: "India",
  nationality: "Indian",
  priorApplications: "yes",
  currentJobTitle: "Software Engineer",
  countryOfWork: "India",
  totalExperience: "3-5",
  industryCategory: "Technology",
  employmentGaps: "no",
  mostRecentJobStart: "2021-01",
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
      country: "India",
      yearsRange: "3-5",
      startMonth: "2021-01",
      endMonth: "",
      present: true,
    },
  ],
  educationLevel: "bachelors",
  educationCountry: "India",
  graduationYear: "2019",
  ecaStatus: "yes",
  languageTestStatus: "yes",
  languageScores: { listening: "8", reading: "7.5", writing: "7", speaking: "7.5" },
  addScoresLater: false,
  plannedTestDate: "",
  ageRange: "25-29",
  canadianEducation: "no",
  canadianWorkExperience: "no",
  maritalStatus: "single",
  dependents: 0,
  partnerEducation: false,
  partnerLanguageScores: false,
  partnerWorkExperience: false,
  priorRefusals: "yes",
  criminalCharges: "no",
  medicalIssues: "no",
  misrepresentation: "no",
  multipleCountries: "no",
  nonTraditionalEmployment: "no",
  missingDocuments: "no",
}
