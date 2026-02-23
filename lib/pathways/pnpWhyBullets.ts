import type { PNPConfidenceLevel } from "./pnpConfidence"
import type { PNPSignals } from "./pnpSignals"

type WhyRuleParams = {
  signals: PNPSignals
  meta: { unknownRate: number }
  dampenersApplied: string[]
  confidenceLevel: PNPConfidenceLevel
}

type WhyRule = {
  id: string
  priority: number
  when: (params: WhyRuleParams) => boolean
  text: (params: WhyRuleParams) => string
}

const FALLBACK_ID = "F1_fallback"
const FALLBACK_TEXT =
  "PNP is province-specific. Additional details such as province preference, employment, or Canadian experience may help clarify alignment."

function isMediumOrLow(confidenceLevel: PNPConfidenceLevel): boolean {
  return confidenceLevel === "medium" || confidenceLevel === "low"
}

function isPreferredProvinceFlexibility(value: string | null): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === "preferprovince" || normalized === "onlyprovince" || normalized === "prefer-specific" || normalized === "only-specific"
}

export const PNP_WHY_BULLET_RULES: WhyRule[] = [
  {
    id: "A1_job_offer",
    priority: 100,
    when: ({ signals }) => signals.hasJobOffer === "yes",
    text: () =>
      "You reported a Canadian job offer, which is commonly required in many employer-driven provincial nomination pathways.",
  },
  {
    id: "A2_employer_support_yes",
    priority: 95,
    when: ({ signals }) => signals.employerSupportPNP === "yes",
    text: () =>
      "You indicated your employer may be willing to support a provincial nomination, which can significantly strengthen some PNP options.",
  },
  {
    id: "A3_canadian_skilled_work_12mo",
    priority: 90,
    when: ({ signals }) => signals.canadianSkilledWork12mo === "yes",
    text: () =>
      "You reported 12+ months of skilled Canadian work experience, which can support alignment under several provincial programs.",
  },
  {
    id: "A4_fulltime_permanent_offer",
    priority: 85,
    when: ({ signals }) =>
      signals.hasJobOffer === "yes" &&
      signals.jobOfferFullTime === "yes" &&
      signals.jobOfferPermanent === "yes",
    text: () =>
      "Your role appears to be full-time and permanent, which aligns with common provincial nomination requirements.",
  },
  {
    id: "B1_currently_working_in_canada",
    priority: 70,
    when: ({ signals }) => signals.currentlyWorkingInCanada === "yes",
    text: () =>
      "You indicated you are currently working in Canada, which may support province-based pathways tied to local employment.",
  },
  {
    id: "B2_canadian_education",
    priority: 65,
    when: ({ signals }) => signals.anyEducationInCanada === "yes",
    text: () =>
      "You reported education completed in Canada, which may strengthen certain provincial options, including some graduate-focused pathways.",
  },
  {
    id: "B3_province_preference",
    priority: 60,
    when: ({ signals }) => isPreferredProvinceFlexibility(signals.settleFlexibility),
    text: () => "You identified a preferred province, which matters because PNP pathways are province-specific.",
  },
  {
    id: "B4_job_offer_has_province",
    priority: 55,
    when: ({ signals }) => typeof signals.jobOfferProvince === "string" && signals.jobOfferProvince.trim().length > 0,
    text: () =>
      "Your job offer is tied to a specific province, which may align with that province’s nomination requirements.",
  },
  {
    id: "D2_no_canadian_ties",
    priority: 52,
    when: ({ confidenceLevel, dampenersApplied }) =>
      isMediumOrLow(confidenceLevel) && dampenersApplied.includes("no_canadian_ties"),
    text: () =>
      "You do not currently appear to have Canadian work, education, or employer ties, which can make PNP pathways more limited.",
  },
  {
    id: "D1_many_unknowns",
    priority: 50,
    when: ({ confidenceLevel, meta }) => isMediumOrLow(confidenceLevel) && meta.unknownRate > 0.5,
    text: () =>
      "Several key details are currently marked as uncertain, which may affect how accurately we can assess PNP alignment.",
  },
  {
    id: "D3_prior_refusal",
    priority: 48,
    when: ({ confidenceLevel, dampenersApplied }) =>
      isMediumOrLow(confidenceLevel) && dampenersApplied.includes("prior_refusal"),
    text: () =>
      "You indicated a prior application refusal, which may require careful review before pursuing provincial pathways.",
  },
  {
    id: "C1_language_valid",
    priority: 40,
    when: ({ signals }) => signals.languageReady === "valid",
    text: () =>
      "You have a valid language test result, which is required in most provincial nomination applications.",
  },
  {
    id: "C2_language_booked",
    priority: 35,
    when: ({ signals }) => signals.languageReady === "booked",
    text: () =>
      "You have a planned language test, which is an important step toward meeting provincial requirements.",
  },
  {
    id: "C3_reference_letters_yes",
    priority: 30,
    when: ({ signals }) => signals.canGetReferenceLetter === "yes",
    text: () =>
      "You indicated you can obtain proper employment documentation, which is important for most PNP applications.",
  },
]

function getMaxBullets(confidenceLevel: PNPConfidenceLevel): number {
  if (confidenceLevel === "high") return 5
  if (confidenceLevel === "medium") return 4
  return 3
}

export function generatePNPWhyBullets(params: WhyRuleParams): {
  whyBullets: string[]
  whyBulletIds: string[]
} {
  const matched = PNP_WHY_BULLET_RULES.filter((rule) => rule.when(params)).sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return a.id.localeCompare(b.id)
  })

  const selected = matched.slice(0, getMaxBullets(params.confidenceLevel))
  const whyBullets = selected.map((rule) => rule.text(params))
  const whyBulletIds = selected.map((rule) => rule.id)

  while (whyBullets.length < 2) {
    whyBullets.push(FALLBACK_TEXT)
    whyBulletIds.push(FALLBACK_ID)
  }

  return { whyBullets, whyBulletIds }
}
