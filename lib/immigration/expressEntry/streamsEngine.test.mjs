import test from "node:test"
import assert from "node:assert/strict"
import { defaultAssessmentData } from "../../storage.ts"
import { buildProfileFromAnswers, checkCEC, checkFSW, checkFST, classifyExpressEntryStreams } from "./streamsEngine.ts"
import { summarizeHours } from "./workHours.ts"

const AS_OF_DATE = new Date("2026-02-24T00:00:00Z")

function cloneProfile() {
  return JSON.parse(JSON.stringify(defaultAssessmentData))
}

function applyValidLanguage(profile) {
  profile.languageTestStatus = "valid"
  profile.languageTests = [
    {
      id: "primary",
      isPrimary: true,
      testType: "ielts-general-training",
      stream: "general",
      testDate: "2025-09-01",
      registrationNumber: "TRF123",
      scores: {
        listening: "8.0",
        reading: "7.0",
        writing: "7.0",
        speaking: "7.0",
      },
    },
  ]
}

function applyCanadianRole(profile, overrides = {}) {
  profile.workRoles = [
    {
      id: "role-a",
      noc2021Code: "21231",
      teer: "1",
      nocDutiesMatchConfirmed: true,
      title: "Software Engineer",
      employerName: "A",
      country: "Canada",
      province: "Ontario",
      city: "Toronto",
      startDate: "2024-01-01",
      endDate: "",
      present: true,
      hoursPerWeek: 30,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "yes",
      authorizationType: "permit",
      authorizationValidFrom: "2023-01-01",
      authorizationValidTo: "2026-12-31",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      hasOverlapWithOtherRoles: "no",
      qualifiedToPracticeInCountry: "yes",
      ...overrides,
    },
  ]
}

test("CEC multi-NOC role hours can pass eligibility", () => {
  const profile = cloneProfile()
  profile.expressEntryIntentOutsideQuebec = "yes"
  applyValidLanguage(profile)
  profile.workRoles = [
    {
      id: "r1",
      noc2021Code: "21231",
      teer: "1",
      nocDutiesMatchConfirmed: true,
      title: "Software Engineer",
      employerName: "A",
      country: "Canada",
      province: "Ontario",
      city: "Toronto",
      startDate: "2024-01-01",
      endDate: "2024-09-30",
      present: false,
      hoursPerWeek: 30,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "yes",
      authorizationType: "permit",
      authorizationValidFrom: "2024-01-01",
      authorizationValidTo: "2024-12-31",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      hasOverlapWithOtherRoles: "no",
      qualifiedToPracticeInCountry: "yes",
    },
    {
      id: "r2",
      noc2021Code: "13110",
      teer: "3",
      nocDutiesMatchConfirmed: true,
      title: "Office Supervisor",
      employerName: "B",
      country: "Canada",
      province: "Ontario",
      city: "Toronto",
      startDate: "2024-10-01",
      endDate: "2025-08-31",
      present: false,
      hoursPerWeek: 30,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "yes",
      authorizationType: "permit",
      authorizationValidFrom: "2024-01-01",
      authorizationValidTo: "2025-12-31",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      hasOverlapWithOtherRoles: "no",
      qualifiedToPracticeInCountry: "yes",
    },
  ]

  const result = checkCEC(buildProfileFromAnswers(profile, AS_OF_DATE), AS_OF_DATE)
  assert.equal(result.status, "eligible")
})

test("FSW continuity fails for 11 months plus gap plus 1 month", () => {
  const profile = cloneProfile()
  profile.expressEntryIntentOutsideQuebec = "yes"
  profile.currentlyAuthorizedToWorkInCanada = "no"
  profile.jobOfferMeetsValidOfferDefinition = "no"
  profile.fundsFamilySize = 1
  profile.settlementFundsCad = 20000
  profile.educationLevel = "bachelors"
  profile.educationCredentials = [
    {
      id: "edu1",
      level: "bachelors",
      country: "India",
      isCanadianCredential: "no",
      issueDate: "2020-06-01",
      institutionName: "Uni",
      programLengthMonths: 48,
      ecaIssuer: "wes",
      ecaReferenceNumber: "WES-1",
      ecaIssueDate: "2024-05-01",
      ecaEquivalency: "bachelors",
    },
  ]
  applyValidLanguage(profile)
  profile.workRoles = [
    {
      id: "primary-role",
      noc2021Code: "21231",
      teer: "1",
      nocDutiesMatchConfirmed: true,
      title: "Engineer",
      employerName: "A",
      country: "India",
      province: "",
      city: "Delhi",
      startDate: "2024-01-01",
      endDate: "2024-11-30",
      present: false,
      hoursPerWeek: 30,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "",
      authorizationType: "",
      authorizationValidFrom: "",
      authorizationValidTo: "",
      wasFullTimeStudent: "no",
      physicallyInCanada: "",
      hasOverlapWithOtherRoles: "no",
      qualifiedToPracticeInCountry: "yes",
    },
    {
      id: "other-role",
      noc2021Code: "21231",
      teer: "1",
      nocDutiesMatchConfirmed: true,
      title: "Engineer",
      employerName: "A",
      country: "India",
      province: "",
      city: "Delhi",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      present: false,
      hoursPerWeek: 30,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "",
      authorizationType: "",
      authorizationValidFrom: "",
      authorizationValidTo: "",
      wasFullTimeStudent: "no",
      physicallyInCanada: "",
      hasOverlapWithOtherRoles: "no",
      qualifiedToPracticeInCountry: "yes",
    },
  ]
  profile.fswPrimaryOccupationRoleId = "primary-role"

  const result = checkFSW(buildProfileFromAnswers(profile, AS_OF_DATE), AS_OF_DATE)
  assert.equal(result.status, "ineligible")
  assert.match(result.reasons[0], /continuous year/i)
})

test("Language test older than 2 years fails language validity", () => {
  const profile = cloneProfile()
  profile.expressEntryIntentOutsideQuebec = "yes"
  applyValidLanguage(profile)
  profile.languageTests[0].testDate = "2023-01-01"
  applyCanadianRole(profile)

  const result = checkCEC(buildProfileFromAnswers(profile, AS_OF_DATE), AS_OF_DATE)
  assert.equal(result.status, "ineligible")
  assert.match(result.reasons[0], /older than 2 years/i)
})

test("Invalid/unapproved language type returns needs_more_info", () => {
  const profile = cloneProfile()
  profile.expressEntryIntentOutsideQuebec = "yes"
  applyValidLanguage(profile)
  profile.languageTests[0].testType = "ielts-academic"
  applyCanadianRole(profile)

  const result = checkCEC(buildProfileFromAnswers(profile, AS_OF_DATE), AS_OF_DATE)
  assert.equal(result.status, "needs_more_info")
  assert.ok(result.missingFields.includes("language.primary.testType"))
})

test("Unknown Quebec intent returns shared follow-up missing field", () => {
  const profile = cloneProfile()
  applyValidLanguage(profile)
  applyCanadianRole(profile)

  const result = classifyExpressEntryStreams(profile, AS_OF_DATE)
  assert.equal(result.programResults.CEC.status, "needs_more_info")
  assert.ok(result.nextQuestions.some((question) => question.id === "shared.intentOutsideQuebec"))
})

test("FSW with multiple skilled roles requires explicit primary occupation selection", () => {
  const profile = cloneProfile()
  profile.expressEntryIntentOutsideQuebec = "yes"
  profile.currentlyAuthorizedToWorkInCanada = "no"
  profile.jobOfferMeetsValidOfferDefinition = "no"
  profile.fundsFamilySize = 1
  profile.settlementFundsCad = 20000
  applyValidLanguage(profile)
  profile.educationLevel = "bachelors"
  profile.educationCredentials = [
    {
      id: "edu1",
      level: "bachelors",
      country: "India",
      isCanadianCredential: "no",
      issueDate: "2020-06-01",
      institutionName: "Uni",
      programLengthMonths: 48,
      ecaIssuer: "wes",
      ecaReferenceNumber: "WES-1",
      ecaIssueDate: "2024-05-01",
      ecaEquivalency: "bachelors",
    },
  ]
  profile.workRoles = [
    {
      id: "r1",
      noc2021Code: "21231",
      teer: "1",
      nocDutiesMatchConfirmed: true,
      title: "Engineer",
      employerName: "A",
      country: "India",
      province: "",
      city: "Delhi",
      startDate: "2022-01-01",
      endDate: "2024-01-01",
      present: false,
      hoursPerWeek: 30,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "",
      authorizationType: "",
      authorizationValidFrom: "",
      authorizationValidTo: "",
      wasFullTimeStudent: "no",
      physicallyInCanada: "",
      hasOverlapWithOtherRoles: "no",
      qualifiedToPracticeInCountry: "yes",
    },
    {
      id: "r2",
      noc2021Code: "13110",
      teer: "3",
      nocDutiesMatchConfirmed: true,
      title: "Supervisor",
      employerName: "B",
      country: "India",
      province: "",
      city: "Delhi",
      startDate: "2021-01-01",
      endDate: "2022-01-01",
      present: false,
      hoursPerWeek: 30,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "",
      authorizationType: "",
      authorizationValidFrom: "",
      authorizationValidTo: "",
      wasFullTimeStudent: "no",
      physicallyInCanada: "",
      hasOverlapWithOtherRoles: "no",
      qualifiedToPracticeInCountry: "yes",
    },
  ]

  const result = checkFSW(buildProfileFromAnswers(profile, AS_OF_DATE), AS_OF_DATE)
  assert.equal(result.status, "needs_more_info")
  assert.ok(result.missingFields.includes("fsw.primaryOccupationRoleId"))
})

test("CEC authorization unknown requires follow-up", () => {
  const profile = cloneProfile()
  profile.expressEntryIntentOutsideQuebec = "yes"
  applyValidLanguage(profile)
  applyCanadianRole(profile, { wasAuthorizedInCanada: "not-sure" })

  const result = checkCEC(buildProfileFromAnswers(profile, AS_OF_DATE), AS_OF_DATE)
  assert.equal(result.status, "needs_more_info")
  assert.ok(result.missingFields.some((key) => key.endsWith("wasAuthorizedInCanada")))
})

test("Concurrent 30-hour roles are capped to 30 total hours per week", () => {
  const roles = [
    {
      id: "a",
      nocCode: "21231",
      teer: "1",
      nocDutiesMatchConfirmed: true,
      country: "Canada",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      present: false,
      hoursPerWeek: 30,
      paid: true,
      employmentType: "employee",
      wasAuthorizedInCanada: "yes",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      title: "A",
      employerName: "A",
    },
    {
      id: "b",
      nocCode: "13110",
      teer: "3",
      nocDutiesMatchConfirmed: true,
      country: "Canada",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      present: false,
      hoursPerWeek: 30,
      paid: true,
      employmentType: "employee",
      wasAuthorizedInCanada: "yes",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      title: "B",
      employerName: "B",
    },
  ]

  const summary = summarizeHours(roles, AS_OF_DATE, 3)
  assert.ok(summary.totalHours < 1700)
  assert.ok(summary.totalHours > 1500)
})

test("FST eligible example passes", () => {
  const profile = cloneProfile()
  profile.expressEntryIntentOutsideQuebec = "yes"
  profile.currentlyAuthorizedToWorkInCanada = "yes"
  applyValidLanguage(profile)
  profile.languageTests[0].scores = {
    listening: "6.0",
    reading: "5.0",
    writing: "5.0",
    speaking: "6.0",
  }
  profile.workRoles = [
    {
      id: "trade-role",
      noc2021Code: "72200",
      teer: "2",
      nocDutiesMatchConfirmed: true,
      title: "Electrician",
      employerName: "TradeCo",
      country: "Canada",
      province: "Alberta",
      city: "Calgary",
      startDate: "2021-01-01",
      endDate: "2023-12-31",
      present: false,
      hoursPerWeek: 30,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: true,
      wasAuthorizedInCanada: "yes",
      authorizationType: "permit",
      authorizationValidFrom: "2021-01-01",
      authorizationValidTo: "2023-12-31",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      hasOverlapWithOtherRoles: "no",
      qualifiedToPracticeInCountry: "yes",
    },
  ]
  profile.fstJobOfferEmployers = [
    {
      id: "offer-1",
      employerName: "TradeCo",
      province: "Alberta",
      noc2021Code: "72200",
      paid: "yes",
      fullTime: "yes",
      continuous: "yes",
      nonSeasonal: "yes",
      hoursPerWeek: 40,
      durationMonths: 12,
    },
  ]

  const result = checkFST(buildProfileFromAnswers(profile, AS_OF_DATE), AS_OF_DATE)
  assert.equal(result.status, "eligible")
})
