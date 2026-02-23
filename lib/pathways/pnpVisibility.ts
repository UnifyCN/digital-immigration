import type { PNPConfidenceLevel } from "./pnpConfidence"

export const PNP_VISIBLE_RANK_HIGH = 20
export const PNP_VISIBLE_RANK_MEDIUM = 40
export const PNP_VISIBLE_RANK_LOW = 60
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

  const displayRank =
    params.confidenceLevel === "high"
      ? PNP_VISIBLE_RANK_HIGH
      : params.confidenceLevel === "medium"
        ? PNP_VISIBLE_RANK_MEDIUM
        : PNP_VISIBLE_RANK_LOW

  return {
    shouldShowPNP: true,
    visibilityMode: "visible",
    visibilityReasonCode: "pr_goal_in_scope",
    displayRank,
  }
}
