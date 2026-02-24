import test from "node:test"
import assert from "node:assert/strict"
import {
  mapConfidenceDisplay,
  mapFitLabel,
  selectRecommendedFamilies,
} from "./bcRecommendationDisplay.ts"

function makeFamily(overrides = {}) {
  return {
    familyId: "BC_EMPLOYER_SKILLED",
    title: "Test Family",
    shortDescription: "",
    fitScore: 50,
    confidence: "medium",
    baselineBadge: "pass",
    hardBlockers: [],
    missingInfo: [],
    whyBullets: ["One", "Two"],
    whyBulletIds: ["one", "two"],
    matchLevel: "possible",
    ...overrides,
  }
}

test("selectRecommendedFamilies: strong top + weak second => 1 card", () => {
  const selected = selectRecommendedFamilies([
    makeFamily({ matchLevel: "strong", fitScore: 82 }),
    makeFamily({ familyId: "BC_INTL_GRAD", matchLevel: "weak", fitScore: 40 }),
  ])
  assert.equal(selected.length, 1)
})

test("selectRecommendedFamilies: strong top + possible second within 20 points => 2 cards", () => {
  const selected = selectRecommendedFamilies([
    makeFamily({ matchLevel: "strong", fitScore: 80 }),
    makeFamily({ familyId: "BC_INTL_GRAD", matchLevel: "possible", fitScore: 64 }),
  ])
  assert.equal(selected.length, 2)
})

test("selectRecommendedFamilies: possible top => 2 cards when second exists", () => {
  const selected = selectRecommendedFamilies([
    makeFamily({ matchLevel: "possible", fitScore: 58 }),
    makeFamily({ familyId: "BC_INTL_GRAD", matchLevel: "weak", fitScore: 30 }),
  ])
  assert.equal(selected.length, 2)
})

test("selectRecommendedFamilies: weak top => 2 cards when second exists", () => {
  const selected = selectRecommendedFamilies([
    makeFamily({ matchLevel: "weak", fitScore: 20 }),
    makeFamily({ familyId: "BC_INTL_GRAD", matchLevel: "weak", fitScore: 18 }),
  ])
  assert.equal(selected.length, 2)
})

test("mapFitLabel thresholds", () => {
  assert.equal(mapFitLabel(makeFamily({ fitScore: 80, baselineBadge: "pass" })), "High")
  assert.equal(mapFitLabel(makeFamily({ fitScore: 55, baselineBadge: "pass" })), "Medium")
  assert.equal(mapFitLabel(makeFamily({ fitScore: 30, baselineBadge: "pass" })), "Low")
  assert.equal(mapFitLabel(makeFamily({ fitScore: 92, baselineBadge: "fail" })), "Low")
})

test("mapConfidenceDisplay guardrail: baseline unclear + high => Medium", () => {
  assert.equal(mapConfidenceDisplay(makeFamily({ baselineBadge: "unclear", confidence: "high" })), "Medium")
  assert.equal(mapConfidenceDisplay(makeFamily({ baselineBadge: "pass", confidence: "high" })), "High")
})
