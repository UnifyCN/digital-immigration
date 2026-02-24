import test from "node:test"
import assert from "node:assert/strict"
import { step0Schema, step2Schema, step3Schema, step4Schema, step5Schema, step7Schema, validateStep6 } from "./schemas.ts"
import {
  CANADIAN_PROVINCES_AND_TERRITORIES,
  CURRENT_PROVINCE_TERRITORY_OPTIONS,
} from "./canada-regions.ts"

const ALL_CANADIAN_PROVINCES_AND_TERRITORIES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Northwest Territories",
  "Nunavut",
  "Yukon",
]

function getIssuePaths(result) {
  return result.error.issues.map((issue) => issue.path.join("."))
}

test("step0 requires temporary status follow-ups only when valid temporary status is yes", () => {
  const base = {
    firstName: "Alex",
    middleName: "",
    lastName: "Demo",
    dateOfBirth: "1990-05-15",
    exactAge: 30,
    citizenshipCountry: "India",
    currentProvinceTerritory: "Ontario",
    intendedProvinceTerritory: "Ontario",
    hasValidTemporaryStatus: "yes",
    temporaryStatusType: "",
    temporaryStatusExpiryDate: "",
    email: "",
    consentAcknowledged: true,
  }

  const missingFollowUps = step0Schema.safeParse(base)
  assert.equal(missingFollowUps.success, false)
  assert.deepEqual(
    getIssuePaths(missingFollowUps).sort(),
    ["temporaryStatusExpiryDate", "temporaryStatusType"],
  )

  const notRequiredWhenNo = step0Schema.safeParse({
    ...base,
    hasValidTemporaryStatus: "no",
  })
  assert.equal(notRequiredWhenNo.success, true)
})

test("step2 requires working-in-canada follow-ups only when currently working in Canada is yes", () => {
  const base = {
    currentStatus: "citizen",
    statusExpiryDate: "",
    hasAppliedToExtendStatus: "no",
    refusalHistory: "no",
    mostRecentRefusalType: "",
    priorCanadaApplicationType: "",
    currentlyWorkingInCanada: "yes",
    currentJobProvinceTerritory: "",
    sameEmployerForPermanentOffer: "",
    countryOfResidence: "Canada",
    nationality: "Indian",
    priorApplications: "no",
    currentLocation: "inside-canada",
  }

  const missingFollowUps = step2Schema.safeParse(base)
  assert.equal(missingFollowUps.success, false)
  assert.deepEqual(
    getIssuePaths(missingFollowUps).sort(),
    ["currentJobProvinceTerritory", "sameEmployerForPermanentOffer"],
  )

  const notRequiredWhenNo = step2Schema.safeParse({
    ...base,
    currentlyWorkingInCanada: "no",
  })
  assert.equal(notRequiredWhenNo.success, true)
})

test("province dropdown options include all provinces and territories and only current includes outside Canada", () => {
  assert.deepEqual(CANADIAN_PROVINCES_AND_TERRITORIES, ALL_CANADIAN_PROVINCES_AND_TERRITORIES)
  assert.equal(CANADIAN_PROVINCES_AND_TERRITORIES.includes("Outside Canada"), false)

  assert.deepEqual(CURRENT_PROVINCE_TERRITORY_OPTIONS, [
    ...ALL_CANADIAN_PROVINCES_AND_TERRITORIES,
    "Outside Canada",
  ])
})

test("step3 job-offer follow-ups are required only when hasCanadianJobOffer is yes", () => {
  const base = {
    currentJobTitle: "Developer",
    countryOfWork: "Canada",
    industryCategory: "technology",
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
    hasCanadianJobOffer: "yes",
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
    occupationCategory: "it-software-data",
    occupationCategoryOtherRole: "",
    jobDuties:
      "Lead roadmap planning across multiple product lines, coordinate cross-functional requirements, draft PRDs, and prioritize release scope based on user feedback and business constraints.",
    foreignSkilledYears: "3",
    hasContinuous12MonthsSkilled: "yes",
    has12MonthsCanadaSkilled: "no",
    currentlyWorkingInCanada: "no",
    canadianWorkDuration: "none",
    canadianWorkAuthorizedAll: "yes",
    derivedCanadianSkilledYearsBand: "0",
    jobs: [],
  }

  const missingFollowUps = step3Schema.safeParse(base)
  assert.equal(missingFollowUps.success, false)
  assert.deepEqual(
    getIssuePaths(missingFollowUps).sort(),
    [
      "employerWillSupportPNP",
      "jobOfferCity",
      "jobOfferCompensation",
      "jobOfferCompensationType",
      "jobOfferEmployerName",
      "jobOfferFullTime",
      "jobOfferMeetsValidOfferDefinition",
      "jobOfferNonSeasonal",
      "jobOfferPermanent",
      "jobOfferProvinceTerritory",
      "jobOfferSupportType",
      "jobOfferTenure",
      "jobOfferTitle",
    ],
  )

  const notRequiredWhenNo = step3Schema.safeParse({
    ...base,
    hasCanadianJobOffer: "no",
  })
  assert.equal(notRequiredWhenNo.success, true)
})

test("step3 jobDuties requires at least 120 non-whitespace-trimmed characters", () => {
  const result = step3Schema.safeParse({
    currentJobTitle: "Developer",
    countryOfWork: "Canada",
    industryCategory: "technology",
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
    hasCanadianJobOffer: "no",
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
    occupationCategory: "it-software-data",
    occupationCategoryOtherRole: "",
    jobDuties: "Write code.",
    foreignSkilledYears: "3",
    hasContinuous12MonthsSkilled: "yes",
    has12MonthsCanadaSkilled: "no",
    currentlyWorkingInCanada: "no",
    canadianWorkDuration: "none",
    canadianWorkAuthorizedAll: "yes",
    derivedCanadianSkilledYearsBand: "0",
    jobs: [],
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["jobDuties"])
})

test("step3 occupationCategoryOtherRole is required when occupation category is other", () => {
  const result = step3Schema.safeParse({
    currentJobTitle: "Developer",
    countryOfWork: "Canada",
    industryCategory: "technology",
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
    hasCanadianJobOffer: "no",
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
    occupationCategory: "other",
    occupationCategoryOtherRole: "",
    jobDuties:
      "Lead roadmap planning across multiple product lines, coordinate cross-functional requirements, draft PRDs, and prioritize release scope based on user feedback and business constraints.",
    foreignSkilledYears: "3",
    hasContinuous12MonthsSkilled: "yes",
    has12MonthsCanadaSkilled: "no",
    currentlyWorkingInCanada: "no",
    canadianWorkDuration: "none",
    canadianWorkAuthorizedAll: "yes",
    derivedCanadianSkilledYearsBand: "0",
    jobs: [],
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["occupationCategoryOtherRole"])
})

test("step3 jobDuties enforces 400 character maximum", () => {
  const result = step3Schema.safeParse({
    currentJobTitle: "Developer",
    countryOfWork: "Canada",
    industryCategory: "technology",
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
    hasCanadianJobOffer: "no",
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
    occupationCategory: "it-software-data",
    occupationCategoryOtherRole: "",
    jobDuties: "x".repeat(401),
    foreignSkilledYears: "3",
    hasContinuous12MonthsSkilled: "yes",
    has12MonthsCanadaSkilled: "no",
    currentlyWorkingInCanada: "no",
    canadianWorkDuration: "none",
    canadianWorkAuthorizedAll: "yes",
    derivedCanadianSkilledYearsBand: "0",
    jobs: [],
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["jobDuties"])
})

test("step4 Canada education follow-ups are required only when educationCompletedInCanada is yes", () => {
  const base = {
    educationLevel: "bachelors",
    fieldOfStudy: "engineering",
    educationCountry: "India",
    graduationYear: "2018",
    ecaStatus: "yes",
    canadaEducationStatus: "no",
    educationCompletedInCanada: "yes",
    canadianEducationProvinceTerritory: "",
    canadianEducationPublicInstitution: "",
    programLength: "2-years",
    hasMultipleCredentials: "no",
    additionalCredentials: [],
    ecaValid: "yes",
  }

  const missingFollowUps = step4Schema.safeParse(base)
  assert.equal(missingFollowUps.success, false)
  assert.deepEqual(
    getIssuePaths(missingFollowUps).sort(),
    ["canadianEducationProvinceTerritory", "canadianEducationPublicInstitution"],
  )

  const notRequiredWhenNo = step4Schema.safeParse({
    ...base,
    educationCompletedInCanada: "no",
  })
  assert.equal(notRequiredWhenNo.success, true)
})

test("step5 requires language test status", () => {
  const result = step5Schema.safeParse({
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
    ageRange: "30-34",
    canadianEducation: "no",
    canadianWorkExperience: "",
    canadianWorkDuration: "none",
    secondOfficialLanguageIntent: "no",
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["languageTestStatus"])
})

test("step5 valid language test requires all four exact scores", () => {
  const result = step5Schema.safeParse({
    languageTestStatus: "valid",
    languageTestPlannedDate: "",
    languageTestPlan: "",
    englishTestStatus: "",
    englishTestType: "",
    englishPlannedTestDate: "",
    frenchTestStatus: "",
    frenchTestType: "",
    frenchPlannedTestDate: "",
    languageScores: { listening: "8.0", reading: "", writing: "7.5", speaking: "7.0" },
    languageTests: [
      {
        id: "test-primary",
        isPrimary: true,
        testType: "ielts-general-training",
        stream: "general",
        testDate: "2025-06-01",
        registrationNumber: "",
        scores: { listening: "8.0", reading: "7.5", writing: "7.0", speaking: "7.0" },
      },
    ],
    addScoresLater: false,
    ageRange: "30-34",
    canadianEducation: "no",
    canadianWorkExperience: "",
    canadianWorkDuration: "none",
    secondOfficialLanguageIntent: "no",
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["languageScores.listening"])
})

test("step5 booked language test requires future planned date", () => {
  const result = step5Schema.safeParse({
    languageTestStatus: "booked",
    languageTestPlannedDate: "2000-01-01",
    languageTestPlan: "",
    englishTestStatus: "",
    englishTestType: "",
    englishPlannedTestDate: "",
    frenchTestStatus: "",
    frenchTestType: "",
    frenchPlannedTestDate: "",
    languageScores: { listening: "", reading: "", writing: "", speaking: "" },
    addScoresLater: false,
    ageRange: "30-34",
    canadianEducation: "no",
    canadianWorkExperience: "",
    canadianWorkDuration: "none",
    secondOfficialLanguageIntent: "no",
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["languageTestPlannedDate"])
})

test("step5 valid language test requires structured test metadata", () => {
  const result = step5Schema.safeParse({
    languageTestStatus: "valid",
    languageTestPlannedDate: "",
    languageTestPlan: "english-only",
    englishTestStatus: "",
    englishTestType: "",
    englishPlannedTestDate: "",
    frenchTestStatus: "",
    frenchTestType: "",
    frenchPlannedTestDate: "",
    languageScores: { listening: "8.0", reading: "7.0", writing: "7.0", speaking: "7.0" },
    languageTests: [],
    addScoresLater: false,
    ageRange: "30-34",
    canadianEducation: "no",
    canadianWorkExperience: "",
    canadianWorkDuration: "none",
    secondOfficialLanguageIntent: "no",
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["languageTests"])
})

test("step3 canadian work authorization is required only when a Canadian role exists", () => {
  const base = {
    currentJobTitle: "Developer",
    countryOfWork: "Canada",
    industryCategory: "technology",
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
    hasCanadianJobOffer: "no",
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
    occupationCategory: "it-software-data",
    occupationCategoryOtherRole: "",
    jobDuties:
      "Lead roadmap planning across multiple product lines, coordinate cross-functional requirements, draft PRDs, and prioritize release scope based on user feedback and business constraints.",
    foreignSkilledYears: "3",
    hasContinuous12MonthsSkilled: "yes",
    has12MonthsCanadaSkilled: "yes",
    canadianWorkAuthorizedAll: "",
    derivedCanadianSkilledYearsBand: "1",
    jobs: [],
  }

  const requiredWhenExists = step3Schema.safeParse(base)
  assert.equal(requiredWhenExists.success, false)
  assert.deepEqual(getIssuePaths(requiredWhenExists), ["canadianWorkAuthorizedAll"])

  const notRequiredWhenNone = step3Schema.safeParse({
    ...base,
    countryOfWork: "India",
  })
  assert.equal(notRequiredWhenNone.success, true)
})

test("step3 requires foreign skilled years", () => {
  const result = step3Schema.safeParse({
    currentJobTitle: "Developer",
    countryOfWork: "Canada",
    industryCategory: "technology",
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
    hasCanadianJobOffer: "no",
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
    occupationCategory: "it-software-data",
    occupationCategoryOtherRole: "",
    jobDuties:
      "Lead roadmap planning across multiple product lines, coordinate cross-functional requirements, draft PRDs, and prioritize release scope based on user feedback and business constraints.",
    foreignSkilledYears: "",
    hasContinuous12MonthsSkilled: "",
    has12MonthsCanadaSkilled: "no",
    canadianWorkAuthorizedAll: "yes",
    derivedCanadianSkilledYearsBand: "0",
    jobs: [],
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["foreignSkilledYears"])
})

test("step3 requires 12-months-Canada gate only when a Canadian role exists", () => {
  const withCanadianRole = step3Schema.safeParse({
    currentJobTitle: "Developer",
    countryOfWork: "Canada",
    industryCategory: "technology",
    employmentGaps: "no",
    mostRecentJobStart: "2025-01",
    mostRecentJobEnd: "",
    mostRecentJobPresent: true,
    hoursPerWeekRange: "30plus",
    paidWorkStatus: "yes",
    employmentType: "employee",
    canObtainEmployerLetter: "yes",
    employerLetterChallenge: "",
    hasOverlappingPeriods: "no",
    hasCanadianJobOffer: "no",
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
    occupationCategory: "it-software-data",
    occupationCategoryOtherRole: "",
    jobDuties:
      "Lead roadmap planning across multiple product lines, coordinate cross-functional requirements, draft PRDs, and prioritize release scope based on user feedback and business constraints.",
    foreignSkilledYears: "3",
    hasContinuous12MonthsSkilled: "yes",
    has12MonthsCanadaSkilled: "",
    canadianWorkAuthorizedAll: "yes",
    derivedCanadianSkilledYearsBand: "0",
    jobs: [],
  })
  assert.equal(withCanadianRole.success, false)
  assert.deepEqual(getIssuePaths(withCanadianRole), ["has12MonthsCanadaSkilled"])

  const noCanadianRole = step3Schema.safeParse({
    currentJobTitle: "Developer",
    countryOfWork: "India",
    industryCategory: "technology",
    employmentGaps: "no",
    mostRecentJobStart: "2025-01",
    mostRecentJobEnd: "",
    mostRecentJobPresent: true,
    hoursPerWeekRange: "30plus",
    paidWorkStatus: "yes",
    employmentType: "employee",
    canObtainEmployerLetter: "yes",
    employerLetterChallenge: "",
    hasOverlappingPeriods: "no",
    hasCanadianJobOffer: "no",
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
    occupationCategory: "it-software-data",
    occupationCategoryOtherRole: "",
    jobDuties:
      "Lead roadmap planning across multiple product lines, coordinate cross-functional requirements, draft PRDs, and prioritize release scope based on user feedback and business constraints.",
    foreignSkilledYears: "3",
    hasContinuous12MonthsSkilled: "yes",
    has12MonthsCanadaSkilled: "",
    canadianWorkAuthorizedAll: "",
    derivedCanadianSkilledYearsBand: "0",
    jobs: [],
  })
  assert.equal(noCanadianRole.success, true)
})

test("step3 blocks yes-12-months claim when current Canada role is under 12 months and no prior Canada roles", () => {
  const result = step3Schema.safeParse({
    currentJobTitle: "Developer",
    countryOfWork: "Canada",
    industryCategory: "technology",
    employmentGaps: "no",
    mostRecentJobStart: "2026-01",
    mostRecentJobEnd: "",
    mostRecentJobPresent: true,
    hoursPerWeekRange: "30plus",
    paidWorkStatus: "yes",
    employmentType: "employee",
    canObtainEmployerLetter: "yes",
    employerLetterChallenge: "",
    hasOverlappingPeriods: "no",
    hasCanadianJobOffer: "no",
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
    occupationCategory: "it-software-data",
    occupationCategoryOtherRole: "",
    jobDuties:
      "Lead roadmap planning across multiple product lines, coordinate cross-functional requirements, draft PRDs, and prioritize release scope based on user feedback and business constraints.",
    foreignSkilledYears: "3",
    hasContinuous12MonthsSkilled: "yes",
    has12MonthsCanadaSkilled: "yes",
    canadianWorkAuthorizedAll: "yes",
    derivedCanadianSkilledYearsBand: "0",
    jobs: [],
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result), ["jobs"])
})

test("step6 relativeProvinceTerritory is required only when hasCloseRelativeInCanada is yes", () => {
  const base = {
    maritalStatus: "single",
    dependents: 0,
    spouseAccompanying: "",
    spouseLocation: "",
    closeRelativeInCanada: "no",
    hasCloseRelativeInCanada: "yes",
    relativeProvinceTerritory: "",
    closeRelativeRelationship: "",
    hasDependentsUnder18: "no",
    hasDependents18Plus: "no",
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
    fundsFamilySize: 1,
    settlementFundsCad: null,
    fundsExemptByValidJobOffer: "yes",
  }

  const missingProvince = validateStep6("pr", base)
  assert.equal(missingProvince.success, false)
  assert.deepEqual(getIssuePaths(missingProvince), ["relativeProvinceTerritory"])

  const notRequiredWhenNo = validateStep6("pr", {
    ...base,
    hasCloseRelativeInCanada: "no",
  })
  assert.equal(notRequiredWhenNo.success, true)
})

test("step6 PR flow requires funds when not exempt", () => {
  const result = validateStep6("pr", {
    maritalStatus: "single",
    dependents: 0,
    spouseAccompanying: "",
    spouseLocation: "",
    closeRelativeInCanada: "no",
    hasCloseRelativeInCanada: "no",
    relativeProvinceTerritory: "",
    closeRelativeRelationship: "",
    hasDependentsUnder18: "no",
    hasDependents18Plus: "no",
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
    fundsExemptByValidJobOffer: "no",
  })

  assert.equal(result.success, false)
  assert.deepEqual(getIssuePaths(result).sort(), ["fundsFamilySize", "settlementFundsCad"])
})

test("step7 hard factual items reject unsure after options cleanup", () => {
  const result = step7Schema.safeParse({
    priorRefusals: "unsure",
    criminalCharges: "unsure",
    statusExpiringSoon: "unsure",
    overstayHistory: "unsure",
    removalOrDeportationHistory: "unsure",
    hasActiveApplication: "unsure",
    workedWithoutAuthorizationInCanada: "unsure",
    refusedProvincialNomination: "unsure",
  })

  assert.equal(result.success, false)
})

test("step7 keeps unsure for interpretive items", () => {
  const result = step7Schema.safeParse({
    medicalIssues: "unsure",
    misrepresentation: "unsure",
    multipleCountries: "unsure",
    nonTraditionalEmployment: "unsure",
    missingDocuments: "unsure",
    employerLetterUnwilling: "unsure",
    isSkilledTrade: "unsure",
    statusExpiringSoon: "na",
    priorRefusals: "no",
    criminalCharges: "no",
    overstayHistory: "no",
    removalOrDeportationHistory: "no",
    hasActiveApplication: "no",
    workedWithoutAuthorizationInCanada: "no",
    refusedProvincialNomination: "no",
  })

  assert.equal(result.success, true)
})
