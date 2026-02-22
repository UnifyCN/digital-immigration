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

    return {
      draft,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
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
  localStorage.setItem(PROVINCE_FINDER_STORAGE_KEY, JSON.stringify(state))
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
