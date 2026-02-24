export type ProvinceRefinementMode = "guided" | "explore"
export type BannerStyle = "none" | "info" | "warning"

export type ProvinceRouterMissingItem = {
  id: string
  prompt: string
}

export type ProvinceRouterDecision = {
  allowProvinceRefinement: boolean
  provinceCode: "BC"
  routeTo: "/assessment/results/pathways/pnp/province-finder"
  mode: ProvinceRefinementMode
  bannerStyle: BannerStyle
  bannerTitle?: string
  bannerBody?: string
  primaryCTA: string
  secondaryCTA?: string
  bannerMissingItems?: ProvinceRouterMissingItem[]
}

const PROVINCE_FINDER_ROUTE = "/assessment/results/pathways/pnp/province-finder" as const
const MEDIUM_OR_HIGH_THRESHOLD = 45

function toTopMissingItems(
  items: Array<{ id: string; prompt: string }> | undefined,
): ProvinceRouterMissingItem[] | undefined {
  if (!items || items.length === 0) return undefined
  const normalized = items
    .filter((item) => typeof item?.id === "string" && typeof item?.prompt === "string")
    .map((item) => ({ id: item.id, prompt: item.prompt }))
  if (normalized.length === 0) return undefined
  return normalized.slice(0, 3)
}

export function getPNPProvinceRouterDecision(input: {
  pnpInScope: boolean
  pnpFitScore: number
  pnpConfidence?: "high" | "medium" | "low"
  missingItems?: Array<{ id: string; prompt: string }>
}): ProvinceRouterDecision {
  const missing = toTopMissingItems(input.missingItems)

  if (!input.pnpInScope) {
    return {
      allowProvinceRefinement: true,
      provinceCode: "BC",
      routeTo: PROVINCE_FINDER_ROUTE,
      mode: "explore",
      bannerStyle: "warning",
      bannerTitle: "PNP is mainly for Permanent Residence",
      bannerBody:
        "Based on your goal, PNP may not be your primary path right now. You can still explore BC options if you’d like.",
      primaryCTA: "Explore BC PNP (Optional)",
      secondaryCTA: "Back to results",
    }
  }

  const mediumOrHighScore = input.pnpFitScore >= MEDIUM_OR_HIGH_THRESHOLD

  if (mediumOrHighScore && input.pnpConfidence !== "low") {
    return {
      allowProvinceRefinement: true,
      provinceCode: "BC",
      routeTo: PROVINCE_FINDER_ROUTE,
      mode: "guided",
      bannerStyle: "none",
      primaryCTA: "Refine BC Options",
      secondaryCTA: "Back to results",
    }
  }

  if (mediumOrHighScore && input.pnpConfidence === "low") {
    return {
      allowProvinceRefinement: true,
      provinceCode: "BC",
      routeTo: PROVINCE_FINDER_ROUTE,
      mode: "guided",
      bannerStyle: "info",
      bannerTitle: "We need a few details to confirm fit",
      bannerBody:
        "Your answers suggest BC PNP could be relevant, but some key details are missing. Answer a few questions to refine your result.",
      bannerMissingItems: missing,
      primaryCTA: "Refine BC Options",
      secondaryCTA: "Back to results",
    }
  }

  return {
    allowProvinceRefinement: true,
    provinceCode: "BC",
    routeTo: PROVINCE_FINDER_ROUTE,
    mode: "explore",
    bannerStyle: "warning",
    bannerTitle: "Low PNP Fit (Exploratory)",
    bannerBody:
      "Based on your answers so far, BC PNP may not be your strongest match yet — but you can still explore BC options.",
    bannerMissingItems: missing,
    primaryCTA: "Explore BC Options (Low Fit)",
    secondaryCTA: "Back to results",
  }
}
