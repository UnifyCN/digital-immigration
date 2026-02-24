import test from "node:test"
import assert from "node:assert/strict"
import {
  buildPNPReadinessChecklistAll,
  selectPNPReadinessChecklistForDisplay,
} from "./pnpReadinessChecklist.ts"
import { basePNPSignals } from "./testFixtures.ts"

function datePlusDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

test("Case 1: inside Canada strong info displays status_in_canada as fifth item complete", () => {
  const signals = {
    ...basePNPSignals(),
    currentLocation: "inside-canada",
    currentStatus: "worker",
    statusExpiryDate: "2027-01-10",
    statusExpiringSoon: false,
    settleFlexibility: "prefer-specific",
    hasJobOffer: "yes",
    canGetReferenceLetter: "yes",
    languageReady: "valid",
  }

  const all = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.1 } })
  const display = selectPNPReadinessChecklistForDisplay(all, signals)
  const ids = display.map((item) => item.id)

  assert.equal(display.length, 5)
  assert.deepEqual(ids, [
    "province_direction",
    "employment_basis",
    "work_documentation",
    "language_readiness",
    "status_in_canada",
  ])
  assert.equal(display[4].status, "complete")
})

test("Case 2: outside Canada uses education_details as fifth and keeps status_in_canada as na in all items", () => {
  const signals = {
    ...basePNPSignals(),
    currentLocation: "outside-canada",
    highestEducationLevel: "bachelors",
  }

  const all = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.1 } })
  const display = selectPNPReadinessChecklistForDisplay(all, signals)

  assert.equal(display[4].id, "education_details")
  const statusInCanada = all.find((item) => item.id === "status_in_canada")
  assert.ok(statusInCanada)
  assert.equal(statusInCanada.status, "na")
  assert.ok(!display.some((item) => item.id === "status_in_canada"))
})

test("Case 3: inside Canada with expiry soon or extension pending marks status_in_canada attention", () => {
  const signals = {
    ...basePNPSignals(),
    currentLocation: "inside-canada",
    currentStatus: "worker",
    statusExpiryDate: datePlusDays(30),
    statusExpiringSoon: true,
  }

  const all = buildPNPReadinessChecklistAll({ signals, meta: { unknownRate: 0.1 } })
  const display = selectPNPReadinessChecklistForDisplay(all, signals)
  const statusItem = display.find((item) => item.id === "status_in_canada")

  assert.ok(statusItem)
  assert.equal(statusItem.status, "attention")
})

test("Case 4: work documentation status maps missing=>unknown and no=>attention", () => {
  const unknownSignals = {
    ...basePNPSignals(),
    canGetReferenceLetter: null,
    referenceLetterChallenge: null,
  }
  const attentionSignals = {
    ...basePNPSignals(),
    canGetReferenceLetter: "no",
    referenceLetterChallenge: null,
  }

  const unknownAll = buildPNPReadinessChecklistAll({ signals: unknownSignals, meta: { unknownRate: 0.1 } })
  const attentionAll = buildPNPReadinessChecklistAll({ signals: attentionSignals, meta: { unknownRate: 0.1 } })
  const unknownItem = unknownAll.find((item) => item.id === "work_documentation")
  const attentionItem = attentionAll.find((item) => item.id === "work_documentation")

  assert.ok(unknownItem)
  assert.equal(unknownItem.status, "unknown")
  assert.equal(
    unknownItem.shortText,
    "Confirm whether you can obtain an employment verification/reference letter.",
  )

  assert.ok(attentionItem)
  assert.equal(attentionItem.status, "attention")
  assert.equal(
    attentionItem.shortText,
    "Employment documentation may be difficult; this can affect readiness.",
  )
})
