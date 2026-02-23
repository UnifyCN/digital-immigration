import {
  getProvinceFinderInitialDraft,
  type ProvinceFinderDraftAnswers,
  type ProvinceRecommendation,
} from "@/lib/pathways/provinceFinder"
import { PNP_MVP_DEFAULT_PROVINCE } from "@/lib/config/pnpScope"
import type { MVPProvinceResolution } from "@/lib/pathways/pnpProvinceScope"
import type { ProvinceFinderResult } from "@/lib/rules/pnp/bcFamilies"

const PROVINCE_FINDER_STORAGE_KEY = "clarity-province-finder"

type ProvinceFinderStorageState = {
  pnpProvinceFinderAnswers: ProvinceFinderDraftAnswers
  recommendations: ProvinceRecommendation[]
  pnpProvinceFinderResult: ProvinceFinderResult | null
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

function normalizePNPProvinceFinderResult(input: unknown): ProvinceFinderResult | null {
  if (!input || typeof input !== "object") return null
  const raw = input as Partial<ProvinceFinderResult>
  if (raw.provinceCode !== "BC") return null
  if (!Array.isArray(raw.recommendations)) return null
  if (typeof raw.generatedAt !== "string") return null

  const recommendations = raw.recommendations.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const rec = item as ProvinceFinderResult["recommendations"][number]
    if (rec.familyId !== "BC_EMPLOYER_SKILLED" && rec.familyId !== "BC_INTL_GRAD") return []
    if (typeof rec.title !== "string") return []
    if (typeof rec.shortDescription !== "string") return []
    if (typeof rec.fitScore !== "number" || Number.isNaN(rec.fitScore)) return []
    if (rec.confidence !== "high" && rec.confidence !== "medium" && rec.confidence !== "low") return []
    if (rec.baselineBadge !== "pass" && rec.baselineBadge !== "unclear" && rec.baselineBadge !== "fail") return []
    return [
      {
        familyId: rec.familyId,
        title: rec.title,
        shortDescription: rec.shortDescription,
        fitScore: rec.fitScore,
        confidence: rec.confidence,
        baselineBadge: rec.baselineBadge,
        hardBlockers: Array.isArray(rec.hardBlockers) ? rec.hardBlockers.filter((v) => typeof v === "string") : [],
        missingRequired: Array.isArray(rec.missingRequired)
          ? rec.missingRequired
              .filter((q) => q && typeof q === "object" && typeof q.id === "string" && typeof q.prompt === "string")
              .map((q) => ({
                id: q.id,
                prompt: q.prompt,
                signalKeys: Array.isArray(q.signalKeys)
                  ? q.signalKeys.filter((k) => typeof k === "string")
                  : undefined,
              }))
          : [],
        whyBullets: Array.isArray(rec.whyBullets) ? rec.whyBullets.filter((v) => typeof v === "string") : [],
        whyBulletIds: Array.isArray(rec.whyBulletIds) ? rec.whyBulletIds.filter((v) => typeof v === "string") : [],
        openQuestions: Array.isArray(rec.openQuestions)
          ? rec.openQuestions
              .filter((q) => q && typeof q === "object" && typeof q.id === "string" && typeof q.prompt === "string")
              .map((q) => ({
                id: q.id,
                prompt: q.prompt,
                reason: typeof q.reason === "string" ? q.reason : undefined,
                signalKeys: Array.isArray(q.signalKeys)
                  ? q.signalKeys.filter((k) => typeof k === "string")
                  : undefined,
              }))
          : [],
      },
    ]
  })

  return {
    provinceCode: "BC",
    generatedAt: raw.generatedAt,
    recommendations,
  }
}

function getDefaultState(): ProvinceFinderStorageState {
  return {
    pnpProvinceFinderAnswers: getProvinceFinderInitialDraft(),
    recommendations: [],
    pnpProvinceFinderResult: null,
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
    const recommendations = normalizeRecommendations(parsed.recommendations)
    const pnpProvinceFinderResult = normalizePNPProvinceFinderResult(parsed.pnpProvinceFinderResult)
    const mvpResolution = normalizeMVPResolution(parsed.mvpResolution)

    return {
      pnpProvinceFinderAnswers,
      recommendations,
      pnpProvinceFinderResult,
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
    recommendations,
    pnpProvinceFinderResult: current.pnpProvinceFinderResult,
    mvpResolution: mvpResolution ?? current.mvpResolution,
    updatedAt: new Date().toISOString(),
  })
}

export function loadProvinceFinderMVPResolution(): MVPProvinceResolution | null {
  return loadState().mvpResolution
}

export function savePNPProvinceFinderResult(result: ProvinceFinderResult | null): void {
  const current = loadState()
  saveState({
    ...current,
    pnpProvinceFinderResult: result,
    updatedAt: new Date().toISOString(),
  })
}

export function loadPNPProvinceFinderResult(): ProvinceFinderResult | null {
  return loadState().pnpProvinceFinderResult
}
