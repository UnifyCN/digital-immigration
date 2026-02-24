import test from "node:test"
import assert from "node:assert/strict"
import { defaultAssessmentData } from "../storage.ts"
import { computeExpressEntryEligibility } from "../express-entry/eligibility.ts"
import { computeResults } from "../scoring.ts"
import { buildExpressEntryPathwayViewModel } from "./expressEntryPresentation.ts"

const AS_OF_DATE = new Date("2026-02-23T00:00:00Z")

function baseProfile() {
  const profile = JSON.parse(JSON.stringify(defaultAssessmentData))
  profile.primaryGoal = "pr"
  profile.currentLocation = "inside-canada"
  profile.currentStatus = "worker"
  profile.statusExpiryDate = "2026-12-31"
  profile.hasAppliedToExtendStatus = "no"
  profile.currentlyWorkingInCanada = "yes"
  profile.currentJobProvinceTerritory = "Ontario"
  profile.sameEmployerForPermanentOffer = "yes"
  profile.countryOfResidence = "Canada"
  profile.nationality = "Indian"
  profile.refusalHistory = "no"
  profile.priorApplications = "no"
  profile.consentAcknowledged = true
  profile.firstName = "Demo"
  profile.lastName = "User"
  profile.dateOfBirth = "1992-01-01"
  profile.citizenshipCountry = "India"
  profile.currentProvinceTerritory = "Ontario"
  profile.intendedProvinceTerritory = "Ontario"
  profile.hasValidTemporaryStatus = "yes"
  profile.temporaryStatusType = "work-permit-open"
  profile.temporaryStatusExpiryDate = "2026-12-31"
  profile.openToPNP = "yes"
  profile.geographicFlexibility = "yes-anywhere"
  profile.deadlineTrigger = "no-hard-deadline"
  return profile
}

function applyLanguage(profile, scores) {
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

test("eligible profile maps to eligible presentation status", () => {
  const profile = baseProfile()
  applyLanguage(profile, { listening: "8.0", reading: "7.0", writing: "7.0", speaking: "7.0" })
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

  const eligibility = computeExpressEntryEligibility(profile, AS_OF_DATE)
  const results = computeResults(profile)
  const model = buildExpressEntryPathwayViewModel({
    assessment: profile,
    eligibility,
    resultsContext: {
      pathways: results.pathways,
      riskFlags: results.riskFlags,
      nextSteps: results.nextSteps,
    },
  })

  assert.equal(model.status, "eligible")
  assert.equal(model.statusBadgeLabel, "Express Entry Eligible")
  assert.ok(model.qualifyingFactors.length > 0)
})

test("needs_more_info maps to low eligibility and prioritizes missing-field actions", () => {
  const profile = baseProfile()
  const eligibility = computeExpressEntryEligibility(profile, AS_OF_DATE)
  const model = buildExpressEntryPathwayViewModel({ assessment: profile, eligibility })

  assert.equal(eligibility.overallStatus, "needs_more_info")
  assert.equal(model.status, "low_eligibility")
  assert.ok(model.nextActions.some((action) => action.source === "missing_field"))
})

test("soft ineligible maps to low eligibility when gaps are actionable", () => {
  const profile = baseProfile()
  applyLanguage(profile, { listening: "4.0", reading: "4.0", writing: "4.0", speaking: "4.0" })
  profile.workRoles = [
    {
      id: "role1",
      noc2021Code: "64100",
      teer: "4",
      title: "Retail Clerk",
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
  profile.fundsExemptByValidJobOffer = "no"
  profile.fundsFamilySize = 1
  profile.settlementFundsCad = 15000

  const eligibility = computeExpressEntryEligibility(profile, AS_OF_DATE)
  const model = buildExpressEntryPathwayViewModel({ assessment: profile, eligibility })

  assert.equal(eligibility.overallStatus, "ineligible")
  assert.equal(model.status, "low_eligibility")
  assert.ok(model.failedCoreRequirements.length > 0)
})

test("hard inadmissibility flag forces not eligible presentation state", () => {
  const profile = baseProfile()
  applyLanguage(profile, { listening: "4.0", reading: "4.0", writing: "4.0", speaking: "4.0" })
  profile.workRoles = [
    {
      id: "role1",
      noc2021Code: "64100",
      teer: "4",
      title: "Retail Clerk",
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
  profile.fundsExemptByValidJobOffer = "no"
  profile.fundsFamilySize = 1
  profile.settlementFundsCad = 15000
  profile.criminalCharges = "yes"

  const eligibility = computeExpressEntryEligibility(profile, AS_OF_DATE)
  const model = buildExpressEntryPathwayViewModel({ assessment: profile, eligibility })

  assert.equal(eligibility.overallStatus, "ineligible")
  assert.equal(model.status, "not_eligible")
})
