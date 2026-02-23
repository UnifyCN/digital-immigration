import test from "node:test"
import assert from "node:assert/strict"
import { buildPNPSignals } from "./pnpSignals.ts"
import { buildPNPProvinceFinderSignals, mergeSignals } from "./pnpProvinceScope.ts"
import { buildBCProvinceFinderResult } from "./pnpBcFamilyEvaluator.ts"

function buildFrom(mainAnswers, finderAnswers = {}) {
  const { signals: mainSignals, meta } = buildPNPSignals(mainAnswers)
  const finderSignals = buildPNPProvinceFinderSignals(finderAnswers)
  const combinedSignals = mergeSignals(mainSignals, finderSignals)
  return buildBCProvinceFinderResult({ combinedSignals, meta })
}

test("Case 1: strong employer case ranks employer family first with high fit", () => {
  const result = buildFrom(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "inside-canada",
      currentStatus: "worker",
      statusExpiryDate: "2026-12-31",
      currentlyWorkingInCanada: "yes",
      has12MonthsCanadaSkilled: "yes",
      hasCanadianJobOffer: "yes",
      jobOfferProvinceTerritory: "British Columbia",
      jobOfferFullTime: "yes",
      jobOfferPermanent: "yes",
      employerWillSupportPNP: "yes",
      canadaEducationStatus: "no",
      canadianEducationPublicInstitution: "no",
      programLength: "2-years",
      refusalHistory: "no",
      canObtainEmployerLetter: "yes",
      languageTestStatus: "valid",
    },
    {
      teer_level_guess: "teer_1_professional_roles",
      employerSupport: "yes",
    },
  )

  assert.equal(result.recommendations[0].familyId, "BC_EMPLOYER_SKILLED")
  assert.ok(result.recommendations[0].fitScore >= 85)
  assert.ok(result.recommendations[0].confidence === "high" || result.recommendations[0].confidence === "medium")
})

test("Case 2: strong graduate case ranks graduate family first", () => {
  const result = buildFrom(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "inside-canada",
      currentStatus: "worker",
      statusExpiryDate: "2026-12-31",
      currentlyWorkingInCanada: "yes",
      has12MonthsCanadaSkilled: "no",
      hasCanadianJobOffer: "yes",
      jobOfferProvinceTerritory: "British Columbia",
      jobOfferFullTime: "yes",
      jobOfferPermanent: "no",
      employerWillSupportPNP: "not-sure",
      canadaEducationStatus: "yes",
      canadianEducationProvinceTerritory: "British Columbia",
      canadianEducationPublicInstitution: "yes",
      programLength: "2-years",
      refusalHistory: "no",
      canObtainEmployerLetter: "yes",
      languageTestStatus: "valid",
      graduationYear: `${new Date().getFullYear() - 1}`,
    },
    {
      institutionType: "public",
      programAtLeast8Months: "yes",
      graduatedWithin3Years: "yes",
    },
  )

  assert.equal(result.recommendations[0].familyId, "BC_INTL_GRAD")
  assert.ok(result.recommendations[0].fitScore >= 75)
})

test("Case 3: outside Canada + no ties returns low-fit families with open questions", () => {
  const result = buildFrom(
    {
      primaryGoal: "pr",
      openToPNP: "yes",
      currentLocation: "outside-canada",
      currentStatus: "other",
      statusExpiryDate: "",
      currentlyWorkingInCanada: "no",
      has12MonthsCanadaSkilled: "no",
      hasCanadianJobOffer: "no",
      employerWillSupportPNP: "no",
      canadaEducationStatus: "no",
      canadianEducationPublicInstitution: "no",
      programLength: "not-sure",
      refusalHistory: "no",
      canObtainEmployerLetter: "not-sure",
      languageTestStatus: "not_valid",
    },
    {},
  )

  assert.equal(result.recommendations.length, 2)
  assert.ok(result.recommendations.every((rec) => rec.fitScore < 35))
  assert.ok(result.recommendations.every((rec) => rec.openQuestions.length >= 2))
})

test("Case 4: many unknowns keeps confidence low and asks key missing questions", () => {
  const result = buildFrom(
    {
      primaryGoal: "pr",
      openToPNP: "not-sure",
      currentLocation: "outside-canada",
      hasCanadianJobOffer: "not-sure",
      has12MonthsCanadaSkilled: "not_sure",
      canadaEducationStatus: "not-sure",
      languageTestStatus: "booked",
      refusalHistory: "unsure",
      canObtainEmployerLetter: "unsure",
      programLength: "not-sure",
    },
    {},
  )

  const employer = result.recommendations.find((rec) => rec.familyId === "BC_EMPLOYER_SKILLED")
  const grad = result.recommendations.find((rec) => rec.familyId === "BC_INTL_GRAD")
  assert.ok(employer)
  assert.ok(grad)
  assert.equal(employer.confidence, "low")
  assert.equal(grad.confidence, "low")
  assert.ok(employer.openQuestions.some((q) => q.id.startsWith("A_q_job_offer")))
  assert.ok(grad.openQuestions.some((q) => q.id.startsWith("B_q_canadian_education")))
})
