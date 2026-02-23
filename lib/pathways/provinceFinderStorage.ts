import {
  getProvinceFinderInitialDraft,
  type ProvinceFinderDraftAnswers,
  type ProvinceRecommendation,
} from "@/lib/pathways/provinceFinder"

const PROVINCE_FINDER_STORAGE_KEY = "clarity-province-finder"

type ProvinceFinderStorageState = {
  draft: ProvinceFinderDraftAnswers
  recommendations: ProvinceRecommendation[]
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

function getDefaultState(): ProvinceFinderStorageState {
  return {
    draft: getProvinceFinderInitialDraft(),
    recommendations: [],
    updatedAt: new Date(0).toISOString(),
  }
}

function parseState(raw: string | null): ProvinceFinderStorageState {
  if (!raw) return getDefaultState()

  try {
    const parsed = JSON.parse(raw) as Partial<ProvinceFinderStorageState>
    const draft = {
      ...getProvinceFinderInitialDraft(),
      ...(parsed.draft ?? {}),
    } satisfies ProvinceFinderDraftAnswers
    const recommendations = normalizeRecommendations(parsed.recommendations)

    return {
      draft,
      recommendations,
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
  return loadState().draft
}

export function saveProvinceFinderDraft(draft: ProvinceFinderDraftAnswers): void {
  const current = loadState()
  saveState({
    ...current,
    draft,
    updatedAt: new Date().toISOString(),
  })
}

export function loadProvinceFinderRecommendations(): ProvinceRecommendation[] {
  return loadState().recommendations
}

export function saveProvinceFinderRecommendations(
  recommendations: ProvinceRecommendation[],
  draft?: ProvinceFinderDraftAnswers,
): void {
  const current = loadState()
  saveState({
    draft: draft ?? current.draft,
    recommendations,
    updatedAt: new Date().toISOString(),
  })
}
