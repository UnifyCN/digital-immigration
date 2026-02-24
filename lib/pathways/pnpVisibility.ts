import { getDisplayPriority, type PNPConfidenceLevel } from "./pnpConfidence.ts"

export const PNP_HIDDEN_RANK = 999

export function derivePNPVisibility(params: {
  inScope: boolean
  confidenceLevel: PNPConfidenceLevel
}): {
  shouldShowPNP: boolean
  visibilityMode: "visible" | "hidden"
  visibilityReasonCode: string
  displayRank: number
} {
  if (!params.inScope) {
    return {
      shouldShowPNP: false,
      visibilityMode: "hidden",
      visibilityReasonCode: "not_in_pr_scope",
      displayRank: PNP_HIDDEN_RANK,
    }
  }

  const displayRank = getDisplayPriority(params.confidenceLevel)

  return {
    shouldShowPNP: true,
    visibilityMode: "visible",
    visibilityReasonCode: "pr_goal_in_scope",
    displayRank,
  }
}
