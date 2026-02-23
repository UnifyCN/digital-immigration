import test from "node:test"
import assert from "node:assert/strict"
import { buildPNPSignals, EXPIRING_SOON_DAYS, KEY_FIELDS } from "./pnpSignals.ts"

function datePlusDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

test("example: PR-intent profile with active job offer builds expected core signals", () => {
  const answers = {
    primaryGoal: "pr",
    openToPNP: "yes",
    geographicFlexibility: "prefer-specific",
    preferredProvince: "Ontario",
    currentJobProvinceTerritory: "Ontario",
    jobOfferProvinceTerritory: "Ontario",
    currentLocation: "inside-canada",
    currentStatus: "worker",
    statusExpiryDate: datePlusDays(20),
    hasAppliedToExtendStatus: "yes",
    hasValidTemporaryStatus: "yes",
    temporaryStatusType: "work-permit-open",
    temporaryStatusExpiryDate: datePlusDays(120),
    currentlyWorkingInCanada: "yes",
    sameEmployerForPermanentOffer: "yes",
    has12MonthsCanadaSkilled: "yes",
    canadianWorkAuthorizedAll: "yes",
    hoursPerWeekRange: "30plus",
    paidWorkStatus: "yes",
    employmentType: "employee",
    hasCanadianJobOffer: "yes",
    jobOfferFullTime: "yes",
    jobOfferPermanent: "yes",
    jobOfferCompensation: "42",
    jobOfferCompensationType: "hourly",
    jobOfferTenure: "1-2-years",
    employerWillSupportPNP: "yes",
    occupationCategory: "it-software-data",
    jobDuties: "Develops and maintains production systems.",
    educationLevel: "bachelors",
    educationCountry: "India",
    graduationYear: "2018",
    ecaStatus: "yes",
    educationCompletedInCanada: "no",
    canadaEducationStatus: "no",
    canadianEducationPublicInstitution: "not-sure",
    programLength: "3-plus-years",
    refusalHistory: "no",
    priorApplications: "no",
    canObtainEmployerLetter: "yes",
    hasOverlappingPeriods: "no",
    employmentGaps: "no",
    deadlineTrigger: "status-expiring",
    deadlineDate: datePlusDays(30),
  }

  const { signals, meta } = buildPNPSignals(answers)
  assert.equal(signals.pursuingPR, true)
  assert.equal(signals.hasJobOffer, "yes")
  assert.equal(signals.employerSupportPNP, "yes")
  assert.equal(signals.statusExpiringSoon, true)
  assert.equal(signals.jobDutiesProvided, true)
  assert.equal(meta.keyFieldsTotal, KEY_FIELDS.length)
})

test("example: non-PR goal excludes conditional job-offer subfields when no offer", () => {
  const answers = {
    primaryGoal: "study-permit",
    openToPNP: "no",
    currentLocation: "outside-canada",
    currentStatus: "other",
    statusExpiryDate: "",
    currentlyWorkingInCanada: "no",
    has12MonthsCanadaSkilled: "no",
    hasCanadianJobOffer: "no",
    employerWillSupportPNP: "yes",
    canadaEducationStatus: "mix-some-in-canada",
    canadianEducationPublicInstitution: "yes",
    programLength: "1-year",
    refusalHistory: "another-country",
    canObtainEmployerLetter: "unsure",
  }

  const { signals } = buildPNPSignals(answers)
  assert.equal(signals.pursuingPR, false)
  assert.equal(signals.anyEducationInCanada, "yes")
  assert.equal(signals.hasRefusals, "yes")
  assert.equal(signals.canGetReferenceLetter, "not_sure")
  assert.equal(signals.jobOfferFullTime, null)
  assert.equal(signals.employerSupportPNP, null)
})

test("example: unknown handling and meta unknownRate counts only KEY_FIELDS", () => {
  const answers = {
    primaryGoal: "not-sure",
    openToPNP: "not-sure",
    currentLocation: "inside-canada",
    currentStatus: "",
    statusExpiryDate: "",
    currentlyWorkingInCanada: "unsure",
    has12MonthsCanadaSkilled: "not_sure",
    hasCanadianJobOffer: "",
    canadaEducationStatus: "not-sure",
    canadianEducationPublicInstitution: "",
    programLength: "",
    refusalHistory: "unsure",
    canObtainEmployerLetter: "",
  }

  const { signals, meta } = buildPNPSignals(answers)
  assert.equal(signals.pursuingPR, true)
  assert.equal(signals.openToPNP, "not_sure")
  assert.equal(signals.currentlyWorkingInCanada, "not_sure")
  assert.equal(meta.keyFieldsTotal, 14)
  assert.equal(meta.unknownCount, 13)
  assert.equal(meta.unknownRate, 13 / 14)
})

test("example: statusExpiringSoon is false outside threshold", () => {
  const answers = {
    statusExpiryDate: datePlusDays(EXPIRING_SOON_DAYS + 10),
  }

  const { signals } = buildPNPSignals(answers)
  assert.equal(signals.statusExpiringSoon, false)
})

test("example: occupationOtherText only set for Other occupation category", () => {
  const { signals: otherSignals } = buildPNPSignals({
    occupationCategory: "other",
    occupationCategoryOtherRole: "Aircraft maintenance planner",
  })
  const { signals: nonOtherSignals } = buildPNPSignals({
    occupationCategory: "engineering",
    occupationCategoryOtherRole: "Should not pass through",
  })

  assert.equal(otherSignals.occupationOtherText, "Aircraft maintenance planner")
  assert.equal(nonOtherSignals.occupationOtherText, null)
})
