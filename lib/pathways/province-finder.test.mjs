import test from "node:test"
import assert from "node:assert/strict"
import {
  computeProvinceRecommendations,
  formatProvinceShortlistSummary,
  isCompleteProvinceFinderAnswers,
  topProvinceRecommendations,
} from "./provinceFinder.ts"

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

test("alignment labels follow boundary thresholds at 45 and 70", () => {
  const exploratoryInput = {
    employerSupport: "yes",
    employerEmployeesInProvince: "not_sure",
    monthsWithEmployer: "1plus",
    hourlyWage: 5,
    ruralJobLocation: "yes",
    institutionType: "unsure",
    programAtLeast8Months: "no",
    graduatedWithin3Years: "no",
    willingOutsideMajorCities: "no",
    committedToResideProvince: "unsure",
    occupationRegulated: "yes",
    licensureStatus: "in_progress",
    priorNomination: "yes",
    priorPNPRefusal: "no",
    settlementFunds: "no",
    frenchIntermediatePlus: "no",
    prioritySectorEmployer: "no",
  }
  const moderateInput = {
    employerSupport: "no",
    employerEmployeesInProvince: "50plus",
    monthsWithEmployer: "lt3",
    hourlyWage: -1,
    ruralJobLocation: "no",
    institutionType: "public",
    programAtLeast8Months: "not_sure",
    graduatedWithin3Years: "yes",
    willingOutsideMajorCities: "no",
    committedToResideProvince: "unsure",
    occupationRegulated: "not_sure",
    licensureStatus: "yes",
    priorNomination: "no",
    priorPNPRefusal: "no",
    settlementFunds: "yes",
    frenchIntermediatePlus: "no",
    prioritySectorEmployer: "yes",
  }
  const strongInput = {
    employerSupport: "yes",
    employerEmployeesInProvince: "5to50",
    monthsWithEmployer: "1plus",
    hourlyWage: 20,
    ruralJobLocation: "yes",
    institutionType: "unsure",
    programAtLeast8Months: "yes",
    graduatedWithin3Years: "yes",
    willingOutsideMajorCities: "no",
    committedToResideProvince: "unsure",
    occupationRegulated: "yes",
    licensureStatus: "in_progress",
    priorNomination: "no",
    priorPNPRefusal: "yes",
    settlementFunds: "yes",
    frenchIntermediatePlus: "yes",
    prioritySectorEmployer: "not_sure",
  }
  const justBelowStrongInput = {
    employerSupport: "not_sure",
    employerEmployeesInProvince: "5to50",
    monthsWithEmployer: "1plus",
    hourlyWage: 5,
    ruralJobLocation: "yes",
    institutionType: "public",
    programAtLeast8Months: "not_sure",
    graduatedWithin3Years: "yes",
    willingOutsideMajorCities: "yes",
    committedToResideProvince: "no",
    occupationRegulated: "no",
    licensureStatus: "in_progress",
    priorNomination: "yes",
    priorPNPRefusal: "yes",
    settlementFunds: "not_sure",
    frenchIntermediatePlus: "yes",
    prioritySectorEmployer: "not_sure",
  }

  const exploratoryTop = computeProvinceRecommendations(exploratoryInput)[0]
  const moderateTop = computeProvinceRecommendations(moderateInput)[0]
  const strongTop = computeProvinceRecommendations(strongInput)[0]
  const justBelowStrongTop = computeProvinceRecommendations(justBelowStrongInput)[0]

  assert.equal(exploratoryTop.alignmentScore, 44)
  assert.equal(exploratoryTop.alignmentLabel, "Exploratory")
  assert.equal(moderateTop.alignmentScore, 45)
  assert.equal(moderateTop.alignmentLabel, "Moderate alignment")
  assert.equal(justBelowStrongTop.alignmentScore, 69)
  assert.equal(justBelowStrongTop.alignmentLabel, "Moderate alignment")
  assert.equal(strongTop.alignmentScore, 70)
  assert.equal(strongTop.alignmentLabel, "Strong alignment")
})

test("all-no profile stays in low alignment range with floor-safe scores", () => {
  const answers = {
    employerSupport: "no",
    employerEmployeesInProvince: "lt5",
    monthsWithEmployer: "lt3",
    hourlyWage: 0,
    ruralJobLocation: "no",
    institutionType: "private",
    programAtLeast8Months: "no",
    graduatedWithin3Years: "no",
    willingOutsideMajorCities: "no",
    committedToResideProvince: "no",
    occupationRegulated: "yes",
    licensureStatus: "no",
    priorNomination: "yes",
    priorPNPRefusal: "yes",
    settlementFunds: "no",
    frenchIntermediatePlus: "no",
    prioritySectorEmployer: "no",
  }

  const recommendations = computeProvinceRecommendations(answers)
  assert.equal(recommendations.length, 5)
  for (const recommendation of recommendations) {
    assert.ok(recommendation.alignmentScore >= 0)
    assert.ok(recommendation.alignmentScore < 45)
    assert.equal(recommendation.alignmentLabel, "Exploratory")
  }
})

test("hourly wage null and -1 do not add wage points or wage bullet", () => {
  const nullWageRecommendations = computeProvinceRecommendations({
    ...buildBaseAnswers(),
    hourlyWage: null,
  })
  const negativeWageRecommendations = computeProvinceRecommendations({
    ...buildBaseAnswers(),
    hourlyWage: -1,
  })

  assert.deepEqual(
    nullWageRecommendations.map((item) => item.alignmentScore),
    negativeWageRecommendations.map((item) => item.alignmentScore),
  )
  assert.ok(
    nullWageRecommendations.every(
      (item) =>
        !item.whyBullets.includes(
          "You provided wage information, which is commonly requested during stream matching.",
        ),
    ),
  )
})

test("prior refusal applies penalty and produces explicit penalty reason/risk flag", () => {
  const noRefusal = computeProvinceRecommendations({
    ...buildBaseAnswers(),
    priorPNPRefusal: "no",
  })
  const withRefusal = computeProvinceRecommendations({
    ...buildBaseAnswers(),
    priorPNPRefusal: "yes",
  })

  const noRefusalByProvince = Object.fromEntries(noRefusal.map((item) => [item.provinceCode, item]))
  const hasPenaltyBullet = withRefusal.some((item) =>
    item.whyBullets.includes("A prior provincial refusal may reduce alignment until refusal issues are addressed."),
  )

  for (const recommendation of withRefusal) {
    const baseline = noRefusalByProvince[recommendation.provinceCode]
    assert.ok(recommendation.alignmentScore < baseline.alignmentScore)
    assert.ok(
      recommendation.riskFlags.includes(
        "Prior provincial refusal reported; review refusal reasons before reapplying.",
      ),
    )
  }
  assert.equal(hasPenaltyBullet, true)
})

test("topProvinceRecommendations enforces minimum count and keeps sorted top items", () => {
  const topOne = topProvinceRecommendations(buildBaseAnswers(), 0)
  const topThree = topProvinceRecommendations(buildBaseAnswers(), 3)
  const full = computeProvinceRecommendations(buildBaseAnswers())

  assert.equal(topOne.length, 1)
  assert.equal(topThree.length, 3)
  assert.equal(topThree[0].provinceCode, full[0].provinceCode)
  assert.equal(topThree[1].provinceCode, full[1].provinceCode)
  assert.equal(topThree[2].provinceCode, full[2].provinceCode)
})

test("formatProvinceShortlistSummary builds expected shortlist text", () => {
  const recommendations = topProvinceRecommendations(buildBaseAnswers(), 3)
  const summary = formatProvinceShortlistSummary(recommendations)

  assert.match(summary, /^[A-Z]{2} \((Strong|Moderate|Exploratory)\), [A-Z]{2} \((Strong|Moderate|Exploratory)\), [A-Z]{2} \((Strong|Moderate|Exploratory)\)$/)
  assert.equal(formatProvinceShortlistSummary([]), "")
})

test("isCompleteProvinceFinderAnswers distinguishes complete and incomplete drafts", () => {
  const completeDraft = { ...buildBaseAnswers() }
  const incompleteDraft = { ...buildBaseAnswers() }
  delete incompleteDraft.prioritySectorEmployer

  assert.equal(isCompleteProvinceFinderAnswers(completeDraft), true)
  assert.equal(isCompleteProvinceFinderAnswers(incompleteDraft), false)
})
