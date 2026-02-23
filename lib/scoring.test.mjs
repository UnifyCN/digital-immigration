import test from "node:test"
import assert from "node:assert/strict"
import { defaultAssessmentData } from "./storage.ts"
import { computeResults } from "./scoring.ts"

function baseProfile() {
  const profile = JSON.parse(JSON.stringify(defaultAssessmentData))
  profile.primaryGoal = "pr"
  return profile
}

function setValidLanguage(profile, scores = { listening: "8.0", reading: "7.0", writing: "7.0", speaking: "7.0" }) {
  profile.languageTestStatus = "valid"
  profile.languageTestPlan = "english-only"
  profile.languageTests = [
    {
      id: "lang1",
      isPrimary: true,
      testType: "ielts-general-training",
      stream: "general",
      testDate: "2025-10-01",
      registrationNumber: "TRF-1",
      scores,
    },
  ]
  profile.languageScores = { ...scores }
}

test("Express Entry card appears for eligible profile", () => {
  const profile = baseProfile()
  setValidLanguage(profile)
  profile.workRoles = [
    {
      id: "role1",
      noc2021Code: "21231",
      teer: "1",
      title: "Engineer",
      employerName: "Maple",
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
      authorizationType: "permit",
      authorizationValidFrom: "2024-01-01",
      authorizationValidTo: "2026-12-31",
      wasFullTimeStudent: "no",
      physicallyInCanada: "yes",
      hasOverlapWithOtherRoles: "no",
    },
  ]

  const result = computeResults(profile)
  const eeCard = result.pathways.find((pathway) => pathway.id === "express-entry")

  assert.ok(eeCard)
  assert.equal(result.expressEntryEligibility.overallStatus, "eligible")
  assert.equal(eeCard?.statusTag, "Eligible")
})

test("Express Entry card appears as Needs info when unresolved", () => {
  const profile = baseProfile()
  const result = computeResults(profile)
  const eeCard = result.pathways.find((pathway) => pathway.id === "express-entry")

  assert.ok(eeCard)
  assert.equal(result.expressEntryEligibility.overallStatus, "needs_more_info")
  assert.equal(eeCard?.statusTag, "Needs info")
})

test("Express Entry card hides when definitively ineligible", () => {
  const profile = baseProfile()
  setValidLanguage(profile, { listening: "4.0", reading: "3.5", writing: "4.0", speaking: "4.0" })
  profile.educationLevel = "high-school"
  profile.educationCountry = "Canada"
  profile.educationCredentials = [
    {
      id: "edu1",
      level: "high-school",
      country: "Canada",
      isCanadianCredential: "yes",
      issueDate: "2010-06-01",
      institutionName: "High School",
      programLengthMonths: 12,
      studyLoad: "full-time",
      startDate: "2009-09-01",
      endDate: "2010-06-01",
      physicallyInCanada: "yes",
      distanceLearningPercent: 0,
      ecaIssuer: "",
      ecaOtherIssuer: "",
      ecaReferenceNumber: "",
      ecaIssueDate: "",
      ecaEquivalency: "",
    },
  ]
  profile.workRoles = [
    {
      id: "role1",
      noc2021Code: "64100",
      teer: "4",
      title: "Retail clerk",
      employerName: "Store",
      country: "India",
      province: "",
      city: "Delhi",
      startDate: "2023-01-01",
      endDate: "2024-01-01",
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
  profile.fundsExemptByValidJobOffer = "no"
  profile.fundsFamilySize = 1
  profile.settlementFundsCad = 15000

  const result = computeResults(profile)
  const eeCard = result.pathways.find((pathway) => pathway.id === "express-entry")

  assert.equal(result.expressEntryEligibility.overallStatus, "ineligible")
  assert.equal(eeCard, undefined)
})
