import test from "node:test"
import assert from "node:assert/strict"
import { generatePNPWhyBullets } from "./pnpWhyBullets.ts"

function baseSignals() {
  return {
    primaryGoal: "pr",
    pursuingPR: true,
    openToPNP: "yes",
    settleFlexibility: "yes-anywhere",
    hasProvincePreference: false,
    preferredProvince: null,
    currentJobProvince: null,
    jobOfferProvince: null,
    currentLocation: "inside-canada",
    currentStatus: "worker",
    statusExpiryDate: null,
    statusExpiringSoon: false,
    appliedToExtendWaiting: null,
    holdsValidTempStatus: "yes",
    tempStatusType: null,
    tempStatusExpiry: null,
    currentlyWorkingInCanada: "no",
    sameEmployerAsPermanentOffer: null,
    canadianSkilledWork12mo: "no",
    canadianWorkAuthorized: "yes",
    avgHoursPerWeek: null,
    workPaid: "yes",
    workType: "employee",
    hasJobOffer: "no",
    jobOfferFullTime: null,
    jobOfferPermanent: null,
    jobOfferCompAmount: null,
    jobOfferCompType: null,
    workedForEmployerDuration: null,
    employerSupportPNP: null,
    occupationCategory: "it-software-data",
    occupationOtherText: null,
    jobDutiesProvided: true,
    highestEducationLevel: "bachelors",
    educationCountry: "India",
    graduationYear: "2018",
    ecaCompleted: "yes",
    educationCompletedInCanada: "no",
    anyEducationInCanada: "no",
    educationProvinceInCanada: null,
    publicInstitutionInCanada: null,
    programLength: null,
    hasRefusals: "no",
    refusalMostRecentType: null,
    priorCanadianApplications: "no",
    canGetReferenceLetter: "no",
    referenceLetterChallenge: null,
    hasOverlappingWorkOrWorkStudy: "no",
    hasEmploymentGaps: "no",
    deadlineDriver: null,
    deadlineDate: null,
    languageReady: "not_ready",
  }
}

test("Case 1: high confidence strong signals prioritizes strongest drivers and excludes risk bullets", () => {
  const signals = {
    ...baseSignals(),
    hasJobOffer: "yes",
    employerSupportPNP: "yes",
    canadianSkilledWork12mo: "yes",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    languageReady: "valid",
    canGetReferenceLetter: "yes",
  }

  const result = generatePNPWhyBullets({
    signals,
    meta: { unknownRate: 0.1 },
    dampenersApplied: [],
    confidenceLevel: "high",
  })

  assert.ok(result.whyBullets.length >= 3 && result.whyBullets.length <= 5)
  assert.ok(["A1_job_offer", "A2_employer_support_yes"].includes(result.whyBulletIds[0]))
  assert.ok(!result.whyBulletIds.some((id) => id.startsWith("D")))
})

test("Case 2: medium confidence + unknownRate > 0.5 includes many_unknowns risk bullet", () => {
  const result = generatePNPWhyBullets({
    signals: baseSignals(),
    meta: { unknownRate: 0.6 },
    dampenersApplied: [],
    confidenceLevel: "medium",
  })

  assert.ok(result.whyBulletIds.includes("D1_many_unknowns"))
  assert.ok(result.whyBullets.length >= 2 && result.whyBullets.length <= 4)
})

test("Case 3: low confidence + no_canadian_ties includes risk bullet and fallback when needed", () => {
  const result = generatePNPWhyBullets({
    signals: baseSignals(),
    meta: { unknownRate: 0.2 },
    dampenersApplied: ["no_canadian_ties"],
    confidenceLevel: "low",
  })

  assert.ok(result.whyBulletIds.includes("D2_no_canadian_ties"))
  assert.ok(result.whyBullets.length >= 2 && result.whyBullets.length <= 3)
  assert.ok(result.whyBulletIds.includes("F1_fallback"))
})

test("Case 4: few/no signals adds fallback until minimum 2 bullets", () => {
  const result = generatePNPWhyBullets({
    signals: baseSignals(),
    meta: { unknownRate: 0.1 },
    dampenersApplied: [],
    confidenceLevel: "medium",
  })

  assert.ok(result.whyBullets.length >= 2)
  assert.ok(result.whyBulletIds.includes("F1_fallback"))
})
