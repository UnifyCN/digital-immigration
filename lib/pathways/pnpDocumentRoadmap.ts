import type { OpenQuestion } from "./pnpOpenQuestions"
import type { ChecklistItem } from "./pnpReadinessChecklist"
import type { PNPSignals } from "./pnpSignals"

export type DocumentItemStatus = "ready" | "needs_action" | "conditional" | "later_stage"
export type DocumentCategory = "typical" | "sometimes" | "later"

export type DocumentItem = {
  id: string
  label: string
  category: DocumentCategory
  status: DocumentItemStatus
  note?: string
  signalKeys?: string[]
  reasonCodes?: string[]
}

type ChecklistIndex = Record<string, ChecklistItem>

type DocumentRuleContext = {
  signals: PNPSignals
  checklistById: ChecklistIndex
  openQuestions: OpenQuestion[]
}

type DocumentRule = {
  id: string
  label: string
  category: DocumentCategory
  signalKeys: string[]
  when: (ctx: DocumentRuleContext) => boolean
  status: (ctx: DocumentRuleContext) => DocumentItemStatus
  note: (ctx: DocumentRuleContext) => string
}

function hasChecklistStatus(
  checklistById: ChecklistIndex,
  id: string,
  statuses: ChecklistItem["status"][],
): boolean {
  const item = checklistById[id]
  return Boolean(item && statuses.includes(item.status))
}

function isInsideCanadaApplicable(checklistById: ChecklistIndex): boolean {
  const status = checklistById.status_in_canada?.status
  return Boolean(status && status !== "na")
}

export const PNP_DOCUMENT_RULES: DocumentRule[] = [
  {
    id: "passport_identity",
    label: "Passport + identity documents",
    category: "typical",
    signalKeys: [],
    when: () => true,
    status: () => "ready",
    note: () => "A valid passport or travel document is typically needed.",
  },
  {
    id: "education_docs",
    label: "Education documents (degree/diploma + transcripts)",
    category: "typical",
    signalKeys: ["education_details"],
    when: () => true,
    status: ({ checklistById }) =>
      hasChecklistStatus(checklistById, "education_details", ["complete"]) ? "ready" : "needs_action",
    note: ({ checklistById }) =>
      hasChecklistStatus(checklistById, "education_details", ["complete"])
        ? "You’ve provided education details; keep supporting documents available."
        : "Education documents help support your education history.",
  },
  {
    id: "eca_report",
    label: "ECA report (if required)",
    category: "typical",
    signalKeys: ["anyEducationInCanada"],
    when: () => true,
    status: ({ signals }) => (signals.anyEducationInCanada === "yes" ? "conditional" : "needs_action"),
    note: ({ signals }) =>
      signals.anyEducationInCanada === "yes"
        ? "May be required depending on your education and pathway."
        : "Foreign education may require an ECA in many PR contexts.",
  },
  {
    id: "language_test_results",
    label: "Language test results (valid)",
    category: "typical",
    signalKeys: ["languageReady"],
    when: () => true,
    status: ({ signals }) => (signals.languageReady === "valid" ? "ready" : "needs_action"),
    note: ({ signals }) =>
      signals.languageReady === "valid"
        ? "Most pathways require valid language results."
        : "Language results are commonly required; plan to obtain valid results.",
  },
  {
    id: "work_reference_letters",
    label: "Work reference letters (duties/hours/pay/dates)",
    category: "typical",
    signalKeys: ["canGetReferenceLetter"],
    when: () => true,
    status: ({ signals }) => (signals.canGetReferenceLetter === "yes" ? "ready" : "needs_action"),
    note: ({ signals }) =>
      signals.canGetReferenceLetter === "yes"
        ? "Reference letters help document your work history."
        : "Letters typically need duties, hours, pay, and dates.",
  },
  {
    id: "proof_status_in_canada",
    label: "Proof of status in Canada (if inside Canada)",
    category: "typical",
    signalKeys: ["status_in_canada", "currentLocation", "currentStatus", "statusExpiryDate"],
    when: ({ checklistById }) => isInsideCanadaApplicable(checklistById),
    status: ({ checklistById }) =>
      hasChecklistStatus(checklistById, "status_in_canada", ["complete"]) ? "ready" : "needs_action",
    note: ({ checklistById }) =>
      hasChecklistStatus(checklistById, "status_in_canada", ["complete"])
        ? "Status documents help confirm your legal status in Canada."
        : "Confirm your status type and expiry documents if applicable.",
  },
  {
    id: "civil_status_docs",
    label: "Civil status documents (marriage/divorce, children, etc.)",
    category: "typical",
    signalKeys: ["maritalStatus", "hasDependents"],
    when: () => true,
    status: ({ signals }) =>
      signals.maritalStatus !== null || signals.hasDependents !== null ? "ready" : "conditional",
    note: ({ signals }) =>
      signals.maritalStatus !== null || signals.hasDependents !== null
        ? "Civil status documents may be needed depending on your situation."
        : "May be needed depending on marital/family situation.",
  },
  {
    id: "proof_of_funds",
    label: "Proof of funds (sometimes required)",
    category: "sometimes",
    signalKeys: ["hasJobOffer", "status_in_canada"],
    when: () => true,
    status: () => "conditional",
    note: () => "May be required depending on your situation and program requirements.",
  },
  {
    id: "job_offer_documents",
    label: "Job offer documents (if applicable)",
    category: "sometimes",
    signalKeys: ["hasJobOffer", "jobOfferFullTime", "jobOfferPermanent"],
    when: ({ signals }) => signals.hasJobOffer === "yes",
    status: ({ signals }) =>
      signals.jobOfferFullTime === "yes" && signals.jobOfferPermanent === "yes"
        ? "ready"
        : "needs_action",
    note: ({ signals }) =>
      signals.jobOfferFullTime === "yes" && signals.jobOfferPermanent === "yes"
        ? "Keep a signed job offer letter and employer details available."
        : "Confirm your job offer details and keep the offer letter available.",
  },
  {
    id: "employer_support_letter",
    label: "Employer support letter (if applicable)",
    category: "sometimes",
    signalKeys: ["hasJobOffer", "employerSupportPNP"],
    when: ({ signals }) =>
      signals.hasJobOffer === "yes" &&
      (signals.employerSupportPNP === "yes" ||
        signals.employerSupportPNP === "not_sure" ||
        signals.employerSupportPNP == null),
    status: ({ signals }) => (signals.employerSupportPNP === "yes" ? "conditional" : "needs_action"),
    note: ({ signals }) =>
      signals.employerSupportPNP === "yes"
        ? "If your employer supports nomination, written support may be required."
        : "May be needed depending on employer participation requirements.",
  },
  {
    id: "nomination_certificate",
    label: "Provincial nomination certificate (if nominated)",
    category: "sometimes",
    signalKeys: [],
    when: () => true,
    status: () => "conditional",
    note: () => "Only applicable if you receive a nomination from a province.",
  },
  {
    id: "police_certificates",
    label: "Police certificates",
    category: "later",
    signalKeys: [],
    when: () => true,
    status: () => "later_stage",
    note: () => "Typically requested later during federal processing.",
  },
  {
    id: "medical_exam",
    label: "Medical exam",
    category: "later",
    signalKeys: [],
    when: () => true,
    status: () => "later_stage",
    note: () => "Usually completed after instructions during processing.",
  },
  {
    id: "biometrics",
    label: "Biometrics",
    category: "later",
    signalKeys: [],
    when: () => true,
    status: () => "later_stage",
    note: () => "May be requested later if applicable.",
  },
]

export function buildPNPDocumentRoadmap(params: {
  signals: PNPSignals
  readinessChecklistAll: ChecklistItem[]
  openQuestions?: OpenQuestion[]
}): { typical: DocumentItem[]; sometimes: DocumentItem[]; later: DocumentItem[] } {
  const checklistById = Object.fromEntries(
    params.readinessChecklistAll.map((item) => [item.id, item]),
  ) as ChecklistIndex
  const ctx: DocumentRuleContext = {
    signals: params.signals,
    checklistById,
    openQuestions: params.openQuestions ?? [],
  }
  void ctx.openQuestions

  const typical: DocumentItem[] = []
  const sometimes: DocumentItem[] = []
  const later: DocumentItem[] = []

  for (const rule of PNP_DOCUMENT_RULES) {
    if (!rule.when(ctx)) continue
    const item: DocumentItem = {
      id: rule.id,
      label: rule.label,
      category: rule.category,
      status: rule.status(ctx),
      note: rule.note(ctx),
      signalKeys: rule.signalKeys,
    }

    if (rule.category === "typical") {
      typical.push(item)
    } else if (rule.category === "sometimes") {
      sometimes.push(item)
    } else {
      later.push(item)
    }
  }

  return { typical, sometimes, later }
}
