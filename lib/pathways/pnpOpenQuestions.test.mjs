import test from "node:test"
import assert from "node:assert/strict"
import { buildPNPReadinessChecklistAll } from "./pnpReadinessChecklist.ts"
import { generatePNPOpenQuestions } from "./pnpOpenQuestions.ts"

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
    canadianSkilledWork12mo: null,
    canadianWorkAuthorized: null,
    avgHoursPerWeek: null,
    workPaid: null,
    workType: null,
    hasJobOffer: null,
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
    ecaCompleted: null,
    educationCompletedInCanada: null,
    anyEducationInCanada: null,
    educationProvinceInCanada: null,
    publicInstitutionInCanada: null,
    programLength: null,
    hasRefusals: "no",
    refusalMostRecentType: null,
    refusalMostRecentDate: null,
    priorCanadianApplications: null,
    canGetReferenceLetter: null,
    referenceLetterChallenge: null,
    hasOverlappingWorkOrWorkStudy: null,
    hasEmploymentGaps: null,
    deadlineDriver: null,
    deadlineDate: null,
    languageReady: "not_ready",
  }
}

test("Case 1: low confidence + no_canadian_ties prioritizes low-to-medium movers", () => {
  const signals = {
    ...baseSignals(),
    hasJobOffer: "not_sure",
    canadianSkilledWork12mo: "not_sure",
  }

  const readinessChecklistAll = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.6 } })
  const result = generatePNPOpenQuestions({
    signals,
    meta: { unknownRate: 0.6 },
    dampenersApplied: ["no_canadian_ties"],
    confidenceLevel: "low",
    readinessChecklistAll,
  })

  assert.ok(result.openQuestions.length >= 4 && result.openQuestions.length <= 6)
  assert.ok(result.openQuestionIds.includes("Q2_job_offer_unknown"))
  assert.ok(result.openQuestionIds.includes("Q4_canadian_skilled_work_12mo_unclear"))
  assert.ok(result.openQuestionIds.includes("Q5_canadian_education_missing"))
  assert.ok(result.openQuestionIds.includes("Q1_province_preference_missing"))
  assert.ok(!result.openQuestionIds.includes("Q8_job_offer_details_missing"))
})

test("Case 2: medium confidence with job offer yes includes Q3 and Q8 but not Q2", () => {
  const signals = {
    ...baseSignals(),
    hasJobOffer: "yes",
    employerSupportPNP: null,
    jobOfferFullTime: null,
    jobOfferPermanent: "yes",
    canadianSkilledWork12mo: "yes",
    settleFlexibility: "preferProvince",
    preferredProvince: "Ontario",
    languageReady: "not_ready",
    canGetReferenceLetter: "yes",
    highestEducationLevel: "bachelors",
    currentLocation: "outside-canada",
  }

  const readinessChecklistAll = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.25 } })
  const result = generatePNPOpenQuestions({
    signals,
    meta: { unknownRate: 0.25 },
    dampenersApplied: [],
    confidenceLevel: "medium",
    readinessChecklistAll,
  })

  assert.ok(result.openQuestions.length >= 3 && result.openQuestions.length <= 5)
  assert.ok(result.openQuestionIds.includes("Q3_employer_support_unknown"))
  assert.ok(result.openQuestionIds.includes("Q8_job_offer_details_missing"))
  assert.ok(!result.openQuestionIds.includes("Q2_job_offer_unknown"))
})

test("Case 3: inside Canada + expiring soon includes Q9 with boosted priority near top", () => {
  const signals = {
    ...baseSignals(),
    currentLocation: "inside-canada",
    currentStatus: "worker",
    statusExpiryDate: "2026-03-10",
    statusExpiringSoon: true,
    hasJobOffer: "yes",
    employerSupportPNP: "yes",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    canadianSkilledWork12mo: "yes",
    settleFlexibility: "preferProvince",
    preferredProvince: "Ontario",
    canGetReferenceLetter: "yes",
    languageReady: "valid",
    highestEducationLevel: "bachelors",
    anyEducationInCanada: "yes",
  }

  const readinessChecklistAll = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.15 } })
  const result = generatePNPOpenQuestions({
    signals,
    meta: { unknownRate: 0.15 },
    dampenersApplied: [],
    confidenceLevel: "medium",
    readinessChecklistAll,
  })

  assert.ok(result.openQuestionIds.includes("Q9_status_details_missing_or_attention"))
  const q9Index = result.openQuestionIds.indexOf("Q9_status_details_missing_or_attention")
  assert.ok(q9Index >= 0 && q9Index <= 1)
})

test("Case 4: high confidence with only language missing returns only matched items", () => {
  const signals = {
    ...baseSignals(),
    currentLocation: "outside-canada",
    hasJobOffer: "yes",
    employerSupportPNP: "yes",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    canadianSkilledWork12mo: "yes",
    settleFlexibility: "preferProvince",
    preferredProvince: "Ontario",
    canGetReferenceLetter: "yes",
    languageReady: "not_ready",
    highestEducationLevel: "bachelors",
    anyEducationInCanada: "yes",
  }

  const readinessChecklistAll = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.05 } })
  const result = generatePNPOpenQuestions({
    signals,
    meta: { unknownRate: 0.05 },
    dampenersApplied: [],
    confidenceLevel: "high",
    readinessChecklistAll,
  })

  assert.ok(result.openQuestions.length <= 3)
  assert.ok(result.openQuestionIds.includes("Q6_language_plan_missing"))
})
