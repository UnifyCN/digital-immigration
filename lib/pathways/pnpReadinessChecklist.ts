import type { PNPSignals } from "./pnpSignals"
import { isProvinceDirected } from "./pnpProvinceDirection.ts"

export type ChecklistStatus = "complete" | "attention" | "unknown" | "na"

export type ChecklistItem = {
  id: string
  label: string
  status: ChecklistStatus
  shortText: string
  reasonCodes?: string[]
}

function normalizeLocation(value: string | null): "inside" | "outside" | "unknown" {
  if (!value) return "unknown"
  const normalized = value.trim().toLowerCase()
  if (normalized === "insidecanada" || normalized === "inside-canada") return "inside"
  if (normalized === "outsidecanada" || normalized === "outside-canada") return "outside"
  return "unknown"
}

function hasProvinceDirection(signals: PNPSignals): boolean {
  return isProvinceDirected(signals)
}

function buildProvinceDirectionItem(signals: PNPSignals): ChecklistItem {
  const complete = hasProvinceDirection(signals)
  return {
    id: "province_direction",
    label: "Province direction",
    status: complete ? "complete" : "unknown",
    shortText: complete
      ? "You provided a province preference."
      : "PNP is province-based; a province preference improves accuracy.",
  }
}

function buildEmploymentBasisItem(signals: PNPSignals): ChecklistItem {
  const hasAnyEmploymentSignalYes =
    signals.hasJobOffer === "yes" ||
    signals.currentlyWorkingInCanada === "yes" ||
    signals.canadianSkilledWork12mo === "yes"
  const hasAnyEmploymentSignalNotSure =
    signals.hasJobOffer === "not_sure" ||
    signals.currentlyWorkingInCanada === "not_sure" ||
    signals.canadianSkilledWork12mo === "not_sure"

  if (hasAnyEmploymentSignalYes) {
    return {
      id: "employment_basis",
      label: "Employment basis",
      status: "complete",
      shortText: "You provided employment details that may support some PNP options.",
    }
  }

  if (hasAnyEmploymentSignalNotSure) {
    return {
      id: "employment_basis",
      label: "Employment basis",
      status: "attention",
      shortText: "Some employment details are unclear; confirming job/work information can improve accuracy.",
    }
  }

  return {
    id: "employment_basis",
    label: "Employment basis",
    status: "unknown",
    shortText: "Employment ties often matter for PNP; add job/work details if available.",
  }
}

function buildWorkDocumentationItem(signals: PNPSignals): ChecklistItem {
  const hasChallenge = Boolean(signals.referenceLetterChallenge && signals.referenceLetterChallenge.trim().length > 0)

  if (signals.canGetReferenceLetter === "yes") {
    return {
      id: "work_documentation",
      label: "Work documentation",
      status: "complete",
      shortText: "You indicated you can obtain proper employment documentation.",
    }
  }

  if (signals.canGetReferenceLetter === "not_sure" || signals.canGetReferenceLetter === "no" || hasChallenge) {
    return {
      id: "work_documentation",
      label: "Work documentation",
      status: "attention",
      shortText: "Employment documentation may be difficult; this can affect readiness.",
    }
  }

  return {
    id: "work_documentation",
    label: "Work documentation",
    status: "unknown",
    shortText: "Confirm whether you can obtain an employment verification/reference letter.",
  }
}

function buildLanguageReadinessItem(signals: PNPSignals): ChecklistItem {
  if (signals.languageReady === "valid") {
    return {
      id: "language_readiness",
      label: "Language test readiness",
      status: "complete",
      shortText: "You have a valid language test result.",
    }
  }

  if (signals.languageReady === "booked") {
    return {
      id: "language_readiness",
      label: "Language test readiness",
      status: "attention",
      shortText: "You have a planned language test, which is an important step.",
    }
  }

  return {
    id: "language_readiness",
    label: "Language test readiness",
    status: "unknown",
    shortText: "Most pathways require a language test; consider booking one.",
  }
}

function buildEducationDetailsItem(signals: PNPSignals): ChecklistItem {
  const anyEducationKnown =
    Boolean(signals.highestEducationLevel) ||
    Boolean(signals.educationCountry) ||
    Boolean(signals.graduationYear) ||
    signals.anyEducationInCanada !== null

  return {
    id: "education_details",
    label: "Education details",
    status: anyEducationKnown ? "complete" : "unknown",
    shortText: anyEducationKnown
      ? "You provided education details."
      : "Add your education background to improve accuracy.",
  }
}

function buildStatusInCanadaItem(signals: PNPSignals): ChecklistItem {
  const location = normalizeLocation(signals.currentLocation)
  if (location === "outside") {
    return {
      id: "status_in_canada",
      label: "Status in Canada",
      status: "na",
      shortText: "Not applicable because you are currently outside Canada.",
    }
  }

  if (location === "inside") {
    if (signals.appliedToExtendWaiting === "yes" || signals.statusExpiringSoon) {
      return {
        id: "status_in_canada",
        label: "Status in Canada",
        status: "attention",
        shortText: "Your status may be time-sensitive or pending; plan carefully.",
      }
    }

    if (
      Boolean(signals.currentStatus && signals.currentStatus.trim().length > 0) &&
      Boolean(signals.statusExpiryDate && signals.statusExpiryDate.trim().length > 0) &&
      signals.statusExpiringSoon === false
    ) {
      return {
        id: "status_in_canada",
        label: "Status in Canada",
        status: "complete",
        shortText: "You provided your status type and expiry information.",
      }
    }

    return {
      id: "status_in_canada",
      label: "Status in Canada",
      status: "unknown",
      shortText: "Confirm your current status type and expiry date.",
    }
  }

  return {
    id: "status_in_canada",
    label: "Status in Canada",
    status: "unknown",
    shortText: "Confirm your current status type and expiry date.",
  }
}

function buildPRGoalConfirmedItem(signals: PNPSignals): ChecklistItem {
  if (signals.pursuingPR === true) {
    return {
      id: "pr_goal_confirmed",
      label: "PR goal confirmed",
      status: "complete",
      shortText: "You’re exploring Permanent Residence, so PNP is relevant to review.",
    }
  }

  if (!signals.primaryGoal) {
    return {
      id: "pr_goal_confirmed",
      label: "PR goal confirmed",
      status: "unknown",
      shortText: "Confirm whether you’re pursuing PR to assess PNP fit.",
    }
  }

  return {
    id: "pr_goal_confirmed",
    label: "PR goal confirmed",
    status: "attention",
    shortText: "Your goal does not currently indicate PR; PNP may not be relevant.",
  }
}

export function buildPNPReadinessChecklistAll(params: {
  signals: PNPSignals
  meta: { unknownRate: number }
}): ChecklistItem[] {
  // `unknownRate` is intentionally accepted for API stability with other builders.
  void params.meta.unknownRate

  return [
    buildProvinceDirectionItem(params.signals),
    buildEmploymentBasisItem(params.signals),
    buildWorkDocumentationItem(params.signals),
    buildLanguageReadinessItem(params.signals),
    buildEducationDetailsItem(params.signals),
    buildStatusInCanadaItem(params.signals),
    buildPRGoalConfirmedItem(params.signals),
  ]
}

export function selectPNPReadinessChecklistForDisplay(
  allItems: ChecklistItem[],
  signals: PNPSignals,
): ChecklistItem[] {
  const byId = new Map(allItems.map((item) => [item.id, item]))
  const selected: ChecklistItem[] = []
  const pushIfPresent = (id: string) => {
    const item = byId.get(id)
    if (item && !selected.some((existing) => existing.id === id)) selected.push(item)
  }

  pushIfPresent("province_direction")
  pushIfPresent("employment_basis")
  pushIfPresent("work_documentation")
  pushIfPresent("language_readiness")

  const location = normalizeLocation(signals.currentLocation)
  const preferredFifth = location === "inside" ? "status_in_canada" : "education_details"
  pushIfPresent(preferredFifth)

  if (selected.length < 5) pushIfPresent("education_details")
  if (selected.length < 5) pushIfPresent("status_in_canada")
  if (selected.length < 5) pushIfPresent("pr_goal_confirmed")

  return selected.slice(0, 5)
}
