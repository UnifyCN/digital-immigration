import {
  getProvinceFinderInitialDraft,
  type ProvinceFinderDraftAnswers,
  type ProvinceRecommendation,
} from "@/lib/pathways/provinceFinder"
import { PNP_MVP_DEFAULT_PROVINCE } from "@/lib/config/pnpScope"
import type { MVPProvinceResolution } from "@/lib/pathways/pnpProvinceScope"
import type { ProvinceRouterDecision } from "@/lib/pathways/pnpProvinceRouter"
import type {
  EvaluatedFamily,
  FamilyConfidence,
  MatchLevel,
  ProvinceFinderEvaluation,
} from "@/lib/rules/pnp/bcFamilies"

const PROVINCE_FINDER_STORAGE_KEY = "clarity-province-finder"

type ProvinceFinderStorageState = {
  pnpProvinceFinderAnswers: ProvinceFinderDraftAnswers
  pnpBCRefinementAnswers: Record<string, string | number | null>
  recommendations: ProvinceRecommendation[]
  pnpProvinceFinderResult: ProvinceFinderEvaluation | null
  pnpProvinceFinderEntryContext: ProvinceRouterDecision | null
  mvpResolution: MVPProvinceResolution | null
  updatedAt: string
}

const PROVINCE_CODES: ProvinceRecommendation["provinceCode"][] = ["BC", "AB", "ON", "SK", "MB"]
const provinceCodeSet = new Set<ProvinceRecommendation["provinceCode"]>(PROVINCE_CODES)

function normalizeRecommendations(input: unknown): ProvinceRecommendation[] {
  if (!Array.isArray(input)) return []

  return input.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return []

    const raw = entry as Partial<ProvinceRecommendation>
    if (!raw.provinceCode || !provinceCodeSet.has(raw.provinceCode)) return []
    if (typeof raw.alignmentScore !== "number" || Number.isNaN(raw.alignmentScore)) return []

    const alignmentLabel =
      raw.alignmentLabel === "Strong alignment" ||
      raw.alignmentLabel === "Moderate alignment" ||
      raw.alignmentLabel === "Exploratory"
        ? raw.alignmentLabel
        : raw.alignmentScore >= 70
          ? "Strong alignment"
          : raw.alignmentScore >= 45
            ? "Moderate alignment"
            : "Exploratory"

    return [
      {
        provinceCode: raw.provinceCode,
        provinceName: typeof raw.provinceName === "string" ? raw.provinceName : raw.provinceCode,
        alignmentScore: raw.alignmentScore,
        alignmentLabel,
        whyBullets: Array.isArray(raw.whyBullets) ? raw.whyBullets.filter((item) => typeof item === "string") : [],
        whatToConfirmNext: Array.isArray(raw.whatToConfirmNext)
          ? raw.whatToConfirmNext.filter((item) => typeof item === "string")
          : [],
        riskFlags: Array.isArray(raw.riskFlags) ? raw.riskFlags.filter((item) => typeof item === "string") : [],
      } satisfies ProvinceRecommendation,
    ]
  })
}

function normalizeMVPResolution(input: unknown): MVPProvinceResolution | null {
  if (!input || typeof input !== "object") return null
  const raw = input as Partial<MVPProvinceResolution>
  if (raw.provinceCode !== PNP_MVP_DEFAULT_PROVINCE) return null
  if (typeof raw.mvpProvinceNotice !== "boolean") return null

  const requestedProvinceCode =
    typeof raw.requestedProvinceCode === "string" && raw.requestedProvinceCode.trim().length > 0
      ? raw.requestedProvinceCode
      : null
  const requestedProvinceInput =
    typeof raw.requestedProvinceInput === "string" && raw.requestedProvinceInput.trim().length > 0
      ? raw.requestedProvinceInput
      : null

  return {
    provinceCode: PNP_MVP_DEFAULT_PROVINCE,
    mvpProvinceNotice: raw.mvpProvinceNotice,
    requestedProvinceCode,
    requestedProvinceInput,
  }
}

function normalizeFamilyConfidence(value: unknown): FamilyConfidence | null {
  if (value === "high" || value === "medium" || value === "low") return value
  return null
}

function normalizeBaselineBadge(value: unknown): "pass" | "unclear" | "fail" | null {
  if (value === "pass" || value === "unclear" || value === "fail") return value
  return null
}

function normalizeMatchLevel(value: unknown): MatchLevel | null {
  if (value === "strong" || value === "possible" || value === "weak") return value
  return null
}

function deriveMatchLevel(params: {
  baselineBadge: "pass" | "unclear" | "fail"
  fitScore: number
  confidence: FamilyConfidence
}): MatchLevel {
  const { baselineBadge, fitScore, confidence } = params
  if (baselineBadge === "fail" || fitScore < 45) return "weak"
  if (baselineBadge === "pass" && fitScore >= 70 && confidence !== "low") return "strong"
  return "possible"
}

function normalizeMissingInfoList(input: unknown): Array<{
  id: string
  prompt: string
  reason?: string
  signalKeys?: string[]
}> {
  if (!Array.isArray(input)) return []
  return input
    .filter((q) => q && typeof q === "object" && typeof q.id === "string" && typeof q.prompt === "string")
    .map((q) => ({
      id: q.id,
      prompt: q.prompt,
      reason: typeof q.reason === "string" ? q.reason : undefined,
      signalKeys: Array.isArray(q.signalKeys)
        ? q.signalKeys.filter((k: unknown): k is string => typeof k === "string")
        : undefined,
    }))
}

function normalizePNPProvinceFinderResult(input: unknown): ProvinceFinderEvaluation | null {
  if (!input || typeof input !== "object") return null
  const raw = input as Record<string, unknown>
  if (raw.provinceCode !== "BC") return null
  const rawFamilies = Array.isArray(raw.evaluatedFamilies)
    ? raw.evaluatedFamilies
    : Array.isArray(raw.recommendations)
      ? raw.recommendations
      : null
  if (!rawFamilies) return null
  if (typeof raw.generatedAt !== "string") return null

  const evaluatedFamilies = rawFamilies.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const rec = item as Record<string, unknown>
    if (rec.familyId !== "BC_EMPLOYER_SKILLED" && rec.familyId !== "BC_INTL_GRAD") return []
    if (typeof rec.title !== "string") return []
    if (typeof rec.shortDescription !== "string") return []
    if (typeof rec.fitScore !== "number" || Number.isNaN(rec.fitScore)) return []
    const confidence = normalizeFamilyConfidence(rec.confidence)
    const baselineBadge = normalizeBaselineBadge(rec.baselineBadge)
    if (!confidence || !baselineBadge) return []
    const missingInfo = normalizeMissingInfoList(rec.missingInfo)
    const fallbackMissing = normalizeMissingInfoList(rec.missingRequired)
    const legacyOpenQuestions = normalizeMissingInfoList(rec.openQuestions)
    const mergedMissing = [...missingInfo, ...fallbackMissing, ...legacyOpenQuestions]
    const dedupedMissing = mergedMissing.filter(
      (entry, index) => mergedMissing.findIndex((x) => x.id === entry.id) === index,
    )
    const normalizedMatchLevel = normalizeMatchLevel(rec.matchLevel)
    const matchLevel =
      normalizedMatchLevel ??
      deriveMatchLevel({
        baselineBadge,
        fitScore: rec.fitScore,
        confidence,
      })

    return [
      {
        familyId: rec.familyId,
        title: rec.title,
        shortDescription: rec.shortDescription,
        fitScore: rec.fitScore,
        confidence,
        baselineBadge,
        hardBlockers: Array.isArray(rec.hardBlockers) ? rec.hardBlockers.filter((v) => typeof v === "string") : [],
        missingInfo: dedupedMissing.slice(0, 4),
        whyBullets: Array.isArray(rec.whyBullets) ? rec.whyBullets.filter((v) => typeof v === "string") : [],
        whyBulletIds: Array.isArray(rec.whyBulletIds) ? rec.whyBulletIds.filter((v) => typeof v === "string") : [],
        matchLevel,
      } satisfies EvaluatedFamily,
    ]
  })

  return {
    provinceCode: "BC",
    generatedAt: raw.generatedAt,
    evaluatedFamilies,
  }
}

function normalizeProvinceFinderEntryContext(input: unknown): ProvinceRouterDecision | null {
  if (!input || typeof input !== "object") return null
  const raw = input as Partial<ProvinceRouterDecision>
  if (typeof raw.allowProvinceRefinement !== "boolean") return null
  if (raw.provinceCode !== "BC") return null
  if (raw.routeTo !== "/assessment/results/pathways/pnp/province-finder") return null
  if (raw.mode !== "guided" && raw.mode !== "explore") return null
  if (raw.bannerStyle !== "none" && raw.bannerStyle !== "info" && raw.bannerStyle !== "warning") return null
  if (typeof raw.primaryCTA !== "string") return null

  return {
    allowProvinceRefinement: raw.allowProvinceRefinement,
    provinceCode: "BC",
    routeTo: "/assessment/results/pathways/pnp/province-finder",
    mode: raw.mode,
    bannerStyle: raw.bannerStyle,
    bannerTitle: typeof raw.bannerTitle === "string" ? raw.bannerTitle : undefined,
    bannerBody: typeof raw.bannerBody === "string" ? raw.bannerBody : undefined,
    primaryCTA: raw.primaryCTA,
    secondaryCTA: typeof raw.secondaryCTA === "string" ? raw.secondaryCTA : undefined,
    bannerMissingItems: Array.isArray(raw.bannerMissingItems)
      ? raw.bannerMissingItems
          .filter((item) => item && typeof item.id === "string" && typeof item.prompt === "string")
          .map((item) => ({ id: item.id, prompt: item.prompt }))
          .slice(0, 3)
      : undefined,
  }
}

function normalizeBCRefinementAnswers(input: unknown): Record<string, string | number | null> {
  if (!input || typeof input !== "object") return {}
  const raw = input as Record<string, unknown>
  const normalized: Record<string, string | number | null> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" || typeof value === "number" || value === null) {
      normalized[key] = value
    }
  }
  return normalized
}

function getDefaultState(): ProvinceFinderStorageState {
  return {
    pnpProvinceFinderAnswers: getProvinceFinderInitialDraft(),
    pnpBCRefinementAnswers: {},
    recommendations: [],
    pnpProvinceFinderResult: null,
    pnpProvinceFinderEntryContext: null,
    mvpResolution: null,
    updatedAt: new Date(0).toISOString(),
  }
}

function parseState(raw: string | null): ProvinceFinderStorageState {
  if (!raw) return getDefaultState()

  try {
    const parsed = JSON.parse(raw) as Partial<ProvinceFinderStorageState>
    const pnpProvinceFinderAnswers = {
      ...getProvinceFinderInitialDraft(),
      ...((parsed.pnpProvinceFinderAnswers ?? (parsed as { draft?: ProvinceFinderDraftAnswers }).draft) ?? {}),
    } satisfies ProvinceFinderDraftAnswers
    const pnpBCRefinementAnswers = normalizeBCRefinementAnswers(parsed.pnpBCRefinementAnswers)
    const recommendations = normalizeRecommendations(parsed.recommendations)
    const pnpProvinceFinderResult = normalizePNPProvinceFinderResult(parsed.pnpProvinceFinderResult)
    const pnpProvinceFinderEntryContext = normalizeProvinceFinderEntryContext(
      parsed.pnpProvinceFinderEntryContext,
    )
    const mvpResolution = normalizeMVPResolution(parsed.mvpResolution)

    return {
      pnpProvinceFinderAnswers,
      pnpBCRefinementAnswers,
      recommendations,
      pnpProvinceFinderResult,
      pnpProvinceFinderEntryContext,
      mvpResolution,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return getDefaultState()
  }
}

function loadState(): ProvinceFinderStorageState {
  if (typeof window === "undefined") return getDefaultState()
  return parseState(localStorage.getItem(PROVINCE_FINDER_STORAGE_KEY))
}

function saveState(state: ProvinceFinderStorageState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PROVINCE_FINDER_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage write failures (quota/private mode) so UI flow can continue.
  }
}

export function loadProvinceFinderDraft(): ProvinceFinderDraftAnswers {
  return loadState().pnpProvinceFinderAnswers
}

export function saveProvinceFinderDraft(draft: ProvinceFinderDraftAnswers): void {
  savePNPProvinceFinderAnswers(draft)
}

export function loadPNPProvinceFinderAnswers(): ProvinceFinderDraftAnswers {
  return loadState().pnpProvinceFinderAnswers
}

export function savePNPProvinceFinderAnswers(pnpProvinceFinderAnswers: ProvinceFinderDraftAnswers): void {
  const current = loadState()
  saveState({
    ...current,
    pnpProvinceFinderAnswers,
    updatedAt: new Date().toISOString(),
  })
}

export function loadProvinceFinderRecommendations(): ProvinceRecommendation[] {
  return loadState().recommendations
}

export function saveProvinceFinderRecommendations(
  recommendations: ProvinceRecommendation[],
  draft?: ProvinceFinderDraftAnswers,
  mvpResolution?: MVPProvinceResolution | null,
): void {
  const current = loadState()
  saveState({
    pnpProvinceFinderAnswers: draft ?? current.pnpProvinceFinderAnswers,
    pnpBCRefinementAnswers: current.pnpBCRefinementAnswers,
    recommendations,
    pnpProvinceFinderResult: current.pnpProvinceFinderResult,
    pnpProvinceFinderEntryContext: current.pnpProvinceFinderEntryContext,
    mvpResolution: mvpResolution ?? current.mvpResolution,
    updatedAt: new Date().toISOString(),
  })
}

export function loadProvinceFinderMVPResolution(): MVPProvinceResolution | null {
  return loadState().mvpResolution
}

export function loadPNPBCRefinementAnswers(): Record<string, string | number | null> {
  return loadState().pnpBCRefinementAnswers
}

export function savePNPBCRefinementAnswers(
  pnpBCRefinementAnswers: Record<string, string | number | null>,
): void {
  const current = loadState()
  saveState({
    ...current,
    pnpBCRefinementAnswers: normalizeBCRefinementAnswers(pnpBCRefinementAnswers),
    updatedAt: new Date().toISOString(),
  })
}

export function savePNPProvinceFinderEntryContext(
  pnpProvinceFinderEntryContext: ProvinceRouterDecision | null,
): void {
  const current = loadState()
  saveState({
    ...current,
    pnpProvinceFinderEntryContext,
    updatedAt: new Date().toISOString(),
  })
}

export function loadPNPProvinceFinderEntryContext(): ProvinceRouterDecision | null {
  return loadState().pnpProvinceFinderEntryContext
}

export function savePNPProvinceFinderResult(result: ProvinceFinderEvaluation | null): void {
  const current = loadState()
  saveState({
    ...current,
    pnpProvinceFinderResult: result,
    updatedAt: new Date().toISOString(),
  })
}

export function loadPNPProvinceFinderResult(): ProvinceFinderEvaluation | null {
  return loadState().pnpProvinceFinderResult
}
