import test from "node:test"
import assert from "node:assert/strict"
import { defaultAssessmentData } from "../storage.ts"
import {
  checkCEC,
  checkFSW,
  checkFST,
  computeExpressEntryEligibility,
} from "./eligibility.ts"
import { normalizeWorkHours } from "./work-normalization.ts"

const AS_OF_DATE = new Date("2026-02-23T00:00:00Z")

function baseProfile() {
  return JSON.parse(JSON.stringify(defaultAssessmentData))
}

function applyValidPrimaryLanguage(profile) {
  profile.languageTestStatus = "valid"
  profile.languageTestPlan = "english-only"
  profile.languageTests = [
    {
      id: "lang-primary",
      isPrimary: true,
      testType: "ielts-general-training",
      stream: "general",
      testDate: "2025-10-01",
      registrationNumber: "TRF123",
      scores: {
        listening: "8.0",
        reading: "7.0",
        writing: "7.0",
        speaking: "7.0",
      },
    },
  ]
  profile.languageScores = {
    listening: "8.0",
    reading: "7.0",
    writing: "7.0",
    speaking: "7.0",
  }
}

function applyBasicEducation(profile) {
  profile.educationLevel = "bachelors"
  profile.educationCountry = "India"
  profile.educationCredentials = [
    {
      id: "edu-1",
      level: "bachelors",
      country: "India",
      isCanadianCredential: "no",
      issueDate: "2020-06-01",
      institutionName: "ABC University",
      programLengthMonths: 48,
      studyLoad: "full-time",
      startDate: "2016-06-01",
      endDate: "2020-05-31",
      physicallyInCanada: "no",
      distanceLearningPercent: 0,
      ecaIssuer: "wes",
      ecaOtherIssuer: "",
      ecaReferenceNumber: "WES-100",
      ecaIssueDate: "2024-04-01",
      ecaEquivalency: "bachelors",
    },
  ]
}

function applyFunds(profile) {
  profile.fundsExemptByValidJobOffer = "no"
  profile.fundsFamilySize = 1
  profile.settlementFundsCad = 20000
}

function applyCanadianWorkRole(profile, overrides = {}) {
  profile.workRoles = [
    {
      id: "role-1",
      noc2021Code: "21231",
      teer: "1",
      title: "Software Engineer",
      employerName: "Maple Inc",
      country: "Canada",
      province: "Ontario",
      city: "Toronto",
      startDate: "2024-01-01",
      endDate: "",
      present: true,
      hoursPerWeek: 40,
      hoursVaried: false,
      paid: true,
      employmentType: "employee",
      isSkilledTradeRole: false,
      wasAuthorizedInCanada: "yes",
      authorizationType: "work permit",
      authorizationValidFrom: "2023-12-01",
      authorizationValidTo: "2026-12-31",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      hasOverlapWithOtherRoles: "no",
      ...overrides,
    },
  ]
}

test("CEC eligible profile returns eligible", () => {
  const profile = baseProfile()
  applyValidPrimaryLanguage(profile)
  applyCanadianWorkRole(profile)

  const result = checkCEC(profile, AS_OF_DATE)
  assert.equal(result.status, "eligible")
})

test("FSW eligible profile passes 67-point threshold", () => {
  const profile = baseProfile()
  profile.dateOfBirth = "1993-01-01"
  applyValidPrimaryLanguage(profile)
  applyBasicEducation(profile)
  applyFunds(profile)
  profile.workRoles = [
    {
      id: "role-fsw",
      noc2021Code: "21231",
      teer: "1",
      title: "Engineer",
      employerName: "Tech Co",
      country: "India",
      province: "",
      city: "Delhi",
      startDate: "2021-01-01",
      endDate: "2024-01-31",
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
  ]

  const result = checkFSW(profile, AS_OF_DATE)
  assert.equal(result.status, "eligible")
  assert.ok((result.fsw67Score ?? 0) >= 67)
})

test("FSW near-boundary failing profile is ineligible", () => {
  const profile = baseProfile()
  profile.dateOfBirth = "1976-01-01"
  applyValidPrimaryLanguage(profile)
  applyBasicEducation(profile)
  applyFunds(profile)
  profile.educationLevel = "high-school"
  profile.educationCredentials[0].level = "high-school"
  profile.educationCredentials[0].ecaEquivalency = "high-school"
  profile.workRoles = [
    {
      id: "role-fsw-low",
      noc2021Code: "13110",
      teer: "3",
      title: "Clerk",
      employerName: "Office Co",
      country: "India",
      province: "",
      city: "Mumbai",
      startDate: "2023-01-01",
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
      wasFullTimeStudent: "",
      physicallyInCanada: "",
      hasOverlapWithOtherRoles: "no",
    },
  ]

  const result = checkFSW(profile, AS_OF_DATE)
  assert.equal(result.status, "ineligible")
  assert.ok((result.fsw67Score ?? 0) < 67)
})

test("expired language test returns non-eligible outcome", () => {
  const profile = baseProfile()
  applyValidPrimaryLanguage(profile)
  profile.languageTests[0].testDate = "2022-01-01"
  applyCanadianWorkRole(profile)

  const result = checkCEC(profile, AS_OF_DATE)
  assert.equal(result.status, "ineligible")
})

test("expired ECA produces FSW needs_more_info", () => {
  const profile = baseProfile()
  applyValidPrimaryLanguage(profile)
  applyBasicEducation(profile)
  applyFunds(profile)
  profile.educationCredentials[0].ecaIssueDate = "2018-01-01"
  profile.workRoles = [
    {
      id: "role-fsw-eca",
      noc2021Code: "21231",
      teer: "1",
      title: "Engineer",
      employerName: "Tech Co",
      country: "India",
      province: "",
      city: "Delhi",
      startDate: "2021-01-01",
      endDate: "2024-01-31",
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
  ]

  const result = checkFSW(profile, AS_OF_DATE)
  assert.equal(result.status, "needs_more_info")
  assert.ok(result.missingFields.some((field) => field.key === "education.eca.issueDate"))
})

test("overlapping roles do not stack above full-time cap", () => {
  const roles = [
    {
      id: "a",
      noc2021Code: "21231",
      teer: "1",
      title: "Engineer",
      employerName: "A",
      country: "Canada",
      province: "Ontario",
      city: "Toronto",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      present: false,
      hoursPerWeek: 40,
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
      hasOverlapWithOtherRoles: "yes",
    },
    {
      id: "b",
      noc2021Code: "21231",
      teer: "1",
      title: "Engineer",
      employerName: "B",
      country: "Canada",
      province: "Ontario",
      city: "Toronto",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      present: false,
      hoursPerWeek: 40,
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
      hasOverlapWithOtherRoles: "yes",
    },
  ]

  const summary = normalizeWorkHours(roles, {
    asOfDate: AS_OF_DATE,
    windowYears: 3,
  })

  assert.ok(summary.totalHours < 1700)
  assert.ok(summary.totalHours > 1500)
})

test("CEC excludes unauthorized and self-employed work", () => {
  const profile = baseProfile()
  applyValidPrimaryLanguage(profile)
  applyCanadianWorkRole(profile, {
    wasAuthorizedInCanada: "no",
    employmentType: "self-employed",
  })

  const result = checkCEC(profile, AS_OF_DATE)
  assert.equal(result.status, "ineligible")
})

test("FST eligible case passes", () => {
  const profile = baseProfile()
  applyValidPrimaryLanguage(profile)
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
      title: "Electrician",
      employerName: "Trades Co",
      country: "Canada",
      province: "Alberta",
      city: "Calgary",
      startDate: "2021-01-01",
      endDate: "2023-12-31",
      present: false,
      hoursPerWeek: 40,
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
    },
  ]
  profile.jobOfferMeetsValidOfferDefinition = "yes"
  profile.jobOfferSupportType = "lmia"
  profile.jobOfferNonSeasonal = "yes"
  profile.fundsExemptByValidJobOffer = "yes"

  const result = checkFST(profile, AS_OF_DATE)
  assert.equal(result.status, "eligible")
})

test("aggregate result returns needs_more_info and missing fields", () => {
  const profile = baseProfile()
  const result = computeExpressEntryEligibility(profile, AS_OF_DATE)

  assert.equal(result.overallStatus, "needs_more_info")
  assert.ok(result.missingFields.length > 0)
})
