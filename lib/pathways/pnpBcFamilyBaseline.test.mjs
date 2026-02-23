import test from "node:test"
import assert from "node:assert/strict"
import { buildPNPSignals } from "./pnpSignals.ts"
import { buildPNPProvinceFinderSignals, mergeSignals } from "./pnpProvinceScope.ts"
import { evaluateFamilyBaseline } from "./pnpBcFamilyBaseline.ts"

function buildCombined(mainAnswers, finderAnswers = {}) {
  const { signals } = buildPNPSignals(mainAnswers)
  const finderSignals = buildPNPProvinceFinderSignals(finderAnswers)
  return mergeSignals(signals, finderSignals)
}

test("Employer family fail: hasJobOffer=no => badge fail with job offer blocker", () => {
  const combined = buildCombined({
    hasCanadianJobOffer: "no",
    jobOfferProvinceTerritory: "British Columbia",
    languageTestStatus: "valid",
  })

  const baseline = evaluateFamilyBaseline("BC_EMPLOYER_SKILLED", combined)
  assert.equal(baseline.badge, "fail")
  assert.ok(
    baseline.hardBlockers.includes(
      "No job offer was reported, which can limit employer-driven options.",
    ),
  )
})

test("Employer family unclear: job offer + teer unknown => badge unclear with missing prompts", () => {
  const combined = buildCombined({
    hasCanadianJobOffer: "not-sure",
    languageTestStatus: "booked",
  })

  const baseline = evaluateFamilyBaseline("BC_EMPLOYER_SKILLED", combined)
  assert.equal(baseline.badge, "unclear")
  const prompts = baseline.missingRequired.map((item) => item.prompt)
  assert.ok(prompts.includes("Do you currently have a job offer from a BC employer?"))
  assert.ok(prompts.includes("Do you know your NOC code or TEER level?"))
})

test("Graduate family pass: education+public+8mo+within3Years+bcAnchor => badge pass", () => {
  const combined = buildCombined(
    {
      canadaEducationStatus: "yes",
      canadianEducationProvinceTerritory: "British Columbia",
      canadianEducationPublicInstitution: "yes",
      hasCanadianJobOffer: "yes",
      jobOfferProvinceTerritory: "British Columbia",
      languageTestStatus: "valid",
    },
    {
      institutionType: "public",
      programAtLeast8Months: "yes",
      graduatedWithin3Years: "yes",
    },
  )

  const baseline = evaluateFamilyBaseline("BC_INTL_GRAD", combined)
  assert.equal(baseline.badge, "pass")
})

test("Graduate family fail: educationInCanada=no => badge fail", () => {
  const combined = buildCombined({
    canadaEducationStatus: "no",
    hasCanadianJobOffer: "yes",
    jobOfferProvinceTerritory: "British Columbia",
    languageTestStatus: "valid",
  })

  const baseline = evaluateFamilyBaseline("BC_INTL_GRAD", combined)
  assert.equal(baseline.badge, "fail")
  assert.ok(
    baseline.hardBlockers.includes(
      "Canadian education was not reported, which can limit graduate options.",
    ),
  )
})
