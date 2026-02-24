export const SCORE_THRESHOLD_HIGH = 70
export const SCORE_THRESHOLD_MEDIUM = 45

export const UNKNOWN_RATE_FORCE_LOW_THRESHOLD = 0.7
export const UNKNOWN_RATE_CAP_HIGH_THRESHOLD = 0.5

export const PNP_CONFIDENCE_DISPLAY_PRIORITY: Record<PNPConfidenceLevel, number> = {
  high: 20,
  medium: 40,
  low: 60,
}

export const CONFIDENCE_LABELS = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low (Exploratory)",
} as const

export type PNPConfidenceLevel = "high" | "medium" | "low"
export type PNPRecommendationMode = "recommended" | "explore" | "later"

type DerivePNPConfidenceParams = {
  score: number
  unknownRate: number
  dampenersApplied: string[]
}

type DerivePNPConfidenceResult = {
  confidenceLevel: PNPConfidenceLevel
  confidenceLabel: string
  confidenceReasonCodes: string[]
  recommendationMode: PNPRecommendationMode
  displayPriority: number
}

function getBaseConfidence(score: number): PNPConfidenceLevel {
  if (score >= SCORE_THRESHOLD_HIGH) return "high"
  if (score >= SCORE_THRESHOLD_MEDIUM) return "medium"
  return "low"
}

function getRecommendationMode(confidenceLevel: PNPConfidenceLevel): PNPRecommendationMode {
  if (confidenceLevel === "high") return "recommended"
  if (confidenceLevel === "medium") return "explore"
  return "later"
}

export function getDisplayPriority(confidenceLevel: PNPConfidenceLevel): number {
  return PNP_CONFIDENCE_DISPLAY_PRIORITY[confidenceLevel]
}

export function derivePNPConfidence(
  params: DerivePNPConfidenceParams,
): DerivePNPConfidenceResult {
  const reasonCodes: string[] = []
  let finalConfidence = getBaseConfidence(params.score)

  if (params.unknownRate > UNKNOWN_RATE_FORCE_LOW_THRESHOLD) {
    finalConfidence = "low"
    reasonCodes.push("cap_to_low_due_to_extreme_unknown_rate")
  } else if (params.unknownRate > UNKNOWN_RATE_CAP_HIGH_THRESHOLD) {
    if (finalConfidence === "high") {
      finalConfidence = "medium"
    }
    reasonCodes.push("cap_high_due_to_high_unknown_rate")
  }

  if (params.dampenersApplied.includes("no_canadian_ties")) {
    finalConfidence = "low"
    reasonCodes.push("cap_to_low_due_to_no_canadian_ties")
  }

  if (params.dampenersApplied.includes("prior_refusal")) {
    if (finalConfidence === "high") {
      finalConfidence = "medium"
    }
    reasonCodes.push("downgrade_due_to_prior_refusal")
  }

  return {
    confidenceLevel: finalConfidence,
    confidenceLabel: CONFIDENCE_LABELS[finalConfidence],
    confidenceReasonCodes: reasonCodes,
    recommendationMode: getRecommendationMode(finalConfidence),
    displayPriority: getDisplayPriority(finalConfidence),
  }
}
