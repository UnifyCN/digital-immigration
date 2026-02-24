import {
  BC_STREAM_FAMILIES,
  type EvaluatedFamily,
  type FamilyConfidence,
  type FamilyOpenQuestion,
  type MatchLevel,
  type ProvinceFinderEvaluation,
  type StreamFamilyId,
} from "../rules/pnp/bcFamilies.ts"
import { loadBCPNPStreams } from "../rules/loadPNPRules.ts"
import { evaluateFamilyBaseline } from "./pnpBcFamilyBaseline.ts"
import { buildRuleSignals } from "./pnpRuleSignals.ts"
import { generateMissingInfo, generateWhyBullets } from "./explainFromRules.ts"
import { isUnknownRuleValue } from "./ruleEngine.ts"
import { scoreStream } from "./scoreFromRules.ts"
import type { CombinedPNPSignals } from "./pnpProvinceScope.ts"
import type { PNPBuildMeta } from "./pnpSignals.ts"

type ScoreResult = {
  fitScore: number
}

function confidenceRank(value: FamilyConfidence): number {
  if (value === "high") return 3
  if (value === "medium") return 2
  return 1
}

function matchLevelRank(value: MatchLevel): number {
  if (value === "strong") return 3
  if (value === "possible") return 2
  return 1
}

function findStream(familyId: StreamFamilyId) {
  return loadBCPNPStreams().streams.find((stream) => stream.id === familyId)
}

export function scoreFamily(
  familyId: StreamFamilyId,
  combinedSignals: CombinedPNPSignals,
  _meta: PNPBuildMeta,
): ScoreResult {
  const stream = findStream(familyId)
  if (!stream) return { fitScore: 0 }
  const ruleSignals = buildRuleSignals(combinedSignals)
  return { fitScore: scoreStream(stream, ruleSignals) }
}

function computeUnknownCountForFamily(familyId: StreamFamilyId, combinedSignals: CombinedPNPSignals): number {
  const ruleSignals = buildRuleSignals(combinedSignals)
  const keyFields =
    familyId === "BC_EMPLOYER_SKILLED"
      ? [
          ruleSignals.hasJobOffer,
          ruleSignals.jobProvinceCode,
          ruleSignals.jobFullTime,
          ruleSignals.jobPermanent,
          ruleSignals.employerSupportPNP,
          ruleSignals.teer,
        ]
      : [
          ruleSignals.educationInCanada,
          ruleSignals.educationProvinceCode,
          ruleSignals.institutionType,
          ruleSignals.programLength8mo,
          ruleSignals.graduatedWithin3Years,
          ruleSignals.hasJobOffer,
          ruleSignals.jobProvinceCode,
        ]

  return keyFields.filter((value) => isUnknownRuleValue(value)).length
}

function applyMetaCaps(base: FamilyConfidence, unknownRate: number): FamilyConfidence {
  if (unknownRate > 0.7) return "low"
  if (unknownRate > 0.5 && base === "high") return "medium"
  return base
}

export function computeFamilyConfidence(
  familyId: StreamFamilyId,
  combinedSignals: CombinedPNPSignals,
  meta: PNPBuildMeta,
): FamilyConfidence {
  const unknownCount = computeUnknownCountForFamily(familyId, combinedSignals)
  let base: FamilyConfidence
  if (unknownCount <= 1) base = "high"
  else if (unknownCount <= 3) base = "medium"
  else base = "low"
  return applyMetaCaps(base, meta.unknownRate)
}

export function generateFamilyWhyBullets(
  familyId: StreamFamilyId,
  combinedSignals: CombinedPNPSignals,
  _confidence: FamilyConfidence,
): { whyBullets: string[]; whyBulletIds: string[] } {
  const stream = findStream(familyId)
  if (!stream) {
    return {
      whyBullets: ["We can refine this recommendation with a few more details."],
      whyBulletIds: ["missing_stream"],
    }
  }

  const ruleSignals = buildRuleSignals(combinedSignals)
  return generateWhyBullets(stream, ruleSignals)
}

export function generateFamilyOpenQuestions(
  familyId: StreamFamilyId,
  combinedSignals: CombinedPNPSignals,
  _confidence: FamilyConfidence,
): FamilyOpenQuestion[] {
  const stream = findStream(familyId)
  if (!stream) return []

  const ruleSignals = buildRuleSignals(combinedSignals)
  return generateMissingInfo(stream, ruleSignals).map((item) => ({
    id: item.id,
    prompt: item.prompt,
    signalKeys: item.signalKeys,
  }))
}

function getSignalValueByKey(
  signals: CombinedPNPSignals,
  ruleSignals: ReturnType<typeof buildRuleSignals>,
  key: string,
): unknown {
  if (key in ruleSignals) {
    return ruleSignals[key]
  }

  switch (key) {
    case "jobOfferPermanent":
      return signals.jobOfferPermanent
    case "jobOfferFullTime":
      return signals.jobOfferFullTime
    case "employerSupport":
      return signals.employerSupportRefined
    case "programAtLeast8Months":
      return signals.programAtLeast8Months
    case "completedWithin3Years":
      return signals.completedWithin3Years
    case "educationProvinceInCanada":
      return signals.educationProvince
    case "publicInstitutionInCanada":
      return signals.publicInstitutionInCanada
    default:
      return (signals as unknown as Record<string, unknown>)[key]
  }
}

function isPromptStillNeeded(
  item: { signalKeys?: string[] },
  signals: CombinedPNPSignals,
  ruleSignals: ReturnType<typeof buildRuleSignals>,
): boolean {
  if (!item.signalKeys || item.signalKeys.length === 0) return true
  return item.signalKeys.some((key) => isUnknownRuleValue(getSignalValueByKey(signals, ruleSignals, key)))
}

export function buildMissingInfo(params: {
  familyId: StreamFamilyId
  baselineMissingRequired: Array<{ id: string; prompt: string; signalKeys?: string[] }>
  openQuestions: FamilyOpenQuestion[]
  baselineBadge: "pass" | "unclear" | "fail"
  confidence: FamilyConfidence
  combinedSignals: CombinedPNPSignals
}): Array<{ id: string; prompt: string; reason?: string; signalKeys?: string[] }> {
  const {
    familyId,
    baselineMissingRequired,
    openQuestions,
    baselineBadge,
    confidence,
    combinedSignals,
  } = params

  const ruleSignals = buildRuleSignals(combinedSignals)
  const filteredBaseline = baselineMissingRequired.filter((item) =>
    isPromptStillNeeded(item, combinedSignals, ruleSignals),
  )
  const filteredOpen = openQuestions.filter((item) => isPromptStillNeeded(item, combinedSignals, ruleSignals))

  let ordered: Array<{ id: string; prompt: string; reason?: string; signalKeys?: string[] }> = []
  if (baselineBadge === "unclear") {
    ordered = [...filteredBaseline, ...filteredOpen]
  } else if (baselineBadge === "fail") {
    const failHighImpactIds =
      familyId === "BC_EMPLOYER_SKILLED"
        ? new Set(["missing_teer", "missing_full_time", "missing_permanent", "job_offer_exists", "job_in_bc"])
        : new Set([
            "missing_institution_type",
            "missing_program_length",
            "missing_grad_recency",
            "canadian_education",
            "bc_anchor",
          ])
    ordered = [...filteredBaseline, ...filteredOpen.filter((item) => failHighImpactIds.has(item.id))]
  } else {
    if (confidence === "high") return []
    ordered = filteredOpen
  }

  const deduped: Array<{ id: string; prompt: string; reason?: string; signalKeys?: string[] }> = []
  const seen = new Set<string>()
  for (const item of ordered) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    deduped.push(item)
  }

  const maxCount = baselineBadge === "fail" ? 3 : baselineBadge === "pass" ? 2 : 4
  const trimmed = deduped.slice(0, maxCount)

  if (trimmed.length === 0 && baselineBadge !== "pass") {
    return [
      {
        id: "missing_info_fallback",
        prompt: "We need a few more details to improve this family assessment.",
      },
      {
        id: "missing_info_fallback_2",
        prompt: "Confirm your key profile details so we can refine this recommendation.",
      },
    ]
  }
  return trimmed
}

export function applyScoreCaps(
  fitScore: number,
  baselineBadge: "pass" | "unclear" | "fail",
): number {
  if (baselineBadge === "fail") return Math.min(fitScore, 35)
  if (baselineBadge === "unclear") return Math.min(fitScore, 70)
  return fitScore
}

export function classifyMatchLevel(params: {
  familyId: StreamFamilyId
  baselineBadge: "pass" | "unclear" | "fail"
  fitScore: number
  confidence: FamilyConfidence
  combinedSignals: CombinedPNPSignals
}): MatchLevel {
  const { familyId, baselineBadge, fitScore, confidence, combinedSignals } = params
  const employerSupportNo = familyId === "BC_EMPLOYER_SKILLED" && combinedSignals.employerSupportRefined === "no"

  const isStrong = baselineBadge === "pass" && fitScore >= 70 && confidence !== "low" && !employerSupportNo

  if (isStrong) return "strong"

  const isPossible =
    (baselineBadge === "unclear" && fitScore >= 45) ||
    (baselineBadge === "pass" && fitScore >= 45 && fitScore <= 69) ||
    (baselineBadge === "pass" && fitScore >= 70 && confidence === "low") ||
    (employerSupportNo && baselineBadge === "pass" && fitScore >= 70 && confidence !== "low")

  if (isPossible) return "possible"
  if (baselineBadge === "fail" || fitScore < 45) return "weak"
  return "weak"
}

function buildEvaluatedFamily(
  familyId: StreamFamilyId,
  combinedSignals: CombinedPNPSignals,
  meta: PNPBuildMeta,
): EvaluatedFamily {
  const stream = findStream(familyId)
  const fallback = BC_STREAM_FAMILIES.find((item) => item.familyId === familyId)

  const score = scoreFamily(familyId, combinedSignals, meta)
  const confidence = computeFamilyConfidence(familyId, combinedSignals, meta)
  const baseline = evaluateFamilyBaseline(familyId, combinedSignals, meta)
  const cappedFitScore = applyScoreCaps(score.fitScore, baseline.badge)
  const why = generateFamilyWhyBullets(familyId, combinedSignals, confidence)
  const openQuestions = generateFamilyOpenQuestions(familyId, combinedSignals, confidence)
  const missingInfo = buildMissingInfo({
    familyId,
    baselineMissingRequired: baseline.missingRequired,
    openQuestions,
    baselineBadge: baseline.badge,
    confidence,
    combinedSignals,
  })
  const matchLevel = classifyMatchLevel({
    familyId,
    baselineBadge: baseline.badge,
    fitScore: cappedFitScore,
    confidence,
    combinedSignals,
  })

  return {
    familyId,
    title: stream?.displayName ?? fallback?.title ?? familyId,
    shortDescription: stream?.shortDescription ?? fallback?.shortDescription ?? "",
    fitScore: cappedFitScore,
    confidence,
    baselineBadge: baseline.badge,
    hardBlockers: baseline.hardBlockers,
    missingInfo,
    whyBullets: why.whyBullets,
    whyBulletIds: why.whyBulletIds,
    matchLevel,
  }
}

export function rankBCFamilyRecommendations(families: EvaluatedFamily[]): EvaluatedFamily[] {
  return [...families].sort((a, b) => {
    if (matchLevelRank(b.matchLevel) !== matchLevelRank(a.matchLevel)) {
      return matchLevelRank(b.matchLevel) - matchLevelRank(a.matchLevel)
    }
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore
    if (confidenceRank(b.confidence) !== confidenceRank(a.confidence)) {
      return confidenceRank(b.confidence) - confidenceRank(a.confidence)
    }
    return a.familyId.localeCompare(b.familyId)
  })
}

export function evaluateBCFamilies(params: {
  combinedSignals: CombinedPNPSignals
  meta: PNPBuildMeta
}): ProvinceFinderEvaluation {
  const { combinedSignals, meta } = params

  const rules = loadBCPNPStreams()
  const familyIds = rules.streams
    .map((stream) => stream.id)
    .filter((id): id is StreamFamilyId => id === "BC_EMPLOYER_SKILLED" || id === "BC_INTL_GRAD")

  const fallbackFamilyIds: StreamFamilyId[] = ["BC_EMPLOYER_SKILLED", "BC_INTL_GRAD"]
  const idsToEvaluate = familyIds.length > 0 ? familyIds : fallbackFamilyIds

  const evaluatedFamilies = rankBCFamilyRecommendations(
    idsToEvaluate.map((familyId) => buildEvaluatedFamily(familyId, combinedSignals, meta)),
  )

  return {
    provinceCode: "BC",
    evaluatedFamilies,
    generatedAt: new Date().toISOString(),
  }
}

// Backward-compatible alias used by current wiring.
export function buildBCProvinceFinderResult(params: {
  combinedSignals: CombinedPNPSignals
  meta: PNPBuildMeta
}): ProvinceFinderEvaluation {
  return evaluateBCFamilies(params)
}
