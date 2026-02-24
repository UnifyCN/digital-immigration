import type { ExpressEntryEligibilityResult, ExpressEntryReason, ExpressEntryReasonCode } from "../express-entry/types.ts"
import type { AssessmentData, AssessmentResults, PathwayCard, RiskFlag } from "../types.ts"

export type ExpressEntryPresentationStatus = "eligible" | "low_eligibility" | "not_eligible"

export interface ExpressEntryPathwayNextAction {
  label: string
  href?: string
  source: "missing_field" | "reason_code" | "alternative_pathway"
}

export interface ExpressEntryPathwayViewModel {
  status: ExpressEntryPresentationStatus
  statusBadgeLabel: string
  statusSummary: string
  qualifyingFactors: string[]
  missingOrWeakFactors: string[]
  failedCoreRequirements: string[]
  riskFlags: string[]
  nextActions: ExpressEntryPathwayNextAction[]
  alternativePathways: string[]
}

interface BuildExpressEntryPathwayViewModelInput {
  assessment: AssessmentData
  eligibility: ExpressEntryEligibilityResult
  resultsContext?: Pick<AssessmentResults, "pathways" | "riskFlags" | "nextSteps">
}

const ACTIONABLE_SOFT_INELIGIBLE_CODES = new Set<ExpressEntryReasonCode>([
  "work_history_missing",
  "work_role_fields_missing",
  "work_role_authorization_missing",
  "language_missing_or_invalid",
  "language_test_expired",
  "language_wrong_stream",
  "language_below_threshold",
  "cec_hours_below_minimum",
  "eca_missing_or_expired",
  "fsw_required_data_missing",
  "fsw_continuous_work_requirement_not_met",
  "fsw_education_requirement_not_met",
  "fsw_funds_details_missing",
  "fsw_funds_insufficient",
  "fsw_spouse_details_missing",
  "fsw_grid_below_pass_mark",
  "fst_hours_below_minimum",
  "fst_offer_or_certificate_missing",
  "fst_job_offer_validity_missing",
  "fst_required_data_missing",
])

const PATHWAY_LINKS: Record<string, string> = {
  pnp: "/assessment/results/pathways/pnp",
  "work-permit": "/assessment/results",
  "study-permit": "/assessment/results",
  sponsorship: "/assessment/results",
}

function dedupe(list: string[]): string[] {
  return Array.from(new Set(list.filter(Boolean).map((item) => item.trim()).filter(Boolean)))
}

function collectReasons(eligibility: ExpressEntryEligibilityResult): ExpressEntryReason[] {
  return [
    ...eligibility.programs.cec.reasonDetails,
    ...eligibility.programs.fsw.reasonDetails,
    ...eligibility.programs.fst.reasonDetails,
  ]
}

function hasHardInadmissibilityBlockers(assessment: AssessmentData): boolean {
  return (
    assessment.criminalCharges === "yes" ||
    assessment.misrepresentation === "yes" ||
    assessment.medicalIssues === "yes"
  )
}

function isSoftIneligible(
  assessment: AssessmentData,
  eligibility: ExpressEntryEligibilityResult,
  reasons: ExpressEntryReason[],
): boolean {
  if (eligibility.overallStatus !== "ineligible") return false
  if (hasHardInadmissibilityBlockers(assessment)) return false

  return reasons.some(
    (reason) =>
      reason.actionability === "actionable" &&
      ACTIONABLE_SOFT_INELIGIBLE_CODES.has(reason.code),
  )
}

function toPresentationStatus(
  assessment: AssessmentData,
  eligibility: ExpressEntryEligibilityResult,
  reasons: ExpressEntryReason[],
): ExpressEntryPresentationStatus {
  if (eligibility.overallStatus === "eligible") return "eligible"
  if (eligibility.overallStatus === "needs_more_info") return "low_eligibility"
  if (isSoftIneligible(assessment, eligibility, reasons)) return "low_eligibility"
  return "not_eligible"
}

function badgeForStatus(status: ExpressEntryPresentationStatus): string {
  if (status === "eligible") return "Express Entry Eligible"
  if (status === "low_eligibility") return "Needs Improvement"
  return "Not Currently Eligible"
}

function summaryForStatus(
  status: ExpressEntryPresentationStatus,
  reasons: ExpressEntryReason[],
  eligibility: ExpressEntryEligibilityResult,
): string {
  const topMissing = eligibility.missingFields[0]?.label
  const topFail = reasons.find((reason) => reason.kind === "fail")?.message

  if (status === "eligible") {
    const eligiblePrograms = [
      eligibility.programs.cec.status === "eligible" ? "CEC" : "",
      eligibility.programs.fsw.status === "eligible" ? "FSW" : "",
      eligibility.programs.fst.status === "eligible" ? "FST" : "",
    ].filter(Boolean)

    return eligiblePrograms.length > 0
      ? `You meet the minimum eligibility for ${eligiblePrograms.join(", ")} under the current rule set.`
      : "You currently meet the minimum Express Entry eligibility based on your submitted profile."
  }

  if (status === "low_eligibility") {
    if (topMissing) {
      return `Your profile is close, but key details are missing (starting with ${topMissing.toLowerCase()}).`
    }
    if (topFail) {
      return `Your profile needs improvement before eligibility is met: ${topFail}`
    }
    return "Your profile needs targeted improvements before Express Entry eligibility can be finalized."
  }

  if (topFail) {
    return `Minimum Express Entry program requirements are not currently met: ${topFail}`
  }
  return "Minimum Express Entry program requirements are not currently met based on the submitted data."
}

function actionForReasonCode(code: ExpressEntryReasonCode): { label: string; href?: string } | null {
  switch (code) {
    case "language_missing_or_invalid":
    case "language_test_expired":
    case "language_wrong_stream":
    case "language_below_threshold":
      return { label: "Update/retake your language test and enter valid General-stream scores.", href: "/assessment?step=6" }
    case "eca_missing_or_expired":
      return { label: "Complete or renew your ECA and add issue date/equivalency details.", href: "/assessment?step=5" }
    case "work_history_missing":
    case "work_role_fields_missing":
    case "work_role_authorization_missing":
      return { label: "Complete detailed work-role records (NOC, TEER, dates, hours, authorization).", href: "/assessment?step=4" }
    case "cec_hours_below_minimum":
      return { label: "Accumulate additional qualifying Canadian skilled work hours for CEC.", href: "/assessment?step=4" }
    case "fsw_continuous_work_requirement_not_met":
      return { label: "Document at least one continuous year of qualifying skilled paid work for FSW.", href: "/assessment?step=4" }
    case "fsw_education_requirement_not_met":
      return { label: "Add a qualifying education credential (minimum secondary or above).", href: "/assessment?step=5" }
    case "fsw_funds_details_missing":
    case "fsw_funds_insufficient":
      return { label: "Update proof-of-funds details (family size and available settlement funds).", href: "/assessment?step=7" }
    case "fsw_spouse_details_missing":
      return { label: "Complete spouse accompanying factors to finalize FSW adaptability points.", href: "/assessment?step=7" }
    case "fsw_grid_below_pass_mark":
      return { label: "Improve language/work/education factors to raise your FSW 67-point score.", href: "/assessment?step=6" }
    case "fst_offer_or_certificate_missing":
    case "fst_job_offer_validity_missing":
      return { label: "Add a valid trade offer/certificate path and complete offer validity details.", href: "/assessment?step=4" }
    case "fst_hours_below_minimum":
      return { label: "Accumulate additional qualifying skilled-trade work hours for FST.", href: "/assessment?step=4" }
    default:
      return null
  }
}

function toAlternativePathways(pathways: PathwayCard[] | undefined): ExpressEntryPathwayNextAction[] {
  if (!pathways?.length) return []

  return pathways
    .filter((pathway) => pathway.id !== "express-entry")
    .slice(0, 3)
    .map((pathway) => {
      const detail = pathway.whatNext[0] ?? pathway.whyRelevant[0] ?? "Review this pathway against your profile."
      return {
        label: `Explore ${pathway.name}: ${detail}`,
        href: PATHWAY_LINKS[pathway.id],
        source: "alternative_pathway" as const,
      }
    })
}

function toRiskFlags(
  reasons: ExpressEntryReason[],
  contextRiskFlags: RiskFlag[] | undefined,
  assessment: AssessmentData,
): string[] {
  const reasonRisks = reasons
    .filter((reason) => reason.kind === "fail" || reason.kind === "warning")
    .map((reason) => reason.message)

  const structuralRisks = (contextRiskFlags ?? []).map((flag) => flag.label)

  const inadmissibilitySignals: string[] = []
  if (assessment.criminalCharges === "yes") inadmissibilitySignals.push("Criminal charges/convictions may block admissibility.")
  if (assessment.medicalIssues === "yes") inadmissibilitySignals.push("Medical admissibility concerns require professional review.")
  if (assessment.misrepresentation === "yes") inadmissibilitySignals.push("Misrepresentation concerns can lead to refusal and long-term bans.")

  return dedupe([...reasonRisks, ...structuralRisks, ...inadmissibilitySignals]).slice(0, 8)
}

function extractQualifyingFactors(
  reasons: ExpressEntryReason[],
  eligibility: ExpressEntryEligibilityResult,
): string[] {
  const passReasons = reasons.filter((reason) => reason.kind === "pass").map((reason) => reason.message)

  const programPasses = [
    eligibility.programs.cec.status === "eligible" ? "Meets Canadian Experience Class (CEC) minimum requirements." : "",
    eligibility.programs.fsw.status === "eligible" ? "Meets Federal Skilled Worker (FSW) minimum requirements." : "",
    eligibility.programs.fst.status === "eligible" ? "Meets Federal Skilled Trades (FST) minimum requirements." : "",
  ]

  return dedupe([...programPasses, ...passReasons]).slice(0, 6)
}

function extractWeakFactors(
  reasons: ExpressEntryReason[],
  eligibility: ExpressEntryEligibilityResult,
): string[] {
  const reasonWeaknesses = reasons
    .filter((reason) => reason.kind === "missing" || reason.kind === "warning" || reason.kind === "fail")
    .filter((reason) => reason.actionability === "actionable")
    .map((reason) => reason.message)

  const missingFieldWeaknesses = eligibility.missingFields.map(
    (field) => `Missing required detail: ${field.label}.`,
  )

  return dedupe([...missingFieldWeaknesses, ...reasonWeaknesses]).slice(0, 8)
}

function extractFailedCoreRequirements(reasons: ExpressEntryReason[]): string[] {
  return dedupe(
    reasons
      .filter((reason) => reason.kind === "fail")
      .map((reason) => reason.message),
  ).slice(0, 8)
}

function nextActions(
  eligibility: ExpressEntryEligibilityResult,
  reasons: ExpressEntryReason[],
  pathwayAlternatives: ExpressEntryPathwayNextAction[],
): ExpressEntryPathwayNextAction[] {
  const actions: ExpressEntryPathwayNextAction[] = []

  for (const field of eligibility.missingFields.slice(0, 6)) {
    actions.push({
      label: `Complete ${field.label}.`,
      href: field.href,
      source: "missing_field",
    })
  }

  const actionableByCode = dedupe(
    reasons
      .filter((reason) => reason.actionability === "actionable")
      .map((reason) => reason.code),
  )

  for (const code of actionableByCode) {
    const mapped = actionForReasonCode(code as ExpressEntryReasonCode)
    if (!mapped) continue
    if (actions.some((action) => action.label === mapped.label)) continue
    actions.push({
      ...mapped,
      source: "reason_code",
    })
  }

  for (const alt of pathwayAlternatives) {
    if (actions.some((action) => action.label === alt.label)) continue
    actions.push(alt)
  }

  return actions.slice(0, 8)
}

export function buildExpressEntryPathwayViewModel({
  assessment,
  eligibility,
  resultsContext,
}: BuildExpressEntryPathwayViewModelInput): ExpressEntryPathwayViewModel {
  const reasons = collectReasons(eligibility)
  const status = toPresentationStatus(assessment, eligibility, reasons)
  const alternatives = toAlternativePathways(resultsContext?.pathways)

  const qualifyingFactors = extractQualifyingFactors(reasons, eligibility)
  const missingOrWeakFactors = extractWeakFactors(reasons, eligibility)
  const failedCoreRequirements = extractFailedCoreRequirements(reasons)

  const deterministicFallbackAlternatives =
    alternatives.length > 0
      ? alternatives
      : [
          {
            label: "Explore Provincial Nominee Program options while improving your Express Entry profile.",
            href: "/assessment/results/pathways/pnp",
            source: "alternative_pathway" as const,
          },
        ]

  return {
    status,
    statusBadgeLabel: badgeForStatus(status),
    statusSummary: summaryForStatus(status, reasons, eligibility),
    qualifyingFactors,
    missingOrWeakFactors,
    failedCoreRequirements,
    riskFlags: toRiskFlags(reasons, resultsContext?.riskFlags, assessment),
    nextActions: nextActions(eligibility, reasons, deterministicFallbackAlternatives),
    alternativePathways: deterministicFallbackAlternatives.map((alt) => alt.label),
  }
}
