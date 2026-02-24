import test from "node:test"
import assert from "node:assert/strict"
import { scorePNPRelevance } from "./pnpRelevanceScore.ts"

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
    canGetReferenceLetter: "yes",
    referenceLetterChallenge: null,
    hasOverlappingWorkOrWorkStudy: "no",
    hasEmploymentGaps: "no",
    deadlineDriver: null,
    deadlineDate: null,
    languageReady: "not_ready",
  }
}

test("Case 1: strong profile scores >= 85 with no dampeners", () => {
  const signals = {
    ...baseSignals(),
    hasJobOffer: "yes",
    employerSupportPNP: "yes",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    canadianSkilledWork12mo: "yes",
    currentlyWorkingInCanada: "yes",
    anyEducationInCanada: "yes",
    settleFlexibility: "prefer-specific",
    jobOfferProvince: "British Columbia",
    languageReady: "valid",
    canGetReferenceLetter: "yes",
  }

  const scoring = scorePNPRelevance(signals, { unknownRate: 0 })
  assert.ok(scoring.score >= 85)
  assert.equal(scoring.score, 97)
  assert.deepEqual(scoring.dampenersApplied, [])
})

test("Case 2: moderate profile stays in ~35-55 and no no_canadian_ties dampener", () => {
  const signals = {
    ...baseSignals(),
    hasJobOffer: "no",
    canadianSkilledWork12mo: "not_sure",
    anyEducationInCanada: "yes",
    settleFlexibility: "prefer-specific",
    languageReady: "booked",
    canGetReferenceLetter: "yes",
  }

  const scoring = scorePNPRelevance(signals, { unknownRate: 0.2 })
  assert.ok(scoring.score >= 35 && scoring.score <= 55)
  assert.ok(!scoring.dampenersApplied.includes("no_canadian_ties"))
})

test("Case 3: outside/no ties profile is low and includes no_canadian_ties dampener", () => {
  const signals = {
    ...baseSignals(),
    hasJobOffer: "no",
    canadianSkilledWork12mo: "no",
    anyEducationInCanada: "no",
    settleFlexibility: "yes-anywhere",
    languageReady: "valid",
    canGetReferenceLetter: "not_sure",
  }

  const scoring = scorePNPRelevance(signals, { unknownRate: 0.1 })
  assert.ok(scoring.score >= 0 && scoring.score <= 15)
  assert.equal(scoring.score, 0)
  assert.ok(scoring.dampenersApplied.includes("no_canadian_ties"))
})

test("Case 4: high uncertainty applies high_unknown_rate_gt_50 dampener", () => {
  const signals = {
    ...baseSignals(),
    hasJobOffer: "no",
    canadianSkilledWork12mo: "not_sure",
    anyEducationInCanada: "yes",
    settleFlexibility: "prefer-specific",
    languageReady: "booked",
    canGetReferenceLetter: "yes",
  }

  const scoring = scorePNPRelevance(signals, { unknownRate: 0.6 })
  assert.equal(scoring.score, 25)
  assert.ok(scoring.dampenersApplied.includes("high_unknown_rate_gt_50"))
})
