import test from "node:test"
import assert from "node:assert/strict"
import { applyBCRefinementAnswersToSignals } from "./applyBCRefinementAnswers.ts"
import { buildPNPSignals } from "./pnpSignals.ts"
import { buildPNPProvinceFinderSignals, mergeSignals } from "./pnpProvinceScope.ts"

function buildSignals(mainAnswers, finderAnswers = {}) {
  const { signals: mainSignals } = buildPNPSignals(mainAnswers)
  const finderSignals = buildPNPProvinceFinderSignals(finderAnswers)
  return mergeSignals(mainSignals, finderSignals)
}

test("maps refinement answers into evaluator signals deterministically", () => {
  const baseSignals = buildSignals({
    primaryGoal: "pr",
    hasCanadianJobOffer: "yes",
    languageTestStatus: "not_valid",
    canadaEducationStatus: "yes",
  })

  const next = applyBCRefinementAnswersToSignals(baseSignals, {
    teer_or_noc: "teer_2",
    job_full_time: "yes",
    job_permanent: "no",
    institution_type: "public",
    language_test_status: "booked",
    job_offer_exists: "yes",
    job_province: "BC",
  })

  assert.equal(next.teer, 2)
  assert.equal(next.teerSkillBand, "teer_0_3")
  assert.equal(next.jobOfferFullTime, "yes")
  assert.equal(next.jobOfferPermanent, "no")
  assert.equal(next.institutionType, "public")
  assert.equal(next.languageReady, "booked")
  assert.equal(next.hasJobOfferRefined, "yes")
  assert.equal(next.jobProvinceCode, "BC")
})

test("unknown refinement values do not overwrite known signals", () => {
  const baseSignals = buildSignals({
    primaryGoal: "pr",
    hasCanadianJobOffer: "yes",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    languageTestStatus: "valid",
    canadaEducationStatus: "yes",
    canadianEducationPublicInstitution: "yes",
  })

  const next = applyBCRefinementAnswersToSignals(baseSignals, {
    job_full_time: "not_sure",
    job_permanent: "not_sure",
    institution_type: "not_sure",
    job_offer_exists: "not_sure",
  })

  assert.equal(next.jobOfferFullTime, "yes")
  assert.equal(next.jobOfferPermanent, "yes")
  assert.equal(next.institutionType, null)
  assert.equal(next.publicInstitutionInCanada, "yes")
  assert.equal(next.hasJobOfferRefined, "yes")
})
