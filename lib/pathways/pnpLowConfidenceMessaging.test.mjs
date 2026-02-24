import test from "node:test"
import assert from "node:assert/strict"
import { generatePNPLowConfidenceMessaging } from "./pnpLowConfidenceMessaging.ts"
import { basePNPSignals } from "./testFixtures.ts"

test("Case 1: low + no province + no offer + language not ready + high unknown rate", () => {
  const result = generatePNPLowConfidenceMessaging({
    signals: {
      ...basePNPSignals(),
      canadianSkilledWork12mo: "not_sure",
      anyEducationInCanada: "no",
      canGetReferenceLetter: "yes",
    },
    meta: { unknownRate: 0.7 },
    dampenersApplied: [],
    openQuestions: [
      { id: "Q1_province_preference_missing", category: "province" },
      { id: "Q6_language_plan_missing", category: "language" },
    ],
  })

  assert.equal(result.whyLimitedBullets.length, 4)
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
      ...basePNPSignals(),
      canadianSkilledWork12mo: "not_sure",
      anyEducationInCanada: "no",
      canGetReferenceLetter: "not_sure",
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
    signals: {
      ...basePNPSignals(),
      canadianSkilledWork12mo: "not_sure",
      anyEducationInCanada: "no",
      canGetReferenceLetter: "not_sure",
    },
    meta: { unknownRate: 0.1 },
    dampenersApplied: ["no_canadian_ties"],
  })

  assert.ok(result.whyLimitedBulletIds.includes("L4_no_canadian_ties_dampener"))
  const l4Index = result.whyLimitedBulletIds.indexOf("L4_no_canadian_ties_dampener")
  assert.ok(l4Index >= 0 && l4Index <= 2)
})
