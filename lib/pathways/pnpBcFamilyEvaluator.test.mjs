import test from "node:test"
import assert from "node:assert/strict"
import { buildPNPSignals } from "./pnpSignals.ts"
import { buildPNPProvinceFinderSignals, mergeSignals } from "./pnpProvinceScope.ts"
import {
  buildBCProvinceFinderResult,
  buildMissingInfo,
  classifyMatchLevel,
  computeFamilyConfidence,
  scoreFamily,
} from "./pnpBcFamilyEvaluator.ts"

function buildFrom(mainAnswers, finderAnswers = {}) {
  const { signals: mainSignals, meta } = buildPNPSignals(mainAnswers)
  const finderSignals = buildPNPProvinceFinderSignals(finderAnswers)
  const combinedSignals = mergeSignals(mainSignals, finderSignals)
  return buildBCProvinceFinderResult({ combinedSignals, meta })
}

function buildSignals(mainAnswers, finderAnswers = {}) {
  const { signals: mainSignals, meta } = buildPNPSignals(mainAnswers)
  const finderSignals = buildPNPProvinceFinderSignals(finderAnswers)
  const combinedSignals = mergeSignals(mainSignals, finderSignals)
  return { combinedSignals, meta }
}

test("Fixture 1: Employer strong => strong match", () => {
  const result = buildFrom(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "inside-canada",
      currentStatus: "worker",
      statusExpiryDate: "2027-12-31",
      currentlyWorkingInCanada: "yes",
      has12MonthsCanadaSkilled: "yes",
      hasCanadianJobOffer: "yes",
      jobOfferProvinceTerritory: "British Columbia",
      jobOfferFullTime: "yes",
      jobOfferPermanent: "yes",
      employerWillSupportPNP: "yes",
      canadaEducationStatus: "no",
      languageTestStatus: "valid",
      canObtainEmployerLetter: "yes",
    },
    {
      teer_level_guess: "teer_1_professional_roles",
      employerSupport: "yes",
    },
  )

  const employer = result.evaluatedFamilies[0]
  assert.equal(employer.familyId, "BC_EMPLOYER_SKILLED")
  assert.equal(employer.baselineBadge, "pass")
  assert.ok(employer.fitScore >= 70)
  assert.ok(employer.confidence === "high" || employer.confidence === "medium")
  assert.equal(employer.matchLevel, "strong")
})

test("Fixture 2: Employer missing key details => possible match with missingInfo prompts", () => {
  const result = buildFrom(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "inside-canada",
      hasCanadianJobOffer: "yes",
      jobOfferProvinceTerritory: "British Columbia",
      jobOfferFullTime: "not_sure",
      jobOfferPermanent: "not_sure",
      employerWillSupportPNP: "not-sure",
      languageTestStatus: "booked",
    },
    {},
  )

  const employer = result.evaluatedFamilies.find((rec) => rec.familyId === "BC_EMPLOYER_SKILLED")
  assert.ok(employer)
  assert.equal(employer.baselineBadge, "unclear")
  assert.equal(employer.matchLevel, "possible")
  const promptText = employer.missingInfo.map((item) => item.prompt).join(" | ")
  assert.match(promptText, /full-time/i)
  assert.match(promptText, /permanent/i)
  assert.match(promptText, /(NOC|TEER)/i)
})

test("Fixture 3: Graduate strong => strong match", () => {
  const result = buildFrom(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "inside-canada",
      hasCanadianJobOffer: "yes",
      jobOfferProvinceTerritory: "British Columbia",
      jobOfferFullTime: "yes",
      jobOfferPermanent: "yes",
      canadaEducationStatus: "yes",
      canadianEducationProvinceTerritory: "British Columbia",
      canadianEducationPublicInstitution: "yes",
      programLength: "2-years",
      languageTestStatus: "valid",
      graduationYear: `${new Date().getFullYear() - 1}`,
    },
    {
      institutionType: "public",
      programAtLeast8Months: "yes",
      graduatedWithin3Years: "yes",
    },
  )

  const grad = result.evaluatedFamilies.find((rec) => rec.familyId === "BC_INTL_GRAD")
  assert.ok(grad)
  assert.equal(grad.baselineBadge, "pass")
  assert.ok(grad.fitScore >= 70)
  assert.equal(grad.matchLevel, "strong")
})

test("Fixture 4: No job offer + no Canadian education => both weak with blockers", () => {
  const result = buildFrom(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "outside-canada",
      hasCanadianJobOffer: "no",
      has12MonthsCanadaSkilled: "no",
      canadaEducationStatus: "no",
      languageTestStatus: "not_valid",
    },
    {},
  )

  assert.equal(result.evaluatedFamilies.length, 2)
  for (const family of result.evaluatedFamilies) {
    assert.equal(family.matchLevel, "weak")
    assert.ok(family.fitScore <= 35)
    assert.equal(family.baselineBadge, "fail")
    assert.ok(family.hardBlockers.length >= 1)
  }
})

test("classification guardrail: employer support no caps otherwise-strong profile to possible", () => {
  const { combinedSignals, meta } = buildSignals(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "inside-canada",
      hasCanadianJobOffer: "yes",
      jobOfferProvinceTerritory: "British Columbia",
      jobOfferFullTime: "yes",
      jobOfferPermanent: "yes",
      employerWillSupportPNP: "no",
      has12MonthsCanadaSkilled: "yes",
      languageTestStatus: "valid",
    },
    {
      teer_level_guess: "teer_1_professional_roles",
      employerSupport: "no",
    },
  )

  const fitScore = scoreFamily("BC_EMPLOYER_SKILLED", combinedSignals, meta).fitScore
  const confidence = computeFamilyConfidence("BC_EMPLOYER_SKILLED", combinedSignals, meta)
  const level = classifyMatchLevel({
    familyId: "BC_EMPLOYER_SKILLED",
    baselineBadge: "pass",
    fitScore,
    confidence,
    combinedSignals,
  })
  assert.equal(level, "possible")
})

test("buildMissingInfo prioritizes baseline missing first and de-dupes by id", () => {
  const { combinedSignals } = buildSignals(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "inside-canada",
      hasCanadianJobOffer: "yes",
      jobOfferProvinceTerritory: "British Columbia",
      jobOfferFullTime: "not_sure",
      jobOfferPermanent: "not_sure",
      employerWillSupportPNP: "not-sure",
    },
    {},
  )

  const missing = buildMissingInfo({
    familyId: "BC_EMPLOYER_SKILLED",
    baselineMissingRequired: [
      { id: "A_q_job_permanent", prompt: "Is your job offer permanent/ongoing (no end date)?", signalKeys: ["jobPermanent"] },
      { id: "A_q_teer", prompt: "Do you know your NOC code or TEER level?", signalKeys: ["teer", "nocCode"] },
    ],
    openQuestions: [
      { id: "A_q_job_permanent", prompt: "Is your job offer permanent/indeterminate (no end date)?", signalKeys: ["jobOfferPermanent"] },
      { id: "A_q_employer_support", prompt: "Can your employer support a nomination application?", signalKeys: ["employerSupportPNP"] },
    ],
    baselineBadge: "unclear",
    confidence: "medium",
    combinedSignals,
  })

  assert.ok(missing.length >= 2 && missing.length <= 4)
  assert.equal(missing[0].id, "A_q_job_permanent")
  assert.equal(missing.filter((item) => item.id === "A_q_job_permanent").length, 1)
})
