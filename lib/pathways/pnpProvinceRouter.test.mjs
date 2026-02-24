import test from "node:test"
import assert from "node:assert/strict"
import { getPNPProvinceRouterDecision } from "./pnpProvinceRouter.ts"

test("in scope, score 60, confidence high => guided with no banner", () => {
  const decision = getPNPProvinceRouterDecision({
    pnpInScope: true,
    pnpFitScore: 60,
    pnpConfidence: "high",
  })

  assert.equal(decision.allowProvinceRefinement, true)
  assert.equal(decision.mode, "guided")
  assert.equal(decision.bannerStyle, "none")
  assert.equal(decision.primaryCTA, "Refine BC Options")
  assert.equal(decision.routeTo, "/assessment/results/pathways/pnp/province-finder")
  assert.equal(decision.provinceCode, "BC")
})

test("in scope, score 60, confidence low => guided with info banner and top missing items", () => {
  const decision = getPNPProvinceRouterDecision({
    pnpInScope: true,
    pnpFitScore: 60,
    pnpConfidence: "low",
    missingItems: [
      { id: "q1", prompt: "Q1" },
      { id: "q2", prompt: "Q2" },
      { id: "q3", prompt: "Q3" },
      { id: "q4", prompt: "Q4" },
    ],
  })

  assert.equal(decision.mode, "guided")
  assert.equal(decision.bannerStyle, "info")
  assert.equal(decision.bannerTitle, "We need a few details to confirm fit")
  assert.equal(decision.bannerMissingItems?.length, 3)
  assert.deepEqual(decision.bannerMissingItems?.map((item) => item.id), ["q1", "q2", "q3"])
})

test("in scope, score 30 => explore with warning and low-fit CTA", () => {
  const decision = getPNPProvinceRouterDecision({
    pnpInScope: true,
    pnpFitScore: 30,
    pnpConfidence: "medium",
  })

  assert.equal(decision.mode, "explore")
  assert.equal(decision.bannerStyle, "warning")
  assert.equal(decision.bannerTitle, "Low PNP Fit (Exploratory)")
  assert.equal(decision.primaryCTA, "Explore BC Options (Low Fit)")
})

test("not in scope => explore with PR warning banner", () => {
  const decision = getPNPProvinceRouterDecision({
    pnpInScope: false,
    pnpFitScore: 80,
    pnpConfidence: "high",
  })

  assert.equal(decision.allowProvinceRefinement, true)
  assert.equal(decision.mode, "explore")
  assert.equal(decision.bannerStyle, "warning")
  assert.equal(decision.bannerTitle, "PNP is mainly for Permanent Residence")
  assert.equal(decision.primaryCTA, "Explore BC PNP (Optional)")
})
