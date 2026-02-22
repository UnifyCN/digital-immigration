import test from "node:test"
import assert from "node:assert/strict"
import { computeProvinceRecommendations } from "./provinceFinder.ts"

function buildBaseAnswers() {
  return {
    employerSupport: "yes",
    employerEmployeesInProvince: "50plus",
    monthsWithEmployer: "1plus",
    hourlyWage: 32,
    ruralJobLocation: "no",
    institutionType: "public",
    programAtLeast8Months: "yes",
    graduatedWithin3Years: "yes",
    willingOutsideMajorCities: "maybe",
    committedToResideProvince: "yes",
    occupationRegulated: "no",
    licensureStatus: "yes",
    priorNomination: "no",
    priorPNPRefusal: "no",
    settlementFunds: "yes",
    frenchIntermediatePlus: "no",
    prioritySectorEmployer: "yes",
  }
}

test("rural-forward answers favor SK/MB in top ranks", () => {
  const answers = {
    ...buildBaseAnswers(),
    ruralJobLocation: "yes",
    willingOutsideMajorCities: "yes",
    institutionType: "private",
    frenchIntermediatePlus: "no",
  }

  const recommendations = computeProvinceRecommendations(answers)
  const topTwoCodes = recommendations.slice(0, 2).map((item) => item.provinceCode)

  assert.ok(topTwoCodes.includes("SK"))
  assert.ok(topTwoCodes.includes("MB"))
})

test("French + public recent grad profile keeps ON in top recommendations", () => {
  const answers = {
    ...buildBaseAnswers(),
    frenchIntermediatePlus: "yes",
    institutionType: "public",
    graduatedWithin3Years: "yes",
    ruralJobLocation: "no",
    willingOutsideMajorCities: "no",
  }

  const recommendations = computeProvinceRecommendations(answers)
  assert.equal(recommendations[0].provinceCode, "ON")
  assert.ok(recommendations[0].alignmentScore >= recommendations[1].alignmentScore)
})
