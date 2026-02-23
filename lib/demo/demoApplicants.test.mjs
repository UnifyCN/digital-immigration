import test from "node:test"
import assert from "node:assert/strict"
import { demoApplicants } from "./demoApplicants.ts"
import { isPNPInScope } from "../pnp-scope.ts"
import { buildPNPSignals } from "../pathways/pnpSignals.ts"
import { scorePNPRelevance } from "../pathways/pnpRelevanceScore.ts"
import { derivePNPConfidence } from "../pathways/pnpConfidence.ts"
import { buildPNPReadinessChecklistAll } from "../pathways/pnpReadinessChecklist.ts"
import { generatePNPOpenQuestions } from "../pathways/pnpOpenQuestions.ts"
import { generatePNPWhyBullets } from "../pathways/pnpWhyBullets.ts"

function getDemoOrThrow(id) {
  const demo = demoApplicants.find((entry) => entry.id === id)
  assert.ok(demo, `Missing demo applicant: ${id}`)
  return demo
}

function runPNPPipeline(answers) {
  const inScope = isPNPInScope(answers)
  const { signals, meta } = buildPNPSignals(answers)
  const scoring = scorePNPRelevance(signals, { unknownRate: meta.unknownRate })
  const confidence = derivePNPConfidence({
    score: scoring.score,
    unknownRate: meta.unknownRate,
    dampenersApplied: scoring.dampenersApplied,
  })
  const readinessChecklistAll = buildPNPReadinessChecklistAll({
    signals,
    meta: { unknownRate: meta.unknownRate },
  })
  const openQuestions = generatePNPOpenQuestions({
    signals,
    meta: { unknownRate: meta.unknownRate },
    dampenersApplied: scoring.dampenersApplied,
    confidenceLevel: confidence.confidenceLevel,
    readinessChecklistAll,
  })
  const why = generatePNPWhyBullets({
    signals,
    meta: { unknownRate: meta.unknownRate },
    dampenersApplied: scoring.dampenersApplied,
    confidenceLevel: confidence.confidenceLevel,
  })

  return { inScope, signals, meta, scoring, confidence, readinessChecklistAll, openQuestions, why }
}

test("demo applicants expose the two expected PNP fixtures", () => {
  assert.deepEqual(
    demoApplicants.map((demo) => demo.label),
    ["PNP eligible (High fit)", "Low PNP eligibility (Low fit)"],
  )
})

test("high-fit demo produces high-confidence PNP signals and strong why bullets", () => {
  const demo = getDemoOrThrow("pnp-high-fit")
  const result = runPNPPipeline(demo.answers)

  assert.equal(result.inScope, true)
  assert.ok(result.scoring.score >= 85)
  assert.equal(result.confidence.confidenceLevel, "high")
  assert.equal(result.scoring.dampenersApplied.length, 0)
  assert.ok(result.why.whyBullets.length >= 3)
})

test("low-fit demo produces low-confidence PNP signals with prioritized open questions", () => {
  const demo = getDemoOrThrow("pnp-low-fit")
  const result = runPNPPipeline(demo.answers)

  assert.equal(result.inScope, true)
  assert.ok(result.scoring.score <= 25)
  assert.equal(result.confidence.confidenceLevel, "low")
  assert.ok(result.openQuestions.openQuestions.length >= 4)
  assert.ok(result.openQuestions.openQuestionIds.includes("Q2_job_offer_unknown"))
  assert.ok(result.openQuestions.openQuestionIds.includes("Q1_province_preference_missing"))
})
