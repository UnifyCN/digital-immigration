import type { PNPConfidenceLevel } from "./pnpConfidence"
import type { ChecklistItem, ChecklistStatus } from "./pnpReadinessChecklist"
import type { PNPSignals } from "./pnpSignals"

export type OpenQuestionCategory =
  | "province"
  | "job"
  | "work"
  | "language"
  | "docs"
  | "status"
  | "education"
  | "risk"

export type OpenQuestion = {
  id: string
  prompt: string
  reason: string
  priority: number
  category: OpenQuestionCategory
  signalKeys: string[]
  reasonCodes?: string[]
}

type ChecklistIndex = Record<string, { status: ChecklistStatus }>

type OpenQuestionContext = {
  signals: PNPSignals
  meta: { unknownRate: number }
  dampenersApplied: string[]
  confidenceLevel: PNPConfidenceLevel
  checklistAllById: ChecklistIndex
}

type OpenQuestionRule = {
  id: string
  basePriority: number
  category: OpenQuestionCategory
  signalKeys: string[]
  when: (ctx: OpenQuestionContext) => boolean
  build: (ctx: OpenQuestionContext) => { prompt: string; reason: string }
  boost?: (ctx: OpenQuestionContext) => number
}

function isMissing(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0
}

function hasNoCanadianTiesDampener(ctx: OpenQuestionContext): boolean {
  return ctx.dampenersApplied.includes("no_canadian_ties")
}

function isRefusalYes(value: PNPSignals["hasRefusals"]): boolean {
  return value === "yes"
}

function toChecklistIndex(items: ChecklistItem[]): ChecklistIndex {
  const byId: ChecklistIndex = {}
  for (const item of items) byId[item.id] = { status: item.status }
  return byId
}

export const PNP_OPEN_QUESTION_RULES: OpenQuestionRule[] = [
  {
    id: "Q1_province_preference_missing",
    basePriority: 95,
    category: "province",
    signalKeys: ["settleFlexibility", "preferredProvince", "province_direction"],
    when: (ctx) => ctx.checklistAllById.province_direction?.status === "unknown",
    build: () => ({
      prompt: "Which province are you most interested in living and working in? (Choose 1–2)",
      reason: "PNP is province-based; a province preference improves accuracy.",
    }),
    boost: (ctx) => (ctx.confidenceLevel === "low" ? 10 : 0),
  },
  {
    id: "Q2_job_offer_unknown",
    basePriority: 100,
    category: "job",
    signalKeys: ["hasJobOffer"],
    when: (ctx) => ctx.signals.hasJobOffer == null || ctx.signals.hasJobOffer === "not_sure",
    build: () => ({
      prompt: "Do you currently have a Canadian job offer?",
      reason: "A job offer can strongly affect which provincial options may apply.",
    }),
    boost: (ctx) => {
      let bonus = 0
      if (ctx.confidenceLevel === "low") bonus += 15
      if (hasNoCanadianTiesDampener(ctx)) bonus += 10
      return bonus
    },
  },
  {
    id: "Q3_employer_support_unknown",
    basePriority: 90,
    category: "job",
    signalKeys: ["employerSupportPNP", "hasJobOffer"],
    when: (ctx) =>
      (ctx.signals.employerSupportPNP == null || ctx.signals.employerSupportPNP === "not_sure") &&
      (ctx.signals.hasJobOffer === "yes" ||
        ctx.signals.hasJobOffer === "not_sure" ||
        ctx.signals.hasJobOffer == null),
    build: () => ({
      prompt: "If you have a job offer, is your employer willing to support a provincial nomination application?",
      reason: "Many employer-driven pathways require employer participation.",
    }),
    boost: (ctx) => {
      let bonus = 0
      if (ctx.confidenceLevel === "low") bonus += 10
      if (ctx.signals.hasJobOffer === "yes") bonus += 5
      return bonus
    },
  },
  {
    id: "Q4_canadian_skilled_work_12mo_unclear",
    basePriority: 92,
    category: "work",
    signalKeys: ["canadianSkilledWork12mo"],
    when: (ctx) =>
      ctx.signals.canadianSkilledWork12mo == null || ctx.signals.canadianSkilledWork12mo === "not_sure",
    build: () => ({
      prompt: "Do you have at least 12 months of skilled work experience in Canada?",
      reason: "Canadian skilled work experience can strengthen alignment with some provincial pathways.",
    }),
    boost: (ctx) => {
      let bonus = 0
      if (ctx.confidenceLevel === "low") bonus += 12
      if (hasNoCanadianTiesDampener(ctx)) bonus += 10
      return bonus
    },
  },
  {
    id: "Q5_canadian_education_missing",
    basePriority: 75,
    category: "education",
    signalKeys: ["education_details", "anyEducationInCanada"],
    when: (ctx) => ctx.checklistAllById.education_details?.status === "unknown",
    build: () => ({
      prompt: "Have you completed any education in Canada (certificate/diploma/degree)?",
      reason: "Canadian education can strengthen some provincial options.",
    }),
    boost: (ctx) => {
      let bonus = 0
      if (ctx.confidenceLevel === "low") bonus += 8
      if (hasNoCanadianTiesDampener(ctx)) bonus += 6
      return bonus
    },
  },
  {
    id: "Q6_language_plan_missing",
    basePriority: 70,
    category: "language",
    signalKeys: ["languageReady"],
    when: (ctx) => ctx.signals.languageReady === "not_ready",
    build: () => ({
      prompt: "Do you have a language test plan (booked date or timeline)?",
      reason: "Most pathways require language results; a plan improves readiness.",
    }),
    boost: (ctx) => {
      if (ctx.confidenceLevel === "medium") return 10
      if (ctx.confidenceLevel === "low") return 6
      return 0
    },
  },
  {
    id: "Q7_work_docs_unclear",
    basePriority: 68,
    category: "docs",
    signalKeys: ["canGetReferenceLetter", "referenceLetterChallenge", "work_documentation"],
    when: (ctx) => {
      const status = ctx.checklistAllById.work_documentation?.status
      return status === "unknown" || status === "attention"
    },
    build: () => ({
      prompt: "Can you obtain an employment letter that includes your duties, hours, and pay?",
      reason: "Clear documentation improves how accurately we can assess your profile.",
    }),
    boost: (ctx) => {
      if (ctx.confidenceLevel === "medium") return 10
      if (ctx.confidenceLevel === "low") return 5
      return 0
    },
  },
  {
    id: "Q8_job_offer_details_missing",
    basePriority: 65,
    category: "job",
    signalKeys: ["hasJobOffer", "jobOfferFullTime", "jobOfferPermanent"],
    when: (ctx) =>
      ctx.signals.hasJobOffer === "yes" &&
      (ctx.signals.jobOfferFullTime == null || ctx.signals.jobOfferPermanent == null),
    build: () => ({
      prompt: "Is your job offer full-time and permanent?",
      reason: "These details can affect alignment with some provincial requirements.",
    }),
    boost: (ctx) => (ctx.confidenceLevel === "medium" ? 8 : 0),
  },
  {
    id: "Q9_status_details_missing_or_attention",
    basePriority: 60,
    category: "status",
    signalKeys: ["status_in_canada", "currentStatus", "statusExpiryDate", "statusExpiringSoon", "appliedToExtendWaiting"],
    when: (ctx) => {
      const status = ctx.checklistAllById.status_in_canada?.status
      return status !== "na" && (status === "unknown" || status === "attention")
    },
    build: () => ({
      prompt: "What is your current status in Canada, and when does it expire?",
      reason: "Status timelines can affect planning and urgency.",
    }),
    boost: (ctx) => {
      let bonus = 0
      if (ctx.signals.statusExpiringSoon === true) bonus += 20
      if (ctx.signals.appliedToExtendWaiting === "yes") bonus += 10
      return bonus
    },
  },
  {
    id: "Q10_refusal_details_missing",
    basePriority: 55,
    category: "risk",
    signalKeys: ["hasRefusals", "refusalMostRecentType", "refusalMostRecentDate"],
    when: (ctx) =>
      isRefusalYes(ctx.signals.hasRefusals) &&
      (isMissing(ctx.signals.refusalMostRecentType) || isMissing(ctx.signals.refusalMostRecentDate)),
    build: () => ({
      prompt: "What type of application was refused most recently (visitor/study/work/PR), and when?",
      reason: "Prior refusals may require careful review to avoid repeat issues.",
    }),
    boost: (ctx) => (ctx.confidenceLevel !== "high" ? 5 : 0),
  },
]

type RankedQuestion = OpenQuestion

function getCountConfig(confidenceLevel: PNPConfidenceLevel): { max: number; min: number } {
  if (confidenceLevel === "low") return { max: 6, min: 4 }
  if (confidenceLevel === "medium") return { max: 5, min: 3 }
  return { max: 3, min: 3 }
}

function isBlockedByOverlap(candidateId: string, selectedIds: Set<string>): boolean {
  if (candidateId === "Q8_job_offer_details_missing" && selectedIds.has("Q2_job_offer_unknown")) return true
  return false
}

function preferAlternativeByCategoryCap(
  candidates: RankedQuestion[],
  currentIndex: number,
  selectedIds: Set<string>,
  categoryCounts: Record<string, number>,
): boolean {
  const candidate = candidates[currentIndex]
  const currentCount = categoryCounts[candidate.category] ?? 0
  if (currentCount < 2) return false

  for (let i = currentIndex + 1; i < candidates.length; i++) {
    const alt = candidates[i]
    if (selectedIds.has(alt.id)) continue
    if (isBlockedByOverlap(alt.id, selectedIds)) continue
    if (alt.category === candidate.category) continue
    if ((categoryCounts[alt.category] ?? 0) >= 2) continue
    if (alt.priority >= candidate.priority - 10) return true
  }

  return false
}

export function generatePNPOpenQuestions(params: {
  signals: PNPSignals
  meta: { unknownRate: number }
  dampenersApplied: string[]
  confidenceLevel: PNPConfidenceLevel
  readinessChecklistAll: ChecklistItem[]
}): { openQuestions: OpenQuestion[]; openQuestionIds: string[] } {
  const checklistAllById = toChecklistIndex(params.readinessChecklistAll)
  const ctx: OpenQuestionContext = {
    signals: params.signals,
    meta: params.meta,
    dampenersApplied: params.dampenersApplied,
    confidenceLevel: params.confidenceLevel,
    checklistAllById,
  }

  const matched: RankedQuestion[] = PNP_OPEN_QUESTION_RULES.filter((rule) => rule.when(ctx))
    .map((rule) => {
      const built = rule.build(ctx)
      const boost = rule.boost ? rule.boost(ctx) : 0
      return {
        id: rule.id,
        prompt: built.prompt,
        reason: built.reason,
        priority: rule.basePriority + boost,
        category: rule.category,
        signalKeys: rule.signalKeys,
      }
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return a.id.localeCompare(b.id)
    })

  const { max, min } = getCountConfig(params.confidenceLevel)
  const selected: RankedQuestion[] = []
  const selectedIds = new Set<string>()
  const categoryCounts: Record<string, number> = {}

  for (let i = 0; i < matched.length && selected.length < max; i++) {
    const candidate = matched[i]
    if (selectedIds.has(candidate.id)) continue
    if (isBlockedByOverlap(candidate.id, selectedIds)) continue

    // Q2/Q8 overlap is enforced by `isBlockedByOverlap` when Q8 is evaluated.

    if (preferAlternativeByCategoryCap(matched, i, selectedIds, categoryCounts)) continue

    selected.push(candidate)
    selectedIds.add(candidate.id)
    categoryCounts[candidate.category] = (categoryCounts[candidate.category] ?? 0) + 1
  }

  if (selected.length < min) {
    for (const candidate of matched) {
      if (selected.length >= min || selected.length >= max) break
      if (selectedIds.has(candidate.id)) continue
      if (isBlockedByOverlap(candidate.id, selectedIds)) continue

      selected.push(candidate)
      selectedIds.add(candidate.id)
      categoryCounts[candidate.category] = (categoryCounts[candidate.category] ?? 0) + 1
    }
  }

  const openQuestions: OpenQuestion[] = selected.map((item) => ({
    id: item.id,
    prompt: item.prompt,
    reason: item.reason,
    priority: item.priority,
    category: item.category,
    signalKeys: item.signalKeys,
  }))

  return {
    openQuestions,
    openQuestionIds: openQuestions.map((question) => question.id),
  }
}
