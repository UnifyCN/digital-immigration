import test from "node:test"
import assert from "node:assert/strict"
import { generatePNPWhyBullets } from "./pnpWhyBullets.ts"
import { basePNPSignals } from "./testFixtures.ts"

test("Case 1: high confidence strong signals prioritizes strongest drivers and excludes risk bullets", () => {
  const signals = {
    ...basePNPSignals(),
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
    signals: basePNPSignals(),
    meta: { unknownRate: 0.6 },
    dampenersApplied: [],
    confidenceLevel: "medium",
  })

  assert.ok(result.whyBulletIds.includes("D1_many_unknowns"))
  assert.ok(result.whyBullets.length >= 2 && result.whyBullets.length <= 4)
})

test("Case 3: low confidence + no_canadian_ties includes risk bullet and fallback when needed", () => {
  const result = generatePNPWhyBullets({
    signals: basePNPSignals(),
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
    signals: basePNPSignals(),
    meta: { unknownRate: 0.1 },
    dampenersApplied: [],
    confidenceLevel: "medium",
  })

  assert.ok(result.whyBullets.length >= 2)
  assert.ok(result.whyBulletIds.includes("F1_fallback"))
})
