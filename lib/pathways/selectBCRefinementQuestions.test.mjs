import test from "node:test"
import assert from "node:assert/strict"
import { selectBCRefinementQuestions } from "./selectBCRefinementQuestions.ts"
import { buildPNPSignals } from "./pnpSignals.ts"
import { buildPNPProvinceFinderSignals, mergeSignals } from "./pnpProvinceScope.ts"

function buildSignals(mainAnswers, finderAnswers = {}) {
  const { signals: mainSignals } = buildPNPSignals(mainAnswers)
  const finderSignals = buildPNPProvinceFinderSignals(finderAnswers)
  return mergeSignals(mainSignals, finderSignals)
}

function makeEvaluation({
  familyId,
  matchLevel,
  confidence,
  missingInfo,
}) {
  const top = {
    familyId,
    title: familyId,
    shortDescription: "",
    fitScore: 50,
    confidence,
    baselineBadge: "unclear",
    hardBlockers: [],
    missingInfo,
    whyBullets: [],
    whyBulletIds: [],
    matchLevel,
  }
  const otherFamilyId = familyId === "BC_EMPLOYER_SKILLED" ? "BC_INTL_GRAD" : "BC_EMPLOYER_SKILLED"
  const other = {
    familyId: otherFamilyId,
    title: otherFamilyId,
    shortDescription: "",
    fitScore: 10,
    confidence: "low",
    baselineBadge: "fail",
    hardBlockers: [],
    missingInfo: [],
    whyBullets: [],
    whyBulletIds: [],
    matchLevel: "weak",
  }
  return {
    provinceCode: "BC",
    generatedAt: new Date().toISOString(),
    evaluatedFamilies: [top, other],
  }
}

test("Missing TEER + missing full-time/permanent returns those questions first", () => {
  const signals = buildSignals({
    primaryGoal: "pr",
    hasCanadianJobOffer: "yes",
    jobOfferProvinceTerritory: "British Columbia",
    jobOfferFullTime: "not-sure",
    jobOfferPermanent: "not-sure",
    languageTestStatus: "valid",
  })
  const evaluation = makeEvaluation({
    familyId: "BC_EMPLOYER_SKILLED",
    matchLevel: "possible",
    confidence: "medium",
    missingInfo: [
      { id: "m1", prompt: "Do you know your NOC code or TEER level?", signalKeys: ["teer", "nocCode"] },
      { id: "m2", prompt: "Is your job offer full-time (30+ hours/week)?", signalKeys: ["jobFullTime"] },
      { id: "m3", prompt: "Is your job offer permanent/ongoing (no end date)?", signalKeys: ["jobPermanent"] },
    ],
  })

  const selected = selectBCRefinementQuestions({ evaluation, signals, mode: "guided" })
  assert.deepEqual(selected.slice(0, 3).map((q) => q.id), ["teer_or_noc", "job_full_time", "job_permanent"])
})

test("Graduate target missing institution type asks institution-type refinement", () => {
  const signals = buildSignals({
    primaryGoal: "pr",
    canadaEducationStatus: "yes",
    languageTestStatus: "not_valid",
  })
  const evaluation = makeEvaluation({
    familyId: "BC_INTL_GRAD",
    matchLevel: "possible",
    confidence: "medium",
    missingInfo: [
      { id: "m1", prompt: "Was your institution public or private?", signalKeys: ["institutionType"] },
    ],
  })

  const selected = selectBCRefinementQuestions({ evaluation, signals, mode: "guided" })
  const ids = selected.map((q) => q.id)
  assert.ok(ids.includes("institution_type"))
  assert.ok(!ids.includes("language_test_status"))
})

test("Explore mode caps to 3 questions", () => {
  const signals = buildSignals({
    primaryGoal: "pr",
    hasCanadianJobOffer: "not-sure",
    canadaEducationStatus: "yes",
    languageTestStatus: "not_valid",
  })
  const evaluation = makeEvaluation({
    familyId: "BC_EMPLOYER_SKILLED",
    matchLevel: "possible",
    confidence: "low",
    missingInfo: [
      { id: "a", prompt: "Do you currently have a job offer from a BC employer?", signalKeys: ["hasJobOffer"] },
      { id: "b", prompt: "Which province is your job located in?", signalKeys: ["jobProvinceCode"] },
      { id: "c", prompt: "Do you know your NOC code or TEER level?", signalKeys: ["teer", "nocCode"] },
      { id: "d", prompt: "Is your job offer full-time (30+ hours/week)?", signalKeys: ["jobFullTime"] },
      { id: "e", prompt: "What’s your language test status?", signalKeys: ["languageTestStatus"] },
    ],
  })

  const selected = selectBCRefinementQuestions({ evaluation, signals, mode: "explore" })
  assert.ok(selected.length <= 3)
})

test("Strong match + confidence high returns no questions", () => {
  const signals = buildSignals({
    primaryGoal: "pr",
    hasCanadianJobOffer: "yes",
    jobOfferProvinceTerritory: "British Columbia",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    languageTestStatus: "valid",
  })
  const evaluation = makeEvaluation({
    familyId: "BC_EMPLOYER_SKILLED",
    matchLevel: "strong",
    confidence: "high",
    missingInfo: [
      { id: "a", prompt: "Do you know your NOC code or TEER level?", signalKeys: ["teer", "nocCode"] },
    ],
  })

  const selected = selectBCRefinementQuestions({ evaluation, signals, mode: "guided" })
  assert.deepEqual(selected, [])
})
