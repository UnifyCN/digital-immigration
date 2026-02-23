import test from "node:test"
import assert from "node:assert/strict"
import { generatePNPLowConfidenceMessaging } from "./pnpLowConfidenceMessaging.ts"

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
    currentLocation: "outside-canada",
    currentStatus: null,
    statusExpiryDate: null,
    statusExpiringSoon: false,
    appliedToExtendWaiting: null,
    holdsValidTempStatus: null,
    tempStatusType: null,
    tempStatusExpiry: null,
    currentlyWorkingInCanada: "no",
    sameEmployerAsPermanentOffer: null,
    canadianSkilledWork12mo: "not_sure",
    canadianWorkAuthorized: null,
    avgHoursPerWeek: null,
    workPaid: null,
    workType: null,
    hasJobOffer: "no",
    jobOfferFullTime: null,
    jobOfferPermanent: null,
    jobOfferCompAmount: null,
    jobOfferCompType: null,
    workedForEmployerDuration: null,
    employerSupportPNP: null,
    occupationCategory: null,
    occupationOtherText: null,
    jobDutiesProvided: false,
    highestEducationLevel: null,
    educationCountry: null,
    graduationYear: null,
    maritalStatus: null,
    hasDependents: null,
    ecaCompleted: null,
    educationCompletedInCanada: null,
    anyEducationInCanada: "no",
    educationProvinceInCanada: null,
    publicInstitutionInCanada: null,
    programLength: null,
    hasRefusals: "no",
    refusalMostRecentType: null,
    refusalMostRecentDate: null,
    priorCanadianApplications: null,
    canGetReferenceLetter: "not_sure",
    referenceLetterChallenge: null,
    hasOverlappingWorkOrWorkStudy: null,
    hasEmploymentGaps: null,
    deadlineDriver: null,
    deadlineDate: null,
    languageReady: "not_ready",
  }
}

test("Case 1: low + no province + no offer + language not ready + high unknown rate", () => {
  const result = generatePNPLowConfidenceMessaging({
    signals: {
      ...baseSignals(),
      canGetReferenceLetter: "yes",
    },
    meta: { unknownRate: 0.7 },
    dampenersApplied: [],
    openQuestions: [
      { id: "Q1_province_preference_missing", category: "province" },
      { id: "Q6_language_plan_missing", category: "language" },
    ],
  })

  assert.ok(result.whyLimitedBullets.length >= 2 && result.whyLimitedBullets.length <= 4)
  assert.ok(result.howToImproveBullets.length >= 2 && result.howToImproveBullets.length <= 4)
  assert.ok(result.whyLimitedBulletIds.includes("L1_no_province_preference"))
  assert.ok(result.whyLimitedBulletIds.includes("L2_no_job_offer_or_unclear"))
  assert.ok(result.whyLimitedBulletIds.includes("L5_language_not_ready"))
  assert.ok(result.whyLimitedBulletIds.includes("L7_high_unknown_rate"))
  assert.ok(result.howToImproveBulletIds.includes("I1_choose_province"))
  assert.ok(result.howToImproveBulletIds.includes("I4_language_plan"))
})

test("Case 2: low + job offer yes + employer support unknown includes L3 and I3", () => {
  const result = generatePNPLowConfidenceMessaging({
    signals: {
      ...baseSignals(),
      hasJobOffer: "yes",
      employerSupportPNP: "not_sure",
      languageReady: "valid",
    },
    meta: { unknownRate: 0.2 },
    dampenersApplied: [],
    openQuestions: [{ id: "Q3_employer_support_unknown", category: "job" }],
  })

  assert.ok(result.whyLimitedBulletIds.includes("L3_employer_support_unknown_or_no"))
  assert.ok(result.howToImproveBulletIds.includes("I3_strengthen_employer_support"))
})

test("Case 3: low + no_canadian_ties dampener includes L4 near top", () => {
  const result = generatePNPLowConfidenceMessaging({
    signals: baseSignals(),
    meta: { unknownRate: 0.1 },
    dampenersApplied: ["no_canadian_ties"],
  })

  assert.ok(result.whyLimitedBulletIds.includes("L4_no_canadian_ties_dampener"))
  const l4Index = result.whyLimitedBulletIds.indexOf("L4_no_canadian_ties_dampener")
  assert.ok(l4Index >= 0 && l4Index <= 2)
})
