import type { OpenQuestion } from "./pnpOpenQuestions"
import type { ChecklistItem } from "./pnpReadinessChecklist"
import type { PNPSignals } from "./pnpSignals"

type LowMessagingContext = {
  signals: PNPSignals
  meta: { unknownRate: number }
  dampenersApplied: string[]
  readinessChecklistAll?: ChecklistItem[]
  openQuestions?: OpenQuestion[]
}

type LowBulletRule = {
  id: string
  priority: number
  when: (ctx: LowMessagingContext) => boolean
  text: (ctx: LowMessagingContext) => string
}

const MAX_BULLETS_PER_SECTION = 4
const MIN_BULLETS_PER_SECTION = 2
const LIMITED_FALLBACK_ID = "LF1"
const LIMITED_FALLBACK_TEXT =
  "You may need a few more details to assess PNP alignment more confidently."
const IMPROVE_FALLBACK_ID = "IF1"
const IMPROVE_FALLBACK_TEXT =
  "Adding province preference, employment details, and language plans can improve accuracy."

const PROVINCE_DIRECTED_FLEXIBILITY = new Set([
  "preferprovince",
  "onlyprovince",
  "prefer-specific",
  "only-specific",
])

function normalized(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase()
}

function hasProvinceDirection(signals: PNPSignals): boolean {
  if ((signals.preferredProvince ?? "").trim().length > 0) return true
  return PROVINCE_DIRECTED_FLEXIBILITY.has(normalized(signals.settleFlexibility))
}

function isMissingTriState(value: "yes" | "no" | "not_sure" | null | undefined): boolean {
  return value == null
}

function sortByPriorityThenId<T extends { priority: number; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return a.id.localeCompare(b.id)
  })
}

export const PNP_LOW_LIMITED_BULLET_RULES: LowBulletRule[] = [
  {
    id: "L1_no_province_preference",
    priority: 100,
    when: ({ signals }) => !hasProvinceDirection(signals),
    text: () =>
      "You haven’t identified a target province yet, and PNP pathways are province-based.",
  },
  {
    id: "L2_no_job_offer_or_unclear",
    priority: 95,
    when: ({ signals }) => signals.hasJobOffer !== "yes",
    text: () =>
      "No Canadian job offer was reported, which can limit many employer-driven provincial pathways.",
  },
  {
    id: "L3_employer_support_unknown_or_no",
    priority: 90,
    when: ({ signals }) =>
      signals.employerSupportPNP !== "yes" &&
      (signals.hasJobOffer === "yes" ||
        signals.hasJobOffer === "not_sure" ||
        isMissingTriState(signals.hasJobOffer)),
    text: () =>
      "Employer support for nomination is unclear, and some pathways require active employer participation.",
  },
  {
    id: "L4_no_canadian_ties_dampener",
    priority: 92,
    when: ({ dampenersApplied }) => dampenersApplied.includes("no_canadian_ties"),
    text: () =>
      "You do not currently appear to have Canadian work, education, or employer ties, which can make PNP options more limited.",
  },
  {
    id: "L5_language_not_ready",
    priority: 88,
    when: ({ signals }) =>
      signals.languageReady == null ||
      signals.languageReady === "not_ready" ||
      signals.languageReady === "booked",
    text: () =>
      "Language results are not confirmed as valid yet, and most pathways require valid language scores.",
  },
  {
    id: "L6_work_docs_unclear",
    priority: 80,
    when: ({ signals }) => signals.canGetReferenceLetter !== "yes",
    text: () =>
      "Work documentation (like detailed reference letters) is not confirmed, which affects readiness for most applications.",
  },
  {
    id: "L7_high_unknown_rate",
    priority: 75,
    when: ({ meta }) => meta.unknownRate > 0.5,
    text: () =>
      "Several key details are currently marked as uncertain, which limits how confidently we can assess PNP fit.",
  },
]

export const PNP_LOW_IMPROVE_BULLET_RULES: LowBulletRule[] = [
  {
    id: "I1_choose_province",
    priority: 100,
    when: ({ signals }) => !hasProvinceDirection(signals),
    text: () => "Choose 1–2 provinces you’re most interested in living and working in.",
  },
  {
    id: "I2_confirm_job_offer",
    priority: 98,
    when: ({ signals }) =>
      signals.hasJobOffer === "not_sure" || isMissingTriState(signals.hasJobOffer),
    text: () => "Confirm whether you currently have a Canadian job offer.",
  },
  {
    id: "I3_strengthen_employer_support",
    priority: 95,
    when: ({ signals }) => signals.hasJobOffer === "yes" && signals.employerSupportPNP !== "yes",
    text: () =>
      "If you have a job offer, confirm whether your employer is willing to support nomination.",
  },
  {
    id: "I4_language_plan",
    priority: 92,
    when: ({ signals }) =>
      signals.languageReady == null ||
      signals.languageReady === "not_ready" ||
      signals.languageReady === "booked",
    text: () =>
      "Plan for a valid language test result (book a date or confirm your current results).",
  },
  {
    id: "I5_confirm_canadian_work_12mo",
    priority: 90,
    when: ({ signals }) =>
      signals.canadianSkilledWork12mo === "not_sure" ||
      isMissingTriState(signals.canadianSkilledWork12mo),
    text: () =>
      "Confirm whether you have 12+ months of skilled work experience in Canada.",
  },
  {
    id: "I6_canadian_education",
    priority: 85,
    when: ({ signals }) =>
      signals.anyEducationInCanada === "no" || isMissingTriState(signals.anyEducationInCanada),
    text: () => "If applicable, add any Canadian education you’ve completed.",
  },
  {
    id: "I7_reference_letter_details",
    priority: 80,
    when: ({ signals }) => signals.canGetReferenceLetter !== "yes",
    text: () =>
      "Confirm whether you can obtain an employment letter with duties, hours, pay, and dates.",
  },
]

const OPEN_QUESTION_ID_TO_IMPROVE_ID: Record<string, string> = {
  Q1_province_preference_missing: "I1_choose_province",
  Q2_job_offer_unknown: "I2_confirm_job_offer",
  Q3_employer_support_unknown: "I3_strengthen_employer_support",
  Q4_canadian_skilled_work_12mo_unclear: "I5_confirm_canadian_work_12mo",
  Q5_canadian_education_missing: "I6_canadian_education",
  Q6_language_plan_missing: "I4_language_plan",
  Q7_work_docs_unclear: "I7_reference_letter_details",
}

function mapOpenQuestionToImproveId(question: OpenQuestion): string | null {
  const byId = OPEN_QUESTION_ID_TO_IMPROVE_ID[question.id]
  if (byId) return byId

  if (question.category === "province") return "I1_choose_province"
  if (question.category === "language") return "I4_language_plan"
  if (question.category === "work") return "I5_confirm_canadian_work_12mo"
  if (question.category === "education") return "I6_canadian_education"
  if (question.category === "docs") return "I7_reference_letter_details"
  if (question.category === "job") return "I2_confirm_job_offer"
  return null
}

function selectLimitedBullets(ctx: LowMessagingContext): {
  whyLimitedBullets: string[]
  whyLimitedBulletIds: string[]
} {
  const matched = sortByPriorityThenId(
    PNP_LOW_LIMITED_BULLET_RULES.filter((rule) => rule.when(ctx)),
  ).slice(0, MAX_BULLETS_PER_SECTION)

  const whyLimitedBullets = matched.map((rule) => rule.text(ctx))
  const whyLimitedBulletIds = matched.map((rule) => rule.id)

  while (whyLimitedBullets.length < MIN_BULLETS_PER_SECTION) {
    whyLimitedBullets.push(LIMITED_FALLBACK_TEXT)
    whyLimitedBulletIds.push(LIMITED_FALLBACK_ID)
  }

  return { whyLimitedBullets, whyLimitedBulletIds }
}

function selectImproveBullets(ctx: LowMessagingContext): {
  howToImproveBullets: string[]
  howToImproveBulletIds: string[]
} {
  const matchedRules = sortByPriorityThenId(
    PNP_LOW_IMPROVE_BULLET_RULES.filter((rule) => rule.when(ctx)),
  )
  const byId = new Map(matchedRules.map((rule) => [rule.id, rule]))
  const selectedIds = new Set<string>()
  const selectedRules: LowBulletRule[] = []

  for (const openQuestion of ctx.openQuestions ?? []) {
    if (selectedRules.length >= MAX_BULLETS_PER_SECTION) break
    const targetId = mapOpenQuestionToImproveId(openQuestion)
    if (!targetId || selectedIds.has(targetId)) continue
    const rule = byId.get(targetId)
    if (!rule) continue
    selectedRules.push(rule)
    selectedIds.add(rule.id)
  }

  for (const rule of matchedRules) {
    if (selectedRules.length >= MAX_BULLETS_PER_SECTION) break
    if (selectedIds.has(rule.id)) continue
    selectedRules.push(rule)
    selectedIds.add(rule.id)
  }

  const howToImproveBullets = selectedRules.map((rule) => rule.text(ctx))
  const howToImproveBulletIds = selectedRules.map((rule) => rule.id)

  while (howToImproveBullets.length < MIN_BULLETS_PER_SECTION) {
    howToImproveBullets.push(IMPROVE_FALLBACK_TEXT)
    howToImproveBulletIds.push(IMPROVE_FALLBACK_ID)
  }

  return { howToImproveBullets, howToImproveBulletIds }
}

export function generatePNPLowConfidenceMessaging(params: {
  signals: PNPSignals
  meta: { unknownRate: number }
  dampenersApplied: string[]
  readinessChecklistAll?: ChecklistItem[]
  openQuestions?: OpenQuestion[]
}): {
  whyLimitedBullets: string[]
  whyLimitedBulletIds: string[]
  howToImproveBullets: string[]
  howToImproveBulletIds: string[]
} {
  const ctx: LowMessagingContext = {
    signals: params.signals,
    meta: params.meta,
    dampenersApplied: params.dampenersApplied,
    readinessChecklistAll: params.readinessChecklistAll,
    openQuestions: params.openQuestions,
  }

  const limited = selectLimitedBullets(ctx)
  const improve = selectImproveBullets(ctx)

  return {
    whyLimitedBullets: limited.whyLimitedBullets,
    whyLimitedBulletIds: limited.whyLimitedBulletIds,
    howToImproveBullets: improve.howToImproveBullets,
    howToImproveBulletIds: improve.howToImproveBulletIds,
  }
}
