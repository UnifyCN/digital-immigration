import test from "node:test"
import assert from "node:assert/strict"
import { buildPNPReadinessChecklistAll } from "./pnpReadinessChecklist.ts"
import { buildPNPDocumentRoadmap } from "./pnpDocumentRoadmap.ts"

function baseSignals() {
  return {
    primaryGoal: "pr",
    pursuingPR: true,
    openToPNP: "yes",
    settleFlexibility: "preferProvince",
    hasProvincePreference: true,
    preferredProvince: "Ontario",
    currentJobProvince: null,
    jobOfferProvince: null,
    currentLocation: "outside-canada",
    currentStatus: null,
    statusExpiryDate: null,
    statusExpiringSoon: false,
    appliedToExtendWaiting: null,
    holdsValidTempStatus: null,
    tempStatusType: null,
    tempStatusExpiry: null,
    currentlyWorkingInCanada: "no",
    sameEmployerAsPermanentOffer: null,
    canadianSkilledWork12mo: "no",
    canadianWorkAuthorized: null,
    avgHoursPerWeek: null,
    workPaid: null,
    workType: null,
    hasJobOffer: "no",
    jobOfferFullTime: null,
    jobOfferPermanent: null,
    jobOfferCompAmount: null,
    jobOfferCompType: null,
    workedForEmployerDuration: null,
    employerSupportPNP: null,
    occupationCategory: null,
    occupationOtherText: null,
    jobDutiesProvided: false,
    highestEducationLevel: "bachelors",
    educationCountry: "India",
    graduationYear: "2018",
    maritalStatus: "single",
    hasDependents: false,
    ecaCompleted: "yes",
    educationCompletedInCanada: "no",
    anyEducationInCanada: "no",
    educationProvinceInCanada: null,
    publicInstitutionInCanada: null,
    programLength: "3-plus-years",
    hasRefusals: "no",
    refusalMostRecentType: null,
    refusalMostRecentDate: null,
    priorCanadianApplications: null,
    canGetReferenceLetter: "no",
    referenceLetterChallenge: null,
    hasOverlappingWorkOrWorkStudy: null,
    hasEmploymentGaps: null,
    deadlineDriver: null,
    deadlineDate: null,
    languageReady: "not_ready",
  }
}

test("Case 1: inside Canada with language valid and reference letters yes marks key typical docs ready", () => {
  const signals = {
    ...baseSignals(),
    currentLocation: "inside-canada",
    currentStatus: "worker",
    statusExpiryDate: "2027-01-01",
    statusExpiringSoon: false,
    canGetReferenceLetter: "yes",
    languageReady: "valid",
  }
  const readinessChecklistAll = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.1 } })
  const roadmap = buildPNPDocumentRoadmap({ signals, readinessChecklistAll, openQuestions: [] })

  const statusDoc = roadmap.typical.find((item) => item.id === "proof_status_in_canada")
  const languageDoc = roadmap.typical.find((item) => item.id === "language_test_results")
  const workDoc = roadmap.typical.find((item) => item.id === "work_reference_letters")

  assert.ok(statusDoc)
  assert.equal(statusDoc.status, "ready")
  assert.equal(languageDoc?.status, "ready")
  assert.equal(workDoc?.status, "ready")
})

test("Case 2: outside Canada with no job offer excludes status proof and job-offer docs", () => {
  const signals = {
    ...baseSignals(),
    currentLocation: "outside-canada",
    hasJobOffer: "no",
  }
  const readinessChecklistAll = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.1 } })
  const roadmap = buildPNPDocumentRoadmap({ signals, readinessChecklistAll, openQuestions: [] })

  assert.ok(!roadmap.typical.some((item) => item.id === "proof_status_in_canada"))
  assert.ok(!roadmap.sometimes.some((item) => item.id === "job_offer_documents"))
  const fundsDoc = roadmap.sometimes.find((item) => item.id === "proof_of_funds")
  assert.ok(fundsDoc)
  assert.equal(fundsDoc.status, "conditional")
})

test("Case 3: job offer yes with missing full-time/permanent marks job offer docs needs_action", () => {
  const signals = {
    ...baseSignals(),
    hasJobOffer: "yes",
    jobOfferFullTime: null,
    jobOfferPermanent: null,
  }
  const readinessChecklistAll = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.1 } })
  const roadmap = buildPNPDocumentRoadmap({ signals, readinessChecklistAll, openQuestions: [] })

  const jobOfferDocs = roadmap.sometimes.find((item) => item.id === "job_offer_documents")
  assert.ok(jobOfferDocs)
  assert.equal(jobOfferDocs.status, "needs_action")
})
