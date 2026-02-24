import test from "node:test"
import assert from "node:assert/strict"
import { buildPNPReadinessChecklistAll } from "./pnpReadinessChecklist.ts"
import { generatePNPOpenQuestions } from "./pnpOpenQuestions.ts"
import { basePNPSignals } from "./testFixtures.ts"

test("Case 1: low confidence + no_canadian_ties prioritizes low-to-medium movers", () => {
  const signals = {
    ...basePNPSignals(),
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

  // Low confidence can surface between 4 and 6 items depending on overlap/category balancing.
  assert.ok(result.openQuestions.length >= 4 && result.openQuestions.length <= 6)
  assert.ok(result.openQuestionIds.includes("Q2_job_offer_unknown"))
  assert.ok(result.openQuestionIds.includes("Q4_canadian_skilled_work_12mo_unclear"))
  assert.ok(result.openQuestionIds.includes("Q5_canadian_education_missing"))
  assert.ok(result.openQuestionIds.includes("Q1_province_preference_missing"))
  assert.ok(!result.openQuestionIds.includes("Q8_job_offer_details_missing"))
})

test("Case 2: medium confidence with job offer yes includes Q3 and Q8 but not Q2", () => {
  const signals = {
    ...basePNPSignals(),
    hasJobOffer: "yes",
    employerSupportPNP: null,
    jobOfferFullTime: null,
    jobOfferPermanent: "yes",
    canadianSkilledWork12mo: "yes",
    settleFlexibility: "prefer-specific",
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
    ...basePNPSignals(),
    currentLocation: "inside-canada",
    currentStatus: "worker",
    statusExpiryDate: "2026-03-10",
    statusExpiringSoon: true,
    hasJobOffer: "yes",
    employerSupportPNP: "yes",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    canadianSkilledWork12mo: "yes",
    settleFlexibility: "prefer-specific",
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
    ...basePNPSignals(),
    currentLocation: "outside-canada",
    hasJobOffer: "yes",
    employerSupportPNP: "yes",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    canadianSkilledWork12mo: "yes",
    settleFlexibility: "prefer-specific",
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
