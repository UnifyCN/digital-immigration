import {
  BC_EMPLOYER_SKILLED_OPENQ_RULES,
  BC_EMPLOYER_SKILLED_WHY_RULES,
  BC_INTL_GRAD_OPENQ_RULES,
  BC_INTL_GRAD_WHY_RULES,
  BC_STREAM_FAMILIES,
  fallbackOpenQuestion,
  fallbackWhyBullet,
  type EvaluatedFamily,
  type FamilyConfidence,
  type FamilyOpenQuestion,
  type FamilyRuleContext,
  type MatchLevel,
  type ProvinceFinderEvaluation,
  type StreamFamilyId,
} from "../rules/pnp/bcFamilies.ts"
import { evaluateFamilyBaseline } from "./pnpBcFamilyBaseline.ts"
import type { CombinedPNPSignals } from "./pnpProvinceScope"
import type { PNPBuildMeta } from "./pnpSignals"

type ScoreResult = {
  fitScore: number
}

type ScoreContext = {
  combinedSignals: CombinedPNPSignals
  meta: PNPBuildMeta
}

function clampScore(value: number): number {
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.round(value)
}

function isUnknown(value: unknown): boolean {
  return value === null || value === undefined || value === "not_sure" || value === "not-sure" || value === "unsure"
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

function scoreEmployerSkilled({ combinedSignals }: ScoreContext): ScoreResult {
  let score = 0

  if (combinedSignals.hasJobOfferRefined === "yes") score += 35
  else if (combinedSignals.hasJobOfferRefined === "not_sure" || isUnknown(combinedSignals.hasJobOfferRefined)) score += 10

  if (combinedSignals.jobProvinceCode === "BC") score += 20
  else if (isUnknown(combinedSignals.jobProvinceCode)) score += 5

  if (combinedSignals.jobOfferFullTime === "yes") score += 10
  else if (combinedSignals.jobOfferFullTime === "not_sure" || isUnknown(combinedSignals.jobOfferFullTime)) score += 3

  if (combinedSignals.jobOfferPermanent === "yes") score += 10
  else if (combinedSignals.jobOfferPermanent === "not_sure" || isUnknown(combinedSignals.jobOfferPermanent)) score += 3

  if (combinedSignals.employerSupportRefined === "yes") score += 15
  else if (combinedSignals.employerSupportRefined === "not_sure" || isUnknown(combinedSignals.employerSupportRefined)) score += 7

  if (combinedSignals.teerSkillBand === "teer_0_3") score += 10
  else if (combinedSignals.teerSkillBand === "teer_4_5") score += 2

  if (combinedSignals.canadianSkilledWork12mo === "yes") score += 5

  return { fitScore: clampScore(score) }
}

function scoreInternationalGrad({ combinedSignals }: ScoreContext): ScoreResult {
  let score = 0

  if (combinedSignals.anyEducationInCanada === "yes") score += 35
  else if (combinedSignals.anyEducationInCanada === "not_sure" || isUnknown(combinedSignals.anyEducationInCanada)) score += 10

  if (combinedSignals.educationProvinceCode === "BC") score += 15
  else if (isUnknown(combinedSignals.educationProvinceCode)) score += 3

  if (combinedSignals.institutionType === "public" || combinedSignals.publicInstitutionInCanada === "yes") score += 10
  else if (combinedSignals.institutionType === "unsure" || combinedSignals.publicInstitutionInCanada === "not_sure") score += 3

  if (combinedSignals.programAtLeast8Months === "yes") score += 10
  else if (combinedSignals.programAtLeast8Months === "not_sure" || isUnknown(combinedSignals.programAtLeast8Months)) score += 3

  if (combinedSignals.completedWithin3Years === "yes") score += 10
  else if (combinedSignals.completedWithin3Years === "not_sure" || isUnknown(combinedSignals.completedWithin3Years)) score += 3

  if (combinedSignals.hasJobOfferRefined === "yes" && combinedSignals.jobProvinceCode === "BC") score += 15
  else if (combinedSignals.hasJobOfferRefined === "yes" && isUnknown(combinedSignals.jobProvinceCode)) score += 7

  if (combinedSignals.languageReady === "valid") score += 5
  else if (combinedSignals.languageReady === "booked" || isUnknown(combinedSignals.languageReady)) score += 2

  return { fitScore: clampScore(score) }
}

export function scoreFamily(
  familyId: StreamFamilyId,
  combinedSignals: CombinedPNPSignals,
  meta: PNPBuildMeta,
): ScoreResult {
  const ctx: ScoreContext = { combinedSignals, meta }
  if (familyId === "BC_EMPLOYER_SKILLED") return scoreEmployerSkilled(ctx)
  return scoreInternationalGrad(ctx)
}

function computeUnknownCountForFamily(familyId: StreamFamilyId, combinedSignals: CombinedPNPSignals): number {
  if (familyId === "BC_EMPLOYER_SKILLED") {
    const keyFields = [
      combinedSignals.hasJobOfferRefined,
      combinedSignals.jobProvinceCode ?? combinedSignals.jobProvince,
      combinedSignals.jobOfferFullTime,
      combinedSignals.jobOfferPermanent,
      combinedSignals.employerSupportRefined,
      combinedSignals.teerSkillBand ?? combinedSignals.provinceFinder.nocCode,
    ]
    return keyFields.filter((value) => isUnknown(value)).length
  }

  const keyFields = [
    combinedSignals.anyEducationInCanada,
    combinedSignals.educationProvinceCode ?? combinedSignals.educationProvince,
    combinedSignals.institutionType ?? combinedSignals.publicInstitutionInCanada,
    combinedSignals.programAtLeast8Months,
    combinedSignals.completedWithin3Years,
    combinedSignals.hasJobOfferRefined,
    combinedSignals.jobProvinceCode ?? combinedSignals.jobProvince,
  ]
  return keyFields.filter((value) => isUnknown(value)).length
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
  confidence: FamilyConfidence,
): { whyBullets: string[]; whyBulletIds: string[] } {
  const rules = familyId === "BC_EMPLOYER_SKILLED" ? BC_EMPLOYER_SKILLED_WHY_RULES : BC_INTL_GRAD_WHY_RULES
  const ctx: FamilyRuleContext = { combinedSignals, confidence }
  const matched = rules
    .filter((rule) => rule.when(ctx))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, 4)

  const whyBullets = matched.map((rule) => rule.text(ctx))
  const whyBulletIds = matched.map((rule) => rule.id)

  if (whyBullets.length < 2) {
    const fallback = fallbackWhyBullet(familyId)
    whyBullets.push(fallback.text)
    whyBulletIds.push(fallback.id)
  }
  if (whyBullets.length < 2) {
    whyBullets.push("We can refine this recommendation with a few more details.")
    whyBulletIds.push("fallback_refine_details")
  }

  return {
    whyBullets: whyBullets.slice(0, 4),
    whyBulletIds: whyBulletIds.slice(0, 4),
  }
}

export function generateFamilyOpenQuestions(
  familyId: StreamFamilyId,
  combinedSignals: CombinedPNPSignals,
  confidence: FamilyConfidence,
): FamilyOpenQuestion[] {
  const rules = familyId === "BC_EMPLOYER_SKILLED" ? BC_EMPLOYER_SKILLED_OPENQ_RULES : BC_INTL_GRAD_OPENQ_RULES
  const ctx: FamilyRuleContext = { combinedSignals, confidence }
  const matched = rules
    .filter((rule) => rule.when(ctx))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))

  const selected: FamilyOpenQuestion[] = []
  const usedIds = new Set<string>()
  for (const rule of matched) {
    if (selected.length >= 4) break
    if (usedIds.has(rule.id)) continue
    selected.push({
      id: rule.id,
      prompt: rule.prompt,
      reason: rule.reason,
      signalKeys: rule.signalKeys,
    })
    usedIds.add(rule.id)
  }

  while (selected.length < 2) {
    const fallback = fallbackOpenQuestion(familyId)
    selected.push({
      ...fallback,
      id: `${fallback.id}_${selected.length + 1}`,
    })
  }

  return selected.slice(0, 4)
}

function getSignalValueByKey(signals: CombinedPNPSignals, key: string): unknown {
  switch (key) {
    case "hasJobOffer":
      return signals.hasJobOfferRefined
    case "jobProvinceCode":
      return signals.jobProvinceCode
    case "jobProvinceLabel":
    case "jobProvince":
      return signals.jobProvince
    case "jobFullTime":
      return signals.jobOfferFullTime
    case "jobPermanent":
      return signals.jobOfferPermanent
    case "teer":
      return signals.teerSkillBand
    case "nocCode":
      return signals.provinceFinder.nocCode
    case "languageTestStatus":
      return signals.languageReady
    case "educationInCanada":
    case "anyEducationInCanada":
      return signals.anyEducationInCanada
    case "institutionType":
      return signals.institutionType ?? signals.publicInstitutionInCanada
    case "programLength8mo":
    case "programAtLeast8Months":
      return signals.programAtLeast8Months
    case "graduatedWithin3Years":
      return signals.completedWithin3Years
    case "educationProvinceCode":
      return signals.educationProvinceCode
    case "educationProvinceInCanada":
      return signals.educationProvince
    case "employerSupportPNP":
    case "employerSupport":
      return signals.employerSupportRefined
    default:
      return (signals as unknown as Record<string, unknown>)[key]
  }
}

function isPromptStillNeeded(
  item: { signalKeys?: string[] },
  signals: CombinedPNPSignals,
): boolean {
  if (!item.signalKeys || item.signalKeys.length === 0) return true
  return item.signalKeys.some((key) => isUnknown(getSignalValueByKey(signals, key)))
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

  const filteredBaseline = baselineMissingRequired.filter((item) => isPromptStillNeeded(item, combinedSignals))
  const filteredOpen = openQuestions.filter((item) => isPromptStillNeeded(item, combinedSignals))

  let ordered: Array<{ id: string; prompt: string; reason?: string; signalKeys?: string[] }> = []
  if (baselineBadge === "unclear") {
    ordered = [...filteredBaseline, ...filteredOpen]
  } else if (baselineBadge === "fail") {
    const failHighImpactIds =
      familyId === "BC_EMPLOYER_SKILLED"
        ? new Set(["A_q_job_offer", "A_q_job_province", "A_q_job_permanent", "A_q_teer", "A_q_employer_support"])
        : new Set(["B_q_canadian_education", "B_q_education_province", "B_q_program_length", "B_q_recency"])
    ordered = [
      ...filteredBaseline,
      ...filteredOpen.filter((item) => failHighImpactIds.has(item.id)),
    ]
  } else {
    if (confidence === "high") return []
    const passHighImpactIds =
      familyId === "BC_EMPLOYER_SKILLED"
        ? new Set(["A_q_employer_support", "A_q_teer", "A_q_job_permanent"])
        : new Set(["B_q_education_province", "B_q_recency", "B_q_program_length"])
    ordered = filteredOpen.filter((item) => passHighImpactIds.has(item.id))
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

  const isStrong =
    baselineBadge === "pass" &&
    fitScore >= 70 &&
    confidence !== "low" &&
    !employerSupportNo

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
  const family = BC_STREAM_FAMILIES.find((item) => item.familyId === familyId)
  if (!family) throw new Error(`Unsupported BC family: ${familyId}`)

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
    title: family.title,
    shortDescription: family.shortDescription,
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
  const evaluatedFamilies = rankBCFamilyRecommendations([
    buildEvaluatedFamily("BC_EMPLOYER_SKILLED", combinedSignals, meta),
    buildEvaluatedFamily("BC_INTL_GRAD", combinedSignals, meta),
  ])

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
