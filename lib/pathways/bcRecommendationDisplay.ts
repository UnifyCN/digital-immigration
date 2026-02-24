import type { EvaluatedFamily, FamilyConfidence, StreamFamilyId } from "../rules/pnp/bcFamilies.ts"
import type { BaselineBadge } from "../rules/pnp/bcHardChecks.ts"
import { LABELS } from "../copy/compliance.ts"

export type FitLabel = "High" | "Medium" | "Low"
export type DisplayConfidenceLabel = "High" | "Medium" | "Low"

export function selectRecommendedFamilies(evaluatedFamilies: EvaluatedFamily[]): EvaluatedFamily[] {
  if (evaluatedFamilies.length === 0) return []
  const top = evaluatedFamilies[0]
  const second = evaluatedFamilies[1]

  if (!second) return [top]

  if (top.matchLevel === "strong") {
    const scoreGap = top.fitScore - second.fitScore
    if (second.matchLevel === "possible" && scoreGap <= 20) return [top, second]
    return [top]
  }

  if (top.matchLevel === "possible") return [top, second]
  return [top, second]
}

export function mapFitLabel(family: EvaluatedFamily): FitLabel {
  if (family.baselineBadge === "fail") return "Low"
  if (family.fitScore >= 70) return "High"
  if (family.fitScore >= 45) return "Medium"
  return "Low"
}

export function mapBaselineDisplay(
  baselineBadge: BaselineBadge,
): { icon: "✅" | "⚠️" | "❌"; label: string } {
  if (baselineBadge === "pass") return LABELS.baseline.pass
  if (baselineBadge === "unclear") return LABELS.baseline.unclear
  return LABELS.baseline.fail
}

function confidenceToDisplay(confidence: FamilyConfidence): DisplayConfidenceLabel {
  if (confidence === "high") return "High"
  if (confidence === "medium") return "Medium"
  return "Low"
}

export function mapConfidenceDisplay(family: EvaluatedFamily): DisplayConfidenceLabel {
  if (family.baselineBadge === "unclear" && family.confidence === "high") return "Medium"
  return confidenceToDisplay(family.confidence)
}

export function getFamilyDetailsRoute(familyId: StreamFamilyId): string {
  if (familyId === "BC_EMPLOYER_SKILLED") {
    return "/assessment/results/pathways/pnp/bc/employer-skilled"
  }
  return "/assessment/results/pathways/pnp/bc/international-graduate"
}
