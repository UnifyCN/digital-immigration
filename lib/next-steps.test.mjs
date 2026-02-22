import test from "node:test"
import assert from "node:assert/strict"
import { recommendNextSteps } from "./next-steps.ts"

function baseProfile() {
  return {
    firstName: "Alex",
    middleName: "",
    lastName: "Doe",
    dateOfBirth: "1992-08-10",
    citizenshipCountry: "India",
    email: "",
    consentAcknowledged: true,
    primaryGoal: "pr",
    timeUrgency: "3-to-6",
    currentLocation: "outside-canada",
    geographicFlexibility: "yes-anywhere",
    preferredProvince: "",
    pnpTargetProvince: "",
    deadlineTrigger: "no-hard-deadline",
    deadlineDate: "",
    studyPermitHasLOA: "",
    workPermitHasJobOffer: "",
    sponsorshipRelation: "",
    currentStatus: "other",
    statusExpiryDate: "",
    hasAppliedToExtendStatus: "",
    refusalHistory: "no",
    mostRecentRefusalType: "",
    priorCanadaApplicationType: "",
    countryOfResidence: "India",
    nationality: "Indian",
    priorApplications: "no",
    currentJobTitle: "Software Developer",
    countryOfWork: "India",
    totalExperience: "3-5",
    industryCategory: "Technology",
    employmentGaps: "no",
    mostRecentJobStart: "2020-01",
    mostRecentJobEnd: "",
    mostRecentJobPresent: true,
    hoursPerWeekRange: "30plus",
    paidWorkStatus: "yes",
    employmentType: "employee",
    canObtainEmployerLetter: "yes",
    employerLetterChallenge: "",
    hasOverlappingPeriods: "no",
    jobs: [],
    educationLevel: "bachelors",
    educationCountry: "India",
    graduationYear: "2015",
    ecaStatus: "yes",
    canadaEducationStatus: "no",
    programLength: "3-plus-years",
    hasMultipleCredentials: "no",
    additionalCredentials: [],
    ecaValid: "yes",
    languageTestStatus: "yes",
    languageScores: {
      listening: "",
      reading: "",
      writing: "",
      speaking: "",
    },
    addScoresLater: false,
    plannedTestDate: "",
    languageApproxCLB: "clb-7",
    languageTestValid: "yes",
    languagePlannedTiming: "",
    ageRange: "30-34",
    canadianEducation: "no",
    canadianWorkExperience: "no",
    canadianWorkDuration: "none",
    secondOfficialLanguageIntent: "no",
    maritalStatus: "single",
    dependents: 0,
    spouseAccompanying: "",
    spouseLocation: "",
    closeRelativeInCanada: "no",
    closeRelativeRelationship: "",
    hasDependentsUnder18: "no",
    hasDependents18Plus: "no",
    sponsorshipTarget: "",
    sponsorStatus: "",
    partnerEducation: false,
    partnerLanguageScores: false,
    partnerWorkExperience: false,
    priorRefusals: "no",
    criminalCharges: "no",
    medicalIssues: "no",
    misrepresentation: "no",
    multipleCountries: "no",
    nonTraditionalEmployment: "no",
    missingDocuments: "no",
    statusExpiringSoon: "na",
    overstayHistory: "no",
    removalOrDeportationHistory: "no",
    hasActiveApplication: "no",
    employerLetterUnwilling: "no",
  }
}

test("includes and prioritizes language test step when language test is missing", () => {
  const profile = baseProfile()
  profile.languageTestStatus = "no"
  const pathways = [{ id: "express-entry", name: "Express Entry", whyRelevant: [], whatNext: [], confidence: "High" }]
  const risks = [{ id: "language_test_missing", label: "", severity: "high", action: "" }]
  const steps = recommendNextSteps(profile, pathways, risks)

  assert.ok(steps.length > 0)
  assert.equal(steps[0].id, "language_test")
  assert.equal(steps[0].priority, "high")
  assert.ok(steps[0].evidence.risks.includes("language_test_missing"))
})

test("adds ECA step only when outside-Canada education and ECA is incomplete", () => {
  const profile = baseProfile()
  profile.ecaStatus = "no"
  profile.canadaEducationStatus = "no"
  profile.educationCountry = "Philippines"
  const pathways = [{ id: "express-entry", name: "Express Entry", whyRelevant: [], whatNext: [], confidence: "High" }]
  const risks = [{ id: "eca_incomplete", label: "", severity: "low", action: "" }]
  const steps = recommendNextSteps(profile, pathways, risks)
  assert.ok(steps.some((step) => step.id === "eca"))

  const profileWithCanadianEducation = baseProfile()
  profileWithCanadianEducation.ecaStatus = "no"
  profileWithCanadianEducation.educationCountry = "Canada"
  profileWithCanadianEducation.canadaEducationStatus = "yes"
  const steps2 = recommendNextSteps(profileWithCanadianEducation, pathways, risks)
  assert.ok(!steps2.some((step) => step.id === "eca"))
})

test("dedupes and keeps high-priority steps ahead of medium-priority pathway prep", () => {
  const profile = baseProfile()
  profile.languageTestStatus = "no"
  profile.missingDocuments = "yes"
  profile.employmentGaps = "yes"
  const pathways = [
    { id: "express-entry", name: "Express Entry", whyRelevant: [], whatNext: [], confidence: "High" },
    { id: "pnp", name: "PNP", whyRelevant: [], whatNext: [], confidence: "High" },
  ]
  const risks = [
    { id: "language_test_missing", label: "", severity: "high", action: "" },
    { id: "missing_documents", label: "", severity: "medium", action: "" },
    { id: "employment_gaps", label: "", severity: "medium", action: "" },
  ]
  const steps = recommendNextSteps(profile, pathways, risks)
  const ids = steps.map((step) => step.id)
  assert.equal(new Set(ids).size, ids.length)

  const firstMediumIndex = steps.findIndex((step) => step.priority === "medium")
  const lastHighIndex = steps.map((step) => step.priority).lastIndexOf("high")
  assert.ok(lastHighIndex >= 0)
  if (firstMediumIndex >= 0) {
    assert.ok(lastHighIndex < firstMediumIndex)
  }
})
