import {
  BC_EMPLOYER_SKILLED_OPENQ_RULES,
  BC_EMPLOYER_SKILLED_WHY_RULES,
  BC_INTL_GRAD_OPENQ_RULES,
  BC_INTL_GRAD_WHY_RULES,
  BC_STREAM_FAMILIES,
  fallbackOpenQuestion,
  fallbackWhyBullet,
  type FamilyConfidence,
  type FamilyOpenQuestion,
  type FamilyRecommendation,
  type FamilyRuleContext,
  type ProvinceFinderResult,
  type StreamFamilyId,
} from "../rules/pnp/bcFamilies.ts"
import type { CombinedPNPSignals } from "./pnpProvinceScope"
import type { PNPBuildMeta } from "./pnpSignals"
import { evaluateFamilyBaseline } from "./pnpBcFamilyBaseline.ts"

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

function confidenceRank(value: FamilyConfidence): number {
  if (value === "high") return 3
  if (value === "medium") return 2
  return 1
}

function isUnknown(value: unknown): boolean {
  return value === null || value === undefined || value === "not_sure" || value === "not-sure" || value === "unsure"
}

function scoreEmployerSkilled({ combinedSignals }: ScoreContext): ScoreResult {
  let score = 0

  // 1) Job offer present (0-35)
  if (combinedSignals.hasJobOfferRefined === "yes") score += 35
  else if (combinedSignals.hasJobOfferRefined === "not_sure" || isUnknown(combinedSignals.hasJobOfferRefined)) score += 10

  // 2) Job in BC (0-20)
  if (combinedSignals.jobProvinceCode === "BC") score += 20
  else if (isUnknown(combinedSignals.jobProvinceCode)) score += 5

  // 3) Full-time (0-10)
  if (combinedSignals.jobOfferFullTime === "yes") score += 10
  else if (combinedSignals.jobOfferFullTime === "not_sure" || isUnknown(combinedSignals.jobOfferFullTime)) score += 3

  // 4) Permanent/indeterminate (0-10)
  if (combinedSignals.jobOfferPermanent === "yes") score += 10
  else if (combinedSignals.jobOfferPermanent === "not_sure" || isUnknown(combinedSignals.jobOfferPermanent)) score += 3

  // 5) Employer support (0-15)
  if (combinedSignals.employerSupportRefined === "yes") score += 15
  else if (combinedSignals.employerSupportRefined === "not_sure" || isUnknown(combinedSignals.employerSupportRefined)) score += 7

  // 6) TEER/NOC skill level (0-10)
  if (combinedSignals.teerSkillBand === "teer_0_3") score += 10
  else if (combinedSignals.teerSkillBand === "teer_4_5") score += 2

  // Optional small bonus (0-5)
  if (combinedSignals.canadianSkilledWork12mo === "yes") score += 5

  return { fitScore: clampScore(score) }
}

function scoreInternationalGrad({ combinedSignals }: ScoreContext): ScoreResult {
  let score = 0

  // 1) Canadian education present (0-35)
  if (combinedSignals.anyEducationInCanada === "yes") score += 35
  else if (combinedSignals.anyEducationInCanada === "not_sure" || isUnknown(combinedSignals.anyEducationInCanada)) score += 10

  // 2) Education in BC (0-15)
  if (combinedSignals.educationProvinceCode === "BC") score += 15
  else if (isUnknown(combinedSignals.educationProvinceCode)) score += 3

  // 3) Public institution (0-10)
  if (combinedSignals.institutionType === "public" || combinedSignals.publicInstitutionInCanada === "yes") score += 10
  else if (combinedSignals.institutionType === "unsure" || combinedSignals.publicInstitutionInCanada === "not_sure") score += 3

  // 4) Program length >=8 months (0-10)
  if (combinedSignals.programAtLeast8Months === "yes") score += 10
  else if (combinedSignals.programAtLeast8Months === "not_sure" || isUnknown(combinedSignals.programAtLeast8Months)) score += 3

  // 5) Graduated within 3 years (0-10)
  if (combinedSignals.completedWithin3Years === "yes") score += 10
  else if (combinedSignals.completedWithin3Years === "not_sure" || isUnknown(combinedSignals.completedWithin3Years)) score += 3

  // 6) Job offer in BC (0-15)
  if (combinedSignals.hasJobOfferRefined === "yes" && combinedSignals.jobProvinceCode === "BC") score += 15
  else if (combinedSignals.hasJobOfferRefined === "yes" && isUnknown(combinedSignals.jobProvinceCode)) score += 7

  // 7) Language readiness (0-5)
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

function pickWhyBullets(
  familyId: StreamFamilyId,
  ctx: FamilyRuleContext,
): { whyBullets: string[]; whyBulletIds: string[] } {
  const rules = familyId === "BC_EMPLOYER_SKILLED" ? BC_EMPLOYER_SKILLED_WHY_RULES : BC_INTL_GRAD_WHY_RULES
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
    const fallback = fallbackWhyBullet(familyId)
    whyBullets.push(fallback.text)
    whyBulletIds.push(`${fallback.id}_2`)
  }

  return {
    whyBullets: whyBullets.slice(0, 4),
    whyBulletIds: whyBulletIds.slice(0, 4),
  }
}

function pickOpenQuestions(
  familyId: StreamFamilyId,
  ctx: FamilyRuleContext,
): FamilyOpenQuestion[] {
  const rules = familyId === "BC_EMPLOYER_SKILLED" ? BC_EMPLOYER_SKILLED_OPENQ_RULES : BC_INTL_GRAD_OPENQ_RULES
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

function applyBaselineScoreCap(score: number, baselineBadge: "pass" | "unclear" | "fail"): number {
  if (baselineBadge === "fail") return Math.min(score, 35)
  if (baselineBadge === "unclear") return Math.min(score, 70)
  return score
}

function buildFamilyRecommendation(
  familyId: StreamFamilyId,
  combinedSignals: CombinedPNPSignals,
  meta: PNPBuildMeta,
): FamilyRecommendation {
  const family = BC_STREAM_FAMILIES.find((item) => item.familyId === familyId)
  if (!family) {
    throw new Error(`Unsupported BC family: ${familyId}`)
  }

  const score = scoreFamily(familyId, combinedSignals, meta)
  const confidence = computeFamilyConfidence(familyId, combinedSignals, meta)
  const baseline = evaluateFamilyBaseline(familyId, combinedSignals, meta)
  const ctx: FamilyRuleContext = { combinedSignals, confidence }
  const why = pickWhyBullets(familyId, ctx)
  const openQuestions = pickOpenQuestions(familyId, ctx)
  const cappedFitScore = applyBaselineScoreCap(score.fitScore, baseline.badge)

  return {
    familyId,
    title: family.title,
    shortDescription: family.shortDescription,
    fitScore: cappedFitScore,
    confidence,
    baselineBadge: baseline.badge,
    hardBlockers: baseline.hardBlockers,
    missingRequired: baseline.missingRequired,
    whyBullets: why.whyBullets,
    whyBulletIds: why.whyBulletIds,
    openQuestions,
  }
}

export function rankBCFamilyRecommendations(recommendations: FamilyRecommendation[]): FamilyRecommendation[] {
  return [...recommendations].sort((a, b) => {
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore
    if (confidenceRank(b.confidence) !== confidenceRank(a.confidence)) {
      return confidenceRank(b.confidence) - confidenceRank(a.confidence)
    }
    return a.familyId.localeCompare(b.familyId)
  })
}

export function buildBCProvinceFinderResult(params: {
  combinedSignals: CombinedPNPSignals
  meta: PNPBuildMeta
}): ProvinceFinderResult {
  const { combinedSignals, meta } = params
  const recommendations = rankBCFamilyRecommendations([
    buildFamilyRecommendation("BC_EMPLOYER_SKILLED", combinedSignals, meta),
    buildFamilyRecommendation("BC_INTL_GRAD", combinedSignals, meta),
  ])

  return {
    provinceCode: "BC",
    recommendations,
    generatedAt: new Date().toISOString(),
  }
}
