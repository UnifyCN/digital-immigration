import test from "node:test"
import assert from "node:assert/strict"
import { derivePNPConfidence } from "./pnpConfidence.ts"

test("Case 1: score 88, low unknowns, no dampeners => high/recommended", () => {
  const result = derivePNPConfidence({
    score: 88,
    unknownRate: 0.1,
    dampenersApplied: [],
  })

  assert.equal(result.confidenceLevel, "high")
  assert.equal(result.confidenceLabel, "High confidence")
  assert.equal(result.recommendationMode, "recommended")
  assert.equal(result.displayPriority, 20)
  assert.deepEqual(result.confidenceReasonCodes, [])
})

test("Case 2: score 72 with unknownRate 0.60 => cap high to medium", () => {
  const result = derivePNPConfidence({
    score: 72,
    unknownRate: 0.6,
    dampenersApplied: [],
  })

  assert.equal(result.confidenceLevel, "medium")
  assert.ok(result.confidenceReasonCodes.includes("cap_high_due_to_high_unknown_rate"))
})

test("Case 3: score 55 with unknownRate 0.75 => force low", () => {
  const result = derivePNPConfidence({
    score: 55,
    unknownRate: 0.75,
    dampenersApplied: [],
  })

  assert.equal(result.confidenceLevel, "low")
  assert.ok(result.confidenceReasonCodes.includes("cap_to_low_due_to_extreme_unknown_rate"))
})

test("Case 4: no_canadian_ties dampener => force low", () => {
  const result = derivePNPConfidence({
    score: 48,
    unknownRate: 0.1,
    dampenersApplied: ["no_canadian_ties"],
  })

  assert.equal(result.confidenceLevel, "low")
  assert.ok(result.confidenceReasonCodes.includes("cap_to_low_due_to_no_canadian_ties"))
})

test("Case 5: prior_refusal dampener downgrades high to medium", () => {
  const result = derivePNPConfidence({
    score: 78,
    unknownRate: 0.1,
    dampenersApplied: ["prior_refusal"],
  })

  assert.equal(result.confidenceLevel, "medium")
  assert.ok(result.confidenceReasonCodes.includes("downgrade_due_to_prior_refusal"))
})
