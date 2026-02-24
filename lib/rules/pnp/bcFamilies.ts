import type { CombinedPNPSignals } from "../../pathways/pnpProvinceScope"

export type StreamFamilyId = "BC_EMPLOYER_SKILLED" | "BC_INTL_GRAD"
export type FamilyConfidence = "high" | "medium" | "low"
export type MatchLevel = "strong" | "possible" | "weak"

export type FamilyOpenQuestion = {
  id: string
  prompt: string
  reason?: string
  signalKeys?: string[]
}

export type EvaluatedFamily = {
  familyId: StreamFamilyId
  title: string
  shortDescription: string
  fitScore: number
  confidence: FamilyConfidence
  baselineBadge: "pass" | "unclear" | "fail"
  hardBlockers: string[]
  missingInfo: Array<{ id: string; prompt: string; reason?: string; signalKeys?: string[] }>
  whyBullets: string[]
  whyBulletIds: string[]
  matchLevel: MatchLevel
}

export type ProvinceFinderEvaluation = {
  provinceCode: "BC"
  evaluatedFamilies: EvaluatedFamily[]
  generatedAt: string
}

export type FamilyRuleContext = {
  combinedSignals: CombinedPNPSignals
  confidence: FamilyConfidence
}

export const BC_STREAM_FAMILIES: Array<{
  familyId: StreamFamilyId
  title: string
  shortDescription: string
}> = [
  {
    familyId: "BC_EMPLOYER_SKILLED",
    title: "BC Employer-Driven Skilled Worker",
    shortDescription: "Employer-supported skilled work pathway to explore in British Columbia.",
  },
  {
    familyId: "BC_INTL_GRAD",
    title: "BC International Graduate",
    shortDescription: "Graduate-focused pathway to explore for those with recent Canadian study ties.",
  },
]
